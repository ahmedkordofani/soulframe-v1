import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('cloud update has a separate explicit button and request/confirmation phases', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /onClick=\{\(\) => requestUpdate\(record\)\}/);
  assert.match(ui, /setPending\(buildCloudUpdateIntent\(/);
  assert.match(ui, /Confirm cloud update/);
  assert.match(ui, /onClick=\{confirmAction\}/);
});
test('update calls authenticated RPC adapter only inside confirmation', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /action\.kind === 'update'/);
  assert.match(ui, /await updateCloudProject\(client, action\.id, action\.expectedRevision, action\.snapshot\)/);
  const request = ui.split('function requestUpdate(record) {')[1]?.split('\n  async function confirmAction()')[0] || '';
  assert.doesNotMatch(request, /\.rpc\(|updateCloudProject\(/);
});
test('conflicts and inaccessible targets cancel pending action without auto retry', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /outcome\.status === 'conflict'/);
  assert.match(ui, /setHasListed\(false\)/);
  assert.match(ui, /Refresh cloud projects before attempting another edit/);
  assert.doesNotMatch(ui, /\.update\(|\.delete\(|\.upsert\(/);
});
test('cloud deletion is a separate confirmed soft-delete RPC, not a direct table write', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /onClick=\{\(\) => requestDelete\(record\)\}/);
  assert.match(ui, /await softDeleteCloudProject\(client, action\.id, action\.expectedRevision\)/);
  assert.match(ui, /pending.kind === 'delete'/);
  assert.match(ui, /Confirm cloud delete/);
  assert.doesNotMatch(ui, /\.delete\(|\.update\(|\.upsert\(|deleteCloudProject/);
});
test('cloud update maintains account unmount safety and existing load functionality', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /if \(!mounted\.current\) return/);
  assert.match(ui, /await loadCloudProject\(client, action\.id\)/);
  assert.match(ui, /await saveCloudProject\(client, action\.snapshot\)/);
  assert.doesNotMatch(ui, /localStorage|createApiProject/);
});
