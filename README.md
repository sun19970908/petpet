# livliv-pet

Windows、Linux 和 macOS 的本地 AI 桌宠。Electron + [livliv player](https://github.com/livliv-dev/player) 负责角色渲染，主进程负责窗口、截图、语音、文件和本地服务。

> 非官方项目。默认角色 p01/p02 使用 CC BY-NC-SA 4.0，仅限非商业用途；详见 [License / Assets](#license--assets)。

## 功能

- **桌面角色**：无边框透明窗口，鼠标穿透，原生视线跟随、挑眉和微笑；拖动位置会记住。
- **房间与副屏**：可选卧室窗口；`hasBedroom=false` 时只开主屏，没有副屏也能运行。
- **对话**：兼容 OpenAI Chat Completions 的本地或云端端点；按 `llm.config.json` 档案切换模型、上下文和采样参数。
- **记忆**：Orama 语义检索 + 可选 embedding；聊天记录保存为明文 JSON，可直接编辑或备份。
- **语音**：GPT-SoVITS TTS 默认关闭；SenseVoice ASR 在 Electron 主进程内通过 `sherpa-onnx-node` 运行，不需要 Python/FastAPI，模型需单独下载。
- **工具**：读取文件和目录、截屏、改房间、检索记忆；写入只允许 `pet_space/`。
- **唤醒**：手动铃铛、定时唤醒、无限唤醒；带 GPU 占用和上下文长度护栏。
- **多模态**：输入框粘贴图片，或点击按钮截屏后发给模型。

## 快速开始

要求：Node.js 22+、Git。Windows 另外需要 PowerShell；Linux/macOS 使用 bash。

### Windows

```powershell
git clone https://github.com/sun19970908/petpet.git livliv-pet
cd livliv-pet
powershell -NoProfile -ExecutionPolicy Bypass -File .\init.ps1
```

### Linux / macOS

```bash
git clone https://github.com/sun19970908/petpet.git livliv-pet
cd livliv-pet
bash init.sh
```

初始化脚本会：

- 只在缺失时复制配置、`pet_space` 和系统提示词；
- 创建 `logs/`、`history/`；
- 安装 npm 依赖；
- 从 [livliv-dev/player](https://github.com/livliv-dev/player) 只拉取 `p01`、`p02`（CC BY-NC-SA 4.0）。

初始化脚本不会下载 SenseVoice 模型；需要 ASR 时按下面的 [SenseVoice ASR](#sensevoice-asr可选) 一节手动下载。

已有配置或 `characters/` 不会被覆盖。

启动：

```bat
start-pet.bat
```

Linux/macOS：

```bash
bash start-pet.sh
```

调试模式会使用独立历史：

```bat
start-pet.bat debug
```

```bash
bash start-pet.sh debug
```

首次聊天前至少填写 `llm.config.json` 的 `llm.baseUrl`、`apiKey`、`request.model`，并用 `config.json` 的 `llmProfile` 选择档案。

## 配置

| 文件 | 作用 |
| --- | --- |
| `config.json` | 应用配置：角色路径、卧室开关、端口、唤醒阈值、TTS/ASR/ComfyUI |
| `llm.config.json` | LLM 档案：`app` 放上下文/唤醒/提示策略，`llm` 放端点、鉴权和 `request` 原生参数 |
| `tts.config.json` | 可选 GPT-SoVITS：`app` 是服务启动/切句，`request` 是原生请求 |

默认值：`characterPath=/characters/p01/`、`hasBedroom=false`、`ttsMode=off`、`llm.baseUrl` 为空。

LLM 档案最小结构：

```json
{
  "profiles": {
    "default": {
      "app": {
        "contextLength": 65536,
        "wakeGpuLimit": 40
      },
      "llm": {
        "baseUrl": "http://127.0.0.1:11435/v1/chat/completions",
        "headers": {},
        "apiKey": "",
        "request": {
          "model": "your-model",
          "temperature": 0.8,
          "max_tokens": 8192
        }
      }
    }
  }
}
```

对应 `config.json`：

```json
{
  "llmProfile": "default"
}
```

TTS 和 ComfyUI 是外部服务，地址在 `config.json` 中配置。ASR 不再依赖外部服务：`sherpa-onnx-node` 随 `npm install` 安装，只填写 `asrModelDir` 即可；模型目录需要包含 `model.int8.onnx` 和 `tokens.txt`。

### SenseVoice ASR（可选）

官方 int8 模型（中英日韩粤，2025-09-09；下载约 158 MB，解压后约 237 MB）：

```text
https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09.tar.bz2
```

Windows：

```powershell
New-Item -ItemType Directory -Force .\models
Invoke-WebRequest -Uri "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09.tar.bz2" -OutFile .\models\sensevoice.tar.bz2
C:\Windows\System32\tar.exe -xjf .\models\sensevoice.tar.bz2 -C .\models
Remove-Item .\models\sensevoice.tar.bz2
```

Linux / macOS：

```bash
mkdir -p models
curl -L "https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09.tar.bz2" -o models/sensevoice.tar.bz2
tar -xjf models/sensevoice.tar.bz2 -C models
rm models/sensevoice.tar.bz2
```

然后在 `config.json` 中填写：

```json
{
  "asrModelDir": "models/sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2025-09-09"
}
```

`models/` 已被 git 忽略。未配置或模型文件缺失时 ASR 自动禁用，不影响聊天；`/api/asr` 接收 16 kHz 单声道 16-bit PCM WAV，限制 20 MB。

## 项目结构

| 路径 | 说明 |
| --- | --- |
| `main.js` | Electron 入口 |
| `main/` | 主进程模块：窗口、截图、HTTP API、LLM 代理、语音、文件工具 |
| `renderer/` | 渲染层：角色、对话、表情、工具调用和提示词 |
| `lib/` | 配置、存储和启动辅助 |
| `pet_space.example/` | 初始人设和房间模板 |
| `init.ps1` / `init.sh` | Windows / Unix 初始化脚本 |
| `start-pet.bat` / `start-pet.sh` | Windows / Unix 启动脚本 |
| `characters/` | 角色资源；被 git 忽略，由初始化脚本下载 p01/p02 |
| `models/` | 可选的 SenseVoice ASR 模型；被 git 忽略，按需下载 |
| `tools/ScreenCap.exe` | Windows 多显示器截屏辅助工具；Unix 自动回退到 `desktopCapturer` |

## 开发

```powershell
npm install
npm run build
npm start
```

修改 `renderer/app.js` 后必须执行 `npm run build`，再重启桌宠。

## License / Assets

- **代码**：自有源代码使用 MIT，见根目录 [`LICENSE`](LICENSE)。第三方依赖和资源的授权见 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。
- **角色**：角色资源不随仓库分发。`init.ps1` / `init.sh` 只从 [livliv-dev/player](https://github.com/livliv-dev/player) 拉取 `p01`、`p02`；它们是 **CC BY-NC-SA 4.0**，必须署名、仅限非商业用途，修改后分发需使用同一协议。署名和完整条款见拉取后的 `characters/characters/LICENSE.md`、`characters/characters/CREDITS.md`。`p03`（Pen）上游未授予权利，初始化脚本不会拉取，也不应擅自分发。
- **语音和模型**：`voices/`、`voice-samples/`、GPT-SoVITS 权重、SenseVoice/ASR 模型、ComfyUI 模型都不在仓库中；TTS 默认关闭。ASR 的 Node 运行时依赖是 Apache-2.0 的 [`sherpa-onnx-node`](https://github.com/k2-fsa/sherpa-onnx)，模型需从上面的官方链接单独下载并遵守上游 SenseVoice/FunASR 的许可。尤其注意真人歌手音色的授权。
- **ScreenCap**：`tools/ScreenCap.cs` / `ScreenCap.exe` 是自有代码，按根 MIT 许可；构建说明见 [`tools/README.md`](tools/README.md)。
- **示例房间**：`pet_space.example/room/bedroom.png` 是示例图片，不自动纳入 MIT；公开再分发前请确认来源或替换为可自由分发的素材。
- **商标**：本项目是非官方项目，与 LivLiv 没有隶属、赞助或认可关系；相关名称和角色形象归各自权利人。

## 已知限制

- Windows 专用功能：`ScreenCap`、置顶守卫和 `.bat` / `.ps1` 脚本；Unix 上截屏回退到 Electron `desktopCapturer`，置顶守卫跳过。
- Unix 截屏依赖桌面环境：Linux 需要 X11 或 PipeWire，macOS 需要授予屏幕录制权限；无法截屏时请检查系统权限。
- Unix 分支已完成代码适配和启动脚本，但当前开发环境只在 Windows 上做过完整启动验证；首次在 Linux/macOS 运行请先确认 Electron 依赖和屏幕捕获权限。
- 本地 HTTP API 没有额外的 token 鉴权；外部网页的跨站请求已被拦截，但本机进程仍可访问。不要把端口暴露到局域网或公网。
- `read_file` 默认可读取本机任意文件；`write_file` 限制在 `pet_space/`。使用工具时注意隐私和密钥文件。
- TTS 和 ComfyUI 是外部服务，仓库不附带它们的模型、权重或语音样本；ASR 运行时在仓库依赖内，但 SenseVoice 模型需要单独下载。未安装或未配置时相关功能不会工作。
- ASR 的 Node 运行时已在 Windows 的 Electron 主进程中实测；Linux/macOS 只做了原生库路径适配，尚未实机验证，完整麦克风录制链路也需要在目标平台再跑一次。
