// SoulFrame V6.1.4 Step 3.19 — authenticated, opt-in recovery RPC adapter.
// No UI, local storage, audio, direct table writes, auto-sync or automatic retries.
// The database remains authoritative for ownership checks and revision comparison.
import { readVerifiedIdentity } from './hostedIdentity.js';
import { validateCloudMutationTarget } from './cloudMutationContract.js';

export const CLOUD_RECOVERY_RPC = Object.freeze({
  list: 'sf_list_deleted_projects',
  restore: 'sf_restore_project_if_revision',
});

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LIST_FIELDS = ['deleted_at', 'id', 'project_name', 'revision'].join(',');
const MAX_DELETED_PROJECTS = 24;
const MAX_REVISION = 2147483647;

function requireClient(client) {
  if (typeof client?.rpc !== 'function') {
    throw new TypeError('Configured Supabase RPC client required');
  }
}

async function requireSameIdentity(client, ownerId) {
  const current = await readVerifiedIdentity(client);
  if (current.id !== ownerId) {
    throw new Error('Cloud account changed during the operation');
  }
}

function parseRpcResult(result, operation) {
  if (result?.error) {
    // Never surface raw provider errors, SQL messages, credentials or internal IDs.
    throw new Error(`Cloud ${operation} failed. Check your sign-in and connection.`);
  }
  const response = result?.data;
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    throw new Error('Invalid cloud recovery response');
  }
  return response;
}

function parseDeletedProjects(result) {
  const response = parseRpcResult(result, 'deleted-project listing');
  if (Object.keys(response).sort().join(',') !== 'projects,status' ||
      response.status !== 'ok' || !Array.isArray(response.projects) ||
      response.projects.length > MAX_DELETED_PROJECTS) {
    throw new Error('Invalid deleted-project list response');
  }
  const unique = new Set();
  for (const row of response.projects) {
    if (!row || typeof row !== 'object' || Array.isArray(row) ||
        Object.keys(row).sort().join(',') !== LIST_FIELDS ||
        typeof row.id !== 'string' || !UUID.test(row.id) || unique.has(row.id) ||
        typeof row.project_name !== 'string' || !row.project_name.trim() ||
        row.project_name.length > 500 ||
        !Number.isInteger(row.revision) || row.revision < 1 || row.revision > MAX_REVISION ||
        typeof row.deleted_at !== 'string' || !Number.isFinite(Date.parse(row.deleted_at))) {
      throw new Error('Invalid deleted-project metadata');
    }
    unique.add(row.id);
  }
  return response.projects.map(row => ({ ...row }));
}

// Explicit, authenticated read. List is owner-scoped in the private database function.
// Returns minimal tombstone metadata only, never notes or audio.
export async function listDeletedCloudProjects(client) {
  requireClient(client);
  const user = await readVerifiedIdentity(client);
  const result = await client.rpc(CLOUD_RECOVERY_RPC.list);
  const projects = parseDeletedProjects(result);
  await requireSameIdentity(client, user.id);
  return projects;
}

// Explicit, revision-checked restore to be invoked ONLY after future UI confirmation.
// Returns {status:'ok',id,revision}, {status:'conflict'}, or {status:'not_found'}.
// A successful result means metadata is active in the cloud; it does not restore audio.
export async function restoreCloudProject(client, projectId, expectedRevision) {
  const args = validateCloudMutationTarget(projectId, expectedRevision, { incrementsRevision: true });
  requireClient(client);
  const user = await readVerifiedIdentity(client);
  const response = parseRpcResult(
    await client.rpc(CLOUD_RECOVERY_RPC.restore, args),
    'restore',
  );
  let output;
  if (response.status === 'ok') {
    if (Object.keys(response).sort().join(',') !== 'id,revision,status' ||
        response.id !== projectId || response.revision !== expectedRevision + 1) {
      throw new Error('Cloud restore response failed ID or revision validation');
    }
    output = { status: 'ok', id: projectId, revision: response.revision };
  } else if (response.status === 'conflict' || response.status === 'not_found') {
    if (Object.keys(response).join(',') !== 'status') {
      throw new Error('Unexpected cloud restore response fields');
    }
    output = { status: response.status };
  } else {
    throw new Error('Invalid cloud restore response');
  }
  await requireSameIdentity(client, user.id);
  return output;
}
