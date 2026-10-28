#!/usr/bin/env node
// SoulFrame V6.1.4 - one-off mixed UPDATE vs soft DELETE race test.
// Only ONE newly inserted synthetic project is ever targeted. No hard deletion.
import { randomUUID } from 'node:crypto';
import { assertMutationRaceOutcome } from './cloudMutationRaceAssertions.mjs';

const help = `SoulFrame V6.1.4: mixed mutation race test
Usage: node --env-file=.env.rls.local scripts/verify-cloud-race-v614.mjs --live
--help (or no args) is OFFLINE. --live uses two ordinary test accounts
and a public publishable key, and creates exactly ONE new synthetic SF-V614-RACE-* row.
It races UPDATE against SOFT DELETE at revision 1, never touches existing projects,
and leaves the test row/tombstone for administrator inspection. DO NOT run on production.
No cloud edit/delete UI or restoration function is enabled by this script.`;

const args = process.argv.slice(2);
if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
  console.log(help);
  process.exit(0);
}
if (args.length !== 1 || args[0] !== '--live') {
  console.error('Invalid argument. Supply --help or --live.');
  process.exit(2);
}

const { validateOwnershipEnvironment, requireVerifiedDifferentUsers } = await import('../src/hosted/ownershipContract.js');
let config;
try { config = validateOwnershipEnvironment(process.env); }
catch (error) { console.error(`Test configuration rejected: ${error.message}`); process.exit(2); }

const { createClient } = await import('@supabase/supabase-js');
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const clients = [createClient(config.url, config.publishableKey, options), createClient(config.url, config.publishableKey, options)];
const marker = `SF-V614-RACE-${randomUUID().slice(0, 12)}`;
const updatedName = `${marker}-UPDATED`;
let createdId = null;
let passed = 0;
function check(condition, description) {
  if (!condition) throw new Error(`Check ${passed + 1} failed: ${description}`);
  passed++;
  console.log(`PASS ${passed}: ${description}`);
}
function resultData(result, description) {
  if (result?.error) throw new Error(`${description} failed (${result.error.code || 'provider error'})`);
  return result?.data;
}
function mutationFields(name) {
  // Exactly ten allowed fields, with null for optional metadata.
  return {
    project_name: name,
    client_name: null,
    track_type: null,
    ai_tool: null,
    current_stage: null,
    main_concern: null,
    client_goal: null,
    producer_notes: 'DISPOSABLE UPDATE/DELETE RACE CHECK ONLY',
    review_mode: 'draft',
    selected_preset: '',
  };
}

console.log('LIVE TEST: one newly created synthetic row only. NO existing projects are touched.');
console.log(`Test record marker: ${marker}`);
try {
  const verified = [];
  for (let i = 0; i < 2; i++) {
    const signIn = await clients[i].auth.signInWithPassword(config.users[i]);
    if (signIn.error || !signIn.data?.session) throw new Error(`Test account ${i ? 'B' : 'A'} sign-in failed`);
    const identity = await clients[i].auth.getUser();
    if (identity.error || !identity.data?.user?.id) throw new Error(`Test account ${i ? 'B' : 'A'} could not be verified`);
    verified.push(identity.data.user);
  }
  requireVerifiedDifferentUsers(...verified);
  check(true, 'two distinct authenticated test accounts');

  const creation = await clients[0].from('soulframe_projects')
    .insert({ project_name: marker, producer_notes: 'DISPOSABLE UPDATE/DELETE RACE CHECK ONLY' })
    .select('id,owner_id,project_name,revision,deleted_at').single();
  const row = resultData(creation, 'Create synthetic project');
  if (typeof row?.id !== 'string' || row.owner_id !== verified[0].id || row.project_name !== marker || row.revision !== 1 || row.deleted_at !== null) {
    throw new Error('Synthetic row ownership or initial revision mismatch');
  }
  createdId = row.id;
  check(true, 'account A created its own revision-1 synthetic project');

  const denied = resultData(await clients[1].rpc('sf_delete_project_if_revision', {
    p_project_id: createdId, p_expected_revision: 1,
  }), 'Cross-owner deletion check');
  check(denied?.status === 'not_found', 'account B cannot delete account A project');

  // Both RPC calls use the SAME expected revision, while the DB applies CAS atomically.
  const [update, deletion] = await Promise.all([
    clients[0].rpc('sf_update_project_if_revision', {
      p_project_id: createdId, p_expected_revision: 1, p_changes: mutationFields(updatedName),
    }),
    clients[0].rpc('sf_delete_project_if_revision', {
      p_project_id: createdId, p_expected_revision: 1,
    }),
  ]);
  const winner = assertMutationRaceOutcome(update, deletion);
  check(true, 'exactly one concurrent mutation succeeds; loser safely rejects stale state');

  const afterRead = await clients[0].from('soulframe_projects')
    .select('id,owner_id,project_name,revision,deleted_at').eq('id', createdId);
  const visible = resultData(afterRead, 'Owner post-race read');
  if (!Array.isArray(visible)) throw new Error('Owner post-race read was not a list');

  if (winner === 'update') {
    check(update.data.project?.id === createdId && update.data.project?.revision === 2 &&
      update.data.project?.project_name === updatedName && deletion.data.status === 'conflict',
      'update won at revision 2; delete was rejected as stale');
    check(visible.length === 1 && visible[0].id === createdId && visible[0].owner_id === verified[0].id &&
      visible[0].revision === 2 && visible[0].project_name === updatedName && visible[0].deleted_at === null,
      'winning update persisted and project remains active');
    const repeatDelete = resultData(await clients[0].rpc('sf_delete_project_if_revision', {
      p_project_id: createdId, p_expected_revision: 1,
    }), 'Repeat stale deletion');
    check(repeatDelete?.status === 'conflict', 'stale deletion cannot erase successful update');
  } else {
    check(deletion.data.id === createdId && deletion.data.revision === 2 &&
      update.data.status === 'not_found' && !Object.hasOwn(deletion.data, 'project'),
      'soft delete won at revision 2; update cannot resurrect tombstone');
    check(visible.length === 0, 'soft-deleted row is hidden from owner normal SELECT');
    const repeatUpdate = resultData(await clients[0].rpc('sf_update_project_if_revision', {
      p_project_id: createdId, p_expected_revision: 1, p_changes: mutationFields(`${marker}-RESURRECT`),
    }), 'Repeat update on tombstone');
    check(repeatUpdate?.status === 'not_found', 'no stale update can resurrect tombstone');
  }

  const otherRead = await clients[1].from('soulframe_projects')
    .select('id').eq('id', createdId);
  const other = resultData(otherRead, 'Account B post-race read');
  check(Array.isArray(other) && other.length === 0, 'account B cannot see project after race');

  console.log(`RESULT: PASS (${passed} live assertions). Winning operation: ${winner}.`);
  console.log(`Only synthetic row ${marker} was changed. It remains ${winner === 'update' ? 'active' : 'soft-deleted'} for later cleanup.`);
  console.log('No hard DELETE, restore capability, cloud editing UI or cloud deletion UI was enabled.');
} catch (error) {
  // Do not print credentials, keys, session tokens, raw provider responses or personal data.
  console.error(`RESULT: FAIL after ${passed} assertions. ${error.message}`);
  process.exitCode = 1;
} finally {
  await Promise.allSettled(clients.map(client => client.auth.signOut({ scope: 'local' })));
  console.log(createdId ? `Synthetic test marker: ${marker}` : 'No synthetic row was confirmed created.');
}
