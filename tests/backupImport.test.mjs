import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSoulFrameApiServer } from '../server/index.mjs';
import { LocalProjectStore, ProjectStoreError, validateMetadataBackup } from '../server/projectStore.mjs';
import {
  createApiProject, updateApiProject, deleteApiProject, listApiProjects,
  exportLocalApiBackup, previewLocalApiBackup, confirmLocalApiBackupImport,
  listRecoverySnapshots,
} from '../src/api/projectClient.js';

const project = (name) => ({ projectSession: { projectName: name, clientName: 'Demo' }, reviewMode: 'draft' });
async function fixture(run) {
  const dir = await mkdtemp(join(tmpdir(), 'soulframe-v606-'));
  const path = join(dir, 'projects.json');
  const store = new LocalProjectStore({ filePath: path });
  const server = createSoulFrameApiServer({ store });
  await new Promise((res, rej) => { server.once('error', rej); server.listen(0, '127.0.0.1', res); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const fetcher = (url, init) => fetch(base + url, init);
  try { return await run({ store, path, fetcher, base }); }
  finally {
    await new Promise((res, rej) => server.close(err => err ? rej(err) : res()));
    await rm(dir, { recursive: true, force: true });
  }
}

async function makeBackup(name) {
  return fixture(async ({ fetcher }) => {
    const saved = (await createApiProject(project(name), { fetcher })).project;
    return (await exportLocalApiBackup({ fetcher })).backup;
  });
}

test('health advertises only local metadata import, not hosting or authentication', () => fixture(async ({ base }) => {
  const data = await (await fetch(base + '/api/health')).json();
  assert.equal(data.version, 'v6.0.6');
  assert.equal(data.capabilities.metadataBackupImport, true);
  assert.equal(data.capabilities.audioUpload, false);
  assert.equal(data.capabilities.authentication, false);
}));

test('preview is read-only; confirmation imports metadata and survives store restart', () => fixture(async ({ path, fetcher }) => {
  const backup = await makeBackup('From downloaded backup');
  const preview = (await previewLocalApiBackup(backup, { fetcher })).preview;
  assert.equal(preview.newProjects, 1);
  assert.equal(preview.skippedProjects, 0);
  assert.equal((await listApiProjects({ fetcher })).projects.length, 0);
  const summary = (await confirmLocalApiBackupImport(preview.token, { fetcher })).summary;
  assert.equal(summary.importedProjects, 1);
  assert.equal((await (new LocalProjectStore({ filePath: path })).list())[0].title, 'From downloaded backup');
}));

test('colliding IDs never overwrite existing newer metadata or their revisions', () => fixture(async ({ fetcher }) => {
  const older = (await createApiProject(project('Original'), { fetcher })).project;
  const backup = (await exportLocalApiBackup({ fetcher })).backup;
  await updateApiProject(older.id, project('Newer version'), { fetcher, expectedRevision: 1 });
  const preview = (await previewLocalApiBackup(backup, { fetcher })).preview;
  assert.equal(preview.newProjects, 0);
  assert.equal(preview.skippedProjects, 1);
  const result = await confirmLocalApiBackupImport(preview.token, { fetcher });
  assert.equal(result.summary.importedProjects, 0);
  assert.equal((await listApiProjects({ fetcher })).projects[0].title, 'Newer version');
}));

test('database changes after preview fail closed with 412 and require a fresh preview', () => fixture(async ({ fetcher }) => {
  const backup = await makeBackup('New imported');
  const token = (await previewLocalApiBackup(backup, { fetcher })).preview.token;
  await createApiProject(project('Changed in other tab'), { fetcher });
  await assert.rejects(confirmLocalApiBackupImport(token, { fetcher }), e => e.status === 412);
  assert.equal((await listApiProjects({ fetcher })).projects.length, 1);
}));

test('import token is single-use and cannot be replayed', () => fixture(async ({ fetcher }) => {
  const backup = await makeBackup('Single use');
  const token = (await previewLocalApiBackup(backup, { fetcher })).preview.token;
  await confirmLocalApiBackupImport(token, { fetcher });
  await assert.rejects(confirmLocalApiBackupImport(token, { fetcher }), e => e.status === 410);
  assert.equal((await listApiProjects({ fetcher })).projects.length, 1);
}));

test('backup imports history for new IDs and skips history from colliding projects', () => fixture(async ({ fetcher }) => {
  const first = (await createApiProject(project('Initial'), { fetcher })).project;
  await updateApiProject(first.id, project('Edited'), { fetcher, expectedRevision: 1 });
  const backup = (await exportLocalApiBackup({ fetcher })).backup;
  const token = (await previewLocalApiBackup(backup, { fetcher })).preview;
  assert.equal(token.newProjects, 0);
  assert.equal(token.skippedSnapshots, 1);
  await confirmLocalApiBackupImport(token.token, { fetcher });
  assert.equal((await listRecoverySnapshots({ fetcher })).entries.length, 1);
  // Import same backup into a new, empty target database.
  await fixture(async ({ fetcher: other }) => {
    const view = (await previewLocalApiBackup(backup, { fetcher: other })).preview;
    assert.equal(view.newProjects, 1);
    assert.equal(view.recoverableSnapshots, 1);
    await confirmLocalApiBackupImport(view.token, { fetcher: other });
    assert.equal((await listRecoverySnapshots({ fetcher: other })).entries[0].title, 'Initial');
  });
}));

test('deleted-project recovery history imports without recreating an intentionally deleted project', () => fixture(async ({ fetcher }) => {
  const record = (await createApiProject(project('Deleted'), { fetcher })).project;
  await deleteApiProject(record.id, { fetcher, expectedRevision: 1 });
  const backup = (await exportLocalApiBackup({ fetcher })).backup;
  await fixture(async ({ fetcher: second }) => {
    const plan = (await previewLocalApiBackup(backup, { fetcher: second })).preview;
    assert.equal(plan.newProjects, 0);
    assert.equal(plan.recoverableSnapshots, 1);
    await confirmLocalApiBackupImport(plan.token, { fetcher: second });
    assert.equal((await listApiProjects({ fetcher: second })).projects.length, 0);
    assert.equal((await listRecoverySnapshots({ fetcher: second })).entries[0].reason, 'delete');
  });
}));

test('malformed, duplicate-ID, audio and extra-field backups are rejected without writes', () => fixture(async ({ fetcher }) => {
  const good = await makeBackup('Valid');
  const attempts = [
    { ...good, type: 'arbitrary' },
    { ...good, audioBytes: 'not allowed' },
    { ...good, projects: [good.projects[0], good.projects[0]] },
    { ...good, projects: [{ ...good.projects[0], projectSession: { projectName: 'Bad', audioBuffer: 'no' } }] },
    { ...good, projects: [{ ...good.projects[0], audioFile: 'raw' }] },
    { ...good, history: [{ id: 'not-a-uuid', reason: 'delete', capturedAt: good.exportedAt, record: good.projects[0] }] },
  ];
  for (const invalid of attempts) {
    await assert.rejects(previewLocalApiBackup(invalid, { fetcher }), e => e.status === 422);
  }
  assert.equal((await listApiProjects({ fetcher })).projects.length, 0);
}));

test('invalid token and unsupported confirmation bodies fail closed', () => fixture(async ({ fetcher, base }) => {
  await assert.rejects(confirmLocalApiBackupImport('invalid', { fetcher }), e => e.status === 422);
  const response = await fetch(base + '/api/backup/import', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ token: 'invalid', deleteExisting: true }) });
  assert.equal(response.status, 422);
}));

