// Offline design guards only. They do NOT execute SQL, test SQL correctness or prove RLS.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CLOUD_MUTATION_RPC, CLOUD_MUTABLE_COLUMNS } from '../src/hosted/cloudMutationContract.js';

const migration = readFileSync(new URL('../supabase/migrations/20261026000100_revision_safe_cloud_mutations.sql', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../supabase/tests/revision_safe_cloud_mutations_contract.sql', import.meta.url), 'utf8');
const oldMigration = readFileSync(new URL('../supabase/migrations/20261020000100_hosted_projects.sql', import.meta.url), 'utf8');
const liveCloud = readFileSync(new URL('../src/hosted/cloudProjects.js', import.meta.url), 'utf8');
const liveUi = readFileSync(new URL('../src/hosted/CloudProjectManager.jsx', import.meta.url), 'utf8');

// These tests deliberately check only targeted invariants, NOT arbitrary SQL grammar.
test('migration is separate from V6.1.0 and not automatically run by the app', () => {
  assert.match(migration, /begin;/i);
  assert.match(migration, /commit;/i);
  assert.match(oldMigration, /check \(revision = 1\)/);
  assert.doesNotMatch(liveCloud, /sf_update_project_if_revision|sf_delete_project_if_revision|\.rpc\(/);
  // V6.1.4 Step 3.3 now intentionally exposes confirmed, revision-checked Update.
  // The confirmed cloud Delete path uses the revision-checked RPC only.
  assert.match(liveUi, /await updateCloudProject\(client, action\.id, action\.expectedRevision, action\.snapshot\)/);
  assert.match(liveUi, /await softDeleteCloudProject\(client, action\.id, action\.expectedRevision\)/);
  assert.doesNotMatch(liveUi, /confirm cloud overwrite|\bdeleteCloudProject\b|\.delete\(|\.update\(|\.upsert\(/i);
});

test('original revision check is intentionally replaced, without weakening positive revision requirement', () => {
  assert.match(migration, /drop constraint soulframe_projects_revision_check;/);
  assert.match(migration, /add constraint soulframe_projects_revision_check check \(revision >= 1\);/);
  assert.doesNotMatch(migration, /grant\s+(?:update|delete)\s+on\s+table\s+public\.soulframe_projects/i);
});

test('deletion is reversible in principle: timestamp tombstone and hidden owner SELECT', () => {
  assert.match(migration, /add column deleted_at timestamptz;/);
  assert.match(migration, /owner_id = \(select auth\.uid\(\)\) and deleted_at is null/);
  assert.doesNotMatch(migration, /^\s*delete\s+from\s+public\.soulframe_projects/im);
  assert.match(migration, /set deleted_at = pg_catalog\.clock_timestamp\(\)/);
});

test('two private implementations use SECURITY DEFINER and blank search path', () => {
  assert.equal((migration.match(/create function soulframe_private\.sf_(?:update|delete)_project_if_revision\(/g) || []).length, 2);
  assert.equal((migration.match(/security definer\s+set search_path = ''/gi) || []).length, 2);
  assert.equal((migration.match(/security invoker\s+set search_path = ''/gi) || []).length, 2);
  assert.match(migration, /create schema soulframe_private;/);
  assert.match(migration, /revoke all on schema soulframe_private from public, anon, authenticated;/);
});

test('RPC names match the verified Step 1 request contract', () => {
  for (const rpc of Object.values(CLOUD_MUTATION_RPC)) {
    assert.match(migration, new RegExp(`create function public\\.${rpc}\\(`));
    assert.match(migration, new RegExp(`create function soulframe_private\\.${rpc}\\(`));
  }
});

test('all mutable metadata columns are handled explicitly by SQL update', () => {
  for (const column of CLOUD_MUTABLE_COLUMNS) {
    assert.match(migration, new RegExp(`\\b${column} = p_changes->>'${column}'`));
  }
  assert.match(migration, /Unexpected or missing project metadata field/);
  assert.match(migration, /jsonb_typeof/);
  assert.match(migration, /Invalid required project metadata/);
  assert.match(migration, /Invalid optional project metadata/);
});

test('atomic owner+revision matching guards both update and soft delete', () => {
  const matches = migration.match(/where p\.id = p_project_id\s+and p\.owner_id = v_user\s+and p\.deleted_at is null\s+and p\.revision = p_expected_revision/g) || [];
  assert.equal(matches.length, 2);
  assert.equal((migration.match(/revision = p\.revision \+ 1/g) || []).length, 2);
  assert.match(migration, /'status', 'conflict'/);
  assert.match(migration, /'status', 'not_found'/);
});

test('anonymous RPC execution denied, authenticated only explicitly granted', () => {
  assert.match(migration, /revoke all on function public\.sf_update_project_if_revision\(uuid, integer, jsonb\) from public, anon, authenticated;/);
  assert.match(migration, /revoke all on function public\.sf_delete_project_if_revision\(uuid, integer\) from public, anon, authenticated;/);
  assert.match(migration, /grant execute on function public\.sf_update_project_if_revision\(uuid, integer, jsonb\) to authenticated;/);
  assert.match(migration, /grant execute on function public\.sf_delete_project_if_revision\(uuid, integer\) to authenticated;/);
  assert.match(migration, /revoke update, delete on table public\.soulframe_projects from public, anon, authenticated;/);
});

test('read-only catalog checks enforce grants, function modes, and deleted row policy', () => {
  assert.match(catalog, /has_function_privilege\('anon'/);
  assert.match(catalog, /has_table_privilege\('authenticated'/);
  assert.match(catalog, /has_column_privilege\('authenticated'/);
  assert.match(catalog, /prosecdef/);
  assert.match(catalog, /search_path=/);
  assert.match(catalog, /sf_projects_select_own/);
});


test('successful update returns an explicit vetted 15-column project projection', () => {
  assert.doesNotMatch(migration, /\b(?:to_jsonb|row_to_json)\s*\(\s*v_row\s*\)/i);
  const start = migration.indexOf("'project', pg_catalog.jsonb_build_object(");
  assert.ok(start !== -1, 'Expected explicit project projection in update RPC');
  const projection = migration.slice(start, migration.indexOf('\n      )\n    );', start));
  const columns = [
    'id', 'owner_id', 'project_name', 'client_name', 'track_type', 'ai_tool',
    'current_stage', 'main_concern', 'client_goal', 'producer_notes',
    'review_mode', 'selected_preset', 'revision', 'created_at', 'updated_at',
  ];
  for (const col of columns) {
    assert.match(projection, new RegExp(`'${col}', v_row\\.${col}\\b`));
  }
  assert.equal((projection.match(/'[^']+', v_row\./g) || []).length, columns.length);
  assert.doesNotMatch(projection, /'deleted_at'|audio|analysis/i);
});

// Regression for live PostgreSQL pg_proc.proconfig representation observed
// during V6.1.4 catalog preflight. This test is static; the SQL Editor must
// also execute the corrected read-only checker against the test database.
test('catalog preflight accepts only canonical empty search_path representations', () => {
  assert.match(catalog, /cfg\.setting in \('search_path=', 'search_path=""'\)/);
  assert.match(catalog, /cfg\.setting like 'search_path=%'/);
  assert.match(catalog, /cfg\.setting not in \('search_path=', 'search_path=""'\)/);
  assert.match(catalog, /if not exists \(/);
  assert.match(catalog, /or exists \(/);
});
