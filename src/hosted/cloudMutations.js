// SoulFrame V6.1.4 Step 3.2: Explicit revision-safe mutation RPC adapter.
// This module provides NO UI buttons and performs NO local storage, audio or direct table writes.
// The database is authoritative for ownership, revision comparison and soft deletion.
import { readVerifiedIdentity } from './hostedIdentity.js';
import { fromHostedProjectRow } from './projectMapper.js';
import {
  CLOUD_MUTATION_RPC,
  CLOUD_MUTABLE_COLUMNS,
  buildCloudUpdateArguments,
  buildCloudDeleteArguments,
} from './cloudMutationContract.js';

const RESPONSE_ROW_FIELDS = new Set([
  'id', 'owner_id', ...CLOUD_MUTABLE_COLUMNS,
  'revision', 'created_at', 'updated_at',
]);
const STATUS = new Set(['ok', 'conflict', 'not_found']);

function requireRpcClient(client) {
  if (typeof client?.rpc !== 'function') {
    throw new TypeError('Configured Supabase RPC client required');
  }
  return client;
}

function inspectStatus(result, operation) {
  if (result?.error) {
    // Avoid copying provider errors, SQL details, access tokens or project fields to the UI.
    throw new Error(`Cloud ${operation} failed. Check your sign-in and connection.`);
  }
  const response = result?.data;
  if (!response || typeof response !== 'object' || Array.isArray(response) ||
      !STATUS.has(response.status)) {
    throw new Error('Invalid cloud mutation response');
  }
  if (response.status !== 'ok') {
    if (Object.keys(response).length !== 1) throw new Error('Unexpected cloud mutation response fields');
    return { status: response.status };
  }
  return response;
}

async function requireUnchangedIdentity(client, initialOwner) {
  const current = await readVerifiedIdentity(client);
  if (current.id !== initialOwner) throw new Error('Cloud account changed during the operation');
}

// Full metadata replacement after an explicit confirmation in a future UI.
// Returns {status:'ok',project}, {status:'conflict'} or {status:'not_found'}.
// NEVER retries conflicts automatically.
export async function updateCloudProject(client, projectId, expectedRevision, projectMetadata) {
  const args = buildCloudUpdateArguments(projectId, expectedRevision, projectMetadata);
  requireRpcClient(client);
  const identity = await readVerifiedIdentity(client);
  const response = inspectStatus(
    await client.rpc(CLOUD_MUTATION_RPC.update, args), 'update',
  );
  if (response.status !== 'ok') return response;
  if (Object.keys(response).sort().join(',') !== 'project,status') {
    throw new Error('Unexpected cloud update response fields');
  }
  const row = response.project;
  if (!row || typeof row !== 'object' || Array.isArray(row) ||
      Object.keys(row).some(field => !RESPONSE_ROW_FIELDS.has(field)) ||
      row.owner_id !== identity.id || row.id !== projectId ||
      row.revision !== expectedRevision + 1) {
    throw new Error('Cloud update response failed ownership or revision checks');
  }
  const project = fromHostedProjectRow(row);
  await requireUnchangedIdentity(client, identity.id);
  return {
    status: 'ok',
    project: {
      ...project,
      createdAt: typeof row.created_at === 'string' ? row.created_at : null,
      updatedAt: typeof row.updated_at === 'string' ? row.updated_at : null,
    },
  };
}

// Soft deletion only, via the database RPC (no direct DELETE, no restore).
// A future UI must warn that user-facing recovery is unavailable and require confirmation.
export async function softDeleteCloudProject(client, projectId, expectedRevision) {
  const args = buildCloudDeleteArguments(projectId, expectedRevision);
  // PostgreSQL revision is a 32-bit integer. Successful soft deletion increments it.
  if (expectedRevision >= 2147483647) {
    throw new TypeError('Cloud project revision cannot be incremented');
  }
  requireRpcClient(client);
  const identity = await readVerifiedIdentity(client);
  const response = inspectStatus(
    await client.rpc(CLOUD_MUTATION_RPC.delete, args), 'delete',
  );
  if (response.status !== 'ok') return response;
  if (Object.keys(response).sort().join(',') !== 'id,revision,status' ||
      response.id !== projectId || response.revision !== expectedRevision + 1) {
    throw new Error('Cloud deletion response failed identity or revision checks');
  }
  await requireUnchangedIdentity(client, identity.id);
  return { status: 'ok', id: projectId, revision: response.revision };
}
