import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  OWNERSHIP_TABLE, TEST_RECORD_PREFIX, validateOwnershipEnvironment,
  requireVerifiedDifferentUsers, assertPermissionDenied,
  assertRowVisible, assertRowHidden, assertCreated,
} from '../src/hosted/ownershipContract.js';

const good = {
  SOULFRAME_TEST_SUPABASE_URL: 'https://test-project.supabase.co',
  SOULFRAME_TEST_PUBLISHABLE_KEY: 'sb_publishable_test_key_1234',
  SOULFRAME_TEST_USER_A_EMAIL: 'a@example.com',
  SOULFRAME_TEST_USER_A_PASSWORD: 'password-A-not-real',
  SOULFRAME_TEST_USER_B_EMAIL: 'b@example.com',
  SOULFRAME_TEST_USER_B_PASSWORD: 'password-B-not-real',
};

test('RLS verification targets the intended metadata-only table', () => {
  assert.equal(OWNERSHIP_TABLE, 'soulframe_projects');
  assert.equal(TEST_RECORD_PREFIX, 'SF-RLS-VERIFY-');
});
test('missing configuration cannot turn into a live test', () => {
  assert.throws(() => validateOwnershipEnvironment({}), /Missing test configuration/);
});
test('valid config accepts publishable key and two distinct users', () => {
  const config = validateOwnershipEnvironment(good);
  assert.equal(config.url, good.SOULFRAME_TEST_SUPABASE_URL);
  assert.equal(config.users.length, 2);
});
test('secret, service-role and legacy keys are rejected', () => {
  for (const key of ['sb_secret_123', 'eyJhbGciOiJIUzI1NiJ9', 'service_role', 'test-key']) {
    assert.throws(() => validateOwnershipEnvironment({ ...good, SOULFRAME_TEST_PUBLISHABLE_KEY: key }), /publishable/);
  }
});
test('insecure external URL and URL credentials are rejected', () => {
  for (const url of ['http://remote.example.com', 'https://person:password@remote.example.com', 'https://remote.example.com/something']) {
    assert.throws(() => validateOwnershipEnvironment({ ...good, SOULFRAME_TEST_SUPABASE_URL: url }), /HTTPS/);
  }
});
test('local Supabase loopback can be used for an isolated test instance', () => {
  assert.equal(validateOwnershipEnvironment({ ...good, SOULFRAME_TEST_SUPABASE_URL: 'http://127.0.0.1:54321' }).url, 'http://127.0.0.1:54321');
});
test('same user account or invalid addresses are rejected', () => {
  assert.throws(() => validateOwnershipEnvironment({ ...good, SOULFRAME_TEST_USER_B_EMAIL: 'A@EXAMPLE.COM' }), /two different/);
  assert.throws(() => validateOwnershipEnvironment({ ...good, SOULFRAME_TEST_USER_A_EMAIL: 'invalid' }), /two different/);
});
test('unverified or same user identities fail closed', () => {
  assert.throws(() => requireVerifiedDifferentUsers({id:'abc'}, {id:'abc'}), /Two separate/);
  assert.throws(() => requireVerifiedDifferentUsers({id:'abc'}, null), /Two separate/);
  assert.doesNotThrow(() => requireVerifiedDifferentUsers({id:'abc'}, {id:'def'}));
});
test('only explicit 42501 privilege denial counts as protected', () => {
  assert.doesNotThrow(() => assertPermissionDenied({ error: { code: '42501' } }, 'write'));
  for (const result of [{ error: null }, { error: { code: 'PGRST116' } }, { error: { code: '23502' } }, { error: { code: '42P01' } }]) {
    assert.throws(() => assertPermissionDenied(result, 'write'), /expected database permission denied/);
  }
});
test('owner read must return exactly one matching row', () => {
  const data = [{id:'rowA',owner_id:'A'}];
  assert.doesNotThrow(() => assertRowVisible({data,error:null}, 'rowA','A','own'));
  assert.throws(() => assertRowVisible({data,error:null}, 'rowB','A','own'), /not returned/);
  assert.throws(() => assertRowVisible({data:[...data,...data],error:null}, 'rowA','A','own'), /not returned/);
});
test('cross-account read must be completely empty', () => {
  assert.doesNotThrow(() => assertRowHidden({data:[],error:null},'cross'));
  assert.throws(() => assertRowHidden({data:[{id:'other'}],error:null},'cross'), /visible/);
  assert.throws(() => assertRowHidden({data:null,error:{code:'42501'}},'cross'), /visible/);
});
test('database must generate owner, ID and initial revision', () => {
  assert.deepEqual(assertCreated({data:{id:'1',owner_id:'A',revision:1,project_name:'SF test'},error:null},'A','SF test','create'),
    {id:'1',owner_id:'A',revision:1,project_name:'SF test'});
  assert.throws(() => assertCreated({data:{id:'1',owner_id:'B',revision:1,project_name:'SF test'},error:null},'A','SF test','create'), /owner-scoped/);
});
test('live checker requires an explicit --live argument', () => {
  const script = readFileSync(new URL('../scripts/verify-hosted-ownership.mjs', import.meta.url), 'utf8');
  assert.match(script, /args\[0\] !== '--live'/);
  assert.match(script, /persistSession: false/);
  assert.doesNotMatch(script, /SOULFRAME_SERVICE_ROLE_KEY|VITE_SUPABASE_SECRET_KEY|\.auth\.admin\./); // no privileged credentials or admin SDK calls
});
