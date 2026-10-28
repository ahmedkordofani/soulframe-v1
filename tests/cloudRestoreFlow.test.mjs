import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCloudRestoreIntent } from '../src/hosted/cloudRestoreFlow.js';

const id = '12345678-1234-4234-8234-123456789abc';
const row = () => ({ id, revision: 3, project_name: 'SF-V614-RESTORE-DEMO', deleted_at: '2026-10-28T09:00:00Z' });

test('restore intent captures exactly the listed project ID and current revision', () => {
  assert.deepEqual(buildCloudRestoreIntent(row()), {
    kind: 'restore', id, expectedRevision: 3, name: 'SF-V614-RESTORE-DEMO', deletedAt: '2026-10-28T09:00:00Z',
  });
});
test('intent is immutable and carries no project notes, owner, or audio', () => {
  const intent = buildCloudRestoreIntent({ ...row(), owner_id: id, producer_notes: 'private', audio: 'blob' });
  assert.ok(Object.isFrozen(intent));
  assert.deepEqual(Object.keys(intent).sort(), ['deletedAt', 'expectedRevision', 'id', 'kind', 'name']);
  assert.throws(() => { intent.expectedRevision = 8; }, TypeError);
});
test('changing the original row after confirmation does not change the intent', () => {
  const r = row(); const intent = buildCloudRestoreIntent(r);
  r.revision = 4; r.project_name = 'different';
  assert.equal(intent.expectedRevision, 3);
  assert.equal(intent.name, 'SF-V614-RESTORE-DEMO');
});
test('missing and invalid IDs are rejected', () => {
  for (const value of ['', undefined, 'not-a-uuid', null]) {
    assert.throws(() => buildCloudRestoreIntent({ ...row(), id: value }), /identifier/);
  }
});
test('zero, negative, fractional, and overflow revisions are rejected', () => {
  for (const value of [0, -1, 1.5, Number.MAX_SAFE_INTEGER, 2147483647]) {
    assert.throws(() => buildCloudRestoreIntent({ ...row(), revision: value }), /revision/);
  }
});
test('undefined, empty, and oversized project names are rejected', () => {
  for (const value of [null, '', '   ', 'x'.repeat(501)]) {
    assert.throws(() => buildCloudRestoreIntent({ ...row(), project_name: value }), /Refresh deleted/);
  }
});
test('deleted timestamp must be a valid parseable date string', () => {
  for (const value of [undefined, null, 'not-a-date']) {
    assert.throws(() => buildCloudRestoreIntent({ ...row(), deleted_at: value }), /Refresh deleted/);
  }
});
test('arrays or null cannot masquerade as deleted project rows', () => {
  for (const value of [[], null, undefined, 123]) {
    assert.throws(() => buildCloudRestoreIntent(value));
  }
});
