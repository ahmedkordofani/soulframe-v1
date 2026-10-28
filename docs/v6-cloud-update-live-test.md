# SoulFrame V6.1.4 — Step 2.8: Live cloud UPDATE / conflict verification

**Disposable test database only.** The `main (PRODUCTION)` dashboard label is a reminder that this must not be run on a database serving real users. Do not use real client metadata.

Preconditions:
- The reviewed V6.1.4 migration has been applied and the read-only SQL catalog checker passed.
- `soulframe_private` is not Data API exposed.
- The public update RPC is reachable; invalid arguments returned `22023`.
- `.env.rls.local` contains the pre-existing two disposable accounts and only a publishable key; it is git-ignored.
- Current browser/local API/project UI remains unchanged. Cloud DELETE is not exercised.

From the repository root:

```powershell
Expand-Archive -LiteralPath '.\soulframe-v6.1.4-step2.8-live-update-check.zip' -DestinationPath . -Force
npm run verify
node --env-file=.env.rls.local scripts/verify-cloud-update-v614.mjs --help
node --env-file=.env.rls.local scripts/verify-cloud-update-v614.mjs --live
```

The live command creates **one synthetic Account A project**, verifies normal update revision 1→2, stale rev-1 rejection, Account B cross-owner denial, simultaneous rev-2 updates (only one succeeds), and final rev-3 state. It verifies direct table UPDATE and DELETE remain denied. **No delete RPC or hard/soft delete is attempted.** Your existing `Untitled AI Draft` is not targeted or altered.

The script reports its record marker (`SF-V614-UPDATE-...`) for precise administrator-led cleanup in the throwaway database. The test record stays in the database for now; do not try to remove it through client UI. Run this test only once unless a rerun is necessary; each run creates a new synthetic record.

If the script reports FAIL, stop and share only the short error/output. Do not paste passwords, environment files, tokens, Supabase connection URLs or access keys. Do not commit or push V6.1.4 yet.
