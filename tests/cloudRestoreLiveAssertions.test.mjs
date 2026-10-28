import test from 'node:test';
import assert from 'node:assert/strict';
import { checkRestoreResponse, requireOwnerActiveProject, requireNoVisibleProject, requireTombstoneAbsent } from '../scripts/lib/restoreLiveAssertions.mjs';
const id = 'b99e80ef-0996-4c0a-bd67-a0beeb38e0d9';
const owner = 'verified-user';
const name = 'SF-V614-DELETE-01556940-ebb';
const success = {data:{status:'ok',id,revision:4},error:null};
const response = status => ({data:{status},error:null});
const record = {data:[{id,owner_id:owner,project_name:name,revision:4}],error:null};

test('accepts exact successful restore response with stable id and incremented revision', () => {
  assert.equal(checkRestoreResponse(success,'ok',id,4).revision,4);
});
test('rejects a success response with wrong ID or revision', () => {
  assert.throws(() => checkRestoreResponse(success,'ok','f421cbbd-ed30-442f-80e5-60a0dc2510df',4), /allowlist/);
  assert.throws(() => checkRestoreResponse(success,'ok',id,3), /allowlist/);
});
test('rejects success responses that leak additional columns', () => {
  assert.throws(() => checkRestoreResponse({data:{...success.data,owner_id:owner},error:null},'ok',id,4), /allowlist/);
});
test('accepts exact conflict and not_found status without metadata', () => {
  assert.equal(checkRestoreResponse(response('conflict'),'conflict').status,'conflict');
  assert.equal(checkRestoreResponse(response('not_found'),'not_found').status,'not_found');
});
test('rejects unsuccessful response with metadata leakage', () => {
  assert.throws(() => checkRestoreResponse(response('not_found'), 'conflict'), /expected/);
  assert.throws(() => checkRestoreResponse({data:{status:'conflict',id},error:null},'conflict'), /disclosed/);
});
test('rejects malformed and provider-error responses', () => {
  assert.throws(() => checkRestoreResponse({data:null,error:{code:'42501'}},'ok',id,4), /RPC/);
  assert.throws(() => checkRestoreResponse({data:[],error:null},'ok',id,4), /expected/);
});
test('validates preserved owner, ID, name and revision on normal owner SELECT', () => {
  assert.doesNotThrow(() => requireOwnerActiveProject(record,id,owner,name,4));
});
test('rejects wrong identity, wrong revision, absent record, and data leakage in SELECT', () => {
  assert.throws(() => requireOwnerActiveProject(record,id,'other',name,4), /preserve/);
  assert.throws(() => requireOwnerActiveProject(record,id,owner,name,5), /preserve/);
  assert.throws(() => requireOwnerActiveProject({data:[],error:null},id,owner,name,4), /visible/);
  assert.throws(() => requireOwnerActiveProject({data:[{...record.data[0],private_notes:'bad'}],error:null},id,owner,name,4), /preserve/);
});
test('cross-account SELECT requires zero visible rows without errors', () => {
  assert.doesNotThrow(() => requireNoVisibleProject({data:[],error:null},'B'));
  assert.throws(() => requireNoVisibleProject(record,'B'), /unexpected/);
  assert.throws(() => requireNoVisibleProject({data:[],error:{code:'PGRST'}},'B'), /unexpected/);
});
test('restored record must be absent from deleted listings', () => {
  assert.doesNotThrow(() => requireTombstoneAbsent([],id));
  assert.throws(() => requireTombstoneAbsent([{id}],id), /still appears/);
});