test('oversized backup body is rejected with 413', () => fixture(async ({ base }) => {
  const body = JSON.stringify({ type: 'none', padding: 'x'.repeat(3 * 1024 * 1024 + 50) });
  const response = await fetch(base + '/api/backup/preview', {method:'POST',headers:{'Content-Type':'application/json'},body});
  assert.equal(response.status, 413);
}));

test('malformed or corrupted existing database cannot be overwritten by import', () => fixture(async ({ path, store }) => {
  const backup = await makeBackup('Cannot import');
  await writeFile(path, '{bad json', 'utf8');
  await assert.rejects(store.previewBackupImport(backup), /database is invalid/);
  assert.equal(await readFile(path, 'utf8'), '{bad json');
}));

test('client sends preview and commit requests only after explicit call', async () => {
  const calls = [];
  const fetcher = async (url, init) => { calls.push({url,init}); return {ok:true,json:async()=>({ok:true,preview:{token:'a'},summary:{}})}; };
  await previewLocalApiBackup({ type:'sample' }, {fetcher});
  await confirmLocalApiBackupImport('abc', {fetcher});
  assert.deepEqual(calls.map(c => c.url), ['/api/backup/preview', '/api/backup/import']);
  assert.equal(JSON.parse(calls[1].init.body).token, 'abc');
  assert.equal(calls[1].init.method, 'POST');
});

