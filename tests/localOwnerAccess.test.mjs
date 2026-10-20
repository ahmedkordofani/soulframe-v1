import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSoulFrameApiServer } from '../server/index.mjs';
import { LocalProjectStore } from '../server/projectStore.mjs';
import { generateLocalAccessToken, isLocalRequestAuthorized, isValidLocalAccessToken } from '../server/localAccess.mjs';
import { clearLocalAccessToken, getLocalAccessToken, setLocalAccessToken } from '../src/api/localAccessToken.js';
import { listApiProjects, createApiProject } from '../src/api/projectClient.js';

async function fixture(callback) {
  const dir = await mkdtemp(join(tmpdir(), 'soulframe-access-'));
  const token = generateLocalAccessToken();
  const store = new LocalProjectStore({ filePath: join(dir, 'projects.json') });
  const server = createSoulFrameApiServer({ store, authToken: token });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  try { return await callback({ origin, token, store }); }
  finally { clearLocalAccessToken(); await new Promise(resolve => server.close(resolve)); await rm(dir, { recursive: true, force: true }); }
}

const valid = { projectSession: { projectName: 'Secure local demo' }, reviewMode: 'draft' };
const header = (token) => ({ Authorization: `Bearer ${token}` });

test('generated process tokens use cryptographically random fixed length base64url format', () => {
  const a = generateLocalAccessToken();
  const b = generateLocalAccessToken();
  assert.equal(isValidLocalAccessToken(a), true);
  assert.equal(isValidLocalAccessToken(b), true);
  assert.notEqual(a, b);
  assert.equal(isLocalRequestAuthorized({headers:{authorization:`Bearer ${a}`}}, a), true);
  assert.equal(isLocalRequestAuthorized({headers:{authorization:`Bearer ${b}`}}, a), false);
  assert.equal(isLocalRequestAuthorized({headers:{authorization:`Basic ${a}`}}, a), false);
});

test('protected API health advertises required unlock but does not reveal secret', async () => {
  await fixture(async ({ origin, token }) => {
    const response = await fetch(`${origin}/api/health`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.version, 'v6.0.9');
    assert.equal(body.capabilities.localTokenRequired, true);
    assert.equal(body.capabilities.authentication, false);
    assert.equal(body.capabilities.audioUpload, false);
    assert.equal(JSON.stringify(body).includes(token), false);
  });
});

test('project list, recovery, backup and imported metadata are all locked by default', async () => {
  await fixture(async ({ origin }) => {
    for (const path of ['/api/projects', '/api/recovery', '/api/backup']) {
      const response = await fetch(origin + path);
      assert.equal(response.status, 401, path);
      assert.match(response.headers.get('www-authenticate'), /Bearer/);
      assert.equal((await response.json()).ok, false);
    }
    assert.equal((await fetch(origin + '/api/backup/preview', {method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status, 401);
  });
});

test('wrong tokens reject reads and writes, with no persisted changes', async () => {
  await fixture(async ({ origin }) => {
    const bad = generateLocalAccessToken();
    const read = await fetch(origin + '/api/projects', { headers: header(bad) });
    assert.equal(read.status, 401);
    const write = await fetch(origin + '/api/projects', {
      method: 'POST', headers: { ...header(bad), 'Content-Type': 'application/json' }, body: JSON.stringify(valid),
    });
    assert.equal(write.status, 401);
  });
});

test('correct token authorizes real project create/list/backup without exposing audio', async () => {
  await fixture(async ({ origin, token }) => {
    const created = await fetch(origin + '/api/projects', {method:'POST',headers:{...header(token),'Content-Type':'application/json'},body:JSON.stringify(valid)});
    assert.equal(created.status, 201);
    const list = await fetch(origin + '/api/projects', {headers: header(token)});
    assert.equal((await list.json()).projects.length, 1);
    const backup = await fetch(origin + '/api/backup', {headers: header(token)});
    assert.equal((await backup.json()).backup.projects.length, 1);
    assert.equal((await fetch(origin + '/api/projects')).status, 401);
  });
});

test('browser client keeps token in module memory and adds Authorization only when unlocked', async () => {
  await fixture(async ({ origin, token }) => {
    const fetcher = (path, options) => fetch(origin + path, options);
    assert.equal(getLocalAccessToken(), '');
    await assert.rejects(listApiProjects({ fetcher }), err => err.status === 401);
    setLocalAccessToken(token);
    assert.equal(getLocalAccessToken(), token);
    const project = await createApiProject(valid, { fetcher });
    assert.equal(project.project.projectSession.projectName, 'Secure local demo');
    const records = await listApiProjects({ fetcher });
    assert.equal(records.projects.length, 1);
    clearLocalAccessToken();
    assert.equal(getLocalAccessToken(), '');
    await assert.rejects(listApiProjects({ fetcher }), err => err.status === 401);
  });
});

test('token validation rejects incomplete secrets and invalid server configuration', () => {
  assert.throws(() => setLocalAccessToken('short'), /complete local API/);
  assert.throws(() => createSoulFrameApiServer({authToken:'weak'}), /43-character/);
});

test('programmatic API server defaults to locked, not anonymous access', async () => {
  const server = createSoulFrameApiServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const health = await (await fetch(origin + '/api/health')).json();
    assert.equal(health.capabilities.localTokenRequired, true);
    assert.equal((await fetch(origin + '/api/projects')).status, 401);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
