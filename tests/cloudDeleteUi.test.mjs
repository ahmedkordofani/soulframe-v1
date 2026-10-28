import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('active cloud list contains separate explicit Delete button, not a direct mutation', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /onClick=\{\(\) => requestDelete\(record\)\}/);
  assert.match(ui, /buildCloudDeleteIntent\(record\)/);
  assert.match(ui, /Delete from cloud/);
  const request = ui.split('function requestDelete(record) {')[1]?.split('\n  function requestUpdate(record)')[0] || '';
  assert.ok(request);
  assert.doesNotMatch(request, /\.rpc\(|softDeleteCloudProject\(/);
});
test('confirmation shows listed ID context, exact revision, and recovery warning', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /Confirm cloud delete/);
  assert.match(ui, /pending\.name/);
  assert.match(ui, /pending\.expectedRevision/);
  assert.match(ui, /Refresh deleted projects/);
  assert.match(ui, /No automatic backup or automatic recovery/);
  assert.match(ui, /audio is never saved to cloud/i);
});
test('deletion requires typing exact DELETE and uses existing authenticated adapter', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /deleteAcknowledgement !== 'DELETE'/);
  assert.match(ui, /Type DELETE to confirm/);
  assert.match(ui, /await verifyAccount\(\);\s*const outcome = await softDeleteCloudProject\(client, action\.id, action\.expectedRevision\)/);
  assert.match(ui, /verified\.id !== identity\.id/);
});
test('successful deletion removes active item, invalidates deleted list and explains manual restore', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /setRecords\(current => current\.filter\(record => record\.id !== action\.id\)\)/);
  assert.match(ui, /setRecoveryEpoch\(current => current \+ 1\)/);
  assert.match(ui, /key=\{recoveryEpoch\}/);
  assert.match(ui, /Moved .* to Deleted cloud projects/);
});
test('conflicts, not_found and exceptions invalidate active list without retry', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /outcome\.status === 'conflict'/);
  assert.match(ui, /Delete cancelled:/);
  assert.match(ui, /setRecords\(\[\]\)/);
  assert.match(ui, /setHasListed\(false\)/);
  assert.match(ui, /Cloud Delete could not be confirmed/);
  assert.doesNotMatch(ui, /setTimeout|setInterval|retryDelete|automaticDelete/);
});
test('Cloud Delete cannot hard-delete rows or touch browser, audio, and local API', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  const flow = read('src/hosted/cloudDeleteFlow.js');
  const adapter = read('src/hosted/cloudMutations.js');
  for (const source of [ui,flow,adapter]) {
    assert.doesNotMatch(source, /\.delete\(|\.upsert\(|\.storage\.from\(|localStorage|sessionStorage|createApiProject|readApiProject/);
  }
  assert.match(adapter, /client\.rpc\(CLOUD_MUTATION_RPC\.delete, args\)/);
  assert.doesNotMatch(ui, /\.from\(['"]soulframe_projects/);
});
test('existing Save, Load, Update, and recovery UI remain wired', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /await saveCloudProject\(client, action\.snapshot\)/);
  assert.match(ui, /await loadCloudProject\(client, action\.id\)/);
  assert.match(ui, /await updateCloudProject\(client, action\.id, action\.expectedRevision, action\.snapshot\)/);
  assert.match(ui, /<CloudRecoveryPanel/);
  assert.match(read('src/hosted/CloudRecoveryPanel.jsx'), /restoreCloudProject\(client, intent\.id, intent\.expectedRevision\)/);
});
