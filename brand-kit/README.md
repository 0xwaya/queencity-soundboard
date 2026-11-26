# Queen City Soundboard brand and social kit

Branding and social media assets for Queen City Soundboard (QCS) only.

- [`brand/README.md`](brand/README.md): logo variants and when to use each, colors, fonts, handles.
- [`social/README.md`](social/README.md): TikTok / Instagram posting playbook and how to run the poster templates.

## Why this lives at the repo root

This folder is deliberately outside `apps/web/`. Vercel's Root Directory is `apps/web` (see `docs/DEPLOY_OWNERSHIP.md`), and ESLint, `tsc` and Vitest are all configured inside `apps/web`, so nothing here is built, linted, type-checked, tested or served. Do not move it under `apps/web/public/`: everything in that folder is published at `queencitysoundboard.com`.

Files that are already served from `apps/web/public/` (crown, mark, animated logo, skyline photo) are not copied here. They are listed in `brand/README.md` with their paths.

## What must never be committed here

Secrets, tokens, `.env` files, account emails or phone numbers, cookies or session exports, the posting ledger, story kit zips, font files, or anything belonging to another business. `.gitignore` in this folder blocks the common cases. Keep every file under 10 MB.
