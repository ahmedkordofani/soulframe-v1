import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { updateCloudProject, softDeleteCloudProject } from '../src/hosted/cloudMutations.js';

const ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const OWNER = 'user-a';
const DETAILS = { projectSession: { projectName: 'Safe Edit', producerNotes: 'Synthetic only' }, reviewMode: 'draft', selectedPreset: '' };
const row = { id: ID, owner_id: OWNER, revision: 2, project_name: 'Safe Edit', review_mode: 'draft', selected_preset: '', producer_notes: 'Synthetic only', created_at: '2026-10-26T09:00:00Z', updated_at: '2026-10-26T10:00:00Z' };

function fakeClient(data = { status: 'ok', project: row }, opts = {}) {
  const calls = [];
  let authN = 0;
  const client = {
    calls,
    auth: { async signInWithOtp() {}, async verifyOtp() {}, async signOut() {}, async getUser() {
      calls.push(['getUser']);
      const owner = opts.identitySequence?.[Math.min(authN++, opts.identitySequence.length - 1)] ?? (opts.identity === undefined ? OWNER : opts.identity);
      return { data: { user: owner ? { id: owner, email: 'test@example.invalid' } : null }, error: null };
    } },
    async rpc(name, args) {
      calls.push(['rpc', name, args]);
      return opts.error ? { data: null, error: opts.error } : { data, error: null };
    },
  };
  return client;
}

const rpcCalls = client => client.calls.filter(entry => entry[0] === 'rpc');

test('authenticated full update uses only the approved atomic RPC and returns metadata', async () => {
  const client = fakeClient();
  const result = await updateCloudProject(client, ID, 1, DETAILS);
  assert.equal(result.status, 'ok');
  assert.equal(result.project.revision, 2);
  assert.equal(result.project.projectSession.projectName, 'Safe Edit');
  assert.deepEqual(client.calls.map(x => x[0]), ['getUser', 'rpc', 'getUser']);
  assert.equal(rpcCalls(client)[0][1], 'sf_update_project_if_revision');
  assert.equal(rpcCalls(client)[0][2].p_expected_revision, 1);
});

test('update normalises optional columns to null but never includes audio', async () => {
  const client = fakeClient();
  await updateCloudProject(client, ID, 1, { projectSession: { projectName: 'Safe Edit' } });
  const payload = rpcCalls(client)[0][2].p_changes;
  assert.equal(Object.keys(payload).length, 10);
  assert.equal(payload.client_name, null);
  assert.equal(payload.producer_notes, null);
  assert.equal(payload.audio, undefined);
  assert.equal(payload.owner_id, undefined);
});

test('unsigned-in users cannot call either mutation RPC', async () => {
  const client = fakeClient(undefined, { identity: null });
  await assert.rejects(updateCloudProject(client, ID, 1, DETAILS), /No verified hosted identity/);
  await assert.rejects(softDeleteCloudProject(client, ID, 1), /No verified hosted identity/);
  assert.equal(rpcCalls(client).length, 0);
});

test('invalid ids and revisions never reach Supabase', async () => {
  const client = fakeClient();
  await assert.rejects(updateCloudProject(client, 'wrong', 1, DETAILS), /identifier/);
  await assert.rejects(softDeleteCloudProject(client, ID, 0), /revision/);
  await assert.rejects(softDeleteCloudProject(client, ID, 2147483647), /incremented/);
  assert.equal(rpcCalls(client).length, 0);
});

test('malformed metadata never reaches Supabase', async () => {
  const client = fakeClient();
  await assert.rejects(updateCloudProject(client, ID, 1, { ...DETAILS, audioBase64: 'AAAA' }), /metadata/);
  await assert.rejects(updateCloudProject(client, ID, 1, { projectSession: { projectName: '   ' } }), /Project name/);
  assert.equal(rpcCalls(client).length, 0);
});

test('conflict and not_found remain distinct and no automatic retries are made', async () => {
  for (const status of ['conflict', 'not_found']) {
    const update = fakeClient({ status });
    assert.deepEqual(await updateCloudProject(update, ID, 1, DETAILS), { status });
    assert.equal(rpcCalls(update).length, 1);
    const deletion = fakeClient({ status });
    assert.deepEqual(await softDeleteCloudProject(deletion, ID, 1), { status });
    assert.equal(rpcCalls(deletion).length, 1);
  }
});

test('soft deletion sends only id and expected revision and checks response', async () => {
  const client = fakeClient({ status: 'ok', id: ID, revision: 3 });
  assert.deepEqual(await softDeleteCloudProject(client, ID, 2), { status: 'ok', id: ID, revision: 3 });
  assert.deepEqual(rpcCalls(client)[0].slice(1), ['sf_delete_project_if_revision', { p_project_id: ID, p_expected_revision: 2 }]);
});

test('owner mismatch in RPC update result fails closed', async () => {
  const client = fakeClient({ status: 'ok', project: { ...row, owner_id: 'user-b' } });
  await assert.rejects(updateCloudProject(client, ID, 1, DETAILS), /ownership or revision/);
});

test('unexpected update rows or revisions fail closed', async () => {
  for (const mutatedRow of [{ ...row, revision: 7 }, { ...row, audio: 'secret' }, { ...row, id: '00000000-0000-4000-8000-000000000000' }]) {
    await assert.rejects(updateCloudProject(fakeClient({ status: 'ok', project: mutatedRow }), ID, 1, DETAILS), /ownership or revision/);
  }
});

test('malformed and oversized provider results cannot be interpreted as success', async () => {
  for (const response of [null, [], { status: 'unexpected' }, { status: 'conflict', project: row }, { status: 'ok', project: row, secret: 'x' }]) {
    await assert.rejects(updateCloudProject(fakeClient(response), ID, 1, DETAILS), /response/);
  }
  await assert.rejects(softDeleteCloudProject(fakeClient({ status: 'ok', id: ID, revision: 19 }), ID, 1), /revision/);
});

test('provider errors are generic and do not expose SQL or credentials', async () => {
  const client = fakeClient(null, { error: { message: 'password secret SQL text', code: '42501' } });
  await assert.rejects(updateCloudProject(client, ID, 1, DETAILS), error => !error.message.includes('password') && /Cloud update failed/.test(error.message));
});

test('account switches during either successful mutation are detected before returning success', async () => {
  const client1 = fakeClient(undefined, { identitySequence: [OWNER, 'user-b'] });
  await assert.rejects(updateCloudProject(client1, ID, 1, DETAILS), /account changed/);
  const client2 = fakeClient({ status: 'ok', id: ID, revision: 2 }, { identitySequence: [OWNER, 'user-b'] });
  await assert.rejects(softDeleteCloudProject(client2, ID, 1), /account changed/);
});

test('adapter has no direct table writes, browser storage, or audio calls', () => {
  const adapter = readFileSync(new URL('../src/hosted/cloudMutations.js', import.meta.url), 'utf8');
  assert.doesNotMatch(adapter, /\.from\(|\.update\(|\.delete\(|\.upsert\(|localStorage|\.storage\./);
});
