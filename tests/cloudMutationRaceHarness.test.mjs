import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertMutationRaceOutcome } from '../scripts/cloudMutationRaceAssertions.mjs';

const mock = status => ({ data: { status }, error: null });
const script = readFileSync(new URL('../scripts/verify-cloud-race-v614.mjs', import.meta.url), 'utf8');

test('mixed race allows update winner and stale deletion conflict', () => {
  assert.equal(assertMutationRaceOutcome(mock('ok'), mock('conflict')), 'update');
});
test('mixed race allows soft-delete winner and tombstone update rejection', () => {
  assert.equal(assertMutationRaceOutcome(mock('not_found'), mock('ok')), 'delete');
});
test('mixed race rejects two successful writes', () => {
  assert.throws(() => assertMutationRaceOutcome(mock('ok'), mock('ok')), /one winner/);
});
test('mixed race rejects two unsuccessful writes', () => {
  assert.throws(() => assertMutationRaceOutcome(mock('conflict'), mock('not_found')), /one winner/);
});
test('mixed race treats provider errors and malformed responses as failures', () => {
  assert.throws(() => assertMutationRaceOutcome({error:{code:'42501'},data:null},mock('conflict')), /RPC failed/);
  assert.throws(() => assertMutationRaceOutcome(mock('ok'),{data:null,error:null}), /RPC failed/);
});
test('live test requires explicit --live and help has no network connection', () => {
  const output = execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/verify-cloud-race-v614.mjs', import.meta.url)),'--help'], {encoding:'utf8'});
  assert.match(output, /--live/);
  assert.match(output, /OFFLINE/);
  assert.match(script, /args\[0\] !== '--live'/);
  assert.match(script, /persistSession: false/);
});
test('race targets only newly created synthetic ID without elevated credentials', () => {
  assert.match(script, /SF-V614-RACE-/);
  assert.match(script, /createdId = row\.id/);
  assert.match(script, /Promise\.all\(/);
  assert.match(script, /p_expected_revision: 1/);
  assert.doesNotMatch(script, /\.from\('soulframe_projects'\)\s*\.delete\(/);
  assert.doesNotMatch(script, /service_role|sb_secret_|auth\.admin\./);
});
