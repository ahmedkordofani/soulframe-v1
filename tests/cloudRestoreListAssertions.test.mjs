import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeletedList, requireOwnedTestTombstone, requireHiddenFromOtherAccount, TEST_TOMBSTONE_NAME } from '../scripts/lib/restoreListAssertions.mjs';
const id = 'b99e80ef-0996-4c0a-bd67-a0beeb38e0d9';
const row = { id, project_name: TEST_TOMBSTONE_NAME, revision: 3, deleted_at: '2026-10-26T10:00:13.359951+00:00' };
const ok = projects => ({ data: {status:'ok',projects},error:null });

test('accepts the minimal, owner-scoped deleted-project list contract', () => {
  assert.deepEqual(parseDeletedList(ok([row])), [row]);
});
test('accepts an empty account-specific deleted-project list', () => {
  assert.deepEqual(parseDeletedList(ok([])), []);
});
test('rejects API/provider errors and malformed envelopes', () => {
  assert.throws(() => parseDeletedList({data:null,error:{code:'42501'}}), /RPC request failed/);
  assert.throws(() => parseDeletedList({data:{status:'ok',projects:null},error:null}), /unexpected RPC/);
  assert.throws(() => parseDeletedList({data:{status:'ok',projects:[],owner_id:'secret'},error:null}), /unexpected RPC/);
});
test('rejects metadata fields exceeding the delete-list allowlist', () => {
  assert.throws(() => parseDeletedList(ok([{...row,client_name:'private'}])), /overly broad/);
  assert.throws(() => parseDeletedList(ok([{...row,producer_notes:'private'}])), /overly broad/);
});
test('rejects invalid project identities, revisions and timestamps', () => {
  assert.throws(() => parseDeletedList(ok([{...row,id:'not-uuid'}])), /invalid/);
  assert.throws(() => parseDeletedList(ok([{...row,revision:0}])), /invalid/);
  assert.throws(() => parseDeletedList(ok([{...row,deleted_at:null}])), /invalid/);
});
test('requires one exact test tombstone with revision 3', () => {
  assert.equal(requireOwnedTestTombstone([row]).id,id);
  assert.throws(() => requireOwnedTestTombstone([]), /absent/);
  assert.throws(() => requireOwnedTestTombstone([{...row,revision:4}]), /unexpected revision/);
});
test('rejects cross-account disclosure, allowing unrelated Account B tombstones', () => {
  const other = {...row,id:'f421cbbd-ed30-442f-80e5-60a0dc2510df',project_name:'B-owned-test'};
  assert.doesNotThrow(() => requireHiddenFromOtherAccount([other],id));
  assert.throws(() => requireHiddenFromOtherAccount([row],id), /exposed/);
  assert.throws(() => requireHiddenFromOtherAccount([{...row,id:other.id}],id), /exposed/);
});
