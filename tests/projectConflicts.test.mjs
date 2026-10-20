import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { createSoulFrameApiServer } from '../server/index.mjs';
import { LocalProjectStore } from '../server/projectStore.mjs';
import {
  createApiProject, readApiProject, updateApiProject, deleteApiProject, listApiProjects,
} from '../src/api/projectClient.js';

function payload(name = 'Demo') {
  return { projectSession: { projectName: name, producerNotes: 'No audio bytes stored' }, reviewMode: 'draft', selectedPreset: '' };
}

async function fixture(callback) {
  const directory = await mkdtemp(join(tmpdir(), 'soulframe-v604-'));
  const filePath = join(directory, 'projects.json');
  const store = new LocalProjectStore({ filePath });
  const server = createSoulFrameApiServer({ store });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const base = `http://127.0.0.1:${server.address().port}`;
  const fetcher = (url, options) => fetch(`${base}${url}`, options);
  try { await callback({ base, fetcher, filePath, store }); }
  finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await rm(directory, { recursive: true, force: true });
  }
}

test('new projects carry revision 1 in create/read/list and a matching GET ETag', async () => {
  await fixture(async ({ base, fetcher }) => {
    const created = (await createApiProject(payload('First'), { fetcher })).project;
    assert.equal(created.revision, 1);
    assert.equal((await listApiProjects({ fetcher })).projects[0].revision, 1);
    const response = await fetch(`${base}/api/projects/${created.id}`);
    assert.equal(response.headers.get('etag'), '"1"');
    assert.equal((await response.json()).project.revision, 1);
  });
});

test('PUT uses If-Match, increments revision, and rejects stale overwrite without changing the record', async () => {
  await fixture(async ({ fetcher }) => {
    const { project: created } = await createApiProject(payload('Original'), { fetcher });
    const { project: updated } = await updateApiProject(created.id, payload('Updated'), { fetcher, expectedRevision: 1 });
    assert.equal(updated.revision, 2);
    await assert.rejects(
      updateApiProject(created.id, payload('Stale overwrite'), { fetcher, expectedRevision: 1 }),
      (error) => error.status === 412 && /changed since/i.test(error.message),
    );
    const latest = (await readApiProject(created.id, { fetcher })).project;
    assert.equal(latest.projectSession.projectName, 'Updated');
    assert.equal(latest.revision, 2);
  });
});

test('DELETE requires the latest revision; a stale deletion cannot erase newer changes', async () => {
  await fixture(async ({ fetcher }) => {
    const { project: first } = await createApiProject(payload('Protect'), { fetcher });
    const { project: second } = await updateApiProject(first.id, payload('Newer'), { fetcher, expectedRevision: 1 });
    await assert.rejects(deleteApiProject(first.id, { fetcher, expectedRevision: 1 }), (error) => error.status === 412);
    assert.equal((await readApiProject(first.id, { fetcher })).project.projectSession.projectName, 'Newer');
    assert.equal((await deleteApiProject(first.id, { fetcher, expectedRevision: second.revision })).deleted, true);
    assert.deepEqual((await listApiProjects({ fetcher })).projects, []);
  });
});

test('missing revision preconditions receive 428 without updating or deleting data', async () => {
  await fixture(async ({ base, fetcher }) => {
    const { project: record } = await createApiProject(payload('Keep'), { fetcher });
    const put = await fetch(`${base}/api/projects/${record.id}`, {
      method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload('Wrong')),
    });
    const del = await fetch(`${base}/api/projects/${record.id}`, { method: 'DELETE' });
    assert.equal(put.status, 428);
    assert.equal(del.status, 428);
    assert.equal((await readApiProject(record.id, { fetcher })).project.projectSession.projectName, 'Keep');
  });
});

test('malformed weak, wildcard, multi-value and nonnumeric If-Match tokens receive 400', async () => {
  await fixture(async ({ base, fetcher }) => {
    const { project: record } = await createApiProject(payload('Keep'), { fetcher });
    for (const etag of ['W/"1"', '*', '"1","2"', '"abc"', '"9007199254740993"']) {
      const result = await fetch(`${base}/api/projects/${record.id}`, { method: 'DELETE', headers: { 'If-Match': etag } });
      assert.equal(result.status, 400, `Expected 400 for ${etag}`);
    }
    assert.equal((await listApiProjects({ fetcher })).projects.length, 1);
  });
});

test('the local client sends quoted If-Match on update and delete and checks invalid revisions locally', async () => {
  const observed = [];
  const fetcher = async (_url, options) => {
    observed.push(options);
    return { ok: true, json: async () => ({ ok: true, project: { revision: 4 }, deleted: true }) };
  };
  await updateApiProject('id', payload(), { fetcher, expectedRevision: 3 });
  await deleteApiProject('id', { fetcher, expectedRevision: 4 });
  assert.equal(observed[0].headers['If-Match'], '"3"');
  assert.equal(observed[1].headers['If-Match'], '"4"');
  await assert.rejects(updateApiProject('id', payload(), { fetcher, expectedRevision: 0 }), /positive project revision/);
  assert.equal(observed.length, 2);
});

test('older V6.0.2 records without revision remain editable and become revision 2', async () => {
  await fixture(async ({ filePath, store, fetcher }) => {
    const oldId = 'f0d6a9d0-26ab-4a36-87d4-a28ef0b2d999';
    const old = { id: oldId, ...payload('Legacy'), createdAt: '2026-10-19T01:00:00.000Z', updatedAt: '2026-10-19T01:00:00.000Z' };
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify({ schemaVersion: 1, projects: [old] }), 'utf8');
    assert.equal((await readApiProject(oldId, { fetcher })).project.revision, 1);
    assert.equal((await listApiProjects({ fetcher })).projects[0].revision, 1);
    const modified = (await updateApiProject(oldId, payload('Migrated'), { fetcher, expectedRevision: 1 })).project;
    assert.equal(modified.revision, 2);
    assert.equal(modified.createdAt, old.createdAt);
    assert.equal((await store.get(oldId)).revision, 2);
    assert.equal(JSON.parse(await readFile(filePath, 'utf8')).schemaVersion, 1);
  });
});

test('two competing writes with one revision cannot both succeed', async () => {
  await fixture(async ({ fetcher }) => {
    const { project: record } = await createApiProject(payload('Original'), { fetcher });
    const results = await Promise.allSettled([
      updateApiProject(record.id, payload('Edit A'), { fetcher, expectedRevision: 1 }),
      updateApiProject(record.id, payload('Edit B'), { fetcher, expectedRevision: 1 }),
    ]);
    assert.equal(results.filter((v) => v.status === 'fulfilled').length, 1);
    assert.equal(results.filter((v) => v.status === 'rejected' && v.reason?.status === 412).length, 1);
    const latest = (await readApiProject(record.id, { fetcher })).project;
    assert.equal(latest.revision, 2);
    assert.ok(['Edit A', 'Edit B'].includes(latest.projectSession.projectName));
  });
});

test('concurrent PUT and DELETE against one revision are serialized safely', async () => {
  await fixture(async ({ fetcher }) => {
    const { project: record } = await createApiProject(payload('Before'), { fetcher });
    const results = await Promise.allSettled([
      updateApiProject(record.id, payload('After'), { fetcher, expectedRevision: 1 }),
      deleteApiProject(record.id, { fetcher, expectedRevision: 1 }),
    ]);
    assert.equal(results.filter((v) => v.status === 'fulfilled').length, 1);
    const other = results.find((v) => v.status === 'rejected');
    assert.ok(other);
    assert.ok([404, 412].includes(other.reason.status));
  });
});
