import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { saveCloudProject, listCloudProjects, loadCloudProject } from '../src/hosted/cloudProjects.js';

const OWNER = 'user-a';
const OTHER = 'user-b';
const PROJECT_ID = 'b99e80ef-0996-4c0a-bd67-a0beeb38e0d9';
const sample = { projectSession: { projectName: 'Synthetic Test', clientName: 'Demo', producerNotes: 'No audio.' }, reviewMode: 'compare', selectedPreset: 'marcel' };
const row = { id: PROJECT_ID, owner_id: OWNER, project_name: 'Synthetic Test', client_name: 'Demo', producer_notes: 'No audio.', review_mode: 'compare', selected_preset: 'marcel', revision: 1, created_at: '2026-10-25T00:00:00Z', updated_at: '2026-10-25T00:00:00Z' };

function fakeClient(response = { data: row, error: null }, identity = OWNER) {
  const calls = [];
  const query = {
    insert(value) { calls.push(['insert', value]); return this; },
    select(value) { calls.push(['select', value]); return this; },
    eq(key, value) { calls.push(['eq', key, value]); return this; },
    order(key, opts) { calls.push(['order', key, opts]); return this; },
    limit(n) { calls.push(['limit', n]); return Promise.resolve(response); },
    single() { calls.push(['single']); return Promise.resolve(response); },
    maybeSingle() { calls.push(['maybeSingle']); return Promise.resolve(response); },
  };
  return {
    calls,
    auth: {
      async getUser() { calls.push(['getUser']); return { data: { user: identity ? { id: identity, email: 'test@example.com' } : null }, error: null }; },
      async signInWithOtp() {}, async verifyOtp() {}, async signOut() {},
    },
    from(name) { calls.push(['from', name]); return query; },
  };
}

test('explicit cloud save verifies Supabase identity first and inserts allowlisted metadata', async () => {
  const client = fakeClient();
  const saved = await saveCloudProject(client, sample);
  assert.deepEqual(client.calls[0], ['getUser']);
  assert.deepEqual(client.calls[1], ['from', 'soulframe_projects']);
  assert.deepEqual(client.calls[2], ['insert', { project_name: 'Synthetic Test', review_mode: 'compare', selected_preset: 'marcel', client_name: 'Demo', producer_notes: 'No audio.' }]);
  assert.equal(saved.projectSession.projectName, 'Synthetic Test');
  assert.equal(saved.revision, 1);
  assert.equal(saved.createdAt, row.created_at);
});

test('invalid content and audio cannot reach hosted provider', async () => {
  const client = fakeClient();
  await assert.rejects(saveCloudProject(client, { ...sample, audio: 'base64' }), /metadata/);
  await assert.rejects(saveCloudProject(client, { projectSession: { ...sample.projectSession, audioFile: 'raw' } }), /Unsupported/);
  assert.deepEqual(client.calls, []);
});

test('unauthenticated save, list and load cannot query the hosted table', async () => {
  const client = fakeClient(undefined, null);
  await assert.rejects(saveCloudProject(client, sample), /No verified hosted identity/);
  await assert.rejects(listCloudProjects(client), /No verified hosted identity/);
  await assert.rejects(loadCloudProject(client, PROJECT_ID), /No verified hosted identity/);
  assert.equal(client.calls.filter(call => call[0] === 'from').length, 0);
});

test('list scopes query to verified owner and returns only allowed fields', async () => {
  const client = fakeClient({ data: [row], error: null });
  const items = await listCloudProjects(client);
  assert.equal(items.length, 1);
  assert.equal(items[0].id, PROJECT_ID);
  assert.equal(items[0].projectSession.clientName, 'Demo');
  assert.deepEqual(client.calls[0], ['getUser']);
  assert.ok(client.calls.some(call => call[0] === 'eq' && call[1] === 'owner_id' && call[2] === OWNER));
  assert.ok(client.calls.some(call => call[0] === 'order' && call[1] === 'updated_at' && call[2].ascending === false));
  assert.ok(client.calls.some(call => call[0] === 'limit' && call[1] === 24));
});

test('load uses both ID and owner scope and restores metadata only', async () => {
  const client = fakeClient();
  const loaded = await loadCloudProject(client, PROJECT_ID);
  assert.deepEqual(loaded.projectSession, { projectName: 'Synthetic Test', clientName: 'Demo', producerNotes: 'No audio.' });
  assert.equal(loaded.reviewMode, 'compare');
  assert.equal(loaded.selectedPreset, 'marcel');
  assert.deepEqual(client.calls.filter(call => call[0] === 'eq'), [['eq', 'id', PROJECT_ID], ['eq', 'owner_id', OWNER]]);
});

test('cross-owner rows fail closed even if provider unexpectedly returns them', async () => {
  await assert.rejects(saveCloudProject(fakeClient({data:{ ...row, owner_id: OTHER }, error:null}),sample), /ownership/);
  await assert.rejects(listCloudProjects(fakeClient({data:[{...row,owner_id:OTHER}],error:null})), /ownership/);
  await assert.rejects(loadCloudProject(fakeClient({data:{...row,owner_id:OTHER},error:null}),PROJECT_ID), /ownership/);
});

test('missing records, bad IDs and provider errors fail without creating any update/delete path', async () => {
  const client = fakeClient();
  await assert.rejects(loadCloudProject(client, '../bad-id'), /Invalid cloud project identifier/);
  assert.deepEqual(client.calls, []);
  await assert.rejects(loadCloudProject(fakeClient({data:null,error:null}), PROJECT_ID), /not found/);
  await assert.rejects(saveCloudProject(fakeClient({data:null,error:{code:'42501'}}), sample), /Cloud save failed/);
  await assert.rejects(listCloudProjects(fakeClient({data:null,error:{code:'42501'}})), /Cloud listing failed/);
  const src = readFileSync(new URL('../src/hosted/cloudProjects.js',import.meta.url),'utf8');
  assert.doesNotMatch(src, /\.(update|delete|upsert)\(/);
  assert.doesNotMatch(src, /\.storage\.from\(/);
});
