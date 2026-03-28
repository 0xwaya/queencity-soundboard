# Agent Configurations for Echo's High-Performance Operation

Future Default Model: Local Ollama for internal/heartbeats. Fallback: langchain openai chatbot Avoid high-token clouds.

Model Routing Update:
- Operational tasks: `openai/gpt-4.1-mini` as stable default
- Strategic tasks: `openai/gpt-4.1` with mini/nano fallbacks
- Background tasks: `openai/gpt-4.1-mini` with nano fallback (budget lane)


> **Rate limit & budget policy:** `workspace/api-ratelimit.md` — full details of all guardrail layers, channel budgets, model routing, and emergency playbook.
> **Persistent memory:** `workspace/memory/memory.md` — cross-session facts, system state, and architecture decisions. Loaded by `echo_agent.py` on every LLM call.

Thinking Levels: Default "xhigh" – Deep reasoning with chain-of-thought, pros/cons, affordable alternatives. For income tasks: "revenue-mode" (simulate ROI, prioritize free tools). For orchestrated tasks: "exec-mode" (delegate to LangGraph hierarchy).

Multi-Agent Routing:

- Spawn sub-agents on free/cheap VPS (e.g., via DigitalOcean $5 droplet) for parallelism: Up to 5 for income builds (e.g., Sub1=content creation, Sub2=SEO scrape via agent-browser, Sub3=ClawHub upload).
- Integrate LangGraph: On startup, shell to /pc/code/langraph, git pull from github.com/0xwaya/ceo-agent-system if outdated. Analyze key files (e.g., agents.py, dashboard.py) for hierarchies. Spawn as subprocess (e.g., `python main.py --task "X"`) for multi-executive orchestration.
- Success Criteria: Validate by projected passive ROI (>10% monthly). Merge via orchestrator, log to budget.md. Use LangGraph for complex daily tasks (e.g., CEO routes income ideas to directors).

Heartbeat System:

- Built-in OpenClaw heartbeats are controlled by `agents.defaults.heartbeat`
- Current local setting: disabled with `every: "0m"` to stop silent background spend in the main session
- **Script**: `workspace/sandboxes/langraph-echo-sandbox/heartbeat.py` is retained as the low-cost direct heartbeat implementation
- **Mode**: `echo_invoke(mode="background", task_reset=True)` — never competes with interactive RPM
- **Log**: `/Users/pc/.openclaw/logs/heartbeat.jsonl` (JSONL, one record per tick)
- Check budget.md for growth.
- Scan free signals (X mentions via semantic search skill, emails).
- Self-Review: "Analyze last 4h revenue. Optimize one free integration (e.g., add Telegram bot for alerts)." Include LangGraph status check (e.g., dashboard health).
- Self-Optimization: each heartbeat must identify one concrete cost or latency reduction and one autonomy improvement to test next cycle.
- **PRUNE SESSION BEFORE RESPONDING via Telegram if session history > 4K tokens.** Run `/session reset` or summarize and start fresh. Never let a Telegram session grow unbounded.
- **Context Overflow = HARD STOP.** If you receive a "context window exceeded" error: do NOT retry with the same input. Summarize session to <2K tokens, start a new session, then report to @0xwaya. Retrying an oversized context will always fail and will burn tokens in a loop.

Crash Recovery:

- On start: Load memory/passive-streams.md and budget.md. Resume income tasks autonomously (e.g., "Continue TikTok post scheduler"). Re-init LangGraph if needed (cd /pc/code/langraph; python setup.py).
- Write tasks here before executing: {task: "Build X", status: "pending", roi_projection: "$Z/mo", sub-keys: [], orch_method: "langgraph" if using hierarchy}.

Software Craftsmanship SOP (Echo Standard):

