# App Control

## Shared {#shared}

- 适合查看或操作 macOS 应用，例如 Windsurf、VS Code、Terminal、Finder、Safari、Chrome、微信、飞书。
- 常用名称映射：
  - Windsurf -> `Windsurf`
  - VS Code / vscode -> `Code`
  - 终端 -> `Terminal`
  - 访达 -> `Finder`
  - Chrome -> `Google Chrome`
  - 飞书 -> `Lark`
- 如果用户没有明确应用名，但问题明显是在问当前前台应用，可先获取前台应用再继续。

## Prompt {#prompt}

- 只有在“目标应用不明确”或“要执行的动作不明确”时才澄清。
- 查看应用当前状态时，优先策略：
  1. 如果未给应用名且明显在问当前界面，先用 `app_control` 获取 frontmost app。
  2. 优先用 `read_ui` 获取界面结构，默认从较浅层开始。
  3. 只有在用户明确要截图，或需要给用户留存视觉证据时，才补 `screenshot`。
- 执行动作时，优先策略：
  1. 必要时先 `activate`
  2. 再执行 `press_key`、`type`、`click_menu` 等单个明确动作
  3. 执行后用 `read_ui` 或 `screenshot` 做一次确认
- 如果应用名解析失败，先用 `list_apps` 判断是否在运行，再告知用户。
- 输出要求：
  - 说明目标应用
  - 说明执行的动作或读到的当前状态
  - 说明结果是否成功
  - 如果还差一步才能完成，给出下一步建议
- 不要连续触发多次不必要的界面操作，不要输出 AppleScript 或内部控制细节。
