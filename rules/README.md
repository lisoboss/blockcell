# Skills 开发规范

> Last updated: 2026-03-17
> Scope: blockcell 当前 skill 内核

## 1. 当前执行模型

blockcell 现在只有一条统一的用户 skill 执行链路：

1. planner 根据用户问题、历史和已启用 skill 描述选择是否进入 skill
2. runtime 读取根 `SKILL.md`
3. 只把 `shared + prompt` 注入当前 skill 上下文
4. 模型自行决定是否调用普通工具，或在需要时调用 `exec_local`
5. 完整 tool trace 写回主历史

当前规范的核心结论：

- `meta.yaml` 不再承担路由职责
- 不使用 `triggers`
- 不使用私有 continuation context
- follow-up 只依赖主历史里的完整 tool trace
- `SKILL.md` 是 skill 的唯一运行时说明书

## 2. skill 目录结构

```text
skills/<skill_name>/
├── meta.yaml
├── SKILL.md
├── manual/
│   └── *.md
└── scripts/ | SKILL.py | SKILL.sh | cli.js | app
```

复杂 skill 可以拆多个子 `.md`，但运行时入口永远是根 `SKILL.md`。

## 3. meta.yaml 最小规范

推荐只保留：

```yaml
name: weather
description: 查询天气和短期预报
tools:
  - web_fetch
requires:
  bins: []
  env: []
permissions: []
fallback:
  strategy: degrade
  message: 当前无法获取天气数据，请稍后重试。
```

字段说明：

- `name`：skill 名称
- `description`：给 planner 和人看的简洁描述
- `tools`：普通工具白名单
- `requires`：本地脚本或环境依赖
- `permissions`：显式权限声明
- `fallback`：用户可理解的失败提示

不要写：

- `triggers`
- `capabilities`
- `always`
- `output_format`

## 4. 根 SKILL.md 规范

根 `SKILL.md` 必须包含：

- `## Shared {#shared}`
- `## Prompt {#prompt}`

当前内核只注入这两部分，因此所有真实规则都必须能通过这两部分拿到。

根文档职责：

- 说明这个 skill 适合处理什么问题
- 说明哪些请求直接执行，哪些请求先澄清
- 说明工具或 `exec_local` 的使用顺序
- 说明默认值如何推断
- 说明最终结果如何整理
- 说明哪些字段不能暴露给用户

## 5. 子文档与 section link

根 `SKILL.md` 可以用标准 markdown 链接拆分复杂规则：

```md
## Prompt {#prompt}
- [动作映射](manual/planning.md#actions)
- [结果整理规则](manual/summary.md#final-answer)
```

当前解析规则：

- 只解析根 `SKILL.md` 中出现的本地 `.md` 链接
- 只允许 skill 目录内相对路径
- 支持 `a.md#section-id`
- 只展开一层
- 子文档里的二次链接不递归解析
- section 优先匹配显式 id，如 `{#final-answer}`

## 6. 三种 authoring pattern

当前只保留三类 skill 写法：

### 1. Prompt Tool Skill

- 只用普通工具
- 不运行本地脚本

规范见：

- [01-prompt-tool-skill-development.md](01-prompt-tool-skill-development.md)

### 2. Local Script Skill

- 通过 `exec_local` 调用 skill 目录内本地脚本或 CLI

规范见：

- [02-local-script-skill-development.md](02-local-script-skill-development.md)

### 3. Hybrid Skill

- 同时使用普通工具和 `exec_local`

规范见：

- [03-hybrid-skill-development.md](03-hybrid-skill-development.md)

## 7. 历史与 follow-up 规则

skill 设计必须默认以下事实：

- 最近主历史里会保留完整 tool trace
- 用户会继续问“第 N 条”“刚才那个”“继续”
- 模型应优先复用历史里的 tool 结果，再决定是否重跑

因此 skill 说明里必须明确：

- 哪些字段是后续引用所必需的内部标识
- 这些字段如何保留在 trace 中
- 这些字段为什么不能直接展示给用户

## 8. 作者检查清单

- `meta.yaml` 是最小元数据
- 根 `SKILL.md` 是唯一运行时入口
- 所有真实规则都能通过 `shared + prompt` 拿到
- 根文档中的链接只指向 skill 目录内一层 `.md`
- 需要 follow-up 的 skill 已明确历史复用策略
- 需要本地脚本的 skill 已明确 `exec_local` 调用方式
