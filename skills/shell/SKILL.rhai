// Shell 命令执行技能编排脚本
//
// 预注入变量:
//   user_input   — 用户原始输入
//   ctx          — 运行时上下文, 其中 ctx.message 可能为 JSON 字符串

let raw_message = if ctx != () {
    let msg = get_field(ctx, "message");
    if msg != () && msg != "" { msg } else { user_input }
} else {
    user_input
};

let payload = from_json(raw_message);
let cmd = if is_map(payload) {
    let parsed = get_field(payload, "command");
    if parsed != () && parsed != "" { parsed } else { user_input }
} else {
    user_input
};
let cwd = if is_map(payload) {
    let parsed = get_field(payload, "working_dir");
    if parsed != () && parsed != "" { parsed } else { () }
} else {
    ()
};
let timeout = if is_map(payload) {
    let parsed = get_field(payload, "timeout_secs");
    if parsed != () { parsed } else { 30 }
} else {
    30
};

log("🖥️ [Shell] 执行命令: " + cmd);

let params = #{
    command: cmd,
    timeout_secs: timeout
};

if cwd != () {
    params.working_dir = cwd;
}

let result = call_tool("exec", params);

if is_error(result) {
    set_output(#{
        success: false,
        command: cmd,
        error: get_field(result, "error")
    });
} else {
    let stdout = get_field(result, "stdout");
    let stderr = get_field(result, "stderr");
    let exit_code = get_field(result, "exit_code");
    
    log("🖥️ [Shell] 退出码: " + exit_code);
    
    set_output(#{
        success: exit_code == 0,
        command: cmd,
        stdout: stdout,
        stderr: stderr,
        exit_code: exit_code
    });
}
