# SoulFrame V6.1.2 - Real Hosted Project Ownership Verification

**Status: test harness ready. Real Supabase two-account verification is NOT complete until you run this against your own disposable database and see every PASS.**

## What V6.1.2 does

Adds an opt-in **live RLS test** using two separately authenticated Supabase test accounts through the real Supabase Data API. It checks that accounts can insert/read their own project metadata, cannot read another owner's rows, cannot spoof another owner or revision, cannot update/delete rows yet, and anonymous access is denied. Static unit tests cannot replace the live check.

No cloud project buttons are enabled. Nothing in the existing browser or local Node project storage is migrated, and no audio is uploaded. The existing local API remains loopback-only and remains blocked from hosted deployment.

## Step 1 - Create isolated TEST resources only

1. In [Supabase Dashboard](https://supabase.com/dashboard), use a **throwaway development project**, never production. In its SQL Editor, review and apply `supabase/migrations/20261020000100_hosted_projects.sql` if it has not been applied yet. Do not run the migration twice, because it uses CREATE TABLE without IF NOT EXISTS.
2. Run the read-only `supabase/tests/hosted_projects_contract.sql` in the same SQL Editor. It should finish without exceptions. Check the API Data API is enabled and that `public` is exposed in the test project.
3. In Authentication > Users, manually create **two different email-confirmed test users** with passwords you choose for testing. Do not use real users or client addresses. V6.1.1's email-code UI does not itself provision these test users.
4. In Project Settings > API Keys, locate the project's **publishable** `sb_publishable_...` key and Project URL. Never use `sb_secret_...`, service-role, or elevated database credentials in the script or browser.

## Step 2 - Set private CLI test credentials

From your SoulFrame repo root, create a local file called `.env.rls.local` (NOT `.env.example`) containing:

```dotenv
SOULFRAME_TEST_SUPABASE_URL=https://YOUR-TEST-PROJECT.supabase.co
SOULFRAME_TEST_PUBLISHABLE_KEY=sb_publishable_YOUR_TEST_KEY
SOULFRAME_TEST_USER_A_EMAIL=test-a@your-test-domain.example
SOULFRAME_TEST_USER_A_PASSWORD=YOUR_TEST_ACCOUNT_A_PASSWORD
SOULFRAME_TEST_USER_B_EMAIL=test-b@your-test-domain.example
SOULFRAME_TEST_USER_B_PASSWORD=YOUR_TEST_ACCOUNT_B_PASSWORD
```

All values above are **placeholders**. `.env.rls.local` is covered by the repository's existing `.env.*` gitignore. Never commit it, upload it, photograph it or paste passwords/keys into chat. Only use synthetic names/notes in this disposable environment. The Node.js CLI reads this file on your machine; no `VITE_` credentials are used for this test.

Check that Git ignores it:

```powershell
git check-ignore .env.rls.local
```

Expected output: `.env.rls.local`. If the file is not ignored, **stop** and fix `.gitignore` before proceeding.

## Step 3 - Run verification

```powershell
npm run hosted:contract
npm run verify
npm run hosted:ownership -- --help
npm run hosted:ownership -- --live
```

The live command is opt-in and **will write two disposable metadata records** to your test database. It produces PASS checks for independent identities, anonymous permissions, owner-specific inserts, cross-user reads, blocked spoofing, and disabled UPDATE/DELETE. It does not use a bypass-RLS role. If the test fails, do not turn on hosted project saving; inspect grants and policies. A network failure or an unexpected error is a failure, not a security success.

The live script prints a unique `SF-RLS-VERIFY-...` prefix. Records remain in the disposable database until an authorized administrator removes them through the SQL Editor. This avoids requiring DELETE privileges for ordinary user accounts simply to clean up tests.

**Manual test-data cleanup, in the disposable database only**: paste the unique prefix output by the script in a narrowly scoped statement, inspect the matching rows first, and then delete only those records. Example:

```sql
select id, project_name from public.soulframe_projects
where project_name like 'SF-RLS-VERIFY-PASTE-YOUR-EXACT-PREFIX%';
-- After reviewing the exact matches in your disposable test project:
-- delete from public.soulframe_projects
-- where project_name like 'SF-RLS-VERIFY-PASTE-YOUR-EXACT-PREFIX%';
```

Do not run broad cleanup SQL on a project with real users.

## What PASS means and what remains blocked

PASS confirms the current read/create authorization matrix for two live accounts in **the specific test project and policy configuration**. It does not prove production readiness, race-free updates, backups, deletion procedures, email security, business-level quotas or ongoing policy correctness. Re-run when grants or policies change.

**Do not** apply any new UPDATE or DELETE grants as part of this test. V6.1.3 will plan optional cloud reads and explicit project saving only after a successful live ownership test. V6.1.4 must design/test revision-safe update/delete.

## Troubleshooting

- `Missing test configuration`: inspect `.env.rls.local` and check that Node version supports `--env-file-if-exists` (Node 22.16+ works).
- Sign-in fails: confirm separate Auth users were provisioned, password matches, and emails are confirmed.
- Table missing: ensure the V6.1.0 migration was applied to the correct isolated project.
- Anonymous access succeeds: check `REVOKE` and RLS, do not proceed.
- Own insert fails: inspect column grants, `public` Data API exposure, Auth role, and RLS policy.
- Cross-owner read returns a row: immediately disable hosted project access until policies are corrected.
- DELETE/UPDATE succeeds or returns success without a permission error: ownership isolation test **fails** until the intended deny-only behavior is restored.
- Test row exists after a failed run: expected; clean it up manually in the disposable test project.

### Privacy and handling

This test intentionally stores only synthetic metadata. Credentials are read locally, never printed by the CLI and never committed. Supabase still receives authentication traffic and the synthetic data, so execute only against your own test project. Keep the API publishable key public-only; no `service_role` key belongs in `.env.rls.local`.
