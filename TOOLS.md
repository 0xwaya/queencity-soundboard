# TOOLS.md - Echo Operational Tool Catalogue (v2026.1)

> Active tool inventory for Echo's current hardware and software stack.
> Keep this file updated when infrastructure changes. This is the single source of truth for tool references during autonomous sessions.

---

## LLM Layer: lc_adapter

**Location:** `/Users/pc/.openclaw/workspace/sandboxes/langraph-echo-sandbox/lc_adapter.py`

### EchoAgent Exports

| Symbol | Use |
| --- | --- |
| `echo_invoke(messages, mode, cache_key, task_reset)` | Single-shot LLM call with full guard rail stack |
| `echo_task(messages, ...)` | Alias for echo_invoke, for background/cron contexts |
| `session_guard` | Thread-local call counter + token accumulator — check before any loop |
| `_sanitize_err(text)` | Strip sk- keys from any string before logging or raising |

### Guard Rails Active

- **HARD STOP** (RuntimeError, no retry) on: `insufficient_quota`, `billing`, `hard_limit` — these are **billing** errors, not transient.
- **Retry with backoff** (max_retries=3, exponential) on: `rate_limit_exceeded` (429 RPM/TPM) — transient, NOT a HARD STOP.
- **50-call cap per task** (raised from 10 → 50 on 2026-03-07 operator restore; reset with `task_reset=True`)
- **500K session token cap** (raised from 200K → 500K on 2026-03-07; 80% = warning, 100% = HARD STOP)
- **Per-channel budgets** (budget_key): global 50/500K, telegram 20/200K, dashboard 30/300K, background 10/100K
- **Daily cap (optional)**: env-driven hard stop in lc_adapter (`ECHO_DAILY_BUDGET_USD`, `ECHO_MODEL_COSTS_JSON`, `ECHO_DAILY_TOKEN_CAP`)
- Retry N/3 visible: logs "Retry 1/3: [reason]" before each attempt
- Fallback chain: gpt-4.1 → gpt-4.1-mini → gpt-4.1-nano on failure
- Model guardrails: operational/background restricted to mini or nano; optional `ECHO_FORCE_MINI_ONLY=1` forces strategic to mini
- API key deleted from module namespace after construction

> **Rate limit vs quota distinction:**
> `rate_limit_exceeded` (429) = too many requests per minute → retried automatically, clears with backoff.
> `insufficient_quota` / `hard_limit` = billing cap reached → HARD STOP, **never retry**, requires manual action at https://platform.openai.com/usage

### Model Routing

| Mode | Model | When to Use |
| --- | --- | --- |
| `"strategic"` | gpt-4.1 | Architecture, planning, complex reasoning |
| `"operational"` | gpt-4.1-mini | Default code gen, everyday tasks |
| `"background"` | gpt-4.1-nano | Cron jobs, heartbeats, low-cost checks |

**Model guardrail override:** Set `ECHO_FORCE_MINI_ONLY=1` to force strategic calls to use `gpt-4.1-mini`.

### Budget Monitoring

| Tool | Use |
| --- | --- |
| `tools/api_usage_monitor.py` | Reads `logs/rl_ledger.jsonl`, summarizes rolling token burn, and flags minute-level bursts |

Examples:

Dashboard API:

**Full rate-limit policy:** `workspace/api-ratelimit.md` — single source of truth for all budget layers, model routing, and emergency playbook.

## EchoAgent: echo_agent (v2026.3)

**Location:** `/Users/pc/.openclaw/workspace/sandboxes/langraph-echo-sandbox/echo_agent.py`

Agentic brain layer. Sits between telegram_adapter and lc_adapter. Provides
slash command routing, tool execution, memory context, and wall-clock guarding.

### Key Exports

| Symbol | Use |
| --- | --- |
| `EchoAgent().handle(user_id, text, system_prompt)` | Main entry point — always returns a string, never raises |

### Rate Limits

| Constant | Value | Purpose |
| --- | --- | --- |
| `MAX_TOOL_CALLS` | 20 | Hard cap on tool invocations per message |
| `MAX_LLM_CALLS` | 1 | Max LLM synthesis calls after tools |
| `SHELL_TIMEOUT` | 600s | `subprocess.run` timeout; killed on exceed |
| `WALL_TIMEOUT` | 600s | Total wall-clock per `handle()` call |
| `FILE_READ_LIMIT` | 65536 bytes | Max file read size |

### Tools available inside EchoAgent

