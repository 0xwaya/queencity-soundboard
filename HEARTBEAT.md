# HEARTBEAT.md
<!-- Heartbeat runtime notes for Echo -->

## Implementation

- **Built-in scheduler**: OpenClaw system heartbeat (`agents.defaults.heartbeat`), not `cron/jobs.json`
- **Current state**: disabled via `agents.defaults.heartbeat.every = "0m"`
- **Script**: `sandboxes/langraph-echo-sandbox/heartbeat.py`
- **Adapter**: `lc_adapter.echo_invoke(mode="background", budget_key="background", task_reset=True)`
- **Log**: `/Users/pc/.openclaw/logs/heartbeat.jsonl`
- **Guard rails**: HARD STOP on quota/billing/hard_limit, 10-call cap, 100K token cap (background budget)

## Active Tasks (processed each tick)

### 1. Status Check

Respond with a 1-sentence status: current active tasks, blocking issues, or idle.

### 2. Budget Awareness

Check `workspace/budget.md` for any entries approaching cost thresholds.
Flag if month-to-date cost > 80% of target. One sentence max.

### 3. Session Health

If session token total > 80K, issue: "SESSION WARNING — approaching 100K cap."
If blocked by any HARD STOP condition, stop immediately and log to `logs/heartbeat.jsonl`.

## Notes

- All calls use `cache_key="echo-heartbeat-v1"` for prompt caching
- `heartbeat.py` uses `mode="background"` + `budget_key="background"` — never competes with interactive RPM
- The expensive reminder wrapper came from OpenClaw's built-in system heartbeat landing in the main agent session
- To disable the live heartbeat persistently: `openclaw config set --strict-json agents.defaults.heartbeat.every '"0m"'`
- To disable the live heartbeat immediately: `openclaw system heartbeat disable`
- The `OPENCLAW_HEARTBEAT_ENABLED=0` flag and `~/.openclaw/cron/heartbeat.disabled` sentinel only short-circuit `heartbeat.py` if it is launched directly
- 2026-03-13: LangChain dependency upgrade restored heartbeat execution
