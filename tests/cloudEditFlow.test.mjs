import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCloudUpdateIntent } from '../src/hosted/cloudEditFlow.js';
import { buildCloudUpdateArguments } from '../src/hosted/cloudMutationContract.js';

const ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const original = { id: ID, revision: 2, projectSession: { projectName: 'Saved cloud project' } };
const working = { projectName: 'Edited in workspace', producerNotes: 'Synthetic only' };

test('cloud edit intent retains the target id and the listed revision', () => {
  const intent = buildCloudUpdateIntent(original, working, 'draft', 'marcel');
  assert.equal(intent.kind, 'update');
  assert.equal(intent.id, ID);
  assert.equal(intent.expectedRevision, 2);
  assert.equal(intent.targetName, 'Saved cloud project');
  assert.equal(intent.sourceName, 'Edited in workspace');
});
test('cloud edit intent snapshots metadata instead of holding a live mutable workspace', () => {
  const project = { ...working };
  const intent = buildCloudUpdateIntent(original, project, 'draft', '');
  project.projectName = 'Later modification';
  assert.equal(intent.snapshot.projectSession.projectName, 'Edited in workspace');
  assert.equal(intent.snapshot.reviewMode, 'draft');
});
test('edit intent is compatible with exact ten-column database replacement', () => {
  const intent = buildCloudUpdateIntent(original, working, 'compare', 'marcel');
  const args = buildCloudUpdateArguments(intent.id, intent.expectedRevision, intent.snapshot);
  assert.equal(Object.keys(args.p_changes).length, 10);
  assert.equal(args.p_changes.project_name, 'Edited in workspace');
  assert.equal(args.p_changes.client_name, null);
  assert.equal(args.p_expected_revision, 2);
  assert.equal(args.p_changes.audio, undefined);
});
test('invalid record IDs and revisions reject the action before confirmation', () => {
  for (const record of [null, {}, { ...original, id: 'bad' }, { ...original, revision: 0 }, { ...original, revision: 2147483647 }]) {
    assert.throws(() => buildCloudUpdateIntent(record, working, 'draft', ''), /Refresh|Invalid|revision/i);
  }
});
test('invalid metadata and unexpected audio fields cannot enter the update snapshot', () => {
  assert.throws(() => buildCloudUpdateIntent(original, { ...working, audioBase64: 'private' }, 'draft', ''), /Unsupported/);
  assert.throws(() => buildCloudUpdateIntent(original, { projectName: ' ' }, 'draft', ''), /Project name/);
  assert.throws(() => buildCloudUpdateIntent(original, working, 'unsupported', ''), /review mode/);
});
test('missing active project is rejected', () => {
  assert.throws(() => buildCloudUpdateIntent(original, null, 'draft', ''), /unavailable/);
});
