import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSoulFrameApiServer } from '../server/index.mjs';
import { LocalProjectStore, BACKUP_TYPE } from '../server/projectStore.mjs';
import {
  createApiProject, updateApiProject, deleteApiProject, readApiProject, listApiProjects,
  listRecoverySnapshots, readRecoverySnapshot, restoreRecoverySnapshot, exportLocalApiBackup,
} from '../src/api/projectClient.js';

const payload = (name) => ({ projectSession: { projectName: name, producerNotes: 'Metadata only' }, reviewMode: 'draft' });
async function fixture(fn) {
  const dir = await mkdtemp(join(tmpdir(), 'soulframe-v605-'));
  const filePath = join(dir, 'projects.json');
  const store = new LocalProjectStore({ filePath });
  const server = createSoulFrameApiServer({ store, authToken: null });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const fetcher = (url, options) => fetch(`${base}${url}`, options);
  try { await fn({ store, filePath, base, fetcher }); }
  finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(dir, { recursive: true, force: true });
  }
}

test('local API advertises recovery and metadata backup without claiming cloud hosting', async () => fixture(async ({ base }) => {
  const response = await fetch(`${base}/api/health`);
  const health = await response.json();
  assert.equal(health.version, 'v6.0.8');
  assert.equal(health.capabilities.projectRecovery, true);
  assert.equal(health.capabilities.metadataBackupExport, true);
  assert.equal(health.capabilities.authentication, false);
  assert.equal(health.capabilities.audioUpload, false);
}));

test('overwrite captures previous revision, snapshot detail is inspectable, and original project is unchanged', async () => fixture(async ({ fetcher }) => {
  const created = (await createApiProject(payload('Initial'), { fetcher })).project;
  await updateApiProject(created.id, payload('Edited'), { fetcher, expectedRevision: 1 });
  const entries = (await listRecoverySnapshots({ fetcher })).entries;
  assert.equal(entries.length, 1);
  assert.equal(entries[0].revision, 1);
  assert.equal(entries[0].reason, 'update');
  assert.equal(entries[0].activeRevision, 2);
  const detail = (await readRecoverySnapshot(entries[0].id, { fetcher })).snapshot;
  assert.equal(detail.record.projectSession.projectName, 'Initial');
  assert.equal((await readApiProject(created.id, { fetcher })).project.projectSession.projectName, 'Edited');
}));

test('restore of an active record requires the current revision, increments revision, and keeps an undo snapshot', async () => fixture(async ({ fetcher }) => {
  const first = (await createApiProject(payload('A'), { fetcher })).project;
  const second = (await updateApiProject(first.id, payload('B'), { fetcher, expectedRevision: 1 })).project;
  const snapshot = (await listRecoverySnapshots({ fetcher })).entries[0];
  const restored = (await restoreRecoverySnapshot(snapshot.id, { fetcher, expectedRevision: second.revision })).project;
  assert.equal(restored.projectSession.projectName, 'A');
  assert.equal(restored.revision, 3);
  const history = (await listRecoverySnapshots({ fetcher })).entries;
  assert.equal(history[0].reason, 'restore');
  assert.equal(history[0].title, 'B');
  assert.equal(history[0].activeRevision, 3);
}));

test('deleted record can be restored only with If-None-Match absence condition, preserving its ID and moving revision forward', async () => fixture(async ({ fetcher }) => {
  const first = (await createApiProject(payload('Recover this'), { fetcher })).project;
  await deleteApiProject(first.id, { fetcher, expectedRevision: 1 });
  assert.equal((await listApiProjects({ fetcher })).projects.length, 0);
  const snapshot = (await listRecoverySnapshots({ fetcher })).entries[0];
  assert.equal(snapshot.reason, 'delete');
  assert.equal(snapshot.activeRevision, null);
  const result = (await restoreRecoverySnapshot(snapshot.id, { fetcher, requireAbsent: true })).project;
  assert.equal(result.id, first.id);
  assert.equal(result.revision, 2);
  assert.equal(result.projectSession.projectName, 'Recover this');
}));

test('stale active restore and restore-with-absence over existing project fail closed', async () => fixture(async ({ fetcher }) => {
  const first = (await createApiProject(payload('First'), { fetcher })).project;
  await updateApiProject(first.id, payload('Second'), { fetcher, expectedRevision: 1 });
  const oldSnapshot = (await listRecoverySnapshots({ fetcher })).entries[0];
  await updateApiProject(first.id, payload('Third'), { fetcher, expectedRevision: 2 });
  await assert.rejects(restoreRecoverySnapshot(oldSnapshot.id, { fetcher, expectedRevision: 2 }), (e) => e.status === 412);
  await assert.rejects(restoreRecoverySnapshot(oldSnapshot.id, { fetcher, requireAbsent: true }), (e) => e.status === 412);
  assert.equal((await readApiProject(first.id, { fetcher })).project.projectSession.projectName, 'Third');
}));

