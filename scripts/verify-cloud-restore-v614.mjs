#!/usr/bin/env node
// SoulFrame V6.1.4 Step 3.17: one-time, explicit, synthetic-tombstone restore test.
// Writes ONLY the EXACT known Step 2.9 test tombstone, after strict preflight checks.
// Uses TWO ordinary test users plus sb_publishable key. No secret/service-role keys.
import { validateOwnershipEnvironment, requireVerifiedDifferentUsers, assertPermissionDenied } from '../src/hosted/ownershipContract.js';
import { parseDeletedList, requireOwnedTestTombstone, requireHiddenFromOtherAccount,
  TEST_TOMBSTONE_NAME, TEST_TOMBSTONE_REVISION } from './lib/restoreListAssertions.mjs';
import { checkRestoreResponse, requireOwnerActiveProject, requireNoVisibleProject,
  requireTombstoneAbsent } from './lib/restoreLiveAssertions.mjs';

const args = process.argv.slice(2);
if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
  console.log(`SoulFrame V6.1.4 Step 3.17 LIVE owner-only restore test.

This test WILL RESTORE exactly one known, previously soft-deleted synthetic record:
  ${TEST_TOMBSTONE_NAME} (revision ${TEST_TOMBSTONE_REVISION} -> ${TEST_TOMBSTONE_REVISION+1}).
It does not hard-delete, insert, or mutate unrelated cloud projects.
Run ONCE against the already verified disposable Supabase test database.

Usage: node --env-file=.env.rls.local scripts/verify-cloud-restore-v614.mjs --live --restore-known-tombstone
No network requests or database writes occur without BOTH flags.
Do not rerun after a successful restoration.`);
  process.exit(0);
}
if (args.length !== 2 || args[0] !== '--live' || args[1] !== '--restore-known-tombstone') {
  console.error('Requires EXACTLY --live --restore-known-tombstone. See --help.');
  process.exit(2);
}
let config;
try { config = validateOwnershipEnvironment(process.env); }
catch (error) { console.error(`Configuration rejected: ${error.message}`); process.exit(2); }
const { createClient } = await import('@supabase/supabase-js');
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const anonymous = createClient(config.url, config.publishableKey, options);
const clients = [createClient(config.url, config.publishableKey, options), createClient(config.url, config.publishableKey, options)];
let passed = 0;
const pass = desc => console.log(`PASS ${++passed}: ${desc}`);
let attemptedRestore = false;
console.log('LIVE ONE-TIME TEST: only the exact previously verified synthetic tombstone is eligible for restoration.');
try {
  const users = [];
  for (let i = 0; i < 2; i++) {
    const login = await clients[i].auth.signInWithPassword(config.users[i]);
    if (login.error || !login.data?.session?.access_token) throw new Error(`Account ${i ? 'B' : 'A'} test sign-in failed`);
    const who = await clients[i].auth.getUser();
    if (who.error || !who.data?.user?.id) throw new Error(`Account ${i ? 'B' : 'A'} could not be verified`);
    users.push(who.data.user);
  }
  requireVerifiedDifferentUsers(...users);
  pass('two distinct verified test identities');

  const a = parseDeletedList(await clients[0].rpc('sf_list_deleted_projects'), 'Account A list');
  const target = requireOwnedTestTombstone(a);
  pass('Account A owns the exact known revision-3 synthetic tombstone');
  const b = parseDeletedList(await clients[1].rpc('sf_list_deleted_projects'), 'Account B list');
  requireHiddenFromOtherAccount(b, target.id);
  pass('Account B cannot discover Account A tombstone');

  const noAccess = await anonymous.rpc('sf_restore_project_if_revision', {
    p_project_id: null, p_expected_revision: 0,
  });
  assertPermissionDenied(noAccess, 'Anonymous Restore RPC');
  pass('anonymous Restore RPC is denied (42501)');

  checkRestoreResponse(await clients[1].rpc('sf_restore_project_if_revision', {
    p_project_id: target.id, p_expected_revision: TEST_TOMBSTONE_REVISION,
  }), 'not_found');
  pass('Account B cross-owner restore is denied without project disclosure');

  checkRestoreResponse(await clients[0].rpc('sf_restore_project_if_revision', {
    p_project_id: target.id, p_expected_revision: TEST_TOMBSTONE_REVISION - 1,
  }), 'conflict');
  pass('stale owner restore is rejected without changing tombstone');

  requireNoVisibleProject(await clients[0].from('soulframe_projects')
    .select('id,owner_id,project_name,revision').eq('id', target.id), 'Pre-restore owner SELECT');
  pass('tombstone remains invisible to normal SELECT before restoration');

  // Final fail-closed read just before the ONLY successful mutation.
  requireOwnedTestTombstone(parseDeletedList(
    await clients[0].rpc('sf_list_deleted_projects'), 'Final Account A preflight'));
  pass('final preflight still shows one exact revision-3 tombstone');

  attemptedRestore = true;
  checkRestoreResponse(await clients[0].rpc('sf_restore_project_if_revision', {
    p_project_id: target.id, p_expected_revision: TEST_TOMBSTONE_REVISION,
  }), 'ok', target.id, TEST_TOMBSTONE_REVISION + 1);
  pass('owner restores project atomically to revision 4 with same ID');

  checkRestoreResponse(await clients[0].rpc('sf_restore_project_if_revision', {
    p_project_id: target.id, p_expected_revision: TEST_TOMBSTONE_REVISION,
  }), 'not_found');
  pass('repeated stale restore cannot restore already-active record');

  const after = parseDeletedList(await clients[0].rpc('sf_list_deleted_projects'), 'Owner post-restore list');
  requireTombstoneAbsent(after, target.id);
  pass('restored project disappears from deleted-project list');

  requireOwnerActiveProject(await clients[0].from('soulframe_projects')
    .select('id,owner_id,project_name,revision').eq('id',target.id), target.id, users[0].id,
    TEST_TOMBSTONE_NAME, TEST_TOMBSTONE_REVISION+1);
  pass('same project is visible to its owner at revision 4');

  requireNoVisibleProject(await clients[1].from('soulframe_projects')
    .select('id,owner_id,project_name,revision').eq('id',target.id), 'Other-account SELECT');
  pass('cross-account project visibility stays blocked after restore');

  const bAfter = parseDeletedList(await clients[1].rpc('sf_list_deleted_projects'), 'Other-account deleted list');
  requireHiddenFromOtherAccount(bAfter, target.id);
  pass('cross-account deleted listing remains isolated');

  console.log(`RESULT: PASS (${passed} live assertions).`);
  console.log(`Restored ONLY ${TEST_TOMBSTONE_NAME} to revision ${TEST_TOMBSTONE_REVISION+1}. No other project was modified.`);
  console.log('Cloud Restore and Delete UI remain disabled. No hard deletion performed.');
} catch (error) {
  console.error(`RESULT: FAIL after ${passed} assertions: ${error.message}`);
  if (attemptedRestore) console.error('Restore may have succeeded before a subsequent assertion failed. DO NOT RERUN; inspect the project read-only.');
  else console.error('Preflight failed. No successful restore request was attempted. Stop and investigate.');
  process.exitCode = 1;
} finally {
  await Promise.allSettled(clients.map(x => x.auth.signOut({ scope: 'local' })));
}
