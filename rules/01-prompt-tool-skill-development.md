# Prompt Tool Skill 规范

## 1. 适用场景

Prompt Tool Skill 适合：

- 主要靠 `SKILL.md` 约束模型行为
- 主要调用 blockcell 已注册工具完成任务
- 不需要本地脚本、CLI 或第三方 SDK

不适合：

- 必须运行本地脚本才能完成的任务
- 明显依赖外部 SDK、私有协议或复杂解析
- 需要先取远端数据、再交给本地脚本处理的任务

## 2. 目录结构

```text
skills/<skill_name>/
├── meta.yaml
├── SKILL.md
└── manual/
    └── prompt.md
```

`manual/` 是可选目录。简单 skill 只需要 `meta.yaml + SKILL.md`。

## 3. meta.yaml

推荐：

```yaml
name: weather
description: 查询天气和短期预报
tools:
  - web_fetch
fallback:
  strategy: degrade
  message: 当前无法获取天气数据，请稍后重试。
```

规则：

- 不写 `triggers`
- 不写 `capabilities`
- 不写 `always`
- 不写 `output_format`
- `tools` 只列本 skill 真实会用到的工具

## 4. SKILL.md

Prompt Tool Skill 的根 `SKILL.md` 必须包含：

- `## Shared {#shared}`
- `## Prompt {#prompt}`

推荐骨架：

```md
# <skill name>

## Shared {#shared}
- 适合处理什么问题
- 默认语言、默认范围、默认输出风格
- 绝对不能做什么

## Prompt {#prompt}
- 什么情况直接执行
- 什么情况先澄清
- 工具使用顺序
- 默认值如何推断
- 最终回复格式
```

复杂规则写到子文档，再由根 `SKILL.md` 链接引入：

```md
## Prompt {#prompt}
- [澄清规则](manual/prompt.md#clarify)
- [工具顺序](manual/prompt.md#tool-order)
- [输出格式](manual/prompt.md#output)
```

## 5. 执行约束

Prompt Tool Skill 的当前执行方式只有一条：

1. planner 选择 skill
2. runtime 注入 `shared + prompt`
3. 模型在白名单工具内完成当前目标
4. 完整 tool trace 写入主历史

因此 `Prompt` 章节必须写清：

- 如何复用最近主历史中的 tool 结果
- 用户问“第 N 条”“刚才那个”“继续”时，先用已有上下文，不要无脑重取
- 哪些默认值可以自动补，哪些缺失必须澄清

## 6. 作者检查清单

- `meta.yaml` 没有旧路由字段
- `SKILL.md` 只描述当前规范
- `Prompt` 章节写清了澄清边界、工具顺序、默认值和输出格式
- 需要复用列表/详情上下文时，明确写了“先复用历史，再决定是否重取”
- 根文档中的所有 markdown 链接都能解析到 skill 目录内有效 section
