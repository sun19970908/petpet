# 配置参数说明

本文档说明 `config.json`、`llm.config.json`、`tts.config.json` 的字段、默认值和行为。

项目根目录在本文档中记作 `APP_ROOT`。三个配置文件都是严格 JSON，不支持 `//` 或 `/* */` 注释；修改后重启桌宠生效。

| 文件 | 作用 |
| --- | --- |
| `config.json` | 桌宠运行配置：界面、窗口、语音、ComfyUI、读取权限等 |
| `llm.config.json` | LLM 档案：连接地址、模型、请求参数、提示策略 |
| `tts.config.json` | GPT-SoVITS TTS 的启动参数和原生请求参数 |

对应的示例文件：`config.example.json`、`llm.config.example.json`、`tts.config.example.json`。示例文件也只使用纯 JSON，不含注释。

---

## 一、config.json

### 记忆与 embedding

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `siliconflowKey` | string | 空 | 硅基流动 API Key，仅用于记忆 embedding，不是 LLM 的 API Key。为空时语义记忆的向量检索会退化为全文检索。 |
| `embeddingModel` | string | `BAAI/bge-m3` | embedding 模型名，需要和 `embeddingUrl` 提供方支持的模型一致。 |
| `embeddingDim` | number | `1024` | embedding 维度。当前记忆索引按 1024 维建立，换模型时请保持输出维度为 1024。 |
| `embeddingUrl` | string | `https://api.siliconflow.cn/v1/embeddings` | embedding 接口地址。 |

### 无限唤醒与看门狗

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `infwakeCutoff` | string | `12:00` | 无限唤醒的跨日阶段分界时间，格式 `HH:MM`，24 小时制。 |
| `infwakeReflectEvery` | number | `8` | 连续唤醒每进行 N 轮，插入一次反思提示。必须大于 0。 |
| `watchdog` | boolean | `false` | 是否启动看门狗。支持布尔值，也接受 `on` / `off` / `always` / `never` 等写法。 |

### 窗口与屏幕

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `hasBedroom` | boolean | `false` | 是否启用卧室。`false` 时只使用主屏；`true` 时尝试把卧室放到副屏。 |
| `petOnlyBedroom` | boolean | `false` | 桌宠是否只待在卧室屏。仅在卧室可用时生效。 |
| `splitWindows` | boolean | `true` | 是否拆分桌宠窗口和卧室窗口。关闭后使用单窗口模式。 |
| `serverPort` | number | `12400` | Electron 本地 HTTP 服务端口，也是渲染层和本地 API 使用的端口。 |
| `hwCompositing` | boolean | `true` | 是否使用硬件合成。设为 `false` 会关闭 GPU 合成，适合多显卡/截屏异常时排查。 |
| `capMain` | string | `main` | 主屏截屏目标。可填 ScreenCap 的数字下标（`0`、`1`）或屏幕名称模糊匹配；默认 `main`。 |
| `capRoom` | string | `room` | 卧室屏截屏目标，规则同 `capMain`。 |
| `characterPath` | string | `/characters/p01/` | 角色资源 URL 路径，指向 `characters/` 下的角色目录。 |
| `llmProfile` | string | `default` | 当前使用的 `llm.config.json` 档案名。修改后需要保证该档案存在。 |

### 语音

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `ttsMode` | string | `off` | TTS 启动模式：`off`/`never` 不启动；`on`/`always` 启动时常驻；`auto` 按需启动。 |
| `asrModelDir` | string | 空 | SenseVoice 模型目录。目录中需要包含 `model.int8.onnx` 和 `tokens.txt`；为空时 ASR 不可用。 |

旧版字段 `asrPython`、`asrPort` 已不再使用，可以删除。

### ComfyUI

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `comfyHost` | string | `127.0.0.1` | ComfyUI 主机地址。 |
| `comfyPort` | number | `8188` | ComfyUI HTTP 端口。 |
| `comfyInputDir` | string | 空 | ComfyUI 的 `input` 目录。工作流包含 `LoadImage` 且传入 `input_image` 时必须能访问该目录。 |

