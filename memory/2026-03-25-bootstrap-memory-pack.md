# Bootstrap Memory Pack — 2026-03-25

## Purpose
- Rebuild durable operator context after session-store loss in `agents/main/sessions/`.
- Source material: `memory.md`, `passive-streams.md`, dated notes from 2026-03-02 through 2026-03-25.

## Identity And Operating Posture
- Echo is the profit operator super-agent for 0xwaya / Edward Mercado.
- Working style: direct, decisive, outcome-first, high autonomy when action is possible.
- User expects explicit status updates when a task runs longer than about 15 minutes.
- User prefers one-repo-at-a-time discipline for audits and changes.
- User requires strict privacy and security handling.
- User does not want pushes unless explicitly requested.
- When higher-quality tooling is needed, include explicit cost assessment before recommending upgrades.

## Core System State
- OpenClaw baseline version observed in memory: `v2026.3.2`, with update availability noted on 2026-03-14.
- Main default model baseline: `openai/gpt-4.1-mini`.
- Active agents baseline: `main`, `nano-banana-pro`, `openai-image-gen`.
- Telegram bot expected connected with allowlist policy.
- Built-in system heartbeat is controlled by `agents.defaults.heartbeat`; local state is now disabled with `every = "0m"`.
- Budget enforcement baseline: `lc_adapter` max 50 calls per task and 500000 tokens per session.

## Durable Architecture Decisions
- OpenClaw Gateway native RPC is the preferred control surface for config and model routing; avoid fragile `node_modules` patching where possible.
- All Python OpenAI calls must go through `lc_adapter.echo_invoke()`; direct `ChatOpenAI` instantiation is forbidden.
- `canvas.eval` and `canvas.snapshot` should not be denied in `gateway.nodes.denyCommands` after the operator restore.
- Self-optimization is expected in heartbeat cycles: each cycle should propose one cost or latency reduction and one autonomy improvement.

## Current Priority Projects
- Amazon Granite Rebranding: backend, frontend, supplier scraper in `workspace/amazon-granite/`.
- QueenCity Soundboard: active shipping project with production deployment history and Ticket Tailor-only MVP path.
- LangGraph CEO System: active sandbox in `sandboxes/langraph-echo-sandbox/`.

## QueenCity Soundboard Durable Notes
- Shipping focus was explicitly shifted to `0xwaya/queencity-soundboard` on 2026-03-03.
- Priorities: functional web app, stronger brand presence, and domain go-live on `queencitysoundboard.com`.
- Supabase and merch/event flow work was completed and deployed.
- Ticket Tailor became the only supported MVP ticketing path.
- DNS was updated to Vercel targets; finalization depended on Vercel domain attachment and SSL validation.
- SEO, analytics, social content tooling, and poll/event updates were added across March 2026.
- User prefers guided, step-by-step operational execution from phone with verification checkpoints.

## Profit And Brand Direction
- Best near-term monetization path: AI automation studio for appointment businesses and B2B pipeline automation, then micro-SaaS productization.
- Brand direction: premium, non-template, clean, professional, edgy.
- Creative workflow decision: Midjourney for exploration, Figma for final production.
- Content engine direction: short tutorials plus real-world use cases.

## Secret And Security Baseline
- Never commit raw keys.
- Keep secrets in local `.env` and encrypted local copies where applicable.
- Run secret scans before pushes.
- Production secrets stay in provider dashboards.
- A privacy guardrails file was established and should remain part of operating discipline.

## Recent Session And Platform Notes
- A standalone Codex session summary was preserved on 2026-03-25.
- Webchat currently does not support persistent ACP session spawning because `mode="session"` requires `thread=true`, while thread bindings are unavailable in webchat.
- Upgrade work has been defined to enable thread-bound ACP sessions in webchat with config, adapter, runtime, testing, security, and rollout work.

## Session Loss Forensics
- The active `agents/main/sessions/` store now contains only one fresh session from 2026-03-25.
- No additional session transcript files or rotated `sessions.json` backups were found under `.openclaw`.
- `tmutil listbackups` returned no machine directory for host.
- `tmutil listlocalsnapshots /` returned no local snapshots.
- Conclusion: session restore from Time Machine is not possible in the current environment unless the backup disk or backup source is attached later.

## Immediate Boot Checklist
1. Confirm `openclaw.json` still has native `gateway.auth.token` and `channels.telegram.botToken` placement.
2. Confirm gateway health and RPC availability.
3. Confirm `openai/gpt-4.1-mini` remains the primary model for `main`.
4. Confirm `lc_adapter` limits remain intact and built-in heartbeat stays disabled unless intentionally re-enabled.
5. Use this file plus `memory.md` and recent dated notes to rebuild context before resuming project work.