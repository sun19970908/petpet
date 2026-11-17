# AGENTS.md — livliv-pet

给在本仓库工作的编码 agent 的说明。先读 `README.md` 和 `docs/config.md`；不要凭旧记忆假设目录、配置或行为。

## 项目速览

- Electron 桌面宠物，角色由 livliv player 渲染；主进程负责窗口、截图、语音、文件工具和本地 HTTP 服务。
- 双窗模式：桌宠透明置顶窗加载 `/?role=pet`，卧室窗加载 `/renderer/room.html`；卧室场景在 `pet_space/scenes/room/`，宠物可以自己改。
- LLM 走 OpenAI 兼容接口；语音可选 GPT-SoVITS；生图可选 ComfyUI；联网搜索/网页读取可选 SearXNG。
- 所有本地服务只监听 `127.0.0.1`。应用服务端口见 `config.json.serverPort`（默认 `12400`）。

## 常用命令

- 初始化：Windows `powershell -NoProfile -ExecutionPolicy Bypass -File .\init.ps1`；Linux/macOS `bash init.sh`。
- 启动：`start-pet.bat` / `bash start-pet.sh`。启动参数只保留 `debug`；`--no-infwake` 是看门狗内部参数。不要再扩展 CLI，运行配置写 `config.json`。
- 构建渲染层：改 `renderer/app.js` 或它 import 的任何 `renderer/*.js` 后必须执行 `npm run build`。`renderer/app.bundle.js` 是 esbuild 产物，不要手改；提交源码时连同重建后的 bundle 一起提交。
- 看门狗：由 `config.json.watchdog` 控制；`stop-watchdog.bat` 只停看门狗，不杀桌宠。
- 日志与聊天记录：`logs/`、`history/`，都在 `.gitignore` 里；不要提交，也不要整份打印或外发。

## 代码地图

- `main.js`：主进程入口；启动早期读 `BOOT_CONFIG`、单实例锁、本地 HTTP 服务、子模块装配。
- `main/windows.js`：桌宠窗/卧室窗创建、显示屏变化处理。不要给桌宠窗在创建后再调 `setAlwaysOnTop` / `moveTop`；混合 DPI 的透明窗会因此丢掉 `WS_EX_TOPMOST`。置顶由 `topmost-guard.ps1` 兜底。卧室窗必须可激活且不置顶，否则真实鼠标点不到房间。
- `main/http-server.js`、`main/static-assets.js`：本地服务与静态资源路由。
- `main/scenes.js`：场景注册表——扫 `pet_space/scenes/`（一场景一文件夹，扫到即存在；`meta.json` 可选，缺失走默认值；`.`/`_` 前缀目录不算场景），供 `GET /api/scenes`。
- `main/llm-config.js`、`main/llm-proxy.js`：LLM 档案、请求转发。
- `main/voice.js`：GPT-SoVITS、SenseVoice 生命周期和 `/api/tts`。
- `main/fs-tools.js`：宠物工具、文件沙箱、截屏、ComfyUI、Python、联网搜索。
- `main/screen.js`：ScreenCap/desktopCapturer 认屏，`config.capMain` / `capRoom` 控制截屏目标。
- `renderer/app.js` 及同目录模块：桌宠 UI 与对话核心；入口 HTML 加载的是 `app.bundle.js`。
- `renderer/room.html`、`renderer/room.js`：卧室窗外层；房间场景本体在 `pet_space/scenes/room/index.html`。
- `preload.js`：通过 contextBridge 暴露 `window.petWindow`。
- `lib/config-store.js`：config 默认值与归一化的唯一入口；新增配置项要同时改这里、`config.example.json`、`docs/config.md`。
- `watchdog.js`、`topmost-guard.ps1`：外部守护进程。

## 运行时与端口

- 应用本地服务：`127.0.0.1:12400`（`serverPort`）。
- 调试 CDP：`config.debugPort`，`0` 表示关闭；开启后只绑 `127.0.0.1`。默认配置保持 `0`，本机可以临时开。
- 外部服务：Strata `8081` → 反代 `11435`；GPT-SoVITS `9880`；ComfyUI `8188`。不要为了验证擅自重启这些共享服务或用户正在运行的桌宠。

## 调试真实实例

侧边栏 / browser-use 只能打开普通网页副本（房间场景、`room.html`、`?role=pet`），看不到 Electron 的 preload、IPC、置顶、穿透和跨屏行为。

要看真实实例，用 `config.debugPort`（例如本机 `9222`）连 CDP：

- `GET http://127.0.0.1:9222/json/list` 列出两个真实窗口及房间 iframe。
- 在桌宠页执行 `window.__pet.snapshot()`，读取 `busy`、`turnSeq`、`wake`、`room`、`historyLen`、气泡/输入框、视口 DPI 等实时状态。
- `window.__pet` 还暴露 `player`、`speech`、`interrupt`、`room` 控制句柄；房间 iframe 里可直接读 `state`。
- CDP 还支持 console、网络和 `Page.captureScreenshot`。调试口无认证，只在本机使用；提交的默认配置里不要打开它。
- 本仓库自带现成脚本，优先用，不要现写 websocket：`node skills/cdp-debug/snapshot.js` 取实时状态；`node skills/cdp-debug/shot.js pet|room|iframe|all` 截真实窗口 PNG（截完用读图工具看，临时 PNG 验证完清理）。详见 `skills/cdp-debug/SKILL.md`。

## 硬性规则

- 绝不打印、提交或外发密钥：`config.json`、`llm.config.json`、`tts.config.json`、`renderer/system-prompt.txt` 都已被 gitignore；里面有 API Key、人设和本地路径。需要检查结构时用脚本只输出字段名或脱敏值。
- 不要提交：`logs/`、`history/`、`pet_space/`、`characters/`、`voices/`、`voice-samples/`、`author doc/`、任何配置文件。
- 不要修改 `renderer/system-prompt.txt`、用户的人设档案或 `pet_space/` 内容，除非用户明确要求。`pet_space/` 是宠物的个人空间，不是代码目录。
- 写入工具必须留在 `pet_space/` 内。不要放宽 `petReadScope`、`petReadBlacklist`、Python 容器限制或 `fetch_url` 的内网拦截。
- 不要为了“验证”kill / 重启用户正在运行的桌宠、看门狗或外部 AI 服务；先用日志、`/api/config`、CDP 查。确需重启时先征得用户同意，并尽量把停机改动合并成一次。
- 只有用户明确要求时才 commit / push。推送前看 `git status` / `git diff`；不要 `git add -A` 把用户数据带进去。
- 提交信息沿用仓库现有风格：`feat(scope): 中文说明` / `fix(scope): 中文说明`，一次提交只做一条功能线。
- 远程是 GitHub `sun19970908/petpet` 的 `main` 分支。公网推送需要本机代理时，先 `netstat` 确认监听端口，只给当次 git 命令加 `-c http.proxy=...`，不要改全局 git 配置。

## 改动与验证流程

1. 先在 `docs/config.md` 和源码里确认现状；新增配置项走 `lib/config-store.js` + `config.example.json` + `docs/config.md`。
2. 改完先跑 `node --check` 或 `npm run build`（渲染层改动必须 build）。
3. 能通过日志、API 或 CDP 验证的，先做只读验证；不要用重启代替诊断。
4. 完成时说明：改了哪些文件、验证了什么、哪些没验证（尤其是需要真实鼠标或需要重启才能验证的行为）。