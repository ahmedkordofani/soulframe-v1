import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { assessLocalRuntime, assertLocalRuntime, HOSTED_BLOCKERS } from '../server/runtimeGuard.mjs';
import { auditLocalStorage } from '../server/storageAudit.mjs';
import { LocalProjectStore } from '../server/projectStore.mjs';
import { createSoulFrameApiServer, API_CAPABILITIES } from '../server/index.mjs';

const payload = { projectSession: { projectName: 'Sensitive Demo Title', clientName: 'Secret Client' }, reviewMode: 'draft' };
const cli = resolve('scripts/backend-readiness.mjs');
const cleanEnv = () => ({ PATH: process.env.PATH || '' });

test('normal local use and configured local Origin are permitted', () => {
  assert.equal(assessLocalRuntime({}).ok, true);
  assert.equal(assessLocalRuntime({ NODE_ENV: 'development', SOULFRAME_ALLOWED_ORIGIN: 'http://localhost:4321' }).ok, true);
  assert.equal(assertLocalRuntime({}).mode, 'local-development');
});

test('public runtime markers and remote binding hints are rejected', () => {
  for (const env of [
    { NODE_ENV: 'production' },
    { VERCEL: '1' },
    { RENDER: 'true' },
    { K_SERVICE: 'soulframe-api' },
    { SOULFRAME_DEPLOYMENT_TARGET: 'hosted' },
    { SOULFRAME_API_HOST: '0.0.0.0' },
    { SOULFRAME_ALLOWED_ORIGIN: 'https://example.com' },
    { SOULFRAME_ALLOWED_ORIGIN: 'http://127.0.0.1' },
  ]) {
    assert.equal(assessLocalRuntime(env).ok, false, JSON.stringify(env));
    assert.throws(() => createSoulFrameApiServer({ environment: env, authToken: null }), /startup blocked/);
  }
  assert.equal(API_CAPABILITIES.hostedDeployment, false);
  assert.equal(API_CAPABILITIES.authentication, false);
});

test('hosted blockers clearly include identity, isolation and durable storage', () => {
  assert.ok(HOSTED_BLOCKERS.some(text => /identity provider/.test(text)));
  assert.ok(HOSTED_BLOCKERS.some(text => /project ownership/.test(text)));
  assert.ok(HOSTED_BLOCKERS.some(text => /transactional/.test(text)));
});

test('storage audit is read-only for missing stores and real saved projects', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'soulframe-readiness-'));
  try {
    const path = join(dir, 'local', 'projects.json');
    const empty = await auditLocalStorage({ filePath: path });
    assert.deepEqual(empty, { ok: true, exists: false, projectCount: 0, snapshotCount: 0, bytes: 0 });
    const store = new LocalProjectStore({ filePath: path });
    await store.create(payload);
    const before = await readFile(path, 'utf8');
    const audit = await auditLocalStorage({ filePath: path });
    assert.equal(audit.ok, true);
    assert.equal(audit.projectCount, 1);
    assert.equal(audit.snapshotCount, 0);
    assert.equal(await readFile(path, 'utf8'), before);
    assert.equal(JSON.stringify(audit).includes('Secret Client'), false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('corrupt storage is reported without mutation', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'soulframe-readiness-'));
  try {
    const path = join(dir, 'projects.json');
    await writeFile(path, '{invalid-json');
    const result = await auditLocalStorage({ filePath: path });
    assert.equal(result.ok, false);
    assert.equal(await readFile(path, 'utf8'), '{invalid-json');
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('symlink-based storage paths are refused by readiness inspection', { skip: process.platform === 'win32' }, async () => {
  const dir = await mkdtemp(join(tmpdir(), 'soulframe-readiness-'));
  try {
    const original = join(dir, 'real.json');
    const linked = join(dir, 'link.json');
    await writeFile(original, '{}');
    await symlink(original, linked);
    assert.equal((await auditLocalStorage({ filePath: linked })).ok, false);
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('CLI local check is read-only, safe and machine-readable', () => {
  const dir = resolve(import.meta.dirname, '..');
  const run = spawnSync(process.execPath, [cli, '--target=local', '--json'], { cwd: dir, encoding: 'utf8', env: cleanEnv() });
  assert.equal(run.status, 0, run.stderr + run.stdout);
  const report = JSON.parse(run.stdout);
  assert.equal(report.target, 'local');
  assert.equal(report.ready, true);
  assert.equal(report.runtime.safeForLocalUse, true);
  assert.equal(run.stdout.includes('Secret Client'), false);
});

test('CLI hosted check fails closed and has actionable blockers', () => {
  const run = spawnSync(process.execPath, [cli, '--target=hosted', '--json'], { cwd: resolve(import.meta.dirname, '..'), encoding: 'utf8', env: cleanEnv() });
  assert.equal(run.status, 1);
  const report = JSON.parse(run.stdout);
  assert.equal(report.ready, false);
  assert.ok(report.findings.length >= 5);
});

test('CLI local check blocks unsafe production runtime without leaking env values', () => {
  const run = spawnSync(process.execPath, [cli, '--target=local', '--json'], {
    cwd: resolve(import.meta.dirname, '..'), encoding: 'utf8', env: { ...cleanEnv(), NODE_ENV: 'production' },
  });
  assert.equal(run.status, 1);
  const report = JSON.parse(run.stdout);
  assert.equal(report.ready, false);
  assert.ok(report.findings.some(x => x.category === 'runtime'));
});


test('production-marked CLI refuses API startup without printing an owner token', () => {
  const run = spawnSync(process.execPath, ['server/index.mjs'], {
    cwd: resolve(import.meta.dirname, '..'), encoding: 'utf8',
    env: { ...cleanEnv(), NODE_ENV: 'production' }, timeout: 10_000,
  });
  assert.notEqual(run.status, 0);
  assert.match(run.stderr, /startup blocked/);
  assert.equal(run.stdout.includes('Local project access token'), false);
});
