import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('deleted-project panel requires explicit refresh, no automatic fetch in effect', () => {
  const ui = read('src/hosted/CloudRecoveryPanel.jsx');
  assert.match(ui, /onClick={refreshDeleted}/);
  assert.match(ui, /await listDeletedCloudProjects\(client\)/);
  const effect = ui.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/)?.[0] || '';
  assert.ok(effect);
  assert.doesNotMatch(effect, /listDeletedCloudProjects|restoreCloudProject|refreshDeleted/);
});
test('restore uses a frozen target from listing and requires explicit confirmation', () => {
  const ui = read('src/hosted/CloudRecoveryPanel.jsx');
  assert.match(ui, /setPending\(buildCloudRestoreIntent\(record\)\)/);
  assert.match(ui, /onClick={confirmRestore}/);
  assert.match(ui, /Restore deleted cloud project/);
  assert.match(ui, /pending\.expectedRevision/);
  assert.match(ui, /onClick=\{\(\) => setPending\(null\)\}/);
});
test('client operation uses the confirmed ID/revision and checks verified account', () => {
  const ui = read('src/hosted/CloudRecoveryPanel.jsx');
  assert.match(ui, /await verifyAccount\(\)/);
  assert.match(ui, /verified\.id !== identity\.id/);
  assert.match(ui, /restoreCloudProject\(client, intent\.id, intent\.expectedRevision\)/);
  assert.match(ui, /if \(!mounted\.current\) return/);
});
test('conflicts and provider failures invalidate stale deleted lists without retrying', () => {
  const ui = read('src/hosted/CloudRecoveryPanel.jsx');
  assert.match(ui, /outcome\.status === 'conflict'/);
  assert.match(ui, /setDeleted\(\[\]\)/);
  assert.match(ui, /setHasListed\(false\)/);
  assert.doesNotMatch(ui, /setTimeout|setInterval|retryCloudRestore|\.storage\.from\(/);
});
test('restore UI has no Delete action, direct table mutation, or local API coupling', () => {
  const ui = read('src/hosted/CloudRecoveryPanel.jsx');
  assert.doesNotMatch(ui, /deleteCloudProject|softDeleteCloudProject|\.from\(['"]soulframe_projects|\.storage\.from\(/);
  assert.doesNotMatch(ui, /createApiProject|readApiProject|localStorage|sessionStorage|window\.confirm/);
});
test('mount script inserts recovery panel below the active cloud list', () => {
  const src = read('scripts/apply-v614-step320.mjs');
  assert.match(src, /CloudRecoveryPanel/);
  assert.match(src, /setHasListed\(false\)/);
  assert.match(src, /Step 3\.3 Cloud Edit UI is missing/);
  assert.doesNotMatch(src, /\.rpc\(|\.from\(/);
});
