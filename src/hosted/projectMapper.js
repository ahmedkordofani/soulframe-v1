// V6.1.0 - pure metadata mapper for a POSSIBLE future hosted project insert.
// No network requests, tokens, credentials, audio or automatic cloud sync.
// Only a future explicit, authenticated Save action should invoke a hosted API.
export const HOSTED_PROJECT_COLUMNS = Object.freeze({
  projectName: 'project_name',
  clientName: 'client_name',
  trackType: 'track_type',
  aiTool: 'ai_tool',
  currentStage: 'current_stage',
  mainConcern: 'main_concern',
  clientGoal: 'client_goal',
  producerNotes: 'producer_notes',
});

const REVIEW_MODES = new Set(['draft', 'compare']);
const OPTIONAL_FIELDS = new Set(Object.keys(HOSTED_PROJECT_COLUMNS).filter((x) => x !== 'projectName'));
const ROOT_FIELDS = new Set(['projectSession', 'reviewMode', 'selectedPreset']);

function plain(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.getPrototypeOf(value) === Object.prototype;
}

// This returns ONLY column values permitted in the hosted INSERT grant.
// PostgreSQL assigns owner_id from auth.uid() and assigns id/revision/timestamps.
export function toHostedProjectInsert(payload) {
  if (!plain(payload) || Object.keys(payload).some((key) => !ROOT_FIELDS.has(key))) {
    throw new TypeError('Expected project metadata only. Audio and arbitrary fields are not accepted.');
  }
  const session = payload.projectSession;
  if (!plain(session) || Object.keys(session).some((key) => !(key in HOSTED_PROJECT_COLUMNS))) {
    throw new TypeError('Unsupported projectSession field');
  }
  const name = session.projectName;
  if (typeof name !== 'string' || !name.trim() || name.length > 500) {
    throw new TypeError('Project name must contain 1-500 characters');
  }
  const reviewMode = payload.reviewMode ?? 'draft';
  if (!REVIEW_MODES.has(reviewMode)) throw new TypeError('Unsupported review mode');
  const selectedPreset = payload.selectedPreset ?? '';
  if (typeof selectedPreset !== 'string' || selectedPreset.length > 120) {
    throw new TypeError('Preset must be text up to 120 characters');
  }
  const result = { project_name: name, review_mode: reviewMode, selected_preset: selectedPreset };
  for (const field of OPTIONAL_FIELDS) {
    const value = session[field];
    if (value === undefined) continue;
    const limit = field === 'producerNotes' ? 4000 : 500;
    if (typeof value !== 'string' || value.length > limit) {
      throw new TypeError(`${field} must be text up to ${limit} characters`);
    }
    result[HOSTED_PROJECT_COLUMNS[field]] = value;
  }
  return result;
}

// Adapt a verified owner-scoped database row to SoulFrame's existing metadata format.
// Never call this for an unauthenticated or unverified response.
export function fromHostedProjectRow(row) {
  if (!plain(row) || typeof row.id !== 'string' || !Number.isSafeInteger(row.revision) || row.revision < 1) {
    throw new TypeError('Invalid hosted project row');
  }
  const session = {};
  for (const [key, column] of Object.entries(HOSTED_PROJECT_COLUMNS)) {
    if (row[column] !== undefined && row[column] !== null) session[key] = row[column];
  }
  const normalized = toHostedProjectInsert({
    projectSession: session, reviewMode: row.review_mode, selectedPreset: row.selected_preset,
  });
  return {
    id: row.id,
    revision: row.revision,
    projectSession: session,
    reviewMode: normalized.review_mode,
    selectedPreset: normalized.selected_preset,
  };
}