桌宠会通过 `GET /system_stats` 探测 ComfyUI。连不上时不会把 `comfy_run` 工具下发给模型；ComfyUI 启动后，下一轮对话会重新探测。`comfyInputDir` 为空或不存在的配置不会影响不包含 `LoadImage` 的工作流。

### 宠物读取权限

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `petReadScope` | string | `space` | `space`：宠物只能读取 `pet_space/`；`all`：允许读取整机文件（仍受黑名单限制）。 |
| `petReadBlacklist` | string[] | `["config.json", "llm.config.json", "tts.config.json", ".git"]` | 读取黑名单。支持绝对路径，也支持相对 `APP_ROOT` 的路径；命中路径及其子路径都会被拒绝。不支持通配符。 |

读取限制作用于：

- `read_file`
- `list_dir`
- `file_tool` 的 `copy` 源路径

`list_dir` 会过滤掉黑名单项；复制目录时，如果目录内部包含黑名单路径，会拒绝整次复制。默认 `space` 模式下，`README.md`、`logs/`、`config.json` 等 `pet_space/` 之外的文件都不可读。如果宠物需要读这些文件，把 `petReadScope` 改成 `all`，再用 `petReadBlacklist` 排除敏感路径。

### config.json 可选内联 LLM 覆盖

`config.json` 里可以额外放一个 `llm` 对象，用来覆盖当前 LLM 档案的部分字段；一般不建议这样使用，优先在 `llm.config.json` 中管理。常规配置只需要 `config.json` 的 `llmProfile` 指向档案名。

---

## 二、llm.config.json

顶层结构：

```json
{
  "profiles": {
    "default": {
      "app": {},
      "llm": {}
    }
  }
}
```

`config.json` 的 `llmProfile` 选择 `profiles` 中的档案。`llm.config.json` 不保存 active profile；档案名只在 `config.json` 中维护。

### app

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `wakeGpuLimit` | number | `40` | 手动/自动唤醒前的 GPU 占用率上限（百分比）。`>= 100` 表示跳过 GPU 占用判断。 |
| `contextLength` | number | `65536` | 上下文长度提示值；连续唤醒达到该 token 数多次后会停止无限唤醒。 |
| `customPrompt` | string | 空 | 追加到系统提示词的自定义说明。 |
| `capabilities` | object | 见下 | 模型能力与消息格式适配。 |
| `promptPolicy` | object | 见下 | 尾缀续写和工具策略。 |

### app.capabilities

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `vision` | boolean | `true` | 模型是否支持图片。关闭后不发送图片，且会过滤截图类工具。 |
| `nativeTools` | boolean | `true` | 是否使用原生 function calling。关闭后请求不携带原生 tools。 |
| `keepVisionToolsWhenTextOnly` | boolean | `false` | 纯文本模型是否仍保留 `take_screenshot` / `look_at_room` 工具。 |
| `preserveReasoningInHistory` | boolean | `false` | 是否把模型返回的 reasoning 内容保留进历史。 |
| `prefixMode` | string | `continue_final_message` | 续写方式：`continue_final_message`、`message_prefix`、`none`。 |

### app.promptPolicy

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `tailMode` | string | `prefill_assistant` | 尾缀策略：`prefill_assistant` 追加 assistant 预填充；`user_instruction` 把说明作为 user 消息；`none` 不加尾缀。 |
| `tailInstruction` | string | 见示例 | 尾缀说明文本。 |
| `tailPrefill` | string | 见示例 | assistant 预填充文本。 |
| `parseTextToolCalls` | boolean | `true` | 是否解析 `<tool_call>` / `<invoke>` 文本工具调用。适合不支持原生工具调用的本地模型。 |
| `forceToolMode` | string | `prefill_tag` | 强制工具调用方式：`prefill_tag` 使用文本预填充；`tool_choice_required` 使用原生 `tool_choice: required`。 |
| `forceToolPrefillText` | string | `<tool_call>\n` | 文本预填充工具调用时使用的开头。 |

