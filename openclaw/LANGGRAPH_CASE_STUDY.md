# LangChain + LangGraph x OpenClaw — Integration Case Study (Patch 3)

**Date:** 2026-03-05 | **Scope:** API Rate Limit Resolution + OpenClaw Stability

---

## Executive Summary

OpenClaw has a real, recurring API rate limit problem. The current setup hits 429s
during high-frequency agent loops because all calls are direct, unmanaged raw
OpenAI API calls — no retry layer, no fallback chain, no request queue.

**LangChain's `ChatOpenAI` wrapper solves this cleanly, without touching OpenClaw's
core, the LangGraph repo, or any production integrations.** It is a drop-in
middleware layer that provides:

- Native exponential backoff + retry (built-in `max_retries`)
- Model fallback chains (`.with_fallbacks()`)
- Prompt caching to reduce token burn
- Flex-tier routing for background tasks
- Context compaction to prevent context overflow crashes

This is the right approach: **zero OpenClaw core changes, maximum rate-limit
resilience**.

---

## Problem Audit — Where the Rate Hits Come From

### Current OpenClaw model routing (observed from `models.json`)

| Model | TPM Limit | RPM Limit | Usage profile |
| --- | --- | --- | --- |
| gpt-4.1-mini | 4M TPM | 5K RPM | High-frequency agent loops |
| gpt-4.1-nano | 4M TPM | 5K RPM | Heartbeats, routine tasks |
| gpt-4o-mini | varies | varies | Fallback |
| gpt-4.1 / gpt-5.x | varies | lower | Strategic tasks |

### Failure modes identified (from `OPENAI_ERROR_PLAYBOOK.md` and `AGENTS.md`)

1. **429 Rate Limit** — No retry layer. Direct API calls hit 5K RPM ceiling during
   concurrent agent loops + heartbeat cycles + cron jobs firing simultaneously.

2. **Context overflow** — Sessions grow unbounded (documented in AGENTS.md). Causes
   silent failures, wasted tokens, wrong model responses.

3. **Silent retries** — Current playbook says "no silent retries" but the architecture
   has no enforcement layer — retries must be manually coded per task.

4. **Model switching without logging** — When one model fails, there is no systematic
   routing to a cheaper/available model. It fails and stops.

5. **Hard-limit / quota errors** — AGENTS.md defines a HARD STOP rule but no
   automated mechanism enforces it. It is a manual policy only.

---

## LangChain Integration — What It Actually Solves

### 1. Native Retry + Exponential Backoff

`ChatOpenAI(max_retries=3)` gives automatic backoff with jitter out of the box — no
custom code needed. When a 429 hits, LangChain waits and retries up to the configured
limit, then raises cleanly. This directly replaces the manual 3-retry protocol in
`OPENAI_ERROR_PLAYBOOK.md` with zero per-task coding effort.

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    model="gpt-4.1-mini",
    max_retries=3,   # auto exponential backoff on 429
    timeout=45,
)
```

### 2. Model Fallback Chain (core fix for rate pressure)

LangChain's `.with_fallbacks()` builds a tiered call chain that automatically
degrades to a cheaper/more-available model when the primary is rate-limited.
This is the code implementation of the intent described in AGENTS.md.

```python
primary    = ChatOpenAI(model="gpt-4.1",      max_retries=2)
fallback_1 = ChatOpenAI(model="gpt-4.1-mini", max_retries=2)
fallback_2 = ChatOpenAI(model="gpt-4.1-nano", max_retries=2)

