import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { request as rawHttpRequest } from 'node:http';
import { join, dirname } from 'node:path';
import { LocalProjectStore } from '../server/projectStore.mjs';
import { createSoulFrameApiServer } from '../server/index.mjs';
import { createApiProject, listApiProjects, readApiProject, updateApiProject, deleteApiProject } from '../src/api/projectClient.js';

async function fixture(callback) {
  const dir = await mkdtemp(join(tmpdir(), 'soulframe-v602-'));
  const path = join(dir, 'projects.json');
  const store = new LocalProjectStore({ filePath: path });
  const server = createSoulFrameApiServer({ store, authToken: null });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const fetcher = (endpoint, options) => fetch(`${origin}${endpoint}`, options);
  try { await callback({ origin, fetcher, path, store }); }
  finally {
    await new Promise((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
    await rm(dir, { recursive: true, force: true });
  }
}

const project = (name = 'A new SoulFrame project') => ({
  projectSession: {
    projectName: name,
    clientName: 'Private client',
    trackType: 'AI-generated song',
    producerNotes: 'Humanize the drum groove and vocal phrasing.',
  },
  reviewMode: 'draft',
  selectedPreset: '',
});

async function postJson(origin, path, payload, options = {}) {
  return fetch(`${origin}${path}`, {
    method: options.method || 'POST',
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    body: JSON.stringify(payload),
  });
}

test('health advertises local project persistence, not audio upload or cloud authentication', async () => {
  await fixture(async ({ origin }) => {
    const h = await (await fetch(`${origin}/api/health`)).json();
    assert.equal(h.version, 'v6.0.8');
    assert.equal(h.capabilities.projectPersistence, true);
    assert.equal(h.capabilities.audioUpload, false);
    assert.equal(h.capabilities.hostedReports, false);
    assert.equal(h.capabilities.authentication, false);
  });
});

test('create, list, read, update and delete project metadata via HTTP client', async () => {
  await fixture(async ({ fetcher }) => {
    const created = await createApiProject(project('Vocal Draft'), { fetcher });
    assert.equal(created.project.revision, 1);
    assert.equal(created.project.projectSession.projectName, 'Vocal Draft');
    assert.match(created.project.id, /^[a-f0-9-]{36}$/);
    const listed = await listApiProjects({ fetcher });
    assert.equal(listed.projects.length, 1);
    assert.equal(listed.projects[0].title, 'Vocal Draft');
    assert.equal(listed.projects[0].revision, 1);
    assert.equal(listed.projects[0].projectSession, undefined); // summary list only
    const loaded = await readApiProject(created.project.id, { fetcher });
    assert.equal(loaded.project.projectSession.clientName, 'Private client');
    const updated = await updateApiProject(created.project.id, { ...project('Instrumental Mix'), reviewMode: 'compare' }, { fetcher, expectedRevision: created.project.revision });
    assert.equal(updated.project.projectSession.projectName, 'Instrumental Mix');
    assert.equal(updated.project.reviewMode, 'compare');
    assert.equal(updated.project.revision, 2);
    assert.equal(updated.project.createdAt, created.project.createdAt);
    assert.equal((await deleteApiProject(created.project.id, { fetcher, expectedRevision: updated.project.revision })).deleted, true);
    assert.deepEqual((await listApiProjects({ fetcher })).projects, []);
  });
});

test('projects survive API server/store restart and remain local JSON', async () => {
  await fixture(async ({ path, store }) => {
    const saved = await store.create(project('Persistent Project'));
    const newProcessStore = new LocalProjectStore({ filePath: path });
    const afterRestart = await newProcessStore.get(saved.id);
    assert.equal(afterRestart.projectSession.projectName, 'Persistent Project');
    assert.equal(JSON.parse(await readFile(path, 'utf8')).schemaVersion, 1);
  });
});

test('concurrent saves do not overwrite one another', async () => {
  await fixture(async ({ store }) => {
    await Promise.all(Array.from({ length: 15 }, (_, n) => store.create(project(`Project ${n}`))));
    assert.equal((await store.list()).length, 15);
  });
});

test('unknown audio and arbitrary metadata are rejected without a write', async () => {
  await fixture(async ({ origin, store }) => {
    const response = await postJson(origin, '/api/projects', {
      ...project(), audioBase64: 'AAAA',
    });
    assert.equal(response.status, 422);
    const second = await postJson(origin, '/api/projects', {
      projectSession: { ...project().projectSession, audio: 'audio-bytes' },
    });
    assert.equal(second.status, 422);
    assert.deepEqual(await store.list(), []);
  });
});

test('invalid JSON, content type, and oversized metadata fail safely', async () => {
  await fixture(async ({ origin }) => {
    const invalid = await fetch(`${origin}/api/projects`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: '{invalid',
    });
    assert.equal(invalid.status, 400);
    const wrongType = await fetch(`${origin}/api/projects`, {
      method: 'POST', headers: { 'content-type': 'text/plain' }, body: '{}',
    });
    assert.equal(wrongType.status, 415);
    const oversized = await postJson(origin, '/api/projects', { projectSession: { projectName: 'a'.repeat(20000) } });
    assert.equal(oversized.status, 413);
  });
});

test('mutating methods require valid project shape', async () => {
  await fixture(async ({ origin }) => {
    const blank = await postJson(origin, '/api/projects', { projectSession: {} });
    assert.equal(blank.status, 422);
    const badMode = await postJson(origin, '/api/projects', { ...project(), reviewMode: 'unknown' });
    assert.equal(badMode.status, 422);
    const wrongMethod = await fetch(`${origin}/api/projects`, { method: 'DELETE' });
    assert.equal(wrongMethod.status, 405);
  });
});

test('unknown projects return 404 and cannot be silently updated', async () => {
  await fixture(async ({ origin }) => {
    const missing = '00000000-0000-4000-8000-000000000000';
    assert.equal((await fetch(`${origin}/api/projects/${missing}`)).status, 404);
    assert.equal((await postJson(origin, `/api/projects/${missing}`, project(), { method: 'PUT', headers: { 'If-Match': '"1"' } })).status, 404);
    assert.equal((await fetch(`${origin}/api/projects/${missing}`, { method: 'DELETE', headers: { 'If-Match': '"1"' } })).status, 404);
  });
});

test('origin and host checks reject hostile browser origins', async () => {
  await fixture(async ({ origin }) => {
    const blocked = await postJson(origin, '/api/projects', project(), { headers: { origin: 'https://attacker.example' } });
    assert.equal(blocked.status, 403);
    const spoofedHostStatus = await new Promise((resolve, reject) => {
      const req = rawHttpRequest(`${origin}/api/projects`, {
        method: 'GET', headers: { Host: 'attacker.example' },
      }, (res) => { res.resume(); res.on('end', () => resolve(res.statusCode)); });
      req.once('error', reject);
      req.end();
    });
    assert.equal(spoofedHostStatus, 403);
  });
});

test('corrupt existing project database fails closed, preserving the file', async () => {
  await fixture(async ({ path, origin }) => {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, '{not valid json', 'utf8');
    assert.equal((await postJson(origin, '/api/projects', project())).status, 500);
    assert.equal(await readFile(path, 'utf8'), '{not valid json');
  });
});

test('local APIs are explicit; application does not auto-upload existing browser projects', async () => {
  let count = 0;
  const fakeFetcher = async () => { count++; throw new Error('offline'); };
  assert.equal(count, 0);
  await assert.rejects(listApiProjects({ fetcher: fakeFetcher }), /offline/);
  assert.equal(count, 1);
});
