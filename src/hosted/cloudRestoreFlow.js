// SoulFrame V6.1.4 Step 3.20 — snapshot minimal tombstone identity for explicit UI confirmation.
// No network access, browser storage, audio, delete operation, or automatic restoration.
import { validateCloudMutationTarget } from './cloudMutationContract.js';

export function buildCloudRestoreIntent(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record) ||
      typeof record.project_name !== 'string' || !record.project_name.trim() ||
      record.project_name.length > 500 ||
      typeof record.deleted_at !== 'string' || !Number.isFinite(Date.parse(record.deleted_at))) {
    throw new TypeError('Refresh deleted cloud projects before restoring');
  }
  const args = validateCloudMutationTarget(record.id, record.revision, { incrementsRevision: true });
  // No notes, extra columns, or audio are carried into confirmation state.
  return Object.freeze({
    kind: 'restore',
    id: args.p_project_id,
    expectedRevision: args.p_expected_revision,
    name: record.project_name,
    deletedAt: record.deleted_at,
  });
}
