# Echo Operator Workspace

This is the working directory for **Echo** — the autonomous AI operator running on macOS for `@0xwaya`. 

---

## Stack Overview

### OpenClaw Gateway
- Version: `2026.3.2`
- Port: `18789` (loopback only)
- Service: `ai.openclaw.gateway` (launchd)
- Auth: bearer token stored in `~/.openclaw/openclaw.json`

### Core Python Modules (`sandboxes/langraph-echo-sandbox/`)

| File | Role |
|------|------|
| `echo_agent.py` | Agentic brain — intent routing, slash commands, memory, tool execution |
| `telegram_adapter.py` | Telegram → EchoAgent bridge with sanitization and length capping |
| `lc_adapter.py` | LLM invocation layer — rate limits, HARD STOP guards, session budget |
| `langraph_bridge.py` | LangGraph CEO system integration (offline-safe) |

### Model Routing

| Tier | Model | Used for |
|------|-------|----------|
| Strategic | `gpt-4.1` | Complex reasoning, CEO analysis |
| Operational | `gpt-4.1-mini` | Telegram replies, echo_agent synthesis |
| Background | `gpt-4.1-nano` | Lightweight/fallback tasks |

### Explicit Agent Defaults

These are now pinned through the native Gateway `config.get` / `config.set` / `config.apply` path instead of ad hoc per-surface overrides.

| Agent | Primary Model | Reason |
|------|---------------|--------|
| `main` | `openai/gpt-4.1-mini` | Stable default operator path |
| `nano-banana-pro` | `google/gemini-2.5-flash` | Correct provider wiring for the Google-backed agent |
| `openai-image-gen` | `openai/gpt-5-image` | Explicit image-generation default |

The engineering override remains separate from these defaults:
- Engineering toggle primary: `openai/gpt-5.2-codex`
- Engineering toggle fallback: `openai/gpt-5.3-codex`

---

## Native Architecture

The current architecture is intentionally **gateway-native first**.

- Control UI model edits should go through the OpenClaw Gateway on port `18789`, not through the Flask sandbox UI.
- Agent model selection belongs to the Gateway config/agents surfaces, where `agents.list` and `agents.defaults` are already first-class config paths.
- Usage visibility should come from the native `sessions.usage` and `sessions.usage.timeseries` RPCs first, with the local ledger monitor as the second line of defense.
- Python OpenAI calls must go through `lc_adapter.echo_invoke()` so budget guards, token accounting, retries, and hard stops are enforced centrally.

Operational docs maintained in local workspace state:
- `api-ratelimit.md` — budget policy, incident history, daily checkpoints
- `memory/memory.md` — persistent cross-session facts and architecture decisions

## Echo Slash Commands

| Command | Description |
|---------|-------------|
| `/run <cmd>` or `/exec` | Run shell command (30s timeout) |
| `/file <path>` or `/read` | Read file (max 8KB, no binary, `/Users/pc/` only) |
| `/write <path> <content>` | Write file (same path guard) |
| `/skill <name>` | Invoke an OpenClaw skill |
| `/do <task>` | Natural language task delegation |
| `/note <text>` | Append note to today's memory file |
| `/mem` or `/memory` | Show today's memory excerpt |
| `/status` | Show Echo runtime status |
| `/help` or `/?` | List all commands |

---

## Rate Limits & Guards

| Guard | Value | Behaviour |
|-------|-------|-----------|
| Tool calls per message | 6 | Hard cap — returns partial after limit |
| Total API calls per task | 50 | `lc_adapter` global cap (budgeted per channel) |
| Session tokens | 500K | `lc_adapter` global cap (budgeted per channel) |
| Shell timeout | 120s | Process killed, error returned |
| Wall-clock timeout | 120s | `handle()` returns partial |

Per-channel budgets (lc_adapter):
- global: 50 calls / 500K tokens
- telegram: 20 calls / 200K tokens
- dashboard: 30 calls / 300K tokens
- background: 10 calls / 100K tokens

**HARD STOP keywords** (stop all API calls immediately):  
`insufficient_quota` · `billing` · `hard_limit`

