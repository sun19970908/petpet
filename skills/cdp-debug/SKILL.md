---
name: cdp-debug
description: 用 CDP 调试 livliv-pet 真实运行实例——查实时状态、截真实窗口画面。需要看/验证"跑起来的桌宠"（气泡、房间状态、装修效果）而不只是代码副本时用；改完渲染层 npm run build 之后做真机验收也用这个。
---

# CDP 真机调试（snapshot / shot）

前提：应用在跑，且 `config.json.debugPort` 开着（本机惯例 `9222`；仓库提交的默认配置是 `0` 关闭）。
只读操作，随便跑；接口细节见仓库根 `AGENTS.md`「调试真实实例」。

## 查实时状态

```bash
node skills/cdp-debug/snapshot.js
```

打印 `window.__pet.snapshot()` 的 JSON：`busy`、`turnSeq`、`wake`、气泡文本、输入框、
房间状态（curtain/lamp）、视口 DPI、最近对话等。判断"她现在忙不忙、说什么、房间什么样"靠它。

## 截真实画面

```bash
node skills/cdp-debug/shot.js pet        # 桌宠窗
node skills/cdp-debug/shot.js room       # 卧室窗宿主
node skills/cdp-debug/shot.js iframe     # 房间场景本体（可能多张）
node skills/cdp-debug/shot.js all        # 全部（默认）
```

每张 PNG 的绝对路径逐行打印，**拿到路径后必须用读图工具打开看**，别只停留在"截出来了"。
可选 `--out=前缀`（默认 `shot`）、`--port=9222`（或环境变量 `CDP_PORT`）。

## 更深的手动操作

自己发 CDP：`GET http://127.0.0.1:<port>/json/list` 拿 `webSocketDebuggerUrl`，
`Runtime.evaluate` 任意表达式（`window.__pet` 上有 `player`、`speech`、`interrupt`、`room`；
房间 iframe 的 target 里可直接读 `state`）。console、network 域同样可用。
调试口无认证，只在本机使用。

## 坑

- 退出码 1 + "连不上 CDP"：应用没跑或 `debugPort=0`。**不要为此擅自重启应用**，先问用户。
- `iframe` 模式是从宿主窗把 iframe 矩形区域 clip 出来（iframe target 本身不支持 Page 域）；分屏模式下桌宠窗的装修层是 0×0，会被自动跳过，属正常。
- 截图只能到画面层；真实鼠标点击、置顶丢失、混合 DPI 这类行为验证不了，仍需用户人肉确认。
- 截图输出默认落在当前目录，验证完记得清理临时 PNG，别把它们提交进仓库。
