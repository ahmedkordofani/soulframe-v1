// SoulFrame V6.1.4: pure assertions for read-only Cloud Restore discovery.
// This module never performs database operations.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIELDS = ['id', 'project_name', 'revision', 'deleted_at'];

export const TEST_TOMBSTONE_NAME = 'SF-V614-DELETE-01556940-ebb';
export const TEST_TOMBSTONE_REVISION = 3;

export function parseDeletedList(result, label = 'Deleted-project listing') {
  if (result?.error) throw new Error(`${label}: RPC request failed (${result.error.code || 'unknown error'})`);
  const payload = result?.data;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload) ||
      payload.status !== 'ok' || !Array.isArray(payload.projects) ||
      Object.keys(payload).sort().join(',') !== 'projects,status') {
    throw new Error(`${label}: unexpected RPC result shape`);
  }
  if (payload.projects.length > 24) throw new Error(`${label}: list exceeded the configured limit`);
  for (const item of payload.projects) {
    if (!item || typeof item !== 'object' || Array.isArray(item) ||
        Object.keys(item).sort().join(',') !== [...FIELDS].sort().join(',') ||
        typeof item.id !== 'string' || !UUID.test(item.id) ||
        typeof item.project_name !== 'string' || !item.project_name.trim() ||
        !Number.isInteger(item.revision) || item.revision < 1 ||
        typeof item.deleted_at !== 'string' || !Number.isFinite(Date.parse(item.deleted_at))) {
      throw new Error(`${label}: invalid or overly broad tombstone metadata`);
    }
  }
  return payload.projects;
}

export function requireOwnedTestTombstone(projects, expectedName = TEST_TOMBSTONE_NAME, expectedRevision = TEST_TOMBSTONE_REVISION) {
  const matches = projects.filter(p => p.project_name === expectedName);
  if (matches.length !== 1 || matches[0].revision !== expectedRevision) {
    throw new Error('Expected synthetic test tombstone was absent or had an unexpected revision. Stop without restoring.');
  }
  return matches[0];
}

export function requireHiddenFromOtherAccount(projects, testTombstoneId, expectedName = TEST_TOMBSTONE_NAME) {
  if (projects.some(p => p.id === testTombstoneId || p.project_name === expectedName)) {
    throw new Error('Cross-account deleted project listing exposed the test tombstone');
  }
}
