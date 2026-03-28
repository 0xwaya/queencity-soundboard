# API Rate Limit & Budget Policy — Echo / OpenClaw
> **Single source of truth** for all OpenAI API budget guardrails.  
> Last updated: 2026-03-14  
> Enforcing module: `workspace/sandboxes/langraph-echo-sandbox/lc_adapter.py`

---

## Why This Document Exists

On **2026-03-14** the API credit ledger spiked with two burst events:
- `04:06 UTC`: 51 reserve-events, 13,651 tokens reserved in one minute
- `04:08 UTC`: 49 reserve-events, 13,053 tokens reserved in one minute

**Root cause**: The Flask sandbox dashboard chat (`app.py`) was calling `ChatOpenAI` directly, bypassing `lc_adapter` entirely. No per-channel budget, no TPM ledger, no guardrails applied.

**Fix applied**: `llm_chat_response()` now routes through `lc_adapter.echo_invoke(budget_key="dashboard")`. The raw `_get_llm_for_chat()` factory was deleted.

---

## Layer 0 — Daily Budget Guard (Optional, Hard Cap)

Optional daily budget enforcement lives in `lc_adapter.py` and is **env-driven**.
If configured, it hard-stops before any API call once the daily cap would be exceeded.

**Config (environment variables):**
- `ECHO_DAILY_BUDGET_USD` — hard cap in USD (requires model cost map)
- `ECHO_MODEL_COSTS_JSON` — JSON map of blended cost per 1M tokens, e.g. `{ "gpt-4.1-mini": 0.30 }`
- `ECHO_DAILY_TOKEN_CAP` — optional token-only hard cap when cost map is not set
- `ECHO_DAILY_BUDGET_WARN_RATIO` — warning ratio (default 0.8)

> If `ECHO_DAILY_BUDGET_USD` is set **without** `ECHO_MODEL_COSTS_JSON`, the guard logs a warning
> and falls back to token-only enforcement (if `ECHO_DAILY_TOKEN_CAP` is set).

---

## Layer 1 — Proactive Client-Side Rate Limiters (`InMemoryRateLimiter`)

Token-bucket algorithm: queues requests **before** they reach the API to stay within Tier 3 RPM limits.

| Limiter name | `requests_per_second` | Effective RPM | Safety buffer | Applied to |
|---|---|---|---|---|
| `_rl_standard` | 50 req/s | 3,000 RPM | conservative buffer below 5,000 RPM Tier 3 | `gpt-4.1`, `gpt-4.1-mini`, `gpt-4.1-nano` |
| `_rl_mini_longctx` | 10 req/s | 600 RPM | conservative buffer below 1,000 RPM long-context pool | `gpt-4.1-mini` long-context, background jobs |

`check_every_n_seconds = 0.1` on both — 100ms smooth polling.

---

## Layer 2 — Session Guard (`_SessionGuard`)

Tracks calls and tokens **within a single task/session** in-process. Hard stops before billing errors can accumulate.

| Parameter | Value | Notes |
|---|---|---|
| `_MAX_CALLS_PER_TASK` | 50 | Raised from 10 → 50 on 2026-03-07 (operator restore) |
| `_MAX_SESSION_TOKENS` | 500,000 | Raised from 200K → 500K on 2026-03-07 |
| Warning threshold | 80% of cap | Logs warning; does not stop |
| Hard stop threshold | 100% of cap | Raises `RuntimeError("HARD STOP …")` |
| Counter reset | `task_reset=True` in `echo_invoke()` | Use between independent tasks |

---

## Layer 3 — Per-Channel Budget Guards

Each interaction channel has its own `_SessionGuard` instance, keyed by `budget_key`. These are **additive** to the session guard — both are checked.

| `budget_key` | Max calls | Max tokens | Who uses it |
|---|---|---|---|
| `global` | 50 | 500,000 | Catch-all / untagged calls |
| `dashboard` | 30 | 300,000 | Flask sandbox chat (`app.py`) |
| `telegram` | 20 | 200,000 | `telegram_adapter.telegram_invoke()` |
| `background` | 10 | 100,000 | `heartbeat.py`, cron jobs |

> **Rule**: Every `echo_invoke()` call **must** pass an explicit `budget_key`. Calls without one default to `"background"` for non-interactive tasks or `"global"` otherwise.

---

## Layer 3.5 — Telegram Per-User Rate Limit (Adapter Level)

`telegram_adapter.telegram_invoke()` applies a per-user rate limit before any LLM call.

**Config (environment variables):**
- `TELEGRAM_RATE_LIMIT_PER_MINUTE` (default: 30)
- `TELEGRAM_RATE_LIMIT_PER_HOUR` (default: 300)

