import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CLOUD_RECOVERY_RPC, listDeletedCloudProjects, restoreCloudProject } from '../src/hosted/cloudRecovery.js';

const ID = 'c9a5cd43-5157-45ee-93ba-b02f8914655f';
const OTHER_ID = 'e850c0a7-a567-479e-9c9d-458978bde53f';
const ROW = Object.freeze({ id: ID, project_name: 'SF-V614-SYNTHETIC', revision: 3, deleted_at: '2026-10-26T10:00:00Z' });
const LIST = { status: 'ok', projects: [ROW] };
function makeClient(reply = { data: LIST, error: null }) {
  const calls = [];
  let ownerId = 'owner-A';
  const client = {
    calls,
    setOwner(value) { ownerId = value; },
    auth: {
      async getUser() { calls.push(['identity']); return { data: { user: ownerId ? { id: ownerId } : null }, error: null }; },
      signInWithOtp() {}, verifyOtp() {}, signOut() {},
    },
    async rpc(name, args) {
      calls.push(['rpc', name, args]);
      if (typeof reply === 'function') return reply(name, args, client);
      return reply;
    },
  };
  return client;
}

test('declares only the two intended public RPC names', () => {
  assert.deepEqual(CLOUD_RECOVERY_RPC, { list: 'sf_list_deleted_projects', restore: 'sf_restore_project_if_revision' });
});
test('explicit listing uses verified identity and accepts minimal tombstone data', async () => {
  const client = makeClient();
  assert.deepEqual(await listDeletedCloudProjects(client), [ROW]);
  assert.deepEqual(client.calls, [['identity'], ['rpc', CLOUD_RECOVERY_RPC.list, undefined], ['identity']]);
});
test('empty deleted-project list is a valid result', async () => {
  assert.deepEqual(await listDeletedCloudProjects(makeClient({ data: { status: 'ok', projects: [] }, error: null })), []);
});
test('list rejects unexpected fields, including notes and owner IDs', async () => {
  for (const bad of [{ ...ROW, producer_notes: 'private' }, { ...ROW, owner_id: 'owner-A' }, { ...ROW, deleted_at: null }]) {
    await assert.rejects(listDeletedCloudProjects(makeClient({ data: { status: 'ok', projects: [bad] } })), /Invalid deleted-project metadata/);
  }
});
test('list rejects malformed wrappers, excess rows and duplicate IDs', async () => {
  for (const payload of [
    { status: 'ok', projects: [ROW], token: 'secret' },
    { status: 'unauthorized', projects: [] },
    { status: 'ok', projects: Array(25).fill(ROW) },
    { status: 'ok', projects: [ROW, ROW] },
    { status: 'ok', projects: null },
  ]) await assert.rejects(listDeletedCloudProjects(makeClient({ data: payload })), /Invalid deleted-project/);
});
test('missing identity blocks listing before the RPC call', async () => {
  const client = makeClient(); client.setOwner(null);
  await assert.rejects(listDeletedCloudProjects(client), /No verified hosted identity/);
  assert.equal(client.calls.some(x => x[0] === 'rpc'), false);
});
test('account switching during listing does not return another session results', async () => {
  const client = makeClient(async (_, __, sdk) => { sdk.setOwner('owner-B'); return { data: LIST }; });
  await assert.rejects(listDeletedCloudProjects(client), /account changed/);
});
test('valid restore sends exact RPC args and checks result revision', async () => {
  const client = makeClient({ data: { status: 'ok', id: ID, revision: 4 } });
  assert.deepEqual(await restoreCloudProject(client, ID, 3), { status: 'ok', id: ID, revision: 4 });
  assert.deepEqual(client.calls, [['identity'], ['rpc', CLOUD_RECOVERY_RPC.restore, { p_project_id: ID, p_expected_revision: 3 }], ['identity']]);
});
test('conflict and not_found remain explicit without retries', async () => {
  for (const status of ['conflict', 'not_found']) {
    const client = makeClient({ data: { status } });
    assert.deepEqual(await restoreCloudProject(client, ID, 3), { status });
    assert.equal(client.calls.filter(x => x[0] === 'rpc').length, 1);
  }
});
test('restore refuses mismatched project IDs, revisions, and extra fields', async () => {
  for (const payload of [
    { status: 'ok', id: OTHER_ID, revision: 4 },
    { status: 'ok', id: ID, revision: 5 },
    { status: 'ok', id: ID, revision: 4, producer_notes: 'secret' },
    { status: 'conflict', project_name: 'private' },
    { status: 'not_found', id: ID },
    { status: 'unknown' },
  ]) await assert.rejects(restoreCloudProject(makeClient({ data: payload }), ID, 3), /response|fields/);
});
test('invalid target or overflowing revision never reaches the RPC', async () => {
  const client = makeClient();
  await assert.rejects(restoreCloudProject(client, 'invalid', 3), /Invalid cloud project/);
  await assert.rejects(restoreCloudProject(client, ID, 2147483647), /revision/);
  await assert.rejects(restoreCloudProject(client, ID, 0), /revision/);
  assert.equal(client.calls.length, 0);
});
test('account changing during successful restore is not acknowledged as success', async () => {
  const client = makeClient(async (_, __, sdk) => { sdk.setOwner('owner-B'); return { data: { status: 'ok', id: ID, revision: 4 } }; });
  await assert.rejects(restoreCloudProject(client, ID, 3), /account changed/);
});
test('provider errors are sanitized rather than shown verbatim', async () => {
  const client = makeClient({ data: null, error: { message: 'PRIVATE SQL credentials!', code: '42501' } });
  await assert.rejects(restoreCloudProject(client, ID, 3), /Cloud restore failed/);
  await assert.rejects(listDeletedCloudProjects(client), /Cloud deleted-project listing failed/);
});
test('source contains no direct table writes, UI, local storage or file operations', () => {
  const source = readFileSync(new URL('../src/hosted/cloudRecovery.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\.from\(|\.update\(|\.delete\(|\.insert\(|localStorage|sessionStorage|AudioContext|FileReader|\.storage\./);
  assert.doesNotMatch(source, /window\.confirm|document\.|fetch\(/);
});