| Tool function | Trigger | Notes |
| --- | --- | --- |
| `_tool_run_shell(cmd)` | `/run` | Runs in workspace dir, 600s hard kill |
| `_tool_run_command(command)` | `/do` | Natural language command delegation |
| `_tool_read_file(path)` | `/file` | Max 64KB, rejects binary files, optional strict path policy via `ECHO_STRICT_FS=1` |
| `_tool_write_file(path, text)` | `/write` | Writes to accessible paths; strict mode limits writes to workspace/memory and blocks hidden paths |
| `_tool_invoke_skill(skill, args)` | `/skill` | Calls `openclaw do <skill> <args>` |
| `_tool_status()` | `/status` | Gateway ping + session_guard snapshot |
| `_load_memory_context()` | All LLM calls | Injects last 1.5KB of today's memory |
| `_append_memory(text)` | `/note`, LLM calls | Timestamped append to today's memory |
| `_load_persistent_memory()` | All LLM calls | Injects first 1KB of `memory/memory.md` (cross-session facts) |
| `_handle_timeout()` | Internal | Catches wall-clock timeout, returns partial result |
| `_tool_filesystem_access(path, mode)` | Internal | Checks path is under /Users/pc/ before read/write, raises if not |
| `_enforce_tool_limits()` | Internal | Checks tool call count, raises if exceeded |
| `_enforce_tg_limits(text)` | Internal | Truncates Telegram responses to 4096 chars with notice |
| `_split_tg_messages(text)` | Internal | Splits long responses into Telegram-safe chunks |
| `_validate_tg_message(user_id, text)` | Internal | Pre-flight check for Telegram messages (allowlist, length) |
| `_validate_bot_token_format(token)` | Internal | Checks Telegram bot token format matches `NNNNNNNNN:AAF...` |

## Telegram Channel: telegram_adapter (v2026.3)

**Location:** `/Users/pc/.openclaw/workspace/sandboxes/langraph-echo-sandbox/telegram_adapter.py`

### Key Exports (Telegram)

| Symbol | Use |
| --- | --- |
| `telegram_invoke(user_id, user_text, system_prompt, mode, cache_key, split_long)` | Process Telegram message through EchoAgent → lc_adapter stack |
| `enforce_tg_limit(text)` | Truncate to 4096 chars with visible notice |
| `split_tg_messages(text)` | Split long response into list of Telegram-safe chunks |
| `validate_tg_message(user_id, text)` | Pre-flight check: allowlist + empty + length |
| `validate_bot_token_format(token)` | Check token matches `NNNNNNNNN:AAF...` format |

### Config (from openclaw.json -> channels.telegram)

- **Bot ID:** 849898399
- **Allowlist:** `["754774759"]` (0xwaya only)
- **dmPolicy:** allowlist
- **groupPolicy:** allowlist
- **Streaming:** off
- **Max outgoing:** 4096 chars (enforced by adapter)
- **Max incoming:** 2048 chars (rejected with warning if exceeded)
- **Rate limit (adapter-level):** per-user minute/hour caps via `TELEGRAM_RATE_LIMIT_PER_MINUTE` / `TELEGRAM_RATE_LIMIT_PER_HOUR`

### HARD STOP -> Telegram Behavior

When lc_adapter raises `RuntimeError("HARD STOP ...")`:

- telegram_invoke catches it, returns `HARD_STOP_REPLY` string
- No crash, no uncaught exception, no silent drop
- Reply fits within Telegram 4096-char limit

---

## Gateway

- **Port:** 18789
- **Mode:** local
- **Bind:** loopback (127.0.0.1 equivalent)
- **Active dashboard tool profile:** `coding` (native `read`, `write`, `edit`, `exec`, `process` available in dashboard chat)
- **Auth:** token mode (injected at startup by `tools/secret-bootstrap.sh`)
- Secrets source: encrypted file pair (`~/.openclaw/credentials/openclaw.env.enc` + `openclaw.env.key`) or externally injected environment variables
- **Tailscale:** off
- **Denied commands:** canvas.eval, canvas.snapshot (exact OpenClaw command names; prior entries were phantom names with no effect)

---

### Native Gateway Capabilities (use these before adding external tooling)