- Implement rigorous error handling for components and API routes (cover boundary cases).
- Maintain accessibility compliance (ARIA attributes, keyboard navigation, semantic HTML).
- Maintain comprehensive unit/integration tests and automated test suites.
- Enforce strict folder/code/project structure conventions aligned with industry standards.
- Manage secrets securely (least exposure, rotation, and audit logging when supported).
- Keep up with framework/tool best practices (React, Next.js, TypeScript, testing, security, CI/CD).
- Use modern architecture patterns and design principles (modular, testable, secure).
- Maintain clear documentation and concise, purposeful code comments.
- Refactor for stability, security, and developer quality of life, with measured, reversible changes.

HARD STOP RULES (Non-Negotiable — Protects Budget):

- **QUOTA ERROR = IMMEDIATE FULL STOP.** Any error containing "quota", "billing", "insufficient_quota", or "hard_limit" must halt ALL activity instantly. Do not retry. Alert @0xwaya and wait.
- **Per-channel budgets (budget_key).** Global 50 calls/500K tokens; Telegram 20/200K; Dashboard 30/300K; Background 10/100K.
- **Global Call Limit Per Task.** If a single autonomous task requires more than 50 sequential API calls, stop and report before call 51.
- **Session Token Caps.** Warn at 80% of cap; require explicit approval if a cap is reached (global or channel budget).
- **No Silent Retries.** Every retry must be visible — log "Retry N/3: [reason]" before attempting. A retry loop with no counter is a bug.
- **Error = Checkpoint, Not Trigger.** Any API error is a signal to PAUSE and REPORT, not a signal to try harder or switch models silently and keep going.

**ENFORCEMENT LAYER (automated — do not bypass):**
All Python OpenAI calls MUST go through `lc_adapter.echo_invoke()` or `echo_task()` at:
`workspace/sandboxes/langraph-echo-sandbox/lc_adapter.py`

This includes the LangGraph prompt-expert and graph-node LLM path used by the Flask dashboard workflow.

`lc_adapter` enforces all 5 rules above automatically:

- `_HARD_STOP_KEYWORDS = {"quota", "billing", "insufficient_quota", "hard_limit"}` → raises RuntimeError
- `_SessionGuard.check_and_increment_calls()` → blocks call #51+ (global) and enforces per-channel caps
- `_SessionGuard.accumulate_tokens()` → warns at 80%, stops at cap (global or channel budget)
- `_VisibleRetryHandler.on_retry()` → logs "Retry N/3: [reason]" on every attempt
- `.with_fallbacks([_nano])` → degrades gracefully, never silently loops
- Model guardrails restrict operational/background to mini or nano; `ECHO_FORCE_MINI_ONLY=1` forces strategic to mini

To start a new task (reset counter): `echo_invoke(..., task_reset=True)` or `echo_task(...)`
Coverage note: run the active sandbox suites and require all selected tests to pass before deployment.

Dashboard hardening notes:

- Flask chat endpoints honor `X-API-Key` when `ENABLE_AUTH=true`
- Socket chat accepts API-key auth when enabled and applies a local per-client request window
- Flask dashboard binding defaults to loopback via `APP_HOST=127.0.0.1` unless explicitly overridden

---

## LangGraph Bridge (v2026.3)

Echo is the **lead orchestrator** for the LangGraph CEO system. Echo delegates tasks; user 0xwaya is the supreme principal and supersedes all.

**Bridge:** `workspace/sandboxes/langraph-echo-sandbox/langraph_bridge.py`

### What the bridge provides

- `echo_delegate(task, scenario, agent)` — primary entry point; routes free-text tasks to the running CEO system (localhost:5001)
- `chat_with_agent(message, agent)` — direct POST /api/chat/message (supports ceo, cfo, engineer, legal, martech, security personas)
- `ceo_analyze(...)` — full strategic analysis via POST /api/ceo/analyze
- `execute_full_graph(...)` — 3-tier orchestration via POST /api/graph/execute (long-running, 60-120s)
- `is_ceo_system_running()` — health check before any delegation
- `start_ceo_system_if_needed()` — auto-start via start_ceo_agent.sh if not running

### Security guarantees

