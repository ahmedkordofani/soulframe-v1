# SoulFrame V6.1.1 - Optional Hosted Identity Integration

## Scope

This is **email-code identity only**, not hosted projects or a production backend. It is disabled unless you supply your own Supabase URL and **publishable** browser key. Browser audio and existing local/browser-saved project functionality remain independent. Nothing in this milestone writes to hosted project tables, deploys SQL or uploads audio.

## Setup for an optional test account

1. Use the existing `v6-backend-foundation` development branch and apply the V6.1.1 changed-source ZIP at the repository root.
2. Install the official SDK with `npm install @supabase/supabase-js@^2`. This updates `package.json` **and `package-lock.json`** so `npm ci` in GitHub Actions continues working. Commit both.
3. Create a separate development Supabase project. In **Project Settings > API Keys**, find your `sb_publishable_...` key (never the secret/service-role key) and project URL.
4. Copy `.env.example` to `.env.local`, set `VITE_SUPABASE_URL=https://...supabase.co` and `VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`. `.env.local` is ignored by git and must never be published or copied into public logs.
5. In Supabase Auth, configure email one-time codes. The **email template must show `{{ .Token }}`** instead of sending only `{{ .ConfirmationURL }}`. Make a known test account in Auth separately. The app uses `shouldCreateUser:false`, so it cannot silently create new accounts.
6. `npm run verify`, then `npm run dev`. Navigate to **Product > Output > Saved Projects > Hosted identity**. Send an email code, enter it, confirm you see a verified email, then sign out. Your local API remains a separate system, still unlocked using the existing ephemeral local-owner token.
7. Stop the dev server; try a fresh page load. Without configured environment, the panel must report disabled while browser/local projects still work. On a configured site, the user may need to sign in again on refresh because auth tokens are not persisted.

### Privacy/security constraints

- `VITE_` variables are part of the browser bundle, so **never** place a service-role or `sb_secret_` key there.
- This implementation accepts only `sb_publishable_` keys. If your project uses a legacy `anon` key, provision a publishable key instead.
- The Supabase session is **in memory only**, `persistSession:false`, `detectSessionInUrl:false`. A refresh signs you out. This is intentional in V6.1.1.
- `auth.getUser()` checks verified identity with Supabase rather than treating unverified local user data as an identity claim.
- No hosted data is queried or modified. RLS policies in the V6.1.0 migration have only been **statically examined**; they have not been proven with two live users.
- Email codes are sensitive. Do not paste them into GitHub issues, logs or screenshots. No identity API credentials belong in client notes.
- Configuring this panel alone does **not** make a hosted deployment safe. Keep the local Node server loopback-only, and leave `backend:readiness -- --target=hosted` blocked.

## Acceptance checks

- Without `.env.local`, the panel says not configured; browser and local project workflows still operate.
- With correctly configured development Supabase credentials, a known test account can receive an email code, verify using Supabase Auth and sign out.
- Invalid email / code, incorrect identity provider credentials and disconnected network produce a visible error without granting identity.
- A missing or partial config never attempts a sign-in request.
- Local metadata files, revision history, recovery/backup JSON and local-owner tokens are untouched.
- `npm run verify` passes including hosted identity tests; check locally after `npm install`.

## Next gated step

V6.1.2 should validate authenticated database read isolation **against a disposable Supabase project using two different test users**, before introducing optional cloud project reads. Do not enable writes or database-backed user actions until actual RLS tests pass. This phase supplies identity only, not multi-user isolation guarantees.
