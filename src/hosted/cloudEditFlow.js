// SoulFrame V6.1.4 Step 3.3: pure, confirmed cloud-update intent.
// No network, audio, local API, browser storage, deletion or implicit sync.
import { buildCloudUpdateArguments } from './cloudMutationContract.js';

export function buildCloudUpdateIntent(record, projectSession, reviewMode, selectedPreset) {
  if (!record || typeof record !== 'object' || Array.isArray(record) ||
      !record.projectSession || typeof record.projectSession.projectName !== 'string') {
    throw new TypeError('Refresh the cloud project list before updating');
  }
  if (!projectSession || typeof projectSession !== 'object' || Array.isArray(projectSession)) {
    throw new TypeError('Current project details are unavailable');
  }
  // Freeze the source metadata at request time. Do not retain a browser File or audio object.
  const snapshot = {
    projectSession: { ...projectSession },
    reviewMode,
    selectedPreset,
  };
  // Validate ID, positive CURRENT revision, metadata allowlist and Postgres limits before UI confirmation.
  buildCloudUpdateArguments(record.id, record.revision, snapshot);
  return {
    kind: 'update',
    id: record.id,
    expectedRevision: record.revision,
    targetName: record.projectSession.projectName,
    sourceName: snapshot.projectSession.projectName,
    snapshot,
  };
}
