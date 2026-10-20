import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fromHostedProjectRow, toHostedProjectInsert } from '../src/hosted/projectMapper.js';

const migration = readFileSync(new URL('../supabase/migrations/20261020000100_hosted_projects.sql', import.meta.url), 'utf8');
const catalogSmoke = readFileSync(new URL('../supabase/tests/hosted_projects_contract.sql', import.meta.url), 'utf8');
const base = { projectSession: { projectName: 'Test record', clientName: 'Demo only', producerNotes: 'Check groove.' }, reviewMode: 'draft' };

test('hosted mapper accepts only explicit metadata and DB-owned identity fields are absent', () => {
  const out = toHostedProjectInsert(base);
  assert.deepEqual(out, { project_name: 'Test record', review_mode: 'draft', selected_preset: '', client_name: 'Demo only', producer_notes: 'Check groove.' });
  for (const field of ['owner_id','id','revision','created_at','updated_at','audio']) assert.equal(Object.hasOwn(out, field), false);
});
test('hosted mapper rejects audio, unknown client notes and arbitrary root fields', () => {
  assert.throws(() => toHostedProjectInsert({ ...base, audioBase64: 'AAAA' }), /metadata/);
  assert.throws(() => toHostedProjectInsert({ projectSession: { projectName: 'Test', rawAudio: 'AAA' } }), /Unsupported/);
  assert.throws(() => toHostedProjectInsert({ projectSession: { projectName: 'Test', unknown: 'x' } }), /Unsupported/);
});
test('hosted mapper rejects invalid metadata and oversize notes', () => {
  assert.throws(() => toHostedProjectInsert({ projectSession: { projectName: '   ' } }), /Project name/);
  assert.throws(() => toHostedProjectInsert({ ...base, reviewMode: 'not-supported' }), /review mode/);
  assert.throws(() => toHostedProjectInsert({ projectSession: { projectName: 'X', producerNotes: 'a'.repeat(4001) } }), /producerNotes/);
  assert.throws(() => toHostedProjectInsert({ ...base, selectedPreset: 'a'.repeat(121) }), /Preset/);
});
test('hosted mapper reconstructs allowed metadata from a verified owner-scoped row', () => {
  const row = { id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa', revision: 1, project_name: 'Test', review_mode: 'compare', selected_preset: '', client_name: 'Demo' };
  const result = fromHostedProjectRow(row);
  assert.equal(result.id, row.id);
  assert.equal(result.revision, 1);
  assert.deepEqual(result.projectSession, { projectName: 'Test', clientName: 'Demo' });
});
test('hosted row mapper refuses invalid row revisions and project fields', () => {
  assert.throws(() => fromHostedProjectRow({ id: 'x', revision: 0, project_name: 'T' }), /Invalid/);
  assert.throws(() => fromHostedProjectRow({ id: 'x', revision: 1, project_name: '', review_mode: 'draft' }), /Project name/);
});
test('migration defines owner ID, read/create-only grants and RLS owner policies', () => {
  assert.match(migration, /alter table public\.soulframe_projects enable row level security;/);
  assert.match(migration, /default auth\.uid\(\) references auth\.users\(id\)/);
  assert.match(migration, /revoke all on table public\.soulframe_projects from public, anon, authenticated;/);
  assert.match(migration, /grant select on table public\.soulframe_projects to authenticated;/);
  assert.match(migration, /grant insert \(/);
  assert.match(migration, /using \(owner_id = \(select auth\.uid\(\)\)\)/);
  assert.match(migration, /with check \(owner_id = \(select auth\.uid\(\)\)\)/);
  assert.doesNotMatch(migration, /^\s*grant\s+(update|delete)\b/im);
});
test('hosted schema design checker passes and includes explicit warning', () => {
  const output = execFileSync(process.execPath, [fileURLToPath(new URL('../scripts/hosted-schema-check.mjs', import.meta.url))], { encoding: 'utf8' });
  assert.match(output, /PASS/);
  assert.match(output, /does NOT verify SQL execution/);
});
test('database smoke check verifies grants but does not claim multi-user authorization test', () => {
  assert.match(catalogSmoke, /has_table_privilege\('anon'/);
  assert.match(catalogSmoke, /has_column_privilege\('authenticated'/);
  assert.match(catalogSmoke, /pg_policies/);
});
test('V6.0.9 local API remains distinct from the unconnected hosted design', () => {
  const local = readFileSync(new URL('../server/index.mjs', import.meta.url), 'utf8');
  assert.match(local, /API_VERSION = 'v6\.0\.9'/);
  assert.match(local, /authentication: false/);
  assert.doesNotMatch(local, /supabase\/migrations|toHostedProjectInsert/);
});