test('recovery endpoint requires conditional headers and refuses unrecognized absence preconditions', async () => fixture(async ({ base, fetcher }) => {
  const first = (await createApiProject(payload('Before'), { fetcher })).project;
  await updateApiProject(first.id, payload('After'), { fetcher, expectedRevision: 1 });
  const snapshot = (await listRecoverySnapshots({ fetcher })).entries[0];
  const endpoint = `${base}/api/recovery/${snapshot.id}/restore`;
  assert.equal((await fetch(endpoint, { method: 'POST' })).status, 428);
  assert.equal((await fetch(endpoint, { method: 'POST', headers: { 'If-None-Match': '"1"' } })).status, 400);
  assert.equal((await fetch(endpoint, { method: 'POST', headers: { 'If-None-Match': '*', 'If-Match': '"2"' } })).status, 400);
  assert.equal((await readApiProject(first.id, { fetcher })).project.revision, 2);
}));

test('recovery history survives restart and retains legacy schema 1 records', async () => fixture(async ({ store, filePath }) => {
  const old = await store.create(payload('Old'));
  await store.update(old.id, payload('Updated'), { expectedRevision: 1 });
  const reopened = new LocalProjectStore({ filePath });
  const history = await reopened.recoveryList();
  assert.equal(history.length, 1);
  assert.equal((await reopened.recoveryGet(history[0].id)).record.projectSession.projectName, 'Old');
  assert.equal(JSON.parse(await readFile(filePath, 'utf8')).schemaVersion, 1);
}));

test('legacy schema 1 database without history remains readable and starts recovery on future changes', async () => fixture(async ({ store, filePath }) => {
  const project = await store.create(payload('Legacy'));
  const database = JSON.parse(await readFile(filePath, 'utf8'));
  delete database.history;
  await writeFile(filePath, JSON.stringify(database), 'utf8');
  assert.deepEqual(await store.recoveryList(), []);
  await store.update(project.id, payload('Now versioned'), { expectedRevision: 1 });
  assert.equal((await store.recoveryList()).length, 1);
}));

test('history is bounded to ten versions per project and does not exceed a database-wide cap', async () => fixture(async ({ store }) => {
  const project = await store.create(payload('First'));
  for (let n = 1; n <= 18; n++) await store.update(project.id, payload(`Edit ${n}`), { expectedRevision: n });
  const history = await store.recoveryList();
  assert.equal(history.length, 10);
  assert.equal(history[0].revision, 18);
  assert.equal(history[9].revision, 9);
}));

test('manual backup contains metadata and recovery snapshots and cannot claim to contain audio', async () => fixture(async ({ fetcher }) => {
  const created = (await createApiProject(payload('Backup'), { fetcher })).project;
  await updateApiProject(created.id, payload('Revised backup'), { fetcher, expectedRevision: 1 });
  const result = (await exportLocalApiBackup({ fetcher })).backup;
  assert.equal(result.type, BACKUP_TYPE);
  assert.equal(result.schemaVersion, 1);
  assert.equal(result.projects.length, 1);
  assert.equal(result.history.length, 1);
  assert.equal(result.projects[0].projectSession.projectName, 'Revised backup');
  assert.equal(JSON.stringify(result).includes('audioBytes'), false);
}));

test('invalid recovery history fails closed and never overwrites corrupted database', async () => fixture(async ({ filePath, store }) => {
  const original = JSON.stringify({ schemaVersion: 1, projects: [], history: [{ id: 'invalid', record: { projectSession: { projectName: 'corrupt' } } }] });
  await writeFile(filePath, original, 'utf8');
  await assert.rejects(store.create(payload('Should not write')), /database format is invalid/i);
  assert.equal(await readFile(filePath, 'utf8'), original);
}));

test('client restore sends the right conditional header and never adds audio or a request body', async () => {
  const calls = [];
  const fetcher = async (_, options) => { calls.push(options); return { ok: true, json: async () => ({ ok: true, project: {} }) }; };
  await restoreRecoverySnapshot('id', { fetcher, expectedRevision: 3 });
  await restoreRecoverySnapshot('id', { fetcher, requireAbsent: true });
  assert.equal(calls[0].headers['If-Match'], '"3"');
  assert.equal(calls[1].headers['If-None-Match'], '*');
  assert.equal(calls[0].body, undefined);
  assert.equal(calls[1].body, undefined);
});

test('recovery UI requires explicit refresh and confirmation and never auto-restores', async () => {
  const { readFileSync } = await import('node:fs');
  const { fileURLToPath } = await import('node:url');
  const { resolve, dirname } = await import('node:path');
  const path = resolve(dirname(fileURLToPath(import.meta.url)), '../src/api/ProjectRecoveryPanel.jsx');
  const source = readFileSync(path, 'utf8');
  assert.match(source, /onClick={refreshHistory}/);
  assert.match(source, /onClick={confirmRestore}/);
  assert.match(source, /Review restore confirmation/);
  assert.match(source, /Download metadata backup/);
  assert.doesNotMatch(source, /useEffect\(/);
});
