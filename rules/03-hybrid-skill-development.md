# Hybrid Skill 规范

## 1. 适用场景

Hybrid Skill 适合：

- 既要调用 blockcell 工具，又要运行 skill 目录内本地脚本
- 需要先读取文件、抓网页或写产物，再交给本地脚本处理
- 需要本地脚本完成核心处理，但前后仍要配合工具完成上下文准备或结果落盘

不适合：

- 纯工具 skill
- 纯本地脚本 skill

## 2. 目录结构

```text
skills/<skill_name>/
├── meta.yaml
├── SKILL.md
├── manual/
│   ├── prompt.md
│   ├── planning.md
│   └── summary.md
└── scripts/
    └── run.py | run.sh | cli.js | app
```

## 3. meta.yaml

推荐：

```yaml
name: report-builder
description: 读取素材并调用本地脚本生成最终报告
tools:
  - read_file
  - write_file
requires:
  bins:
    - python3
fallback:
  strategy: degrade
  message: 当前无法完成报告生成，请稍后重试。
```

规则：

- `tools` 只列普通工具
- `exec_local` 由内核自动提供，不要手工写进 `tools`
- `requires` 只写本地脚本真实依赖

## 4. SKILL.md

Hybrid Skill 的 `Prompt` 必须把职责边界写清：

- 哪些步骤用普通工具
- 哪一步才进入 `exec_local`
- 本地脚本执行后，是否还需要落盘或二次整理

推荐骨架：

```md
## Prompt {#prompt}
- [何时直接执行](manual/prompt.md#direct-run)
- [先取上下文还是先跑脚本](manual/prompt.md#tool-order)
- [exec_local 调用方式](manual/planning.md#exec-local-call)
- [参数构造规则](manual/planning.md#build-argv)
- [结果整理规则](manual/summary.md#final-answer)
```

## 5. 顺序约束

Hybrid Skill 的 `Prompt` 必须写清以下原则：

- 先复用主历史里的已有结果，不要重复读取或重复抓取
- 只有本地脚本确实需要时才调用 `exec_local`
- 一次问答最多执行一条本地脚本调用
- 本地脚本执行后，如果需要 `write_file` / `message` / `read_file` 等收尾动作，必须写明触发条件

## 6. 输出约束

Hybrid Skill 需要同时控制两层输出：

- 工具或本地脚本的原始结果如何保留在主历史
- 用户最终看到的结果如何整理

要写清：

- 哪些字段只保留在 trace 中
- 哪些字段可以在最终回复中展示
- 当产物已经写入文件时，最终回复必须带上明确路径

## 7. 作者检查清单

- 普通工具和 `exec_local` 的职责边界清晰
- 不会因为 skill manual 模糊而出现重复抓取、重复读取、重复生成
- 本地脚本 stdout 契约清晰，用户展示字段和内部字段分离
- `Prompt` 已明确“先复用历史，再决定是否重跑”