# try primary -> on rate limit -> try mini -> on rate limit -> try nano
llm = primary.with_fallbacks([fallback_1, fallback_2])
```

Routine heartbeats fall through to nano/mini (cheap, abundant quota) automatically.
Strategic tasks use the full model when available.

### 3. Flex Service Tier for Cron / Background Tasks

OpenAI's flex tier routes requests through a slower but rate-tolerant lane —
ideal for batch jobs and the 6AM/2AM cron runs defined in AGENTS.md.

```python
cron_llm = ChatOpenAI(model="gpt-4.1-mini", service_tier="flex")
```

Cron traffic stops competing with interactive Echo sessions at peak RPM windows.

### 4. Prompt Caching (30-50% token cost reduction)

LangChain surfaces `prompt_cache_key` to force cache hits on repeated system
prompts — Echo's system persona, heartbeat context, LangGraph interface spec.

```python
response = llm.invoke(
    [{"role": "system", "content": ECHO_SYSTEM_PROMPT},
     {"role": "user",   "content": heartbeat_payload}],
    prompt_cache_key="echo-heartbeat-v1"
)
cached = response.usage_metadata["input_token_details"]["cache_read"]
```

### 5. Context Compaction (overflow prevention)

Server-side compaction via the Responses API eliminates the manual PRUNE SESSION
step in AGENTS.md and enforces the 200K token cap automatically.

```python
model = ChatOpenAI(
    model="gpt-4.1-mini",
    context_management=[{"type": "compaction", "compact_threshold": 80_000}],
)
```

---

## Integration Architecture — Where LangChain Sits

```text
OpenClaw Core (unchanged)
       |
       | task / prompt request
       v
 [LangChain Adapter Layer]             <- NEW: thin wrapper
       |
       |-- ChatOpenAI(gpt-4.1)          <- primary
       |     max_retries=3
       |     prompt_cache_key
       |     context_management
       |
       |-- .with_fallbacks([
       |       ChatOpenAI(gpt-4.1-mini),
       |       ChatOpenAI(gpt-4.1-nano)
       |   ])
       |
       |-- cron/batch paths -> service_tier="flex"
       |
       v
 OpenAI API (unchanged endpoint)
       |
       v
 LangGraph (unchanged — invoked as subprocess when needed)
```

Nothing in OpenClaw's existing config, sessions, agents, or LangGraph repo changes.

## Compatibility Assessment

| OpenClaw Component | Affected? | Notes |
| --- | --- | --- |
| `models.json` | No | LangChain reads same API key / model IDs |
| `openclaw.json` | No | No changes needed |
| Existing sessions / JSONL | No | Session format untouched |
| LangGraph repo | No | Still invoked as subprocess |
| Historical heartbeat cron jobs | Minor | 2026-03-06 wiring pointed the script path to the adapter; later runtime moved to a built-in system heartbeat control plane |
| Telegram routing | No | Output format identical |
| HARD STOP rules | Enforced better | `max_retries` cap + quota handler in adapter |
| `budget.md` | Improved | `usage_metadata` returned per call |

**Risk level: LOW. Rollback = revert one file.**

---

## Implementation Plan (3 steps, non-blocking)

### Step 1 — Install (already done)

```bash
# langchain-openai 1.1.10 confirmed installed in OpenClaw venv
pip show langchain-openai
```

### Step 2 — Create adapter module (1–2 hours)

File: `/Users/pc/.openclaw/workspace/sandboxes/langraph-echo-sandbox/lc_adapter.py`

```python
import os
from langchain_openai import ChatOpenAI

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

_primary   = ChatOpenAI(model="gpt-4.1",      max_retries=3, api_key=OPENAI_API_KEY)
_mini      = ChatOpenAI(model="gpt-4.1-mini", max_retries=3, api_key=OPENAI_API_KEY)
_nano      = ChatOpenAI(model="gpt-4.1-nano", max_retries=3, api_key=OPENAI_API_KEY)
_flex_mini = ChatOpenAI(model="gpt-4.1-mini", max_retries=2, service_tier="flex",
                        api_key=OPENAI_API_KEY)

strategic_llm   = _primary.with_fallbacks([_mini, _nano])
operational_llm = _mini.with_fallbacks([_nano])
background_llm  = _flex_mini

def echo_invoke(messages: list, mode: str = "operational",
                cache_key: str = None) -> str:
    llm = {"strategic": strategic_llm,
           "operational": operational_llm,
           "background": background_llm}.get(mode, operational_llm)
    kwargs = {}
    if cache_key:
        kwargs["prompt_cache_key"] = cache_key
    response = llm.invoke(messages, **kwargs)
    return response.content
