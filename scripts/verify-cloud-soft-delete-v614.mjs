#!/usr/bin/env node
// SoulFrame V6.1.4 - opt-in live, owner-scoped SOFT DELETE / tombstone checks.
// One newly created synthetic record ONLY. No hard deletes or administrative credentials.
import { randomUUID } from 'node:crypto';

function usage() {
  console.log(`SoulFrame V6.1.4 - live soft-deletion verification
Usage: node --env-file=.env.rls.local scripts/verify-cloud-soft-delete-v614.mjs --live

--help (or no args) does NOT connect to Supabase.
--live creates ONE disposable SF-V614-DELETE-* test row, updates only that row,
then soft-deletes it via the owner-scoped RPC. The tombstone is retained for
read-only SQL verification. Existing projects are never modified or deleted.
Requires two distinct provisioned test users and an isolated test database.
NEVER use a production database, service-role key or real client data.`);
}

const args = process.argv.slice(2);
if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
  usage();
  process.exit(0);
}
if (args.length !== 1 || args[0] !== '--live') {
  console.error('Invalid arguments. Use --help or --live.');
  process.exit(2);
}

// Defer all network-capable imports until --live is explicitly supplied.
const { validateOwnershipEnvironment, requireVerifiedDifferentUsers } = await import('../src/hosted/ownershipContract.js');
let config;
try { config = validateOwnershipEnvironment(process.env); }
catch (error) {
  console.error(`Test configuration rejected: ${error.message}`);
  process.exit(2);
}

const { createClient } = await import('@supabase/supabase-js');
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const accounts = [0, 1].map(() => createClient(config.url, config.publishableKey, options));
const anonymous = createClient(config.url, config.publishableKey, options);
const marker = `SF-V614-DELETE-${randomUUID().slice(0, 12)}`;
let passed = 0;
let createdId = null;

function check(condition, label) {
  if (!condition) throw new Error(`Check ${passed + 1} FAILED: ${label}`);
  passed++;
  console.log(`PASS ${passed}: ${label}`);
}
function dataOrThrow(result, label) {
  if (result?.error) throw new Error(`${label} failed (${result.error.code || 'provider error'})`);
  return result.data;
}
function expectStatus(result, status, label) {
  const response = dataOrThrow(result, label);
  check(response && !Array.isArray(response) && response.status === status, `${label} returns ${status}`);
  return response;
}
function metadata(name, note) {
  // Full replacement: exactly the 10 allowed V6.1.4 metadata columns.
  return {
    project_name: name,
    client_name: null,
    track_type: null,
    ai_tool: null,
    current_stage: null,
    main_concern: null,
    client_goal: null,
    producer_notes: note,
    review_mode: 'draft',
    selected_preset: '',
  };
}
function activeRow(row, id, owner, revision, note) {
  return row?.id === id && row?.owner_id === owner &&
    row.project_name === marker && row.revision === revision &&
    row.deleted_at === null && row.producer_notes === note;
}