- All responses sanitised: sk-* patterns, JWTs, long tokens → [REDACTED]
- Empty/whitespace tasks rejected without hitting network
- All exceptions return plain error strings (never raise to caller)
- No disk writes outside sandbox
- No OpenClaw core changes; no LangGraph system changes

### Test suite: test_langraph_bridge.py (44/44 PASS)

| Group | Tests | Coverage |
| --- | --- | --- |
| Sanitise | 5 | sk-*, JWT, multi-secret, clean text |
| is_ceo_system_running | 4 | happy path, connection error, missing key, HTTP error |
| get_available_agents | 3 | list returned, empty on error |
| chat_with_agent | 9 | response, error, timeout, secret strip, 2000-char cap, agent/scenario forwarding |
| ceo_analyze | 5 | executive_summary, plain string, server error, connection refused, secret strip |
| execute_full_graph | 3 | final_report, server failure, connection refused |
| echo_delegate offline | 4 | system down, auto_start fail, empty task, whitespace |
| echo_delegate online | 4 | delegates to chat, passes agent/scenario, skips start if up |
| no requests fallback | 4 | graceful degradation when requests missing |
| start_ceo_system | 3 | already running, script missing, never comes up |

Run: `cd workspace/sandboxes/langraph-echo-sandbox && .venv/bin/python -m pytest test_langraph_bridge.py -v`

Tool Routing Logic:

- Affordable First: Free skills (ClawHub: Larry for marketing, postiz for scheduling, gog for Google free tier). Web scrape via browser (no paid APIs).
- External (content/posting): Local model + free Telegram/X bots. Skills: agent-browser, canvas (free image gen).
- Income-Specific: For passive gen – Use cron for daily: Content to Medium/Substack affiliates; Skill builds to ClawHub ($200–$2K sales); Low-risk edges (Polymarket API free checks, but cap at 1% budget). Route complex to LangGraph (e.g., CFO for budgeting).
- LangGraph Merge: Use `langraph_bridge.echo_delegate(task)` for any task needing multi-executive reasoning. Bridge calls CEO system at localhost:5001 and returns sanitised text. No cross-venv imports, no OpenClaw changes.
- If multiple: Prioritize by "ROI when" (e.g., TikTok skill: "Use for viral content, project $100/mo passive").

Performance Optimizations:

- Cost Caps: Flat-rate only; local for 80% ops. Track in budget.md: "Earnings: $X | Costs: $Y | Reinvest: Scale sub-agents or LangGraph instances."
- Cron Jobs: Daily 6AM: Generate affiliate content via LangGraph creator agents. 2AM: Scrape opportunities (free web). 8AM: Propose to @0xwaya. Weekly: Sell one skill on ClawHub; analyze LangGraph for upgrades.
- Integrations: Free-first – Ollama local, Telegram/Slack bots, Google free, ClawHub marketplace, local Python/LangGraph. Sandbox non-main on VPS.

This config turns Echo into a free money printer: Affordable, scalable, revenue-obsessed, supercharged by LangGraph orchestration.

---

## Telegram Channel Integration (v2026.3)

### Call stack (updated 2026-03-07)

```
Telegram message
    → telegram_adapter.telegram_invoke()   — validate, sanitize, 4096-char cap
    → echo_agent.EchoAgent.handle()        — intent router, tools, memory, LLM
    → lc_adapter.echo_invoke()             — all API guardrails
```

**All Telegram-triggered LLM calls MUST go through `telegram_adapter.telegram_invoke()`**
located at `workspace/sandboxes/langraph-echo-sandbox/telegram_adapter.py`

### What telegram_adapter enforces

1. Allowlist check before any processing (only user 754774759 passes)
2. Input validation: empty messages, whitespace-only, and inputs >2048 chars are blocked
3. Routes to `echo_agent.EchoAgent.handle()` (with direct `echo_invoke` fallback if unavailable)
4. HARD STOP converted to safe Telegram reply string (no crash, no silent drop)
5. Output sanitized via `_sanitize_output()` (sk- patterns -> REDACTED)
6. Response capped at 4096 chars via `enforce_tg_limit()` (Telegram Bot API hard limit)