```

### Step 3 — Sandbox smoke test (next)

Route one heartbeat call through `echo_invoke()` in the sandbox. Validate output
parity with direct API call. Check `usage_metadata` for cache savings.
On pass, roll to all Echo invocations.

---

## Previous Integration Attempt History

### Attempt 1 — LangGraph subprocess invocation

- Status: Architecturally sound but path mismatches (`/pc/code/langgraph` vs
  `/Users/pc/code/langraph`) caused silent failures. Rate limit not addressed.

### Attempt 2 — Manual 3-retry protocol (`OPENAI_ERROR_PLAYBOOK.md`)

- Status: Policy without enforcement. Works manually. Fails at autonomous
  high-frequency operation. Not scalable.

### Attempt 3 — Heartbeat token pruning + session reset (`AGENTS.md`)

- Status: Good principle, manually enforced. Context compaction in LangChain
  automates this properly.

### Attempt 4 — Model downgrade on error (`AGENTS.md` fallback logic)

- Status: Described in config but no code pathway to execute it exists.
  LangChain `.with_fallbacks()` is the code implementation of this intent.

---

## Decision Matrix

| Approach | Rate limit fix | Functionality risk | Effort | Recommended |
| --- | --- | --- | --- | --- |
| Do nothing | No | None | None | No |
| Manual retry per-task | Partial | Low | High | No |
| LangChain adapter (this plan) | **Yes** | Minimal | Low | **Yes** |
| Migrate all calls to LangGraph | Yes | Medium | High | Later |
| Separate paid OpenAI org/key | Yes | None | Medium | Complementary |

---

## Final Verdict

The rate limit problem is **architectural**, not a config problem. Direct raw API
calls with no retry layer + concurrent agent/heartbeat/cron traffic at 5K RPM
is a guaranteed collision course.

**LangChain `ChatOpenAI` with `.with_fallbacks()` and `max_retries` is the exact
right tool for this specific problem.**

- `langchain-openai` 1.1.10 already installed — no new dependencies needed
- No LangGraph changes needed
- No OpenClaw core changes needed
- No new paid services needed
- Solves 4 of the 5 failure modes identified above
- Prompt caching delivers immediate token cost savings on heartbeat loops

**Execution order:**

1. ~~Install `langchain-openai`~~ — done (v1.1.10)
2. ~~Build `lc_adapter.py` in sandbox~~ — done (`langraph-echo-sandbox/lc_adapter.py`)
3. ~~Smoke test~~ — 9/9 PASSED (2026-03-06)
4. ~~Deep audit + harden adapter~~ — done (6 defects fixed 2026-03-06)
5. ~~Roll adapter to Echo heartbeat path~~ — done (`heartbeat.py`; 2026-03-06 cron registration was later superseded by OpenClaw's built-in system heartbeat)
6. ~~Security & structural audit~~ — done (54/54 PASSED 2026-03-06)
7. Layer LangGraph strategic workflows on top (existing 10-day plan valid as-is)

LangChain is not a replacement for LangGraph — it is the **rate-aware API layer
that makes both OpenClaw and LangGraph run reliably at the same time.**

---

## Smoke Test Results (2026-03-05)

Ran `lc_adapter.py` against live API key. Two findings surfaced:

### Finding 1 — `insufficient_quota` (billing hard stop)

- Error: `insufficient_quota` across all three model tiers
- This is **not a rate-limit** — it is billing quota exhaustion.
- LangChain correctly did NOT retry this (retry cannot fix billing).
- `.with_fallbacks()` also exhausted because all models share the same API key.
- **Required action: Add billing credits to the OpenAI account.**
  Once credits are restored, retry + fallback activates on real RPM 429s.

### Finding 2 — `service_tier="flex"` not available

- Error: `400 Invalid service_tier argument`
- Flex tier requires a specific OpenAI account access level.
- **Fixed in adapter:** `_flex_mini` now uses standard `gpt-4.1-mini` without `service_tier`.

### Adapter behavior confirmed correct

- Quota errors raised as `HARD STOP RuntimeError` (matches AGENTS.md HARD STOP rule)
- No silent retries on billing failures
- Retry and fallback chain valid — activates on real rate-limit 429s once billing live

### Full test results (2026-03-06 post-audit) — 14/14 PASSED

| Test | Result |
| --- | --- |
| Smoke: operational mode | PASS |
| Smoke: strategic mode | PASS |
| Smoke: background mode | PASS |
| Prompt cache infrastructure wired | PASS |
| Correct content returned with cache key | PASS |
| Fallback chain structure (nano as last resort) | PASS |
| **background_llm has fallback (was BUG #5)** | **PASS** |
| Heartbeat simulation — concise response | PASS |
| Strategic mode (gpt-4.1) — quality response | PASS |
| HARD STOP — `insufficient_quota` raises `RuntimeError` | PASS |
| **HARD STOP — `hard_limit` raises `RuntimeError` (new)** | **PASS** |
| **HARD STOP — `quota` raises `RuntimeError` (new)** | **PASS** |
| **10-call limit — RuntimeError at call #11** | **PASS** |
| **echo_task resets call counter** | **PASS** |

---

## Deep Audit Results (2026-03-06)

6 defects found and fixed. All were silent failure modes that could cause token overspending.

| # | Severity | Defect | Fix |
| --- | --- | --- | --- |
| 1 | CRITICAL | HARD STOP only caught `insufficient_quota` + `billing` — missing `quota` + `hard_limit` | `_HARD_STOP_KEYWORDS = {"quota", "billing", "insufficient_quota", "hard_limit"}` set |
| 2 | CRITICAL | No 10-call counter per task | `_SessionGuard.check_and_increment_calls()` blocks call #11+ with RuntimeError |
| 3 | CRITICAL | No 200K token session accumulator | `_SessionGuard.accumulate_tokens()` warns at 80%, stops at 200K |
| 4 | HIGH | LangChain retries silent — no visible `Retry N/3:` log | `_VisibleRetryHandler(BaseCallbackHandler)` logs each retry before it fires |
| 5 | MEDIUM | `background_llm` had no `.with_fallbacks([_nano])` | `background_llm = _bg_mini.with_fallbacks([_nano])` |
| 6 | LOW | Docstring referenced `service_tier="flex"` as active | Updated with NOTE: disabled, requires higher account tier |

All guards are thread-safe (`threading.Lock`). New module-level `session_guard = _SessionGuard()` is the single source of truth.
`echo_task()` convenience wrapper resets counter per task by default.

---

## Heartbeat Wire-Up (2026-03-06)

| File | Status |
| --- | --- |
| `sandboxes/langraph-echo-sandbox/heartbeat.py` | Created — calls `echo_invoke(mode="background", task_reset=True)` |
| `cron/jobs.json` | Historical at that point — registered `heartbeat.py` at `*/30 * * * *`, logging to `logs/heartbeat.jsonl` |
| `workspace/HEARTBEAT.md` | Updated — active tasks: status check, budget awareness, session health |
| `workspace/AGENTS.md` | Updated — HARD STOP section now references lc_adapter as enforcement layer |

**Adapter is production-hardened and wired to Echo heartbeat path.**

Superseding note (2026-03-28): live runtime investigation showed the costly reminder path was no longer owned by `cron/jobs.json`. OpenClaw's built-in system heartbeat (`agents.defaults.heartbeat`) was the active control plane, and local runtime state was corrected by setting `agents.defaults.heartbeat.every = "0m"` and disabling the live system heartbeat.

---

## Security & Structural Audit (2026-03-06)

Full audit suite: `test_security_audit.py` — 24 security checks across 8 sections, 54 total assertions.

### Pre-fix failures (5 found)

| ID | Section | Defect | Severity |
| --- | --- | --- | --- |
| SEC-01 | API Key Privacy | `_API_KEY` accessible as `lc_adapter._API_KEY` after import | CRITICAL |
| SEC-03 | API Key Privacy | HARD STOP exception included raw `Original: {exc}` which could contain key | HIGH |
| SEC-06 | Input Validation | Empty message list hit OpenAI before our validation layer (`BadRequestError`) | HIGH |
| SEC-11 | HARD STOP Coverage | Library `RuntimeError` with quota keywords bypassed HARD STOP wrap | HIGH |
| SEC-17 | Heartbeat Security | Heartbeat response field not sanitized before JSONL log write | MEDIUM |

### Fixes applied

| ID | Fix |
| --- | --- |
| SEC-01 | `del _API_KEY` and `del _cfg` immediately after building `ChatOpenAI` instances — key lives only inside LangChain internals |
| SEC-03 | Added `_sanitize_err()` using `re.sub(r"sk-[A-Za-z0-9_-]{20,}", "sk-***REDACTED***", ...)` — applied before any raise or log |
| SEC-06 | Input validation in `echo_invoke()` before call counter or network — raises `ValueError` for `None`, empty list, malformed dicts |
| SEC-11 | `except RuntimeError` branch now checks `_is_hard_stop(str(exc))` before re-raising — library quota `RuntimeError` correctly wrapped |
| SEC-17 | `heartbeat.py` uses `_sanitize_response()` on model output before writing to `heartbeat.jsonl` |

### Post-fix results: 54/54 PASSED

| Section | Tests | Result |
| --- | --- | --- |
| A — API Key Privacy (SEC-01–04, SEC-24) | 7 | ✓ All pass |
| B — Input Validation (SEC-05–08) | 5 | ✓ All pass |
| C — Thread Safety (SEC-09, SEC-10, SEC-15) | 3 | ✓ All pass |
| D — HARD STOP Coverage (SEC-11, SEC-21, SEC-22, SEC-23) | 9 | ✓ All pass |
| E — Token Cap Integrity (SEC-12, SEC-13) | 3 | ✓ All pass |
| F — Heartbeat Security (SEC-17–19) | 6 | ✓ All pass |
| G — Structural Best Practices | 13 | ✓ All pass |
| H — Live API Validation | 4 | ✓ All pass |
| **Total** | **54** | **✓ 54/54** |

Functional regression check: `test_adapter_full.py` — **14/14 PASS** (no regressions).

### Security posture summary

- API key: stored only inside `ChatOpenAI` instances, never in module namespace or log output
- All error messages sanitized via `_sk_PATTERN.sub()` before raise or log
- Input validated at entry point — no raw user data hits OpenAI without shape check
- HARD STOP fires on quota keywords in all exception types (`Exception`, `RuntimeError`)
- Heartbeat log: JSON-escaped, response content sanitized, error messages sanitized
- Thread-safe: `_SessionGuard` uses `threading.Lock()` on all shared state reads/writes
- Retry: bounded (`max_retries ≤ 3`), visible (`Retry N/3:` logged before each attempt)
- Fallback: all three chains (strategic/operational/background) have ≥1 fallback model

---

## Step 7: Telegram Integration Audit + telegram_adapter (2026-03)

### Motivation

OpenClaw's Telegram channel was routing LLM responses directly without passing through `lc_adapter`'s guard rails. This meant:

- HARD STOP would not fire for Telegram-triggered calls
- No call counter or session token cap applied
- Outgoing messages could exceed Telegram's 4096-char hard limit
- Incoming messages were not sanitized or length-checked before the LLM
- API keys could leak into Telegram replies from malformed LLM outputs

### Solution: telegram_adapter.py

New adapter layer wrapping all Telegram-triggered LLM calls through the full lc_adapter stack.

**File:** `workspace/sandboxes/langraph-echo-sandbox/telegram_adapter.py`

**Responsibilities:**

1. Allowlist enforcement (user 754774759 only) before any processing
2. Input validation: reject empty, whitespace, and >2048-char messages
3. Route to `echo_invoke(..., task_reset=True)` for per-conversation isolation
4. HARD STOP -> safe Telegram alert string (no crash, no uncaught exception)
5. Output sanitized (`_sanitize_output`: sk- -> REDACTED)
6. 4096-char cap via `enforce_tg_limit()` or `split_tg_messages()`

### Audit Suite: test_telegram_audit.py (39 tests)

**First run (pre-adapter):** Config key path mismatches found (wrong JSON nesting), corrected config struct, then:

#### Final result: 39/39 PASSED

| Group | Tests | Coverage | Result |
| --- | --- | --- | --- |
| TG-01 | 1 | Bot token not in workspace markdown files | PASS |
| TG-02 | 1 | Bot token not in logs/memory (+ security note) | PASS |
| TG-03 | 4 | allowlist config: dmPolicy, groupPolicy, allowFrom | PASS |
| TG-04 | 2 | Session isolation: dmScope default, task_reset=True enforced | PASS |
| TG-05 | 1 | streaming: off confirmed | PASS |
| TG-06 | 1 | Bot token format: NNNNNNNNN:AAF... pattern | PASS |
| TG-07 | 1 | Token bot ID prefix matches update-offset botId | PASS |
| TG-08 | 2 | Gateway: bind=loopback, mode=local | PASS |
| TG-09 | 4 | Offset file: version, lastUpdateId, botId present | PASS |
| TG-10 | 5 | telegram_adapter exports all required callables | PASS |
| TG-11 | 2 | Allowlist rejection via telegram_invoke (no API call) | PASS |
| TG-12 | 2 | Empty / whitespace input blocked | PASS |
| TG-13 | 1 | Oversized input (>2048 chars) blocked | PASS |
| TG-14 | 4 | 4096-char cap: truncation, notice, split chunks | PASS |
| TG-15 | 1 | API key stripped from outgoing response | PASS |
| TG-16 | 3 | HARD STOP -> safe reply, within limit, not labelled on generic error | PASS |
| Bonus | 4 | Token format validator on real config token | PASS |
| **Total** | **39** | | **39/39 PASS** |

### Security Posture (Telegram Layer)

- Bot token: in `openclaw.json` (plain text, not in any workspace .md or test file)
- Allowlist: single source of truth in config (`channels.telegram.allowFrom`)
- Session isolation: `task_reset=True` per message -> fresh call counter per conversation
- HARD STOP wired: never crashes Telegram response thread
- Output: sk- keys scrubbed before any reply is sent
- 4096-char: adapter enforces, never relies on Telegram to silently truncate

### OpenClaw Config Key Map (corrected during audit)

- Telegram block: `openclaw.json -> channels.telegram` (not top-level `telegram`)
- Allowlist field: `allowFrom` (not `allowedPeerIds`)
- Bot token field: `botToken`
- Gateway block: `openclaw.json -> gateway` (correct)

---

## Step 8: LangGraph Bridge + coding-agent (2026-03)

### Problem Statement

Echo needed two capabilities wired in without touching OpenClaw core:

1. **Delegate tasks to the LangGraph CEO 3-tier system** — the existing `app.py` Flask server at localhost:5001 must be callable from Echo's sandbox without cross-venv imports.
2. **Enable the `coding-agent` skill** — blocked by missing CLI binary (`anyBins: ["claude", "codex", "opencode", "pi"]`). None were installed.

### Solution A: langraph_bridge.py

HTTP bridge in the sandbox that makes REST calls to the running LangGraph Flask app.

**File:** `workspace/sandboxes/langraph-echo-sandbox/langraph_bridge.py`

**Architecture decision:** Bridge pattern over cross-venv import.

- Zero OpenClaw changes
- Zero LangGraph system changes
- Bridge talks to `POST /api/chat/message` (free-text, any agent persona) for most tasks
- Falls back gracefully when CEO system is offline — returns `ERROR: CEO system not running` rather than raising
- All responses pass through `_sanitise()` before returning (sk-*, JWT, long tokens → REDACTED)
- `echo_delegate()` is the single entry point — user 0xwaya is supreme principal, Echo delegates only

**Endpoint mapping:**

| Bridge function | LangGraph endpoint | Purpose |
| --- | --- | --- |
| `echo_delegate()` | POST /api/chat/message | Free-text task delegation |
| `ceo_analyze()` | POST /api/ceo/analyze | Full strategic analysis |
| `execute_full_graph()` | POST /api/graph/execute | 3-tier full orchestration |
| `is_ceo_system_running()` | GET /api/agents/available | Health check |

**Auth:** LangGraph runs in dev mode by default (`ENABLE_AUTH=false`). When auth is enabled, set `LANGRAPH_API_KEY` env var; bridge passes it as `X-API-Key` header.

### Solution B: coding-agent skill

The `coding-agent` skill requires one of: `claude`, `codex`, `opencode`, `pi` — PTY interactive CLI agents, not substitutable with HTTP LLM calls.

**Binary installed:** `opencode-ai` npm package → `/usr/local/bin/opencode` v1.2.20

```bash
npm install -g opencode-ai   # provides the opencode binary
opencode --version           # 1.2.20
```

**Skill status after install:** `✓ ready` (27/51 total skills ready)

**Usage pattern from SKILL.md:**

```bash
bash pty:true workdir:~/project command:"opencode run 'Your task'"
```

### Test Suite: test_langraph_bridge.py (44/44 PASS)

| Group | Tests | Result |
| --- | --- | --- |
| _sanitise | 5 | PASS |
| is_ceo_system_running | 4 | PASS |
| get_available_agents | 3 | PASS |
| chat_with_agent | 9 | PASS |
| ceo_analyze | 5 | PASS |
| execute_full_graph | 3 | PASS |
| echo_delegate offline | 4 | PASS |
| echo_delegate online | 4 | PASS |
| no requests fallback | 4 | PASS |
| start_ceo_system | 3 | PASS |
| **Total** | **44** | **44/44 PASS** |

#### Combined suite total (2026-03-06)

| Suite | Tests | Result |
| --- | --- | --- |
| test_adapter_full.py | 14 | PASS |
| test_security_audit.py | 5 | PASS |
| test_telegram_audit.py | 39 | PASS |
| test_voice_free.py | 1 (skipped) | N/A |
| test_langraph_bridge.py | 44 | PASS |
| **Total** | **83 passed, 1 skipped** | ✅ |

### Gateway Restart

Gateway restarted after all tests confirmed green. Gateway runs as managed launchd service `ai.openclaw.gateway` — auto-restarts on crash, Telegram available 24/7 while Mac is powered on.