| Capability | URL / RPC | Notes |
| --- | --- | --- |
| Usage timeline | `127.0.0.1:18789` → Control → Usage | Shows token/session data per day; requires session timestamps |
| Config editor | `127.0.0.1:18789` → Settings → Config | Safe JSON editor with validation and `config.get` / `config.set` RPC |
| Agent model select | `127.0.0.1:18789` → Agents → [agent] → Config | Per-agent model override via `onModelChange` RPC |
| Dashboard chat native file read | `tools.profile: coding` | Native core `read` tool is exposed only under the `coding` profile, not `messaging` |
| Cron jobs | `127.0.0.1:18789` → Cron Jobs | Add/edit/remove scheduled tasks |
| Sessions | `127.0.0.1:18789` → Sessions | Browse, compact, delete sessions |
| Logs | `127.0.0.1:18789` → Logs | Tail live logs |

### Engineering Mode Toggle

**Source files** (keep these, they are the correct surface):
- `~/.openclaw/static/js/echo-dashboard-toggle.js` — toggle UI + `config.get/set` RPC logic
- `~/.openclaw/static/css/echo-dashboard.css` — styles
- `~/.openclaw/static/css/_inject.js` — idempotent injector

**Current behavior:**
- Engineering mode now preserves and restores both the main agent model and `tools.profile`
- Dashboard chat filesystem access depends on `tools.profile`, not just `commands.native` / `commands.nativeSkills`
- `messaging` omits native filesystem and shell tools; `coding` enables them

**Apply/Verify:**
```bash
node ~/.openclaw/static/css/_inject.js          # inject (idempotent)
node ~/.openclaw/static/css/_inject.js --check  # verify without modifying
```

**⚠️ Re-run after every `openclaw update`** — updates overwrite `dist/control-ui/index.html`.
- **Load command:** `export OPENAI_API_KEY=$(python3 -c "import json; d=json.load(open('/Users/pc/.openclaw/agents/main/agent/models.json')); print(d['providers']['openai']['apiKey'])")`
---

## Python Environment

- **venv:** `/Users/pc/.openclaw/.venv`
- **Python version:** 3.13.12
- **Activate:** `source /Users/pc/.openclaw/.venv/bin/activate`
- **Key packages:** langchain-openai 1.1.10, anyio 4.12.1, pytest 9.0.2

---

## Test Suites

| Suite | Location | Coverage | Last Result |
| --- | --- | --- | --- |
| `test_adapter_full.py` | langraph-echo-sandbox/ | Functional (14 tests) | 14/14 PASS |
| `test_security_audit.py` | langraph-echo-sandbox/ | Security (54 assertions) | 54/54 PASS |
| `test_telegram_audit.py` | langraph-echo-sandbox/ | Telegram + adapter (39 tests) | 39/39 PASS |

**Run all three:** `python -m pytest test_adapter_full.py test_security_audit.py test_telegram_audit.py -v`

---

## Web Search Standing Order

Before writing any code for an external API or framework:

1. Search for 2026 official documentation (not tutorials from year < 2024).
2. Verify the current package version against the installed venv version.
3. Check the official changelog for breaking changes since the version in use.
4. Only then write code -- no guess-and-check from memory.

---

## Git Worktree Workflow (Parallel Task Standard)

```bash
# Standard flow for any non-trivial change:
git worktree add /tmp/feature-<name> -b feature/<name>
# work in /tmp/feature-<name>
# run tests -- must be green before merge
python -m pytest <relevant_suite>.py -v
git checkout main && git merge feature/<name>
git worktree remove /tmp/feature-<name>
```

- Never modify production files until sandbox tests are green.
- Maximum 2 concurrent worktrees to avoid context explosion.

---

## Cron / Heartbeat

- **heartbeat.py:** `/Users/pc/.openclaw/workspace/sandboxes/langraph-echo-sandbox/heartbeat.py`
- **Built-in heartbeat config:** `agents.defaults.heartbeat` in `/Users/pc/.openclaw/openclaw.json`
- **Live heartbeat control:** `openclaw system heartbeat ...`
- **Cron registry:** `/Users/pc/.openclaw/cron/jobs.json` (other cron jobs only; not the built-in heartbeat)
- **Logs:** `/Users/pc/.openclaw/logs/`
- **Heartbeat JSONL output:** sanitized before write (no sk- keys in records)

---

## Memory & Sessions

- **Daily memory:** `memory/YYYY-MM-DD.md` (log key decisions and income events)
- **Passive streams index:** `memory/passive-streams.md`
- **LangGraph session JSONL:** `agents/main/sessions/<uuid>.jsonl`
- **Budget file:** `workspace/budget.md` (load on restart)

---

## Update-Offset File (Telegram)

- **Path:** `/Users/pc/.openclaw/telegram/update-offset-default.json`
- **Fields:** `version`, `lastUpdateId`, `botId`
- **Purpose:** Tracks last processed Telegram update ID to prevent duplicate processing