**NOT a HARD STOP** — `rate_limit_exceeded` (429) is retried up to 3x with exponential backoff.

Model guardrails:
- Operational and background calls are restricted to `gpt-4.1-mini` or `gpt-4.1-nano`.
- Optional override: set `ECHO_FORCE_MINI_ONLY=1` to force strategic mode to `gpt-4.1-mini`.

---

## Optimization Path

Recent optimization work followed this sequence:

1. API usage spike investigation identified that dashboard chat was bypassing `lc_adapter` and calling `ChatOpenAI` directly.
2. Budget enforcement was restored by routing dashboard chat through `echo_invoke(budget_key="dashboard")`.
3. A local monitor was added over `logs/rl_ledger.jsonl` to detect burst buckets and produce machine-readable budget summaries.
4. Model/agent selection was moved back to the correct control surface: the OpenClaw Gateway dashboard.
5. Explicit native agent defaults were set through gateway config so model wiring is visible, durable, and schema-validated.
6. Persistent structured memory was added so operator facts survive restarts without bloating the daily scratch memory file.

---

## What We Learned

- Native config paths are safer than cross-surface patches. If the Gateway already owns a concern, keep the write path there.
- Budget policies only matter if every call goes through the enforcement layer. One direct SDK call is enough to invalidate the whole budget model.
- Usage needs two views: native session analytics for product-level visibility and ledger-level monitoring for burst/anomaly detection.
- Agent defaults should be explicit. Hidden inheritance is convenient until a provider mismatch ships unnoticed.
- Persistent memory and daily memory solve different problems. Mixing them makes both worse.

## What We Gained

- Per-agent model routing is now explicit and correct.
- The Google-backed agent is no longer pointed at an OpenAI model.
- Budget enforcement is centralized again.
- Usage checks are faster because the Gateway and ledger monitor now complement each other cleanly.
- The engineering Codex path is available without destabilizing default routing.

---

## Safety Properties

- `lc_adapter.py`: API key deleted from module namespace (`del _API_KEY`) after `ChatOpenAI` construction — not accessible via `lc_adapter._API_KEY`
- `echo_agent.py`: File reads restricted to `/Users/pc/` subtree; binary files rejected; LLM output sanitized before return
- `telegram_adapter.py`: Belt-and-suspenders `_sanitize_output()` applied to all outgoing messages
- No API keys in version-controlled files; `models.json` lives in `~/.openclaw/agents/main/agent/` (outside sandbox)

---

## Browser Extensions (Brave — audit 2026-03-06)

| Extension ID | Name | Status |
|--------------|------|--------|
| `bfpnaggikhabdgbnhnngdfldkbinncdf` | OpenClaw Copilot | **DELETED** — was consuming shared API key via gateway |
| `jodblbhgdimkijbponngoammliocehel` | Token Monitor | Active — local storage only, safe |
| `pfhemcnpfilapbppdkfemikblgnnikdp` | Browser Relay | Active — port 18792 CDP relay, safe |

---

## Test Suites

```bash
cd sandboxes/langraph-echo-sandbox
.venv/bin/python -m pytest test_echo_agent.py test_security_audit.py test_telegram_audit.py test_voice_free.py test_langraph_bridge.py -q
```

> `test_adapter_full.py` is excluded from CI — it makes live API calls at module level.

Last recorded result: **161 passed, 1 skipped** (2026-03-06)

---

## Sub-Projects

- Product app: [`queencity-soundboard/`](./queencity-soundboard) — QueenCity Soundboard web app
  - Web: [`queencity-soundboard/apps/web`](./queencity-soundboard/apps/web)
  - Supabase: [`queencity-soundboard/supabase/migrations`](./queencity-soundboard/supabase/migrations)
- OpenJaw core template: [`openjaw-core-template/`](./openjaw-core-template)
- Echo docs: [`AGENTS.md`](./AGENTS.md) · [`TOOLS.md`](./TOOLS.md) · [`SOUL.md`](./SOUL.md) · [`IDENTITY.md`](./IDENTITY.md)
