# OpenClaw Rate Limit Problem — Full Report (2026-03-07, final)

**Account:** OpenAI Tier 3 (confirmed from screenshots — single API key)  
**System:** OpenClaw 2026.3.2, Node 22.22.0, macOS  
**Config model:** `openai/gpt-4.1-mini`  
**Actual model running:** `openai/gpt-4.1` ← THIS IS THE PROBLEM

---

## 1. The Symptom

UI error on every chat message. Persistent all day, not improving.

**Before 17:00 (unpatched NVM gateway):**
`⚠️ API rate limit reached. Please try again later.` — instant fail, zero retries

**After 17:00 (patched /usr/local gateway):**
`⚠️ API rate limit reached (retries exhausted). Please wait a moment before continuing.` — retries happening, but still exhausting after 61s

**Frequency (confirmed from log):**
- 13:xx → 9 events
- 14:xx → 15 events
- 15:xx → 7 events
- 16:xx → 4 events
- 17:xx → 4 events (latest at 17:30)
- **Total today: 37 events**

---

## 2. Root Causes (Confirmed, Evidence-Based)

### Cause #1 — WRONG MODEL IN ACTIVE SESSION (PRIMARY — NOT YET FIXED)

`openclaw.json` sets `openai/gpt-4.1-mini`. Gateway startup logs confirm `agent model: openai/gpt-4.1-mini`. But **every single run-start event in today's logs uses `model=gpt-4.1`**. The session has a manual override.

**Evidence from `2bc41777-e83f-46fb-9576-98079ecab9d1.jsonl`:**
- `"model":"gpt-4.1"` → **181 occurrences**
- `"model":"gpt-4.1-mini"` → 8 occurrences (overridden)

**Tier 3 limits from your screenshots:**

| Model | TPM | RPM |
|-------|-----|-----|
| `gpt-4.1` ← what is running | **800,000** | 5,000 |
| `gpt-4.1-mini` ← what config says | **4,000,000** | 5,000 |

You are at **800K TPM instead of 4M TPM** — 5× less headroom — because the session model was manually changed to `gpt-4.1` at some point. RPM is the same on both. This is purely a TPM exhaustion problem caused by the wrong model.

**Fix:** In the OpenClaw dashboard chat UI, open the model selector and switch back to `gpt-4.1-mini`. That alone recovers 5× TPM capacity with zero code changes.

---

### Cause #2 — THREE INSTALL PATHS, ONLY TWO PATCHED (SECONDARY)

Three openclaw installs exist on this machine:

| Path | Patched | Used when |
|------|---------|----------|
| `/usr/local/lib/node_modules/openclaw/` | ✅ | After 17:08 today |
| `/usr/local/Cellar/node@22/22.22.0_1/lib/node_modules/openclaw/` | ✅ | Brew symlink |
| `~/.nvm/versions/node/v22.22.0/lib/node_modules/openclaw/` | ❌ | All day until 17:07 |

Today's log has **1,448 references to the `.nvm` path**. The gateway ran from that unpatched install from boot until 17:07. All pre-17:00 errors were instant (no retries). The error message change at 17:00 directly tracks the gateway switching paths.

**Fix:** Add the `.nvm` path to `patch-gateway.js` `PI_AI_ROOTS` and reapply.

---

### Cause #3 — NO RETRY IN OPENAI CLIENT (FIXED FOR 2/3 PATHS)

`@mariozechner/pi-ai` built OpenAI clients with no `maxRetries`, so every 429 was an instant UI error. Patch injects `maxRetries: 6` → exponential backoff (1s→2s→4s→8s→16s→30s = ~61s total retry window). Applied to `/usr/local/lib/` and `/usr/local/Cellar/`. The `.nvm` path still unpatched.

---

## 3. Priority Fix List

| Priority | Action | Impact |
|----------|--------|--------|
| 🔴 1 | Switch model back to `gpt-4.1-mini` in chat UI model selector | Recovers 5× TPM headroom immediately |
| 🟡 2 | Patch `.nvm` path (add to `patch-gateway.js`) | Ensures retries work if gateway runs from NVM path again |
| 🟢 3 | `openclaw doctor --fix` if gateway ever shows "not loaded" | Known recovery command |

---

## 4. Complete Change Log This Session

| File | Change | Status |
|------|--------|--------|
| `@mariozechner/pi-ai` providers (`/usr/local/lib/` + `/usr/local/Cellar/`) | `maxRetries: 6` injected | ✅ Done |
| `~/.nvm/.../pi-ai/dist/providers/` | `maxRetries: 6` | ❌ Not yet |
| `openclaw/dist/pi-embedded-helpers-*.js` (×8 files, 2 paths) | Updated UI error message to mention retries | ✅ Done |
| `workspace/patch-gateway.js` | Idempotent patcher — `--status`, `--restore`, `--no-restart` | ✅ Created |
| `workspace/rl-debugger.py` | Live rate limit histogram + cluster detection | ✅ Created |
| `~/Library/LaunchAgents/ai.openclaw.rl-patch.plist` | Boot-time auto-reapply, WatchPaths race condition fixed | ✅ Created |
| `~/.zshrc` | `openclaw()` update wrapper + `rl-debug` / `rl-debug-history` aliases | ✅ Added |

**Patch marker:** `/* rl-patch-v1 */` — idempotent, safe to re-run  
**Commands:** `node workspace/patch-gateway.js` · `--status` · `--restore` · `rl-debug`

---

## 5. 2026-03-13 Addendum (Operational Updates)

### Guardrails and Budgets

- Added model guardrails in `lc_adapter` to restrict operational/background calls to mini or nano.
- Added per-channel budgets (budget_key) to isolate spend by channel (telegram, dashboard, background, global).
- Telegram and fallback paths now pass `budget_key="telegram"` for channel-specific caps.

### Heartbeat and Dependency Status

Operator note (2026-03-13):

"The langchain dependency issue blocking heartbeat was fixed by upgrading packages.
The heartbeat script execution was restored and is now running normally.
There was no explicit mention or log of a rate limit error related to the heartbeat in the recent execution logs.
So yes, the dependency issue was fixable and was fixed to restore proper heartbeat operation. As for rate limit issues, none were recorded or fixed recently according to memory logs and activity traces available.

If there were specific rate limit errors you want me to investigate or fix beyond the heartbeat, please provide more details or logs. I am ready to act."

Superseding operator note (2026-03-28):

"The later API spend issue was not caused by live cron ownership of heartbeat. The active source was OpenClaw's built-in system heartbeat injecting scheduled reminder work into the main agent session, which inherited expensive context. Local runtime state has been corrected by setting `agents.defaults.heartbeat.every = \"0m\"` and disabling the live system heartbeat. Treat `cron/jobs.json` as separate from the built-in heartbeat control plane."
