# DeepSeek 娘桌宠

Electron + [livliv player](https://github.com/livliv-dev/player) 的本地 AI 桌宠。

- 形象：p01 "Kujira"（上善无形绘，CC BY-NC-SA 4.0，个人非商用）
- 大脑：本地 Strata（经反代 11435，`strata-nothink` 关思考）
- 语音：GPT-SoVITS v2 **泠鸢yousa**（真人歌手，HF yousaforever 训练包；9880，3060 Ti，转发层 ffmpeg wav→mp3；权重在 `voices/yousa/`，启动用 `start-gsv-yousa.bat` + `tts_infer_yousa.yaml`；芙宁娜套件保留在 `voices/` 和 `start-gsv-furina.bat` 备用）
- **全屏透明层架构**：Electron 窗口盖满工作区，默认 `setIgnoreMouseEvents(true, {forward:true})` 鼠标穿透——livliv 原生视线跟随/挑眉/微笑全屏生效；悬停人物画布（向内收 14%）或输入框/气泡时自动关闭穿透。拖她 = 挪人物位置（localStorage 记忆），不是挪窗口
- 表情联动：回复含"大肥鱼"→angry+shake；害羞/讨厌→shy；哼/生气→angry；对不起→sad；默认 smile（所有表情 4 秒闪现回中性）
- **语义记忆（Orama + 硅基流动）**：`@orama/orama` + `@orama/tokenizers/mandarin`（`createTokenizer()` 工厂，非默认导出）+ SF `BAAI/bge-m3`（1024 维，key 在 `config.json`，来自 st_memory_table）。索引文件 `history/memory.orama`（debug: `debug-memory.orama`），启动时回填存量聊天记录；每轮对话自动入索引；每条消息前 hybrid 检索 top-5 注入【相关回忆】；她的新工具 `search_memory` 可自查记忆。embedding 失败自动退化为纯词法检索
- **思考模块系统（2026-11-09 v2 自适应）**：模型固定 `strata-nothink`（快），**思考强度 = pet_think 指令措辞动态控制**（验证：Qwen3.8 的思考强度本质是提示词域）。`pickThinkLevel` 按问题特征三档：light（纯寒暄，一句话思考）/ standard（默认）/ deep（>80 字或含查证读写分析等关键词，认真思考）。指令模板在 `THINK_MODULES`（app.js 顶部），开关 `PET_THINK=pet_think|off`。注入形态：[对话, user:强度指令, assistant:`<pet_think>\n让本桌宠想想：`] + cfm；`stripThink` 剥离（成对块 + cfm 续写段双形态）
- **手动唤醒 / 插话打断（🔔 双语义）**：空闲点击 = 自动截屏 + 提示"你被唤醒了，用户没有给你指示，自由行动吧"；忙碌点击 = **打断**（`turnAbort.abort()` 掐断生成/TTS 请求 + `speech.stop()` 停语音，未发送的用户话自动回输入框，气泡"（已打断）"）。提交统一走 `submitRequest`（定时唤醒复用 `wakeNow()` 同一入口）；截图 HTTP 兜底 `/api/capture`
- **自动唤醒**：🔔 旁的数字输入框 = 间隔（分钟，**0 = 关闭**），存 localStorage，到点调 `wakeNow()`（GPU 前置条件、忙时跳过自动继承）；回车应用
- **唤醒前置条件**：主卡（GPU 0）占用率 > `WAKE_GPU_LIMIT`（app.js，默认 40%）时跳过本次唤醒并提示；`nvidia-smi` 不可用则放行；GPU 查询走 IPC `/api/gpuutil`
- **文件工具**（原生 tool calls，实测通过）：`read_file`/`list_dir` 任意路径只读（**不截断**——为将来整份读聊天记录做上下文压缩预留；超大文件会自然撑爆请求，属可接受边界），`write_file` 仅限 `G:\AI\livliv-pet\pet_space\` 沙箱（200KB 上限）。主进程执行器 `runFsTool`（调用日志在 `logs/fstool.log`），IPC 与 `/api/fstool` HTTP 兜底共用。工具循环**无轮次上限**，唯一护栏：同一调用原样重复 3 次=卡死，收走工具逼文本回答；参数 JSON 解析失败会回喂准确错误让她自行重试（实测她能自我纠错）。历史只存最终问答，工具交换不落历史
- **两层提示词解耦**：`renderer/system-prompt.txt`（宪法：身份/行为规则/**文件工具规则**，**在写沙箱外，只有用户能改**）+ `pet_space/persona.txt`（性格档案，**在她的写沙箱内，她可自己重写**——系统提示词里教了她何时/如何改）。系统消息 = system-prompt + persona，每次发送前都重新读取，改完下一条即生效。工具规则已并入 system-prompt.txt，代码里不再有硬编码提示词
- **多模态**：输入框 Ctrl+V 粘贴图片 / 📷 按钮全屏截图（desktopCapturer），OpenAI `image_url` 格式进 Strata（实测图上数字识别正确）；历史图片折叠成 `[图片]` 占位
- **LLM 参数**：`max_tokens: 2000`（曾为 300——长内容工具调用的参数在 300 token 处被截断，模型反复重试烧上下文，实锤于代理日志）；截断（`finish_reason: length`）时工具结果会回喂明确错误提示她精简或分次写
- **模型场景路由**：首轮聊天 `strata-nothink`（快）；**带工具结果的反思轮自动切 `strata-lowthink`**（实测 nothink 在反思回合哑火）——lowthink 的思考内联 `<think>` 标签，app.js 已剥离不进 TTS/气泡
- **上下文注入规则（2026-11-09 修正）**：【工具调用台账】（尾部10条）和 pet_think 强度指令**只在拼请求时临时挂到最后一条 user 上，不进聊天历史**——历史存干净文本，杜绝全量发送时旧台账反复累积（曾实测 34 条消息注入 8 次）。历史/请求解耦：`send()` 存干净文本，`askLLM` 拼请求时由 `getToolLedger()`+`THINK_MODULES` 临时挂载
- **聊天历史**：**明文文件 `history/聊天记录.json` 是唯一事实源**（UTF-8，可直接编辑/备份；**在写沙箱外，她无权改写**）——**每次发消息前先从磁盘同步**：删除文件=真失忆、手动编辑=直接改记忆；之后追加本轮并整份重写。**每次请求全量发送**（用户决策，压缩/摘要后置）。**图片自动抽取**：写盘时把 dataURL 解码到 `history/img/` 独立文件，JSON 只留 `/history/img/...` 相对路径（可预览）——记录不膨胀

## 启动

前置服务：Strata(8081) → 反代(11435)。

双击运行 `start-pet.bat`，可带参数控制 GPT-SoVITS 语音服务生命周期：

```bat
start-pet.bat               # 默认：按需启动模式，收到 LLM 请求时预热拉起，120s 无请求自动杀死释放显存
start-pet.bat auto 180      # 按需启动模式，自定义 180s 无请求自动休眠
start-pet.bat on            # 常驻模式：开机即拉起，一直常驻不休眠
start-pet.bat off           # 纯静音/不启动模式：桌宠不拉起也不管理 GSV
```

## 改代码

`renderer/app.js` 是主逻辑（人设、表情联动、API），改完：

```
npm run build
```

再重开桌宠（静态服务已发 no-cache，重开即生效）。

## 防编造机制（2026-11-11）
- pet_think 指令含硬规则：查证类任务第一动作必须是调用工具（app.js THINK_MODULES）
- 工具台账自动注入每轮上下文（fstool-tail，最近 10 次真实操作）
- 查证兜底：用户消息含 查证/核实/台账/读过/做了没 等且本轮零工具调用 → 自动补一轮系统提醒逼她先查证（每任务一次，app.js wantsVerification/verificationNudged）
- 三层合力的效果：她会先对台账认账（引用真实时间戳）、再真读文件、再给出只有读过才说得出的细节

## 性能（2026-11-10/11 实测）
- **渲染 30fps 封顶**（app.js capFPS，rAF 节流，必须位于 new Player 之前）：桌宠动画足够流畅，GPU 压力减半
- **GPU 占用实测**：DWM 从 69-72%（并集透明窗+蒸汽动画+无限唤醒轮次）降至 <0.5-3%；electron 自身 3.9→2.8%
- 帧率不是 DWM 的驱动因素（A/B 实测 30fps 封顶前后 DWM 不变）；持续高占用的驱动是唤醒轮次活动（截图/房间交互叠加在透明窗上），活动期瞬态属正常
- 混合 DPI 补偿（updatePetDprScale）仅在双屏缩放不同时生效，跨屏拖动卡顿时优先检查它
- 内存：桌宠全家桶 ~3.5GB（Electron 1.2 + GPT-SoVITS 2.3）；Strata 重启前需可用内存 ≥70GB（部署记录 §23），桌宠非主犯但计入预算

## 已知坑

- **表情必须闪现**：`setExpression()` 不自动解除，常驻表情（尤其 p01 的 smile=闭眼大笑）会盖住全部原生视线/挑眉/浅笑互动，`faceFree` 也变 false。所有表情用 4 秒后 `setExpression(null)` 回中性的模式
- **调 livliv 状态看 `player.snapshot()`**：`player.params` 是"用户设置值"不是渲染姿势，读它诊断跟随是错的；快照 PNG 才是真凭据
- **音色变声/低沉**：livliv 的 wav 流式播放路径不认 24k 以外的采样率（48k 会被当 24k 播，降八度）。解法：main.js 转发层用 ffmpeg 把 GPT-SoVITS 的 wav 转成 mp3，让渲染层走 decodeAudioData（真实采样率）。注意本机 GPT-SoVITS v2pro (20250604) 的 api_v2 不支持 media_type=mp3，只认 ogg/aac/wav，转码必须在转发层做
- **视线跟随**：靠全屏窗口 + livliv 原生 `followPointer`（'page' 模式），**不要用 lookAt 轮询**——lookAt 会接管注视目标、屏蔽原生的挑眉/浅笑行为。窗口拖动用手动实现（app-region: drag 会吞掉一切鼠标事件）
- WebGL 画布截图全黑是正常假象（preserveDrawingBuffer 未开），肉眼可见
- npm 新版会拦 electron/esbuild 的 postinstall：`npm install-scripts approve electron esbuild`，electron 二进制缺失时手动 `node node_modules/electron/install.js`
- TTS 参数收紧（temperature 0.4 / top_P 0.7 / top_K 3）防止音色漂移；GPT-SoVITS 芙宁娜模型只有一条参考音频，音色上限由它决定
