import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCloudDeleteIntent } from '../src/hosted/cloudDeleteFlow.js';

const ID = '12345678-1234-4234-8234-123456789abc';
const row = () => ({ id: ID, revision: 4, projectSession: { projectName: 'SF-V614-DELETE-UI-TEST', producerNotes: 'not copied' }, audio: 'not copied' });

test('delete intent freezes the owner-listed ID, revision, and display name only', () => {
  assert.deepEqual(buildCloudDeleteIntent(row()), {
    kind: 'delete', id: ID, expectedRevision: 4, name: 'SF-V614-DELETE-UI-TEST',
  });
});
test('delete intent is immutable; future list changes do not affect it', () => {
  const r = row(); const intent = buildCloudDeleteIntent(r);
  assert.ok(Object.isFrozen(intent));
  r.revision = 99; r.projectSession.projectName = 'CHANGED';
  assert.equal(intent.expectedRevision, 4);
  assert.equal(intent.name, 'SF-V614-DELETE-UI-TEST');
  assert.throws(() => { intent.expectedRevision = 99; }, TypeError);
});
test('delete intent cannot contain audio, notes, credentials or arbitrary metadata', () => {
  assert.deepEqual(Object.keys(buildCloudDeleteIntent(row())).sort(), ['expectedRevision','id','kind','name']);
});
test('delete rejects missing, invalid, and non-UUID project identifiers', () => {
  for (const id of ['', undefined, null, 'not-uuid']) {
    assert.throws(() => buildCloudDeleteIntent({ ...row(), id }), /identifier/);
  }
});
test('delete rejects missing, zero, negative, fractional, and overflowing revisions', () => {
  for (const revision of [undefined, 0, -1, 1.5, 2147483647, Number.MAX_SAFE_INTEGER]) {
    assert.throws(() => buildCloudDeleteIntent({ ...row(), revision }), /revision/);
  }
});
test('delete rejects missing, empty, whitespace or oversized names', () => {
  for (const projectName of [null, '', '   ', 'x'.repeat(501)]) {
    assert.throws(() => buildCloudDeleteIntent({ ...row(), projectSession: { projectName } }), /Refresh cloud projects/);
  }
});
test('delete rejects invalid record shape', () => {
  for (const value of [null, undefined, [], 7, {}, { ...row(), projectSession: null }]) {
    assert.throws(() => buildCloudDeleteIntent(value));
  }
});
