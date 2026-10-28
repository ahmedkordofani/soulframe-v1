// SoulFrame V6.1.4 Step 1 - pure, offline cloud mutation request contract.
// No Supabase requests, UI actions, table privileges, audio or deletion are enabled here.
// The database MUST independently enforce owner-scoping and atomic revision checks.
import { HOSTED_PROJECT_COLUMNS, toHostedProjectInsert } from './projectMapper.js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const POSTGRES_INT_MAX = 2147483647;

// Proposed future RPC names. These endpoints DO NOT exist or become callable in Step 1.
export const CLOUD_MUTATION_RPC = Object.freeze({
  update: 'sf_update_project_if_revision',
  delete: 'sf_delete_project_if_revision',
});

export const CLOUD_MUTABLE_COLUMNS = Object.freeze([
  ...Object.values(HOSTED_PROJECT_COLUMNS),
  'review_mode', 'selected_preset',
]);

export function validateCloudMutationTarget(projectId, expectedRevision, { incrementsRevision = false } = {}) {
  if (typeof projectId !== 'string' || !UUID_PATTERN.test(projectId)) {
    throw new TypeError('Invalid cloud project identifier');
  }
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1 ||
      expectedRevision > POSTGRES_INT_MAX - (incrementsRevision ? 1 : 0)) {
    throw new TypeError('A valid current cloud project revision is required');
  }
  return { p_project_id: projectId, p_expected_revision: expectedRevision };
}

// Full metadata replacement, not a partial patch: omitted optional fields become NULL.
// Do not add owner_id, id, revision, timestamps, audio, analysis or arbitrary fields.
export function buildCloudUpdateArguments(projectId, expectedRevision, projectMetadata) {
  const target = validateCloudMutationTarget(projectId, expectedRevision, { incrementsRevision: true });
  const validated = toHostedProjectInsert(projectMetadata);
  const fullReplacement = {};
  for (const column of CLOUD_MUTABLE_COLUMNS) {
    fullReplacement[column] = Object.hasOwn(validated, column) ? validated[column] : null;
  }
  return { ...target, p_changes: fullReplacement };
}

export function buildCloudDeleteArguments(projectId, expectedRevision) {
  return validateCloudMutationTarget(projectId, expectedRevision);
}
