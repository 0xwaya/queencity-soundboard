# SECURITY_NOTES.md — queencity-soundboard

Date: 2026-03-02 (America/New_York)

## Security posture snapshot
- Frontend-only Next.js app with Supabase client dependency.
- Build/lint currently pass.

## Recommendations

1. **Supabase key hygiene (High)**
   - Keep anon/service keys in env files only.
   - Ensure service-role keys are never shipped client-side.

2. **RLS + policy verification (High)**
   - Enforce Row Level Security for all user data tables.
   - Add policy tests for read/write boundaries.

3. **Input validation (Medium/High)**
   - Continue/expand `zod` validation at API boundaries and form submissions.

4. **Dependency governance (Medium)**
   - Keep Next/Supabase dependencies updated with scheduled patch windows.
   - Track security advisories via Dependabot.

5. **Deployment controls (Medium)**
   - Use strict environment separation (dev/staging/prod).
   - Enable CSP and security headers in production hosting config.

## Solidity / Cyfrin note
- No Solidity contracts found in this repo.
- If contracts are introduced, adopt Cyfrin-aligned practices: CEI, strict auth, fuzz/invariant tests, and explicit threat modeling.