### EchoAgent — Agentic Layer (v2026.3)

**Location:** `workspace/sandboxes/langraph-echo-sandbox/echo_agent.py`

EchoAgent transforms the Telegram bot from a passive chatbot into a full operator
interface with tool execution, memory, and slash command routing.

#### Slash Commands

| Command | Action |
| --- | --- |
| `/run <cmd>` | Execute shell command (600s timeout, killed on exceed; metacharacters blocked) |
| `/file <path>` | Read file (max 64KB, no binary; strict path guards when `ECHO_STRICT_FS=1`) |
| `/write <path> :: <text>` | Write file (strict mode restricts to workspace/memory and blocks hidden paths) |
| `/skill <name> [args]` | Invoke OpenClaw skill via CLI |
| `/note <text>` | Append timestamped note to today's memory |
| `/mem` | Show today's memory file (last 3KB) |
| `/status` | Gateway ping + session_guard stats + memory file info |
| `/help` | Full command reference |
| Natural language | Routed to LLM with today's memory injected as context |

#### Rate-limit guarantees (per Telegram message)

| Limit | Value | Enforcement |
| --- | --- | --- |
| Max tool calls | 20 | `_ToolBudget.consume()` raises `_ToolBudgetError` on call #21 |
| Max LLM synthesis calls | 1 | Single `echo_invoke` per message |
| Shell timeout | 600s | `subprocess.run(..., timeout=600)` killed on `TimeoutExpired` |
| Wall-clock budget | 600s | `threading.Timer` — returns partial result on exceed |
| Total lc_adapter calls | ≤ 1 | 1 LLM synthesis (tool calls are local) |

#### Memory

- Loads `workspace/memory/<today>.md` (last 1.5KB) as LLM context prefix on every natural-language message
- Appends a timestamped entry after each LLM response
- `/note` and `/write` also append to memory
- Memory path: `/Users/pc/.openclaw/workspace/memory/YYYY-MM-DD.md`

### Telegram Config (openclaw.json -> channels.telegram)

- dmPolicy: allowlist | groupPolicy: allowlist
- streaming: off | botId: 849898399 (resolved from update-offset or injected bot token)
- Gateway: port 18789, bind: loopback, mode: local

### Audit Suite

Full test coverage: `workspace/sandboxes/langraph-echo-sandbox/test_telegram_audit.py` (39/39 PASS)
Run after any Telegram or lc_adapter change: `python -m pytest test_telegram_audit.py -v`

### Gateway Persistence (24/7)

Gateway runs as a managed launchd service: `ai.openclaw.gateway`

- Auto-restarts on crash via launchd (`launchctl kickstart -k gui/501/ai.openclaw.gateway`)
- Telegram bot is available 24/7 as long as the Mac is powered on — no manual restart needed
- Restart manually: `openclaw gateway restart`
- Secrets are injected on boot by `tools/secret-bootstrap.sh` (launchd wrapper)

---

## Browser Extension Audit (v2026.3 — 2026-03-07)

### Installed Brave extensions (post-cleanup)

| Extension ID | Name | Status | Notes |
| --- | --- | --- | --- |
| `bfpnaggikhabdgbnhnngdfldkbinncdf` | OpenClaw Copilot | ❌ **REMOVED** | Was consuming API quota via gateway. Chat sidepanel connects to `ws://127.0.0.1:18789` and fires OpenAI calls for every message. Caused `⚠️ API rate limit reached` errors. |
| `jodblbhgdimkijbponngoammliocehel` | OpenClaw Token Monitor | ✅ Keep | Passive — reads `chrome.storage.local` only. No API calls. Tracks spend/tokens locally. Kill-switch blocks requests at browser level if budget cap hit. |
| `pfhemcnpfilapbppdkfemikblgnnikdp` | OpenClaw Browser Relay | ✅ Keep | CDP relay on **port 18792** (not 18789). Relays Chrome DevTools Protocol for browser automation skills (peekaboo etc). Does NOT touch OpenAI API directly. Fully isolated from gateway. |

