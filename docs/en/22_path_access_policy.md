# Path Access Policy

Blockcell includes a configurable **filesystem access policy system** that lets you precisely control which paths the AI agent can read, write, list, or execute — without requiring manual confirmation every time.

---

## Core Concepts

### Policy Actions

| Action | Meaning |
|--------|---------|
| `allow` | Access granted immediately — no confirmation needed |
| `confirm` | A confirmation prompt is shown; user decides |
| `deny` | Access rejected immediately — no prompt sent |

### Operation Types (ops)

| Op | Triggered by |
|----|-------------|
| `read` | `read_file` |
| `write` | `write_file`, `edit_file`, `file_ops`, `data_process`, etc. |
| `list` | `list_dir` |
| `exec` | `exec` tool (`working_dir` parameter) |

### Evaluation Priority (highest → lowest)

1. **Workspace paths** (`~/.blockcell/workspace`) → always allowed
2. **Session-authorized directories** → allowed (user approved earlier in this session)
3. **Built-in sensitive path protection** (`builtin_protected_paths: true`) → denied (`~/.ssh`, `/etc`, etc.)
4. **User `deny` rules** → denied
5. **User `allow` rules** (if more specific than any matching deny) → allowed
6. **User `confirm` rules** → ask user
7. **`default_policy`** → fallback behavior (defaults to `confirm`)

> **Longest prefix wins**: when both `deny` and `allow` rules match the same path, the rule with the longer (more specific) prefix takes precedence.

---

## File Locations

| File | Purpose |
|------|---------|
| `~/.blockcell/config.json5` | Main config — controls whether the policy system is active and where the rules file lives |
| `~/.blockcell/path_access.json5` | Path rules (**generated automatically on first startup**) |

---

## Main Config (`config.json5`)

```json5
{
  "security": {
    "pathAccess": {
      // Enable or disable the policy system entirely
      // When disabled, falls back to the original workspace-only restriction
      "enabled": true,

      // Path to the rules file (supports ~/ expansion)
      "policyFile": "~/.blockcell/path_access.json5",

      // Behavior when the rules file is missing or fails to parse:
      // "fallback_to_safe_default" | "disabled"
      "missingFilePolicy": "fallback_to_safe_default"
    }
  }
}
```

---

## Rules File (`path_access.json5`)

```json5
{
  version: 1,

  // What to do when no rule matches a path
  default_policy: "confirm",

  // Auto-approve directories confirmed by the user within the same session
  cache_confirmed_dirs: true,

  // Always deny built-in sensitive paths (~/.ssh, /etc, etc.)
  builtin_protected_paths: true,

  rules: [
    // ── High priority: deny sensitive credential paths ──────────────────
    {
      name: "deny-secrets",
      action: "deny",
      ops: ["read", "write", "list", "exec"],
      paths: [
        "~/.ssh",
        "~/.aws",
        "~/.gnupg",
        "~/.kube",
        "~/.config/gcloud",
        "/etc",
        "/System"
      ]
    },

    // ── Allow common dev directories without confirmation ───────────────
    {
      name: "allow-dev-roots",
      action: "allow",
      ops: ["read", "list", "write"],
      paths: [
        "~/dev",
        "~/projects",
        "~/Desktop",
        "~/Documents"
      ]
    },

    // ── Always require confirmation for exec, even in allowed dirs ──────
    {
      name: "confirm-all-exec",
      action: "confirm",
      ops: ["exec"],
      paths: ["~"]
    }
  ]
}
```

---

## Built-in Sensitive Paths

When `builtin_protected_paths: true` (the default), the following paths are **always denied** regardless of user rules:

```
~/.ssh          ~/.aws          ~/.gnupg        ~/.kube
~/.config/gcloud  ~/.azure      ~/.netrc
/etc            /System         /private/etc    /private/var
/usr/bin        /usr/sbin       /bin            /sbin
```

---

## Example Configurations

### Example 1: Allow only a specific project, deny everything else

```json5
{
  default_policy: "deny",
  rules: [
    {
      name: "allow-my-project",
      action: "allow",
      ops: ["read", "write", "list"],
      paths: ["~/projects/my-app"]
    }
  ]
}
```

### Example 2: Read anywhere, confirm before writing

```json5
{
  default_policy: "confirm",
  rules: [
    {
      name: "allow-read-anywhere",
      action: "allow",
      ops: ["read", "list"],
      paths: ["~"]
    },
    {
      name: "confirm-write",
      action: "confirm",
      ops: ["write"],
      paths: ["~"]
    }
  ]
}
```

### Example 3: Disable the policy system entirely (revert to original behavior)

In `config.json5`:

```json5
{
  "security": {
    "pathAccess": {
      "enabled": false
    }
  }
}
```

---

## When Do Changes Take Effect?

After editing `path_access.json5`, **restart Blockcell** for the changes to apply. Hot-reload is not yet supported (`reload_on_change` is reserved for a future release).

---

## Relationship with Session Authorization Cache

When a user clicks "Allow" on a confirmation prompt, that directory is added to the **session authorization cache** (`authorized_dirs`). It won't be prompted again for the remainder of the session.

The policy system takes priority over the cache — if a directory is later covered by a `deny` rule, it will be rejected in the next session regardless of any previous user approvals.

You can disable the caching behavior with `cache_confirmed_dirs: false`, which causes every access to be re-evaluated from scratch.