This guard is **pre-LLM** and prevents bursty Telegram traffic from draining credits,
even when per-session token caps are respected.

---

## Layer 4 — Hard Stop Keywords

If OpenAI returns an error containing any of these strings, execution **halts immediately** — no retry, no fallback:

```
"quota"  |  "billing"  |  "insufficient_quota"  |  "hard_limit"
```

These are **billing** signals, not transient rate limits. Retrying them burns credits. The correct response is to stop and alert `@0xwaya`.

---

## Layer 5 — Retry Policy (Transient Errors Only)

`rate_limit_exceeded` (HTTP 429) is **not** a hard stop. It means too many requests per minute, which self-clears.

| Parameter | Value |
|---|---|
| `max_retries` | 3 (on `gpt-4.1`, `gpt-4.1-mini`) / 2 (background `_bg_mini`) |
| Backoff | Exponential (LangChain default) |
| Visibility | `"Retry N/3: [reason]"` logged before each attempt |
| Silent retries | **Never** — every retry is visible in logs |

---

## Layer 6 — Model Routing & Guardrails

| Mode | Model | Timeout | Use case |
|---|---|---|---|
| `"strategic"` | `gpt-4.1` | 60s | Architecture, planning, complex reasoning |
| `"operational"` | `gpt-4.1-mini` | 45s | Default code gen, everyday tasks |
| `"background"` | `gpt-4.1-mini` (fallback `gpt-4.1-nano`) | 90s | Cron, heartbeats, low-cost checks |

**Fallback chain**: `gpt-4.1` → `gpt-4.1-mini` → `gpt-4.1-nano` on any non-hard-stop failure.

**Force mini override**: `ECHO_FORCE_MINI_ONLY=1` — forces `"strategic"` calls to use `gpt-4.1-mini`.

---

## Monitoring

### CLI (run from sandbox directory)
```bash
# Last 60 minutes — normal check
python tools/api_usage_monitor.py --minutes 60

# Last 24 hours — daily review
python tools/api_usage_monitor.py --minutes 1440 --burst-count 12 --burst-tokens 4000

# JSON output for scripting
python tools/api_usage_monitor.py --minutes 60 --json

# Exit codes: 0 = clean  |  1 = error  |  2 = ALERT (burst detected)
```

### Dashboard API
```
GET http://127.0.0.1:18789  →  Control → Usage  (native gateway sessions view)
GET /api/usage/summary?minutes=60           (sandbox Flask endpoint; honors API-key auth when enabled)
GET /api/usage/summary?minutes=60&burst_count=8&burst_tokens=2000
```

### Ledger file
`/Users/pc/.openclaw/logs/rl_ledger.jsonl` — one JSON record per token reserve/adjust event.

---

## Emergency Playbook

