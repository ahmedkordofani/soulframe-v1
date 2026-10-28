import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  CLOUD_MUTATION_RPC, CLOUD_MUTABLE_COLUMNS,
  validateCloudMutationTarget, buildCloudUpdateArguments, buildCloudDeleteArguments,
} from '../src/hosted/cloudMutationContract.js';

const ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const payload = {
  projectSession: { projectName: 'V6.1.4 Synthetic Test', clientName: 'Demo Client', producerNotes: 'No audio' },
  reviewMode: 'compare', selectedPreset: 'marcel',
};

test('V6.1.4 Step 1 only specifies future, explicit RPC operations', () => {
  assert.deepEqual(CLOUD_MUTATION_RPC, {
    update: 'sf_update_project_if_revision', delete: 'sf_delete_project_if_revision',
  });
});

test('target requires an actual UUID and a positive integer revision', () => {
  assert.deepEqual(validateCloudMutationTarget(ID, 1), { p_project_id: ID, p_expected_revision: 1 });
  for (const invalid of ['', 'bad-id', '../other-project', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa']) {
    assert.throws(() => validateCloudMutationTarget(invalid, 1), /identifier/);
  }
  for (const invalid of [undefined, null, 0, -1, 1.5, '1', Number.NaN, Number.POSITIVE_INFINITY, 2147483648]) {
    assert.throws(() => validateCloudMutationTarget(ID, invalid), /revision/);
  }
});

test('update refuses an overflowing PostgreSQL integer revision', () => {
  assert.throws(() => buildCloudUpdateArguments(ID, 2147483647, payload), /revision/);
  assert.equal(buildCloudUpdateArguments(ID, 2147483646, payload).p_expected_revision, 2147483646);
});

test('update uses the existing hosted metadata allowlist and no privileged columns', () => {
  const args = buildCloudUpdateArguments(ID, 1, payload);
  assert.deepEqual(Object.keys(args).sort(), ['p_project_id', 'p_expected_revision', 'p_changes'].sort());
  assert.deepEqual(Object.keys(args.p_changes), CLOUD_MUTABLE_COLUMNS);
  assert.equal(args.p_changes.project_name, 'V6.1.4 Synthetic Test');
  assert.equal(args.p_changes.review_mode, 'compare');
  assert.equal(args.p_changes.selected_preset, 'marcel');
  for (const disallowed of ['id', 'owner_id', 'revision', 'created_at', 'updated_at', 'audio', 'analysis']) {
    assert.equal(Object.hasOwn(args.p_changes, disallowed), false);
  }
});

test('missing optional fields are explicitly NULL in a full overwrite', () => {
  const args = buildCloudUpdateArguments(ID, 2, { projectSession: { projectName: 'Renamed' } });
  assert.equal(args.p_changes.client_name, null);
  assert.equal(args.p_changes.producer_notes, null);
  assert.equal(args.p_changes.review_mode, 'draft');
  assert.equal(args.p_changes.selected_preset, '');
  assert.equal(args.p_changes.project_name, 'Renamed');
});

test('source project data is not mutated', () => {
  const before = JSON.stringify(payload);
  const got = buildCloudUpdateArguments(ID, 1, payload);
  got.p_changes.project_name = 'Changed only in result';
  assert.equal(JSON.stringify(payload), before);
});

test('malformed or oversized project metadata is rejected before a future request', () => {
  for (const bad of [
    { ...payload, audioBase64: 'AAAA' },
    { ...payload, projectSession: { ...payload.projectSession, audioFile: 'raw' } },
    { ...payload, projectSession: { ...payload.projectSession, owner_id: 'other' } },
    { ...payload, projectSession: { ...payload.projectSession, producerNotes: 'a'.repeat(4001) } },
    { ...payload, reviewMode: 'unknown' },
    { ...payload, projectSession: { ...payload.projectSession, projectName: ' ' } },
  ]) assert.throws(() => buildCloudUpdateArguments(ID, 1, bad));
});

test('delete passes only an id and explicit expected revision, never a project payload', () => {
  assert.deepEqual(buildCloudDeleteArguments(ID, 5), { p_project_id: ID, p_expected_revision: 5 });
  assert.equal(Object.hasOwn(buildCloudDeleteArguments(ID, 5), 'p_changes'), false);
});

test('delete also refuses malformed id and revision', () => {
  assert.throws(() => buildCloudDeleteArguments('not-an-id', 2), /identifier/);
  assert.throws(() => buildCloudDeleteArguments(ID, undefined), /revision/);
});

test('new offline contract cannot execute or authorize database mutations', () => {
  const source = readFileSync(new URL('../src/hosted/cloudMutationContract.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\.rpc\(|\.from\(|\.update\(|\.delete\(|\.upsert\(|createClient\(/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(/);
});

test('the V6.1.0 migration still explicitly blocks direct authenticated UPDATE/DELETE', () => {
  const source = readFileSync(new URL('../supabase/migrations/20261020000100_hosted_projects.sql', import.meta.url), 'utf8');
  assert.match(source, /revision integer not null default 1 check \(revision = 1\)/);
  assert.doesNotMatch(source, /^\s*grant\s+(update|delete)\b/im);
  assert.match(source, /grant select on table public\.soulframe_projects to authenticated;/);
});
