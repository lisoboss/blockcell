# Local Script Skill 规范

## 1. 适用场景

Local Script Skill 适合：

- 需要调用 skill 目录内的本地脚本或 CLI
- 需要 Python / Shell / Node / PHP / 本地可执行文件
- 需要把外部 SDK、协议细节或复杂解析封装进本地脚本

不适合：

- 只靠现有工具就能完成的任务
- 需要多步工具编排但不需要本地脚本的任务

## 2. 目录结构

```text
skills/<skill_name>/
├── meta.yaml
├── SKILL.md
├── manual/
│   ├── planning.md
│   └── summary.md
└── scripts/
    └── run.py | run.sh | cli.js | tool.php | app
```

也允许直接把入口脚本放在 skill 根目录，例如 `SKILL.py`。

## 3. meta.yaml

推荐：

```yaml
name: tavily-search
description: 用本地 Tavily 脚本搜索网页并整理来源
requires:
  bins:
    - python3
  env:
    - TAVILY_API_KEY
fallback:
  strategy: degrade
  message: 当前无法完成 Tavily 搜索，请检查环境后重试。
```

规则：

- 不把 `exec_local` 写进 `tools`
- `requires` 只写真正的运行前提
- `fallback` 只写用户可理解的失败提示

## 4. SKILL.md

Local Script Skill 的根 `SKILL.md` 仍然只依赖：

- `## Shared {#shared}`
- `## Prompt {#prompt}`

推荐把复杂规则拆到子文档，再从 `Prompt` 章节引入：

```md
## Prompt {#prompt}
- 固定使用 `exec_local`
- [动作映射](manual/planning.md#actions)
- [exec_local 调用方式](manual/planning.md#exec-local-call)
- [参数构造规则](manual/planning.md#build-argv)
- [结果整理规则](manual/summary.md#final-answer)
- [敏感字段过滤](manual/summary.md#redaction)
```

## 5. exec_local 约束

当前内核里，本地脚本只能通过 `exec_local` 调用。

必须写清：

- `path`：相对 skill 目录的脚本路径
- `runner`：`python3` / `bash` / `sh` / `node` / `php`，或直接执行 skill 目录内可执行文件
- `cwd_mode`：固定为 `skill`
- `args`：只包含脚本自己的参数

例如：

```text
exec_local(path="SKILL.py", runner="python3", cwd_mode="skill", args=[...])
```

规则：

- 一次问答只选择一个本地执行入口来完成当前目标
- 不要同时规划多条本地命令让模型自己分叉
- 不要把解释器路径或系统绝对路径写死到 `SKILL.md`

## 6. stdout 约定

Local Script Skill 必须在 `Prompt` 或子文档里写清：

- `exec_local` 返回的是包装后的 JSON
- 真正的脚本输出在 `stdout`
- 如果 `stdout` 是 JSON，模型应优先解析 `stdout`
- 哪些字段只用于后续 follow-up，不能直接展示给用户

## 7. Follow-up 设计

如果 skill 需要支持“第 N 条”“查看刚才那个”“继续发布”这类续接请求，脚本 stdout 必须保留稳定的内部标识。

要求：

- 标识写进 stdout JSON
- 最终对用户回复时不直接暴露这些标识
- `Prompt` 明确要求模型优先从最近主历史 tool trace 复用这些标识
- 只有历史里确实缺失时，才重新执行列表类操作

## 8. 作者检查清单

- `SKILL.md` 明确写了 `exec_local` 的固定调用方式
- `args` 规则清楚，不会把解释器或脚本路径混进 argv
- stdout JSON 结构稳定，能支持后续多轮引用
- 敏感字段和内部标识有单独 redaction 规则
- 根文档中的 markdown 链接都能解析
