import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const scriptUrl = new URL('../scripts/verify-cloud-soft-delete-v614.mjs', import.meta.url);
const scriptPath = fileURLToPath(scriptUrl);
const source = readFileSync(scriptUrl, 'utf8');

test('soft-delete harness is inert and offline without --live', () => {
  const output = execFileSync(process.execPath, [scriptPath], { encoding: 'utf8' });
  assert.match(output, /--live/);
  assert.match(output, /disposable/i);
});

test('soft-delete harness rejects extra arguments without network access', () => {
  const result = spawnSync(process.execPath, [scriptPath, '--unexpected'], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /Invalid arguments/);
});

test('soft-delete harness always provisions a uniquely named synthetic record', () => {
  assert.match(source, /randomUUID/);
  assert.match(source, /SF-V614-DELETE-/);
  assert.match(source, /createdId\s*=\s*row\.id/);
  assert.match(source, /p_project_id:\s*createdId/g);
  assert.doesNotMatch(source, /\.delete\(\)\s*\.eq\(['"]project_name/);
});

test('soft-delete harness checks signed-in owner, stale revision and blocked direct mutations', () => {
  assert.match(source, /validateOwnershipEnvironment/);
  assert.match(source, /requireVerifiedDifferentUsers/);
  assert.match(source, /accounts\[1\]\.rpc\('sf_delete_project_if_revision'/);
  assert.match(source, /'conflict', 'stale revision-1 deletion'/);
  assert.match(source, /'42501', 'direct table DELETE remains denied'/);
  assert.match(source, /'42501', 'direct table UPDATE remains denied'/);
});

test('soft-delete harness protects tombstone and does not hard-delete', () => {
  assert.match(source, /'not_found', 'second delete on tombstone'/);
  assert.match(source, /'not_found', 'update on tombstone'/);
  assert.match(source, /tombstone is hidden from owner normal SELECT/);
  assert.match(source, /p_expected_revision: 2/);
  assert.doesNotMatch(source, /\.auth\.admin\.|service_role|sb_secret_/);
  assert.doesNotMatch(source, /TRUNCATE|drop\s+table|\.storage\.from\(/i);
});

test('tombstone verification SQL remains read-only', () => {
  const sql = readFileSync(new URL('../supabase/tests/verify_v614_soft_delete_tombstone.sql', import.meta.url), 'utf8');
  assert.match(sql, /select\s+project_name/i);
  assert.match(sql, /deleted_at\s+is\s+not\s+null/i);
  assert.match(sql, /SF-V614-DELETE-/);
  assert.doesNotMatch(sql, /\b(insert|update|delete|truncate|drop|alter|grant|revoke)\s+(?:into|from|table|schema|function|on)?\b/i);
});
