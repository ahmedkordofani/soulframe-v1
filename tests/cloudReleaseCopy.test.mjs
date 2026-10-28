import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const panel = readFileSync(new URL('../src/hosted/HostedIdentityPanel.jsx', import.meta.url), 'utf8');
const manager = readFileSync(new URL('../src/hosted/CloudProjectManager.jsx', import.meta.url), 'utf8');

test('hosted identity UI labels the in-progress development version V6.1.4', () => {
  assert.match(panel, />V6\.1\.4<\/span>/);
  assert.doesNotMatch(panel, />V6\.1\.3<\/span>/);
});

test('hosted identity copy acknowledges revision-safe updates and recoverable soft deletion', () => {
  assert.match(panel, /revision-safe updates/);
  assert.match(panel, /Cloud Delete is explicit, revision-checked and recoverable/);
  assert.doesNotMatch(panel, /No automatic sync, audio upload, cloud editing or deletion\./);
});

test('cloud editor and explicit soft deletion use approved RPC adapters', () => {
  assert.match(manager, /Update from workspace/);
  assert.match(manager, /updateCloudProject/);
  assert.match(manager, /softDeleteCloudProject/);
  assert.doesNotMatch(manager, /\bdeleteCloudProject\b|\.delete\(|\.upsert\(/);
});
