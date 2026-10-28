import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261027000100_cloud_restore_functions.sql', import.meta.url), 'utf8');
const policy = readFileSync(new URL('../docs/v6-cloud-restore-db-design.md', import.meta.url), 'utf8');
const catalog = readFileSync(new URL('../supabase/tests/verify_cloud_restore_catalog.sql', import.meta.url), 'utf8');
const normalized = sql.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ');

function definition(schema, name) {
  const delim = name === 'sf_list_deleted_projects' ? /\$sf_list_deleted\$/ : /\$sf_restore\$/;
  const rx = new RegExp(`create function ${schema}\\.${name}\\([\\s\\S]*?\\)\\s*returns jsonb[\\s\\S]*?as (\\$[a-z_]+\\$)[\\s\\S]*?\\1;`, 'i');
  const match = normalized.match(rx);
  assert.ok(match, `Missing ${schema}.${name}`);
  return match[0];
}

test('candidate migration is transactional and explicitly review-only', () => {
  assert.match(sql, /REVIEW-ONLY, NOT APPLIED/);
  assert.match(normalized, /\bbegin\s*;/i);
  assert.match(normalized, /\bcommit\s*;/i);
});

test('private list and restore functions are SECURITY DEFINER with an empty search path', () => {
  for (const name of ['sf_list_deleted_projects', 'sf_restore_project_if_revision']) {
    const body = definition('soulframe_private', name);
    assert.match(body, /security definer/i);
    assert.match(body, /set search_path = ''/i);
  }
});

test('both private functions check authenticated role and current authenticated user', () => {
  for (const name of ['sf_list_deleted_projects', 'sf_restore_project_if_revision']) {
    const body = definition('soulframe_private', name);
    assert.match(body, /auth\.role\(\)/);
    assert.match(body, /auth\.uid\(\)/);
    assert.match(body, /'42501'/);
  }
});

test('deleted list is owner-scoped, tombstones only, and capped at 24', () => {
  const body = definition('soulframe_private', 'sf_list_deleted_projects');
  assert.match(body, /p\.owner_id = v_user/);
  assert.match(body, /p\.deleted_at is not null/);
  assert.match(body, /limit 24/);
  assert.match(body, /'projects'/);
});

test('deleted list returns an explicit minimal four-field row and no client notes', () => {
  const body = definition('soulframe_private', 'sf_list_deleted_projects');
  const row = body.match(/pg_catalog\.jsonb_build_object\(\s*'id', d\.id,[\s\S]*?\)/i)?.[0];
  assert.ok(row, 'Missing explicit list object');
  for (const field of ["'id'", "'project_name'", "'revision'", "'deleted_at'"]) assert.ok(row.includes(field));
  assert.doesNotMatch(row, /owner_id|client_name|producer_notes|audio|to_jsonb/i);
  assert.doesNotMatch(body, /select p\.\*/i);
});

test('restore uses one atomic compare-and-swap on owner, tombstone, id and revision', () => {
  const body = definition('soulframe_private', 'sf_restore_project_if_revision');
  assert.match(body, /update public\.soulframe_projects as p/i);
  assert.match(body, /set deleted_at = null/i);
  assert.match(body, /revision = p\.revision \+ 1/i);
  assert.match(body, /p\.id = p_project_id/i);
  assert.match(body, /p\.owner_id = v_user/i);
  assert.match(body, /p\.deleted_at is not null/i);
  assert.match(body, /p\.revision = p_expected_revision/i);
  assert.match(body, /p_expected_revision >= 2147483647/i);
});

test('restore distinguishes own stale tombstone from missing or other-owner IDs', () => {
  const body = definition('soulframe_private', 'sf_restore_project_if_revision');
  assert.match(body, /'status', 'conflict'/);
  assert.match(body, /'status', 'not_found'/);
  assert.match(body, /'status', 'ok', 'id', v_row\.id, 'revision', v_row\.revision/);
  assert.doesNotMatch(body, /to_jsonb\(v_row\)|delete from/i);
});

test('public RPC functions are SECURITY INVOKER wrappers without elevated SQL', () => {
  for (const name of ['sf_list_deleted_projects', 'sf_restore_project_if_revision']) {
    const body = definition('public', name);
    assert.match(body, /security invoker/i);
    assert.match(body, /set search_path = ''/i);
    assert.match(body, new RegExp(`select soulframe_private\\.${name}\\(`));
    assert.doesNotMatch(body, /update public|delete from/i);
  }
});

test('both RPC layers revoke anonymous execute and never grant direct table write access', () => {
  for (const schema of ['public', 'soulframe_private']) {
    assert.match(normalized, new RegExp(`revoke all on function ${schema}\\.sf_list_deleted_projects\\(\\) from public, anon, authenticated`, 'i'));
    assert.match(normalized, new RegExp(`revoke all on function ${schema}\\.sf_restore_project_if_revision\\(uuid, integer\\) from public, anon, authenticated`, 'i'));
    assert.match(normalized, new RegExp(`grant execute on function ${schema}\\.sf_list_deleted_projects\\(\\) to authenticated`, 'i'));
    assert.match(normalized, new RegExp(`grant execute on function ${schema}\\.sf_restore_project_if_revision\\(uuid, integer\\) to authenticated`, 'i'));
  }
  assert.doesNotMatch(normalized, /grant\s+(?:all|update|delete)\s+on\s+table|drop policy|alter policy|create policy|delete\s+from\s+public\.soulframe_projects/i);
  assert.match(policy, /No UI feature or account recovery guarantee/);
  assert.match(catalog, /READ-ONLY CATALOG INSPECTION/);
});