test('UI has explicit preview and acknowledgement before import; no auto-import effect', async () => {
  const source = await readFile(new URL('../src/api/ProjectRecoveryPanel.jsx', import.meta.url), 'utf8');
  assert.match(source, /onChange={previewBackupFile}/);
  assert.match(source, /onClick={confirmImport}/);
  assert.match(source, /!importAcknowledged/);
  assert.match(source, /Confirm backup import/);
  assert.doesNotMatch(source, /useEffect\(/);
});

test('reimporting the same orphan recovery snapshots does not duplicate imported history', () => fixture(async ({ fetcher }) => {
  const created = (await createApiProject(project('Deleted elsewhere'), { fetcher })).project;
  await deleteApiProject(created.id, { fetcher, expectedRevision: 1 });
  const backup = (await exportLocalApiBackup({ fetcher })).backup;
  await fixture(async ({ fetcher: target }) => {
    const first = (await previewLocalApiBackup(backup, { fetcher: target })).preview;
    await confirmLocalApiBackupImport(first.token, { fetcher: target });
    const second = (await previewLocalApiBackup(backup, { fetcher: target })).preview;
    assert.equal(second.recoverableSnapshots, 0);
    assert.equal(second.skippedSnapshots, 1);
    const result = await confirmLocalApiBackupImport(second.token, { fetcher: target });
    assert.equal(result.summary.importedSnapshots, 0);
    assert.equal((await listRecoverySnapshots({ fetcher: target })).entries.length, 1);
  });
}));

test('a full local history store cannot exceed the 5000 snapshot cap on import', () => fixture(async ({ path, store }) => {
  const { randomUUID } = await import('node:crypto');
  const now = new Date().toISOString();
  const id = randomUUID();
  const record = { id, projectSession: { projectName: 'Existing deleted' }, reviewMode: 'draft', selectedPreset: '', createdAt: now, updatedAt: now, revision: 1 };
  const history = Array.from({length: 5000}, (_, i) => ({ id: randomUUID(), reason: 'delete', capturedAt: now, record: { ...record, revision: i + 1 } }));
  await writeFile(path, JSON.stringify({schemaVersion: 1, projects: [], history}), 'utf8');
  const backup = await makeBackup('New');
  // Add a recoverable snapshot to the incoming backup.
  backup.history.push({id: randomUUID(), reason: 'delete', capturedAt: now, record: backup.projects[0]});
  const plan = await store.previewBackupImport(backup);
  assert.equal(plan.recoverableSnapshots, 0);
  assert.equal(plan.skippedSnapshots, 1);
  const result = await store.commitBackupImport(plan.token);
  assert.equal(result.importedProjects, 1);
  assert.equal((await store.recoveryList()).length, 5000);
}));
