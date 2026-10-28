// SoulFrame V6.1.4 Step 3.17 — pure assertions only, no network calls.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function checkRestoreResponse(result, expectedStatus, expectedId, expectedRevision) {
  if (result?.error) throw new Error(`Restore RPC returned an error code (${result.error.code || 'unknown'}).`);
  const response = result?.data;
  if (!response || typeof response !== 'object' || Array.isArray(response) ||
      response.status !== expectedStatus) {
    throw new Error(`Restore RPC did not return the expected '${expectedStatus}' status.`);
  }
  if (expectedStatus === 'ok') {
    if (Object.keys(response).sort().join(',') !== 'id,revision,status' ||
        typeof response.id !== 'string' || !UUID_RE.test(response.id) ||
        response.id !== expectedId || response.revision !== expectedRevision) {
      throw new Error('Restore success response failed the ID/revision/allowlist checks.');
    }
  } else if (Object.keys(response).join(',') !== 'status') {
    throw new Error('Unsuccessful restore disclosed unexpected metadata.');
  }
  return response;
}

export function requireOwnerActiveProject(result, id, ownerId, name, revision) {
  if (result?.error || !Array.isArray(result?.data) || result.data.length !== 1) {
    throw new Error('Restored record was not visible to its owner.');
  }
  const item = result.data[0];
  if (Object.keys(item).sort().join(',') !== 'id,owner_id,project_name,revision' ||
      item.id !== id || item.owner_id !== ownerId ||
      item.project_name !== name || item.revision !== revision) {
    throw new Error('Restored row did not preserve ID/owner/name or increment revision.');
  }
}

export function requireNoVisibleProject(result, label) {
  if (result?.error || !Array.isArray(result?.data) || result.data.length !== 0) {
    throw new Error(`${label}: unexpected row visibility or query error.`);
  }
}

export function requireTombstoneAbsent(projects, id) {
  if (!Array.isArray(projects) || projects.some(x => x.id === id)) {
    throw new Error('Restored project still appears in deleted-project listing.');
  }
}
