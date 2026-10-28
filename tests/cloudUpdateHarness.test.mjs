import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const scriptUrl = new URL('../scripts/verify-cloud-update-v614.mjs', import.meta.url);
const scriptPath = fileURLToPath(scriptUrl);
const source = readFileSync(scriptUrl, 'utf8');

test('V6.1.4 update harness is offline and inert by default', () => {
  const output = execFileSync(process.execPath, [scriptPath], { encoding: 'utf8' });
  assert.match(output, /--live/);
  assert.match(output, /disposable/i);
});

test('V6.1.4 update harness rejects unexpected CLI arguments without database access', () => {
  const result = spawnSync(process.execPath, [scriptPath, '--unsafe'], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Invalid arguments/);
});

test('V6.1.4 update harness is explicitly scoped to synthetic rows and two accounts', () => {
  assert.match(source, /validateOwnershipEnvironment/);
  assert.match(source, /requireVerifiedDifferentUsers/);
  assert.match(source, /SF-V614-UPDATE-/);
  assert.match(source, /p_expected_revision: 1/);
  assert.match(source, /p_expected_revision: 2/);
  assert.match(source, /'conflict'/);
  assert.match(source, /'not_found'/);
  assert.doesNotMatch(source, /\.rpc\(['"]sf_delete_project_if_revision/);
  assert.doesNotMatch(source, /\.auth\.admin\.|service_role|sb_secret_/);
});
