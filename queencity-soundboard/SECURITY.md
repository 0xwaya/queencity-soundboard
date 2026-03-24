# Security Practices

## Secrets
- Never commit real API keys, tokens, private keys, or webhook secrets.
- Use environment variables in Vercel/Supabase dashboards.
- Keep only templates in repo (e.g., `.env.example` or docs), never live values.
- For local development, store committed secrets only as `apps/web/.env.encrypted`.
- Use `tools/env-crypto.sh dev` so `apps/web/.env.local` is temporary and removed on exit.

## Data protection
- Use Supabase Row Level Security (RLS) on all tables.
- Restrict write operations to service role/admin paths.
- Store only required customer data.
- Keep preference cookies non-sensitive. For locale or UI state cookies, use scoped values only and set `SameSite=Lax`; add `Secure` on HTTPS.

## Payments
- Use third-party hosted checkout/widget (Ticket Tailor) for PCI scope reduction.
- Validate webhook signatures server-side.

## Operational hygiene
- Run dependency and secret scans before release.
- Enforce branch protection + required PR review for production branch.
- Rotate keys immediately if exposure is suspected.