### llm

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `baseUrl` | string | 空 | OpenAI 兼容的 chat completions 完整地址，例如 `http://127.0.0.1:11435/v1/chat/completions` 或云端 `https://.../v1/chat/completions`。 |
| `apiKey` | string | 空 | LLM API Key。也可以使用环境变量 `LLM_API_KEY`；占位值 `your-...-key-here` 会被视为空。 |
| `headers` | object | 空 | 可选的自定义 HTTP 请求头。 |
| `request` | object | 见下 | 直接透传给模型服务的请求参数。 |

### llm.request

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `model` | string | `your-model` | 模型名。 |
| `temperature` | number | `0.8` | 采样温度。 |
| `max_tokens` | number | `65536` | 最大输出 token 数，按模型服务限制调整。 |
| 其他字段 | - | - | 例如 `top_p`、`thinking` 等厂商扩展参数会原样透传。 |

---

## 三、tts.config.json

TTS 默认关闭；未安装 GPT-SoVITS 或没有授权参考音频时不要开启。参考音频模型和权重不随仓库分发。

### app

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `idleSeconds` | number | `120` | TTS 服务空闲多少秒后卸载。 |
| `url` | string | `/api/tts` | 桌宠内部 TTS 路由，通常不需要修改。 |
| `server.dir` | string | 空 | GPT-SoVITS 根目录。 |
| `server.python` | string | Windows `runtime\python.exe`，Unix `python3` | GPT-SoVITS 使用的 Python 可执行文件；相对路径按 `server.dir` 解析。 |
| `server.config` | string | `GPT_SoVITS/configs/tts_infer.yaml` | GPT-SoVITS 配置文件，相对于 `server.dir`。 |
| `server.gpu` | string | `0` | GPT-SoVITS 使用的 GPU 编号，单卡机器保持 `0`。 |
| `server.port` | number | `9880` | GPT-SoVITS 本地服务端口。 |
| `server.startTimeoutMs` | number | `90000` | 启动服务的最长等待时间，最大 300000。 |
| `shortTextLimit` | number | `60` | 短文本阈值；不超过该长度使用 `splitShort`，超过使用 `splitLong`。 |
| `splitShort` | string | `cut0` | 短文本切句策略，传给 GPT-SoVITS 的 `text_split_method`。 |
| `splitLong` | string | `cut5` | 长文本切句策略。 |

### request

`request` 是 GPT-SoVITS `/tts` 的原生请求体；`text` 由桌宠在每次请求时注入。

| 字段 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `text_lang` | string | `zh` | 待合成文本语言。 |
| `prompt_lang` | string | `zh` | 参考音频对应文本语言。 |
| `media_type` | string | `wav` | 输出音频格式。 |
| `streaming_mode` | number/boolean | `2` | GPT-SoVITS 流式模式。 |
| `temperature` | number | `0.4` | 采样温度。 |
| `top_k` | number | `3` | top-k 采样。 |
| `top_p` | number | `0.7` | top-p 采样。 |
| `text_split_method` | string | `cut5` | 默认切句方式，可被 `app.splitShort` / `app.splitLong` 按文本长度覆盖。 |
| `ref_audio_path` | string | 空 | 参考音频路径。必须是已获授权的音色，不能随仓库分发。 |
| `prompt_text` | string | 空 | 参考音频对应的逐字文本。 |

---

## 四、配置文件关系与生效

1. `config.json` 的 `llmProfile` 选择 `llm.config.json` 的档案。
2. `config.json` 的 `ttsMode` 控制是否启动 GPT-SoVITS；启动参数在 `tts.config.json`。
3. `config.json` 的 `comfyHost` / `comfyPort` / `comfyInputDir` 控制 ComfyUI 工具和输入目录。
4. `config.json` 的 `petReadScope` / `petReadBlacklist` 控制宠物读取权限。
5. 修改配置后重启桌宠；运行中的进程不会自动重新读取所有配置。
6. `config.json`、`llm.config.json`、`tts.config.json` 默认被 Git 忽略，避免把密钥、路径和音色配置提交到仓库。
