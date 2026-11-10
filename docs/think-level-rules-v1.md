# 思考强度规则 v1 存档（正则选择器，2026-11-09）

> 已被 v2（模型自评难度）替代。v2 优点：语义理解远超正则、无需维护触发词表。
> v1 优点：零额外 token、行为完全可预测、不依赖模型自觉。若 v2 出现"难度误判"（简单题想太多/复杂题想太少），
> 可参考本文件回滚或做混合（正则粗判 + 模型细判）。

## 原实现（app.js）

```js
const THINK_MODULES = {
  light: {
    instruction: '你必须在pet_think标签内以"人设档案"的身份、性格和口吻进行非常简短的思考（一句话即可），然后回复',
    prefill: '<pet_think>\n让本桌宠想想：',
  },
  standard: {
    instruction: '你必须在pet_think标签内以"人设档案"的身份、性格和口吻进行简单思考（考虑怎么回答更自然），然后调用工具或回复',
    prefill: '<pet_think>\n让本桌宠想想：',
  },
  deep: {
    instruction: '你必须在pet_think标签内以"人设档案"的身份、性格和口吻认真思考（先分析问题在问什么、是否需要调用工具、回忆相关旧事，再想怎么回答最自然），然后调用工具或回复',
    prefill: '<pet_think>\n让本桌宠认真想想：',
  },
};

// 按问题特征动态选强度：
//   deep     = 明确要求查证/读文件/多步、或带复杂度关键词、或长度长的消息
//   standard = 默认
//   light    = 纯寒暄/情绪表达（无信息量请求）
function pickThinkLevel(text) {
  const t = String(text || '').trim();
  if (!t) return 'light';
  if (t.length > 80) return 'deep';
  if (/(查证|读|翻|看看|找|搜|对比|总结|分析|写|整理|计算|为什么|怎么做|怎么办|如何|计划)/.test(t)) return 'deep';
  if (/^(嗨|哈喽|你好|在吗|早|晚|晚安|吃了吗|嗯|哦|哈哈|呵呵|爱你|喜欢你|抱抱|摸头|心情|难过|开心|累|困)[!！。~～\s]*$/i.test(t)) return 'light';
  return 'standard';
}
```

## 调用方式（v1 的 askLLM 片段）

```js
const level = THINK_MODE === 'off' ? null : pickThinkLevel(textOf(userContent));
const mod = level ? THINK_MODULES[level] : null;   // light / standard / deep 三档指令
// 注入：[对话, user: mod.instruction, assistant: mod.prefill] + continue_final_message
```

## v1 实测记录

- light：寒暄"早呀" → 秒回 + 从截图时间推理"下午才说早"的傲娇 ✓
- deep：读日记 + 两阶段心理变化分析（"从吹牛到认账再到挺直腰板"）✓
- 已知边界：纯正则不理解语义（"帮我看看这句话通不通顺"会误命中 deep）；无上下文感知（追问不升级）

## 混合方案备选（v2 误判时的回退）

正则判 light（高置信寒暄）→ 直接用 light 模块（跳过模型自评，省 token）；
其余交给 v2 模型自评。即：正则只做"一眼简单"的快速通道，复杂判断全归模型。