| Signal | Action |
|---|---|
| `RuntimeError("HARD STOP — quota…")` | Halt all tasks. Check [platform.openai.com/usage](https://platform.openai.com/usage). Wait for `@0xwaya` approval. |
| `rl_ledger.jsonl` burst alert | Run monitor (`--minutes 15`). Identify source channel. Check built-in heartbeat state (`agents.defaults.heartbeat`, `openclaw system heartbeat last`) and dashboard sessions. |
| 429 loop (not clearing after 3 retries) | Set `ECHO_FORCE_MINI_ONLY=1`. Restart gateway. Alert `@0xwaya`. |
| Session token cap hit | Start new session with `task_reset=True`. Summarize context before switching. |

---

## Native Gateway Usage Dashboard

The OpenClaw Gateway at `http://127.0.0.1:18789` → **Control → Usage** tracks sessions natively via the `sessions.usage` / `sessions.usage.timeseries` RPC methods. This view shows:
- Token consumption per session
- Daily usage timeline
- Session error rates

> **Limitation (v2026.3.2)**: Usage data requires session timestamps. Sessions created before a gateway restart may show "No timeline data" — this is expected.

---

## OpenClaw Config Recovery Notes (2026-03-23)

### Incident Summary

- Symptom: repeated gateway and doctor failures during startup/config reads (`JSON5 parse failed`, then schema rejection).
- Confirmed provider pressure: repeated `rate_limit` and `provider in cooldown` failures on `openai-codex` profiles.

### Corrective Actions Applied

- Repaired malformed `~/.openclaw/openclaw.json` and re-validated with `openclaw config validate --json`.
- Removed unsupported top-level config key `rateLimits` (not accepted by OpenClaw v2026.3.2 schema).
- Switched active primaries to reduce provider pressure:
  - `agents.defaults.model.primary` -> `openai/gpt-4.1-mini`
  - `agents.list[0].model.primary` -> `openai/gpt-4.1-mini`
- Restarted gateway and confirmed return to healthy operation.

### Best-Practice Guardrails (Operator)

- Use `openclaw config set` for edits instead of manual JSON surgery.
- Validate after each change: `openclaw config validate --json`.
- If doctor warns on missing transcripts, run cleanup in preview mode first:
  - `openclaw sessions cleanup --store "/Users/pc/.openclaw/agents/main/sessions/sessions.json" --dry-run`
- Treat unsupported schema keys as hard failures; remove them instead of forcing custom fields.

---

## Change Log

| Date | Change | Reason |
|---|---|---|
| 2026-03-23 | Removed unsupported top-level `rateLimits` key from OpenClaw config and restored schema-valid configuration flow | Prevented config parse/schema failures and ensured doctor/restart stability |
| 2026-03-23 | Set `openai/gpt-4.1-mini` as primary for both defaults and main agent via `openclaw config set` | Reduced `openai-codex` cooldown/rate-limit impact and restored reliable operation |
| 2026-03-23 | Added formal recovery notes and operator guardrails for config edits and validation | Improved repeatability, auditability, and incident response quality |
| 2026-03-17 | Routed LangGraph prompt-expert and graph-node LLM calls through `lc_adapter`; kept OpenClaw native UI as model-routing surface | Removed remaining raw Python OpenAI bypass from strategic dashboard workflow |
| 2026-03-17 | Dashboard Flask chat surfaces now honor API-key auth when enabled, and default host binding is loopback via `APP_HOST` | Reduce exposed spend surface without changing local operator workflow |
| 2026-03-17 | Added credit-economy optimizations: skip repeated image-gen retries on quota errors; default to local SVGs; require valid key before image-gen | Reduce wasted calls on external image models |
| 2026-03-15 | 24h monitor sweep executed; native usage RPC re-verified; codex integration status captured | Daily budget audit and model-routing verification |
| 2026-03-14 | Deleted `_get_llm_for_chat()` in `app.py`; routed dashboard chat through `echo_invoke(budget_key="dashboard")` | Direct `ChatOpenAI` bypass caused credit spike |
| 2026-03-14 | Created `tools/api_usage_monitor.py` | Needed CLI visibility into burst events from rl_ledger |
| 2026-03-14 | Added `GET /api/usage/summary` endpoint to `app.py` | Dashboard-accessible usage summary |
| 2026-03-07 | Raised `_MAX_CALLS_PER_TASK` 10→50, `_MAX_SESSION_TOKENS` 200K→500K | Operator restore after over-restrictive cap blocked legitimate tasks |
| 2026-03-07 | Added `_rl_mini_longctx` rate limiter for long-context mini | Separate RPM pool for background/long jobs |

---

## Daily Checkpoint (2026-03-15 00:42 UTC)

### 24h Monitor Sweep

Command run:
```bash
python tools/api_usage_monitor.py --minutes 1440 --burst-count 12 --burst-tokens 4000 --json
```

Result:
- `status`: `alert` (exit code `2`)
- `window_record_count`: `238`
- `window.reserve_events`: `127`
- `window.reserve_tokens`: `35,398`
- `window.actual_tokens`: `9,215`

Alert buckets (historical, same spike window already known):
- `2026-03-14T04:06:00+00:00` — `51` reserve events, `13,651` reserve tokens
- `2026-03-14T04:08:00+00:00` — `49` reserve events, `13,053` reserve tokens

### Native Gateway Usage Recheck

- `sessions.usage` RPC: healthy response, usage summary available
- `sessions.usage.timeseries` RPC: healthy with explicit key (`agent:main:main`)

### GPT-5.2-Codex Integration Status

- Model availability (gateway catalog): `openai/gpt-5.2-codex` and `openai/gpt-5.3-codex` are present
- Engineering toggle wiring: active in `static/js/echo-dashboard-toggle.js`
  - primary: `openai/gpt-5.2-codex`
  - fallback: `openai/gpt-5.3-codex`
- Injection status: `node ~/.openclaw/static/css/_inject.js --check` returns `OK injection present`

Operational note:
- Codex routing is currently an **operator-triggered engineering mode override** on `agents.defaults.model`.
- Base per-agent defaults remain pinned for stability:
  - `main` → `openai/gpt-4.1-mini`
  - `nano-banana-pro` → `google/gemini-2.5-flash`
  - `openai-image-gen` → `openai/gpt-5-image`
