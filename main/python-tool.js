// 在 Docker 容器里运行 Python 代码：只挂载 pet_space，断网并限制资源。
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const DEFAULT_IMAGE = 'python:3.12-slim';
const CHECK_TIMEOUT_MS = 1800;
const PULL_TIMEOUT_MS = 180000;
const MAX_OUTPUT_BYTES = 200000;

function dockerCandidates() {
  if (process.platform === 'win32') {
    return ['docker', 'C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe'];
  }
  return ['docker', '/usr/bin/docker', '/usr/local/bin/docker'];
}

function dockerEnv(bin) {
  const env = { ...process.env };
  const binDir = path.isAbsolute(bin) ? path.dirname(bin) : '';
  const dockerPath = 'C:\\Program Files\\Docker\\Docker\\resources\\bin';
  if (process.platform === 'win32') {
    const extra = [binDir, dockerPath].filter(Boolean);
    const basePath = env.PATH || env.Path || '';
    env.PATH = extra.join(';') + (basePath ? ';' + basePath : '');
    env.Path = env.PATH;
  } else if (binDir) {
    env.PATH = binDir + (env.PATH ? ':' + env.PATH : '');
  }
  return env;
}

function runCommand(command, args, { timeoutMs = 30000, maxOutput = MAX_OUTPUT_BYTES, env = null } = {}) {
  return new Promise((resolve) => {
    let child;
    let finished = false;
    let timedOut = false;
    let stdout = '';
    let stderr = '';
    let totalOut = 0;
    let truncated = false;
    let timer = null;

    const finish = (result) => {
      if (finished) return;
      finished = true;
      if (timer) clearTimeout(timer);
      resolve({ ...result, stdout, stderr, timedOut, truncated });
    };

    const push = (which, chunk) => {
      const text = chunk.toString('utf8');
      const remain = maxOutput - totalOut;
      if (remain <= 0) { truncated = true; return; }
      const piece = text.slice(0, remain);
      totalOut += piece.length;
      if (piece.length < text.length) truncated = true;
      if (which === 'out') stdout += piece;
      else stderr += piece;
    };

    try {
      child = spawn(command, args, { windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'], env: env || process.env });
    } catch (e) {
      resolve({ code: -1, error: String(e.message || e), stdout: '', stderr: '', timedOut: false, truncated: false });
      return;
    }

    child.stdout.on('data', (c) => push('out', c));
    child.stderr.on('data', (c) => push('err', c));
    child.on('error', (e) => finish({ code: -1, error: String(e.message || e) }));
    child.on('close', (code, signal) => finish({ code: code == null ? -1 : code, signal }));

    timer = setTimeout(() => {
      timedOut = true;
      try { child.kill(); } catch {}
    }, timeoutMs);
  });
}

function runDocker(bin, args, options = {}) {
  return runCommand(bin, args, { ...options, env: dockerEnv(bin) });
}

function createPythonTool({ PET_SPACE_DIR, dockerBin = '', image = DEFAULT_IMAGE, timeoutMs = 30000 } = {}) {
  const workspace = path.resolve(PET_SPACE_DIR);
  const runtimeDir = path.join(workspace, '.python');
  let cache = { at: 0, ok: false };
  let seq = 0;

  function resolvedDockerBin() {
    if (dockerBin) return dockerBin;
    for (const candidate of dockerCandidates()) {
      if (path.isAbsolute(candidate) && fs.existsSync(candidate)) return candidate;
    }
    return 'docker';
  }

  async function checkDocker() {
    const now = Date.now();
    if (now - cache.at < 5000) return cache.ok;
    const bin = resolvedDockerBin();
    let ok = false;
    try {
      const r = await runDocker(bin, ['version', '--format', '{{.Server.Version}}'], { timeoutMs: CHECK_TIMEOUT_MS, maxOutput: 4096 });
      ok = !r.error && r.code === 0 && Boolean(String(r.stdout || '').trim());
    } catch {}
    cache = { at: now, ok };
    return ok;
  }

  async function ensureImage(bin) {
    const inspect = await runDocker(bin, ['image', 'inspect', image], { timeoutMs: 5000, maxOutput: 4096 });
    if (!inspect.error && inspect.code === 0) return '';
    const pull = await runDocker(bin, ['pull', image], { timeoutMs: PULL_TIMEOUT_MS });
    if (pull.error) return '拉取 Python 镜像失败：' + pull.error;
    if (pull.code !== 0) return '拉取 Python 镜像失败（exit=' + pull.code + '）：' + (pull.stderr || pull.stdout).slice(0, 500);
    return '';
  }

  async function runPython(args = {}) {
    if (!args || typeof args !== 'object') return { ok: false, error: '参数错误：需要对象参数' };
    const code = typeof args.code === 'string' ? args.code : '';
    if (!code.trim()) return { ok: false, error: '参数错误：code 不能为空' };
    if (code.length > 200000) return { ok: false, error: '拒绝：code 超过 200KB' };
    const rawArgs = Array.isArray(args.args) ? args.args : [];
    const extraArgs = rawArgs.slice(0, 32).map((v) => String(v ?? '')).filter((v) => v.length <= 2000);
    if (!(await checkDocker())) {
      return { ok: false, error: 'Docker 不可用：请启动 Docker Desktop，或检查 config.json 的 pythonDockerBin' };
    }

    const bin = resolvedDockerBin();
    const imageError = await ensureImage(bin);
    if (imageError) return { ok: false, error: imageError };

    fs.mkdirSync(runtimeDir, { recursive: true });
    const name = 'run-' + Date.now() + '-' + (++seq) + '.py';
    const hostScript = path.join(runtimeDir, name);
    const containerScript = '/workspace/.python/' + name;
    const containerName = 'livliv-python-' + process.pid + '-' + Date.now() + '-' + seq;
    fs.writeFileSync(hostScript, code, 'utf8');

    const dockerArgs = [
      'run', '--rm', '--name', containerName,
      '--pull', 'never',
      '--network', 'none',
      '--cap-drop', 'ALL',
      '--security-opt', 'no-new-privileges',
      '--memory', '512m',
      '--cpus', '1',
      '--pids-limit', '128',
      '--read-only',
      '--tmpfs', '/tmp:rw,size=64m',
      '--env', 'HOME=/tmp',
      '--env', 'PYTHONUNBUFFERED=1',
      '--env', 'PYTHONIOENCODING=utf-8',
      '--env', 'PYTHONDONTWRITEBYTECODE=1',
      '--env', 'MPLCONFIGDIR=/tmp/matplotlib',
      '--env', 'PYTHONPATH=/workspace',
      '-v', workspace + ':/workspace',
      '-w', '/workspace',
      image,
      'python', containerScript,
      ...extraArgs,
    ];

    let result;
    try {
      result = await runDocker(bin, dockerArgs, { timeoutMs, maxOutput: MAX_OUTPUT_BYTES });
      if (result.timedOut) {
        await runDocker(bin, ['kill', containerName], { timeoutMs: 3000, maxOutput: 4096 });
        await runDocker(bin, ['rm', '-f', containerName], { timeoutMs: 3000, maxOutput: 4096 });
        return { ok: false, error: 'Python 执行超时（' + timeoutMs + 'ms），容器已终止' };
      }
      if (result.error) return { ok: false, error: '启动 Docker 失败：' + result.error };
      const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
      const suffix = result.truncated ? '\n[输出已截断]' : '';
      if (result.code !== 0) {
        return {
          ok: false,
          error: 'Python 执行失败（exit=' + result.code + '）' + (output ? '\n' + output : ''),
        };
      }
      return {
        ok: true,
        result: (output || '(无输出)') + suffix,
      };
    } catch (e) {
      return { ok: false, error: 'Python 执行异常：' + String(e.message || e) };
    } finally {
      try { fs.rmSync(hostScript, { force: true }); } catch {}
    }
  }

  return { check: checkDocker, run: runPython };
}

module.exports = { createPythonTool, DEFAULT_IMAGE };