console.log('LIVE TEST: Only a newly created synthetic row will be soft-deleted.');
console.log(`Test record marker: ${marker}`);
try {
  const users = [];
  for (let i = 0; i < accounts.length; i++) {
    const signed = await accounts[i].auth.signInWithPassword(config.users[i]);
    if (signed.error || !signed.data?.session) throw new Error(`Account ${i ? 'B' : 'A'} sign-in failed`);
    const verified = await accounts[i].auth.getUser();
    if (verified.error || !verified.data?.user?.id) throw new Error(`Account ${i ? 'B' : 'A'} could not be verified`);
    users.push(verified.data.user);
  }
  requireVerifiedDifferentUsers(...users);
  check(true, 'two distinct verified test accounts');

  // Calling with invalid values must not mutate ANY data, even if a permission regression exists.
  const anon = await anonymous.rpc('sf_delete_project_if_revision', {
    p_project_id: null, p_expected_revision: 0,
  });
  check(anon.error?.code === '42501', 'anonymous Delete RPC denied');

  const initialNote = 'DISPOSABLE V6.1.4 SOFT DELETE TEST ONLY';
  const inserted = await accounts[0].from('soulframe_projects')
    .insert({ project_name: marker, producer_notes: initialNote })
    .select('id,owner_id,revision,project_name,producer_notes,deleted_at').single();
  const row = dataOrThrow(inserted, 'Create synthetic project');
  if (!row?.id || !activeRow(row, row.id, users[0].id, 1, initialNote)) {
    throw new Error('Synthetic project ownership/revision did not match expected values');
  }
  createdId = row.id;
  check(true, 'account A created one new, owner-scoped revision-1 project');

  // Cross-account calls must never hide a successful deletion behind an error.
  expectStatus(await accounts[1].rpc('sf_delete_project_if_revision', {
    p_project_id: createdId, p_expected_revision: 1,
  }), 'not_found', 'account B cross-owner delete');
  const afterOther = dataOrThrow(await accounts[0].from('soulframe_projects')
    .select('id,owner_id,revision,project_name,producer_notes,deleted_at')
    .eq('id', createdId).single(), 'Owner read after account B attempt');
  check(activeRow(afterOther, createdId, users[0].id, 1, initialNote),
    'account B attempt did not alter owner project');

  // Advance revision to exercise the stale-delete conflict condition.
  const changedNote = 'DISPOSABLE V6.1.4 PROJECT UPDATED BEFORE SOFT DELETE';
  const changed = expectStatus(await accounts[0].rpc('sf_update_project_if_revision', {
    p_project_id: createdId,
    p_expected_revision: 1,
    p_changes: metadata(marker, changedNote),
  }), 'ok', 'owner pre-deletion update');
  check(activeRow({ ...changed.project, deleted_at: null }, createdId, users[0].id, 2, changedNote),
    'pre-deletion update advanced project to revision 2');

  expectStatus(await accounts[0].rpc('sf_delete_project_if_revision', {
    p_project_id: createdId, p_expected_revision: 1,
  }), 'conflict', 'stale revision-1 deletion');
  const afterStale = dataOrThrow(await accounts[0].from('soulframe_projects')
    .select('id,owner_id,revision,project_name,producer_notes,deleted_at')
    .eq('id', createdId).single(), 'Owner read after stale delete');
  check(activeRow(afterStale, createdId, users[0].id, 2, changedNote),
    'stale deletion leaves revision-2 project active and unchanged');

  const deniedDelete = await accounts[0].from('soulframe_projects').delete().eq('id', createdId);
  check(deniedDelete.error?.code === '42501', 'direct table DELETE remains denied');
  const deniedUpdate = await accounts[0].from('soulframe_projects')
    .update({ project_name: `${marker}-BYPASS` }).eq('id', createdId);
  check(deniedUpdate.error?.code === '42501', 'direct table UPDATE remains denied');

  const deleted = expectStatus(await accounts[0].rpc('sf_delete_project_if_revision', {
    p_project_id: createdId, p_expected_revision: 2,
  }), 'ok', 'owner soft deletion with current revision');
  check(deleted.id === createdId && deleted.revision === 3 &&
    !Object.hasOwn(deleted, 'owner_id') && !Object.hasOwn(deleted, 'project'),
    'soft-delete response confirms revision 3 without leaking project metadata');

  const ownVisible = await accounts[0].from('soulframe_projects').select('id').eq('id', createdId);
  check(!ownVisible.error && Array.isArray(ownVisible.data) && ownVisible.data.length === 0,
    'tombstone is hidden from owner normal SELECT');
  const otherVisible = await accounts[1].from('soulframe_projects').select('id').eq('id', createdId);
  check(!otherVisible.error && Array.isArray(otherVisible.data) && otherVisible.data.length === 0,
    'tombstone is hidden from account B normal SELECT');

  expectStatus(await accounts[0].rpc('sf_delete_project_if_revision', {
    p_project_id: createdId, p_expected_revision: 3,
  }), 'not_found', 'second delete on tombstone');
  expectStatus(await accounts[0].rpc('sf_update_project_if_revision', {
    p_project_id: createdId, p_expected_revision: 3,
    p_changes: metadata(`${marker}-RESURRECT`, 'Should never take effect'),
  }), 'not_found', 'update on tombstone');

  const ownList = await accounts[0].from('soulframe_projects').select('id').eq('project_name', marker);
  check(!ownList.error && Array.isArray(ownList.data) && ownList.data.length === 0,
    'soft-deleted project stays absent from ordinary owner list');

  console.log(`RESULT: PASS (${passed} live assertions).`);
  console.log(`The synthetic ${marker} row was soft-deleted; existing projects were not modified.`);
  console.log('The database retains the tombstone for a separate READ-ONLY SQL inspection.');
  console.log('No Cloud Delete UI is enabled and no user-facing restore capability has been added.');
} catch (error) {
  // Print only fixed/limited harness diagnostic strings, never credentials or raw responses.
  console.error(`RESULT: FAIL after ${passed} checks. ${error.message}`);
  process.exitCode = 1;
} finally {
  await Promise.allSettled(accounts.map(client => client.auth.signOut({ scope: 'local' })));
  if (createdId) console.log(`Synthetic test marker for later SQL verification: ${marker}`);
  else console.log('No test row was confirmed created.');
}
