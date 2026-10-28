import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('V6.1.3 cloud Save, Refresh and Load require explicit button clicks and confirmation', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /onClick={requestSave}/);
  assert.match(ui, /onClick={refreshCloudProjects}/);
  assert.match(ui, /onClick={confirmAction}/);
  assert.match(ui, /setPending\(\{ kind: 'load', id: record\.id \}\)/);
  assert.match(ui, /pending\.kind === 'save'/);
  assert.match(ui, /Save unsaved work first/);
  assert.match(ui, /const saved = await saveCloudProject\(client, action\.snapshot\)/);
  assert.match(ui, /const loaded = await loadCloudProject\(client, action\.id\)/);
});

test('cloud project list remains opt-in and Delete uses only the confirmed RPC', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /await listCloudProjects\(client\)/);
  assert.match(ui, /\bupdateCloudProject\b/);
  assert.match(ui, /await softDeleteCloudProject\(client, action\.id, action\.expectedRevision\)/);
  assert.doesNotMatch(ui, /\b(?:deleteCloudProject|upsertCloudProject)\b/);
  assert.doesNotMatch(ui, /\.storage\.from\(/);
  assert.doesNotMatch(ui, /createApiProject|readApiProject|setLocalAccessToken/);
  const effect = ui.match(/useEffect\(\(\) => \{[\s\S]*?\}, \[\]\);/)?.[0] || '';
  assert.ok(effect);
  assert.doesNotMatch(effect, /listCloudProjects|saveCloudProject|loadCloudProject/);
});

test('cloud UI is only mounted for a signed-in identity and reset on account changes', () => {
  const panel = read('src/hosted/HostedIdentityPanel.jsx');
  assert.match(panel, /phase === 'signed-in' && identity && client && \(/);
  assert.match(panel, /<CloudProjectManager/);
  assert.match(panel, /key={identity\.id}/);
  assert.match(panel, /await signOutIdentity\(client\)/);
  assert.match(panel, /setIdentity\(null\)/);
  assert.doesNotMatch(panel, /localStorage\./);
});

test('delayed cloud operations cannot replace current project after sign-out', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /mounted\.current = false/);
  assert.match(ui, /if \(!mounted\.current\) return;\s*onLoadProject\(loaded\)/);
  assert.match(ui, /onLoadProject\(loaded\)/);
});

test('App uses same load handler for cloud and local API, clearing all browser audio and analyses', () => {
  const app = read('src/App.jsx');
  assert.match(app, /<HostedIdentityPanel projectSession={projectSession} reviewMode={reviewMode} selectedPreset={selectedPreset} onLoadProject={applyStoredProject}/);
  assert.match(app, /<ApiProjectManager[\s\S]*?onLoadProject={applyStoredProject}/);
  const shared = app.split('function applyStoredProject(record) {')[1]?.split('\n  }')[0] || '';
  for (const step of [
    'setProjectSession(', 'setReviewMode(', 'setSelectedPreset(',
    'setDraftFile("")', 'setHumanizedFile("")',
    'setDraftAudioUrl("")', 'setHumanizedAudioUrl("")',
    'setDraftAudioMetadata(null)', 'setHumanizedAudioMetadata(null)',
    'setDraftAudioAnalysis(null)', 'setHumanizedAudioAnalysis(null)',
    'setActiveStep(0)',
  ]) assert.ok(shared.includes(step), `Missing shared reset: ${step}`);
});

test('cloud upload remains metadata-only; local API and browser session mechanisms stay distinct', () => {
  const ui = read('src/hosted/CloudProjectManager.jsx');
  assert.match(ui, /projectSession: \{ \.\.\.projectSession \}/);
  const hosted = read('src/hosted/cloudProjects.js');
  assert.match(hosted, /toHostedProjectInsert\(projectMetadata\)/);
  assert.match(hosted, /readVerifiedIdentity\(client\)/);
  assert.doesNotMatch(hosted, /\.(?:update|delete|upsert)\(/);
  assert.match(read('src/session/sessionStorage.js'), /soulframe-saved-projects/);
  assert.match(read('src/api/ApiProjectManager.jsx'), /createApiProject/);
});
