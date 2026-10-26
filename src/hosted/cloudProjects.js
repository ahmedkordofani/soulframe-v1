// V6.1.3 - Explicit, authenticated Supabase project metadata saves and reads.
// No automatic syncing, audio, local API access, UPDATE or DELETE operations.
import { readVerifiedIdentity } from './hostedIdentity.js';
import { toHostedProjectInsert, fromHostedProjectRow } from './projectMapper.js';
import { OWNERSHIP_TABLE } from './ownershipContract.js';

const SELECT_COLUMNS = [
  'id', 'owner_id', 'project_name', 'client_name', 'track_type', 'ai_tool',
  'current_stage', 'main_concern', 'client_goal', 'producer_notes',
  'review_mode', 'selected_preset', 'revision', 'created_at', 'updated_at',
].join(',');
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function requireOwner(client) {
  if (typeof client?.from !== 'function') throw new TypeError('A configured Supabase client is required');
  const verified = await readVerifiedIdentity(client); // Server-verified, never a cached UI claim.
  return verified.id;
}

function checkResult(result, operation) {
  if (result?.error) throw new Error(`Cloud ${operation} failed. Check the sign-in and connection.`);
}

function mapOwnedRow(row, ownerId) {
  if (!row || row.owner_id !== ownerId) {
    throw new Error('Cloud project ownership could not be verified');
  }
  return {
    ...fromHostedProjectRow(row),
    createdAt: typeof row.created_at === 'string' ? row.created_at : null,
    updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
  };
}

// Call only from an explicitly confirmed Save button; creates a new row, never overwrites.
export async function saveCloudProject(client, projectMetadata) {
  const fields = toHostedProjectInsert(projectMetadata); // Allowlisted metadata only.
  const ownerId = await requireOwner(client);
  const result = await client.from(OWNERSHIP_TABLE)
    .insert(fields) // DB assigns owner_id = auth.uid(), id, revision and timestamps.
    .select(SELECT_COLUMNS)
    .single();
  checkResult(result, 'save');
  return mapOwnedRow(result?.data, ownerId);
}

// Listing is opt-in; does not run on sign-in or during application startup.
export async function listCloudProjects(client) {
  const ownerId = await requireOwner(client);
  const result = await client.from(OWNERSHIP_TABLE)
    .select(SELECT_COLUMNS)
    .eq('owner_id', ownerId) // Additional scope; database RLS remains authoritative.
    .order('updated_at', { ascending: false })
    .limit(24);
  checkResult(result, 'listing');
  if (!Array.isArray(result?.data)) throw new Error('Invalid cloud project list');
  return result.data.map(row => mapOwnedRow(row, ownerId));
}

// Call only after an explicit Load confirmation; returns metadata for the caller to apply.
export async function loadCloudProject(client, projectId) {
  if (typeof projectId !== 'string' || !UUID_PATTERN.test(projectId)) {
    throw new TypeError('Invalid cloud project identifier');
  }
  const ownerId = await requireOwner(client);
  const result = await client.from(OWNERSHIP_TABLE)
    .select(SELECT_COLUMNS)
    .eq('id', projectId)
    .eq('owner_id', ownerId)
    .maybeSingle();
  checkResult(result, 'load');
  if (!result?.data) throw new Error('Cloud project not found for this account');
  return mapOwnedRow(result.data, ownerId);
}
