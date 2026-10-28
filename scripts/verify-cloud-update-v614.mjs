#!/usr/bin/env node
// SoulFrame V6.1.4 - explicitly opted-in, disposable-database UPDATE / conflict tests.
// Only synthetic rows are created; NO delete/soft-delete calls. Do not run in production.
import { randomUUID } from 'node:crypto';

function usage() {
  console.log(`SoulFrame V6.1.4: live cloud UPDATE and conflict checks
Usage: node --env-file=.env.rls.local scripts/verify-cloud-update-v614.mjs --live

--help is offline. --live creates ONE clearly named synthetic project and updates
only that newly created row. The row is left in the disposable test database.
Requires two pre-existing test users and a public publishable key in .env.rls.local.
NEVER run against a production or non-disposable Supabase database.
Cloud DELETE is not tested or enabled by this script.`);
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

// Load repository dependencies only for an explicitly requested live run.
const { validateOwnershipEnvironment, requireVerifiedDifferentUsers } = await import('../src/hosted/ownershipContract.js');

let config;
try { config = validateOwnershipEnvironment(process.env); }
catch (error) {
  console.error(`Test configuration rejected: ${error.message}`);
  process.exit(2);
}

const { createClient } = await import('@supabase/supabase-js');
const configOptions = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const accounts = [0, 1].map(() => createClient(config.url, config.publishableKey, configOptions));
const marker = `SF-V614-UPDATE-${randomUUID().slice(0, 12)}`;
let passed = 0;
let created = false;

function check(condition, description) {
  if (!condition) throw new Error(`Check ${passed + 1} FAILED: ${description}`);
  passed++;
  console.log(`PASS ${passed}: ${description}`);
}
function requireResult(result, label) {
  if (result?.error) throw new Error(`${label} returned provider error (${result.error.code || 'unknown code'})`);
  return result.data;
}
function rpcFields(projectName) {
  // Exactly ten allowlisted columns. Null replaces omitted optional session values.
  return {
    project_name: projectName,
    client_name: null,
    track_type: null,
    ai_tool: null,
    current_stage: null,
    main_concern: null,
    client_goal: null,
    producer_notes: 'DISPOSABLE V6.1.4 UPDATE TEST; no real client information',
    review_mode: 'draft',
    selected_preset: '',
  };
}
function expectedRpc(result, status, label) {
  const data = requireResult(result, label);
  check(data && typeof data === 'object' && !Array.isArray(data) && data.status === status,
    `${label} returns ${status}`);
  return data;
}
function ownRecord(row, owner, name, revision) {
  return row && typeof row.id === 'string' && row.owner_id === owner &&
    row.project_name === name && row.revision === revision;
}

console.log('LIVE TEST: disposable Supabase database only; no existing projects are modified.');
console.log(`Test record marker: ${marker}`);
try {
  const users = [];
  for (let i = 0; i < 2; i++) {
    const login = await accounts[i].auth.signInWithPassword(config.users[i]);
    if (login.error || !login.data?.session) throw new Error(`Account ${i ? 'B' : 'A'} sign-in failed`);
    const result = await accounts[i].auth.getUser();
    if (result.error || !result.data?.user?.id) throw new Error(`Account ${i ? 'B' : 'A'} could not be verified`);
    users.push(result.data.user);
  }
  requireVerifiedDifferentUsers(...users);
  check(true, 'two distinct verified user accounts');

  const creation = await accounts[0].from('soulframe_projects')
    .insert({ project_name: marker, producer_notes: 'DISPOSABLE V6.1.4 UPDATE TEST' })
    .select('id,owner_id,revision,project_name').single();
  const row = requireResult(creation, 'Create synthetic row');
  if (!ownRecord(row, users[0].id, marker, 1)) throw new Error('Synthetic row was not created for account A with revision 1');
  created = true;
  check(true, 'account A created the single synthetic revision-1 project');

  const nameV2 = `${marker}-EDIT-1`;
  const updated = expectedRpc(await accounts[0].rpc('sf_update_project_if_revision', {
    p_project_id: row.id, p_expected_revision: 1, p_changes: rpcFields(nameV2),
  }), 'ok', 'owner update');
  check(ownRecord(updated.project, users[0].id, nameV2, 2), 'valid update increments revision to 2');

  expectedRpc(await accounts[0].rpc('sf_update_project_if_revision', {
    p_project_id: row.id, p_expected_revision: 1, p_changes: rpcFields(`${marker}-STALE`),
  }), 'conflict', 'stale revision-1 update');

  expectedRpc(await accounts[1].rpc('sf_update_project_if_revision', {
    p_project_id: row.id, p_expected_revision: 2, p_changes: rpcFields(`${marker}-CROSS-OWNER`),
  }), 'not_found', 'account B cross-owner update');

  const hidden = await accounts[1].from('soulframe_projects').select('id').eq('id', row.id);
  check(!hidden.error && Array.isArray(hidden.data) && hidden.data.length === 0,
    'account B cannot read account A synthetic project');

  const nameRaceA = `${marker}-RACE-A`;
  const nameRaceB = `${marker}-RACE-B`;
  const [raceA, raceB] = await Promise.all([
    accounts[0].rpc('sf_update_project_if_revision', {
      p_project_id: row.id, p_expected_revision: 2, p_changes: rpcFields(nameRaceA),
    }),
    accounts[0].rpc('sf_update_project_if_revision', {
      p_project_id: row.id, p_expected_revision: 2, p_changes: rpcFields(nameRaceB),
    }),
  ]);
  const responses = [requireResult(raceA, 'Concurrent update A'), requireResult(raceB, 'Concurrent update B')];
  const statuses = responses.map(result => result?.status).sort();
  check(statuses.length === 2 && statuses[0] === 'conflict' && statuses[1] === 'ok',
    'exactly one concurrent revision-2 update succeeds');

  const latest = await accounts[0].from('soulframe_projects')
    .select('id,owner_id,revision,project_name,deleted_at').eq('id', row.id).single();
  const stored = requireResult(latest, 'Verify final project');
  check(ownRecord(stored, users[0].id, stored.project_name, 3) &&
    [nameRaceA, nameRaceB].includes(stored.project_name) && stored.deleted_at === null,
    'final project is active at revision 3 with one winning update');

  const directUpdate = await accounts[0].from('soulframe_projects')
    .update({ project_name: `${marker}-BYPASS` }).eq('id', row.id);
  check(directUpdate.error?.code === '42501', 'direct table UPDATE is denied');

  const directDelete = await accounts[0].from('soulframe_projects').delete().eq('id', row.id);
  check(directDelete.error?.code === '42501', 'direct table DELETE is denied');

  const postDenials = await accounts[0].from('soulframe_projects')
    .select('id,owner_id,revision,project_name,deleted_at').eq('id', row.id).single();
  const after = requireResult(postDenials, 'Verify unchanged after direct writes');
  check(after.project_name === stored.project_name && after.revision === 3 && after.deleted_at === null,
    'blocked direct writes leave revision-3 project unchanged');

  console.log(`RESULT: PASS (${passed} live assertions). Only disposable project ${marker} was updated.`);
  console.log('No soft delete was performed; V6.1.4 cloud editing/deletion UI remains disabled.');
} catch (err) {
  // No secret key, password, token or URL appears in errors.
  console.error(`RESULT: FAIL after ${passed} checks. ${err.message}`);
  process.exitCode = 1;
} finally {
  await Promise.allSettled(accounts.map(c => c.auth.signOut({ scope: 'local' })));
  if (created) console.log(`Test record ${marker} remains in the disposable database for later cleanup.`);
  else console.log('No synthetic test record was confirmed created.');
}
