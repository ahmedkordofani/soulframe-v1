// SoulFrame V6.1.4 Step 3.27 — immutable, owner-listed soft-delete intent.
// Pure validation only; no network request, audio, or workspace state.
import { validateCloudMutationTarget } from './cloudMutationContract.js';

export function buildCloudDeleteIntent(record) {
  if (!record || typeof record !== 'object' || Array.isArray(record) ||
      !record.projectSession || typeof record.projectSession.projectName !== 'string' ||
      !record.projectSession.projectName.trim() || record.projectSession.projectName.length > 500) {
    throw new TypeError('Refresh cloud projects before deleting');
  }
  const args = validateCloudMutationTarget(record.id, record.revision, { incrementsRevision: true });
  return Object.freeze({
    kind: 'delete', id: args.p_project_id, expectedRevision: args.p_expected_revision,
    name: record.projectSession.projectName,
  });
}
