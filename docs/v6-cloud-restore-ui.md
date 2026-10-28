# SoulFrame V6.1.4 — Step 3.20 (Cloud Restore UI)

**Scope:** Owner-verified, explicit listing and revision-checked restoration of soft-deleted **metadata** using the already applied Step 3.13 RPC functions. No audio restoration, local API writes, or browser storage changes.

- A distinct *Deleted cloud projects* section appears only for an authenticated Hosted Identity and contains no records until **Refresh deleted projects** is clicked. The parent `CloudProjectManager` already has `key={identity.id}` through `HostedIdentityPanel`, resetting state on account switch.
- **Restore** opens an inline confirmation naming the deleted record and its current revision. The intent is immutable and allowlisted. No automatic operation on mount, sign-in, or list refresh.
- The adapter from Step 3.19 verifies Supabase identity before and after the RPC. Database `SECURITY DEFINER` code independently enforces owner ID and expected revision.
- A `conflict`, `not_found`, provider failure, or identity failure discards the deleted-project list so stale records cannot be used again without an explicit refresh. No implicit retries.
- A successful restore hides that tombstone from the deleted list, invalidates the ordinary active cloud project list, and asks the user to refresh it. Project audio must be reattached if needed.
- No Cloud Delete button or permanent deletion is introduced. Do not deploy publicly before live browser and cross-account testing.

**Validation:** Offline UI/intent tests cover explicit user action, revision snapshot, malformed data, auth guard, fail-closed conflict behaviour and no Delete UI. They are not a substitute for a live Restore walkthrough.

**Data:** Use the disposable Supabase test database and synthetic projects only. The previously restored `SF-V614-DELETE-01556940-ebb` is already active at Revision 4; do not rerun its one-time restore test. To verify the UI we should create a NEW synthetic tombstone via the approved test-only workflow, not delete any user project.