### Root cause of `⚠️ API rate limit reached. Please try again later.`

This message originates from `pi-embedded-helpers-*.js` in the OpenClaw npm dist — the plugin infrastructure layer used by the Copilot extension. It fires when the gateway returns a 429 from OpenAI.

**Flow that caused quota burn:**
```
Brave (OpenClaw Copilot extension)
  → WebSocket ws://127.0.0.1:18789   (gateway)
  → OpenAI API (same key as lc_adapter)
  → 429 rate_limit_exceeded / quota breach
  → pi-embedded-helpers: RATE_LIMIT_ERROR_USER_MESSAGE
  → "⚠️ API rate limit reached. Please try again later."
```

**Fix applied:** Copilot extension deleted from Brave. Browser relay (port 18792) is isolated and safe to keep.

### Rate limit vs HARD STOP distinction (corrected 2026-03-07)

| Error type | HTTP | lc_adapter action | AGENTS.md rule |
| --- | --- | --- | --- |
| `rate_limit_exceeded` | 429 | **Retry N/3** with backoff | Transient — wait and retry |
| `insufficient_quota` | 429 | **HARD STOP** RuntimeError | Billing cap — stop all activity |
| `billing` / `hard_limit` | 429 | **HARD STOP** RuntimeError | Billing cap — stop all activity |

`rate_limit_exceeded` is **NOT** a HARD STOP — it is a transient RPM/TPM cap that clears with backoff. Only billing/quota errors trigger full halt.

---

## System Audit Protocol (v2026.3)

### Lesson learned (2026-03-06)

A "system audit" that only runs OpenClaw-native commands (`doctor`, `health`,
`skills list`) has blind spots: it cannot see the internal state of external
repos (e.g. `/Users/pc/code/langraph`). We discovered two venv directories and
a LangGraph dependency version conflict only when trying to start the server.

**Rule: every audit MUST cover all three layers below.**

### Layer 1 — OpenClaw core

```bash
openclaw doctor          # gateway health, channel warnings, skills count
openclaw health          # live ping: Telegram, agent sessions
openclaw plugins list    # confirm only intentional plugins loaded
openclaw skills list     # count ready vs missing; investigate any regression
```

### Layer 2 — Python sandbox (langraph-echo-sandbox)

```bash
cd workspace/sandboxes/langraph-echo-sandbox
.venv/bin/python -m pytest test_adapter_full.py test_security_audit.py \
  test_telegram_audit.py test_voice_free.py test_langraph_bridge.py -q
# Expected: 83 passed, 1 skipped
# Expected: all selected suites pass
```

### Layer 3 — External repos (langraph, any other /code/* project)

Run this block for **every external Python project** that Echo integrates with:

```bash
# 1. Detect duplicate/stale venvs — there must be exactly ONE
find /Users/pc/code/langraph -maxdepth 1 -type d -name "venv" -o -name ".venv" | sort

# 2. Dependency conflict check — must exit clean
/Users/pc/code/langraph/venv/bin/pip check 2>&1

# 3. Smoke-test the server actually boots (not just that the binary exists)
curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/agents/available
# 200 = up, 000 = not running

# 4. If down, start and verify
cd /Users/pc/code/langraph && nohup venv/bin/python app.py > /tmp/langraph_server.log 2>&1 &
sleep 8 && curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/agents/available
# If still 000, check: tail -30 /tmp/langraph_server.log
```

### Audit failure triggers

Any of these findings = STOP, fix before declaring audit clean:

- More than one venv dir in a project (`venv/` AND `.venv/` coexisting)
- `pip check` returns any conflict line
- Server HTTP status is not 200 after start attempt
- Any selected test suite failure
- `openclaw doctor` shows any channel security warning
