# Deploy Ownership & Access Stabilization

## Canonical Deployment Ownership

- **Vercel Team/Scope:** `0xwaya-projects`
- **Vercel Project:** `queencity-soundboard`
- **Git repo:** `github.com/0xwaya/queencity-soundboard-standalone`
- **Production branch:** `master`
- **Root Directory:** `apps/web`
- **Framework:** `nextjs`

If Vercel shows the project slug `queencity-soundboard`, that is expected; the
deployment source must still be this standalone GitHub repository.

The legacy monorepo-shaped repo is not the canonical deploy source for this project.

## Canonical Domains

- `queencitysoundboard.com`
- `www.queencitysoundboard.com`

## Canonical DNS (GoDaddy)

- `A @ -> 76.76.21.21`
- `CNAME www -> cname.vercel-dns.com`

## Environment Variables (Production)

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_TICKETING_WIDGET_URL` (legacy setting; current event ticket buttons require `events.ticket_url` and do not read this variable)

## SEO ownership checks (post-deploy)

- Verify crawl assets:
  - `https://queencitysoundboard.com/robots.txt`
  - `https://queencitysoundboard.com/sitemap.xml`
- Validate structured data in Google Rich Results Test after each production deploy.
- Keep Search Console ownership under the same operational owner as Vercel production scope.

## Access/Token Sanity Checks

Run these before any incident debugging:

```bash
# 1) Confirm current Vercel identity
npx -y vercel whoami

# 2) Confirm scope/project are visible
npx -y vercel project ls --scope 0xwaya-projects

# 3) Confirm root/framework are correct
npx -y vercel project inspect queencity-soundboard --scope 0xwaya-projects
```

Expected values:

- `Root Directory: apps/web`
- `Framework Preset: nextjs`

## Incident Pattern Resolved (2026-03-03)

Symptom:

- App worked on preview deployment URL but returned 404 on custom domain and default project alias.

Root causes:

- Framework preset was `Other` instead of `nextjs`.
- Root directory mismatch/context confusion across UI/auth scopes.

Fix applied:

- Project patched to `framework=nextjs`, `rootDirectory=apps/web`, and fresh production redeploy.
- Domain aliases reattached after DNS verification.

## Fast Recovery Procedure

```bash
# Re-link local workspace to correct project
cd queencity-soundboard
npx -y vercel link --yes --project queencity-soundboard --scope 0xwaya-projects

# Force fresh production deploy
npx -y vercel deploy --prod --yes --scope 0xwaya-projects

# Verify domain wiring
npx -y vercel domains inspect queencitysoundboard.com --scope 0xwaya-projects
```
