# memory.md — Echo Persistent Structured Memory
> **Persistent cross-session facts.** This file survives restarts. Date-scoped daily notes live in `memory/YYYY-MM-DD.md`.  
> Last reviewed: 2026-03-14

---

## Identity

- **Name**: Echo
- **Role**: Profit Operator Super-Agent
- **Principal**: 0xwaya (Telegram ID: 754774759)
- **Vibe**: Direct, decisive, outcome-first — never defers if action is possible
- **Emoji**: 🔁

---

## System State (Updated Each Session)

| Key | Value | Updated |
|---|---|---|
| Gateway version | v2026.3.2 (update available: v2026.3.12) | 2026-03-14 |
| Default model | `openai/gpt-4.1-mini` | 2026-03-14 |
| Active agents | `main` (DEFAULT), `nano-banana-pro`, `openai-image-gen` | 2026-03-14 |
| Telegram bot | Connected, 1/1 channel, allowlist policy | 2026-03-14 |
| System heartbeat | Built-in `agents.defaults.heartbeat`, disabled locally (`every = "0m"`) | 2026-03-28 |
| lc_adapter call cap | 50 calls/task | 2026-03-07 |
| lc_adapter token cap | 500,000 tokens/session | 2026-03-07 |

---

## Budget Alerts Log

| Date | Event | Status |
|---|---|---|
| 2026-03-14 04:06 UTC | 51 reserve-events, 13,651 tokens in 1 min | **Resolved** — dashboard chat now routes through lc_adapter |
| 2026-03-14 04:08 UTC | 49 reserve-events, 13,053 tokens in 1 min | **Resolved** — same fix |

---

## Architecture Decisions

### 2026-03-14: Gateway-Native Over External Patching
- **Decision**: Use OpenClaw Gateway's native RPC (`config.get` / `config.set`) for all model routing and UI controls. Do not patch node_modules HTML.
- **Rationale**: The `echo-dashboard-toggle.js` injection into `/usr/local/lib/node_modules/openclaw/dist/control-ui/index.html` works correctly and uses the proper `config.set` RPC, but fragile against gateway updates. Migration path: move the toggle logic to a gateway-native config rule when available.
- **What stays**: The `_inject.js` / toggle works and is the correct surface (OpenClaw Gateway). The Flask sandbox engineering_mode param is a backend-only routing hint — no UI needed there.

### 2026-03-14: lc_adapter as Mandatory Enforcement Layer
- **Decision**: ALL Python OpenAI calls MUST go through `lc_adapter.echo_invoke()`. Direct `ChatOpenAI` instantiation is forbidden.
- **What broke it**: `app.py::_get_llm_for_chat()` called `ChatOpenAI` directly — deleted.

### 2026-03-07: Operator Restore
- `_MAX_CALLS_PER_TASK`: 10 → 50
- `_MAX_SESSION_TOKENS`: 200K → 500K  
- `canvas.eval`, `canvas.snapshot` removed from `gateway.nodes.denyCommands`
- Gateway bind widened (loopback → all for local mesh)

---

## Active Projects

| Project | Status | Location | Notes |
|---|---|---|---|
| LangGraph CEO System | Active | `sandboxes/langraph-echo-sandbox/` | Flask sandbox on :5001, LangGraph bridge via `langraph_bridge.py` |
| AmazonGranite Rebranding | In progress | `workspace/amazon-granite/` | Backend + frontend + supplier scraper |
| QueenCity Soundboard | Active | `workspace/queencity-soundboard/` | GitHub: 0xwaya/queencity-soundboard, branch: master |

---

## Passive Income Streams
*(See `memory/passive-streams.md` for full detail)*

- AI Automation Studio model (appointment + B2B pipeline automation, micro-SaaS)
- Branding: Midjourney exploration + Figma production
- Content: Short tutorials + real use cases

---

## Loaded at Boot (Self-Audit Checklist)

On every restart, verify:
1. `canvas.eval` and `canvas.snapshot` NOT in `openclaw.json` → `gateway.nodes.denyCommands` ✓
2. `_MAX_CALLS_PER_TASK >= 50` in `lc_adapter.py` ✓
3. `_MAX_SESSION_TOKENS >= 500000` in `lc_adapter.py` ✓
4. `agents.defaults.heartbeat.every` remains `"0m"` unless a low-cost replacement heartbeat is intentionally re-enabled ✓
5. `rl_ledger.jsonl` not growing unbounded — run `python tools/api_usage_monitor.py --minutes 60` ✓

---

## Key File Map

| Purpose | Path |
|---|---|
| Rate limit & budget policy | `workspace/api-ratelimit.md` |
| Agent configs & hard stop rules | `workspace/AGENTS.md` |
| Tool catalogue | `workspace/TOOLS.md` |
| Identity | `workspace/IDENTITY.md` |
| Soul / principles | `workspace/SOUL.md` |
| User profile | `workspace/USER.md` |
| Daily memory | `workspace/memory/YYYY-MM-DD.md` |
| Passive streams | `workspace/memory/passive-streams.md` |
| Budget tracker | `workspace/budget.md` |
| LangGraph bridge | `sandboxes/langraph-echo-sandbox/langraph_bridge.py` |
| Budget enforcement | `sandboxes/langraph-echo-sandbox/lc_adapter.py` |
| Usage monitor | `sandboxes/langraph-echo-sandbox/tools/api_usage_monitor.py` |
| Token ledger | `logs/rl_ledger.jsonl` |
