// V6.0.4 - local metadata persistence with optimistic concurrency checks.
// No file/audio bytes, accounts, sync, or hosted services.
import { randomUUID, createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export const PROJECT_FIELDS = Object.freeze([
  'projectName', 'clientName', 'trackType', 'aiTool',
  'currentStage', 'mainConcern', 'clientGoal', 'producerNotes',
]);
const MAX_RECORDS = 1000;
const MAX_HISTORY = 5000;
const HISTORY_PER_PROJECT = 10;
export const BACKUP_TYPE = 'soulframe-local-api-metadata-backup';
const FILENAME = resolve(process.cwd(), '.soulframe-local', 'projects.json');

export class ProjectStoreError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ProjectStoreError';
    this.status = status;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' &&
    !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

export function validateProjectPayload(payload) {
  if (!isPlainObject(payload)) throw new ProjectStoreError(422, 'Expected a project object');
  const acceptedRoot = ['projectSession', 'reviewMode', 'selectedPreset'];
  if (Object.keys(payload).some((key) => !acceptedRoot.includes(key))) {
    throw new ProjectStoreError(422, 'Only project metadata is accepted; audio and arbitrary fields are not allowed');
  }
  if (!isPlainObject(payload.projectSession)) {
    throw new ProjectStoreError(422, 'projectSession must be an object');
  }
  if (Object.keys(payload.projectSession).some((key) => !PROJECT_FIELDS.includes(key))) {
    throw new ProjectStoreError(422, 'projectSession contains an unsupported field');
  }
  if (typeof payload.projectSession.projectName !== 'string' || !payload.projectSession.projectName.trim()) {
    throw new ProjectStoreError(422, 'projectName is required');
  }
  const projectSession = {};
  for (const field of PROJECT_FIELDS) {
    const value = payload.projectSession[field];
    if (value === undefined) continue;
    const limit = field === 'producerNotes' ? 4000 : 500;
    if (typeof value !== 'string' || value.length > limit) {
      throw new ProjectStoreError(422, `${field} must be text up to ${limit} characters`);
    }
    projectSession[field] = value;
  }
  const reviewMode = payload.reviewMode ?? 'draft';
  if (!['draft', 'compare'].includes(reviewMode)) {
    throw new ProjectStoreError(422, 'reviewMode must be draft or compare');
  }
  const selectedPreset = payload.selectedPreset ?? '';
  if (typeof selectedPreset !== 'string' || selectedPreset.length > 120) {
    throw new ProjectStoreError(422, 'selectedPreset must be text up to 120 characters');
  }
  return { projectSession, reviewMode, selectedPreset };
}

// Existing V6.0.2 records may have no revision; they are treated as revision 1.
function recordRevision(record) {
  return record.revision ?? 1;
}

function requireExpectedRevision(expectedRevision) {
  if (!Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
    throw new ProjectStoreError(428, 'A current project revision is required before changing this record');
  }
  return expectedRevision;
}

function withRevision(record) {
  return { ...record, revision: recordRevision(record) };
}

function validHistoryEntry(entry) {
  return isPlainObject(entry) &&
    typeof entry.id === 'string' && /^[a-f0-9-]{36}$/i.test(entry.id) &&
    ['update', 'delete', 'restore'].includes(entry.reason) &&
    typeof entry.capturedAt === 'string' &&
    isPlainObject(entry.record) &&
    typeof entry.record.id === 'string' &&
    typeof entry.record.createdAt === 'string' &&
    typeof entry.record.updatedAt === 'string' &&
    Number.isSafeInteger(recordRevision(entry.record)) && recordRevision(entry.record) >= 1 &&
    isPlainObject(entry.record.projectSession) &&
    typeof entry.record.projectSession.projectName === 'string' &&
    Object.keys(entry.record.projectSession).every((key) => PROJECT_FIELDS.includes(key));
}

function recordSnapshot(data, record, reason) {
  data.history ??= [];
  data.history.push({ id: randomUUID(), reason, capturedAt: new Date().toISOString(), record: withRevision(record) });
  // Keep the most recent 10 revisions per project and cap database-wide history.
  const count = data.history.filter((entry) => entry.record.id === record.id).length;
  if (count > HISTORY_PER_PROJECT) {
    const index = data.history.findIndex((entry) => entry.record.id === record.id);
    if (index !== -1) data.history.splice(index, 1);
  }
  if (data.history.length > MAX_HISTORY) data.history.splice(0, data.history.length - MAX_HISTORY);
}

function validDatabase(data) {
  if (!isPlainObject(data) || data.schemaVersion !== 1 || !Array.isArray(data.projects) || data.projects.length > MAX_RECORDS) return false;
  if (data.history !== undefined && (!Array.isArray(data.history) || data.history.length > MAX_HISTORY || !data.history.every(validHistoryEntry))) return false;
  return data.projects.every((p) => isPlainObject(p) && typeof p.id === 'string' && typeof p.updatedAt === 'string' &&
    (p.revision === undefined || (Number.isSafeInteger(p.revision) && p.revision >= 1)) &&
    isPlainObject(p.projectSession) && typeof p.projectSession.projectName === 'string');
}

// Only accept metadata-only exports generated by the SoulFrame local API.
// All imported objects are whitelisted and normalized, never spread directly into storage.
function validTimestamp(value) {
  return typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value));
}
function validUuid(value) {
  return typeof value === 'string' && /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value);
}
function normalizeImportedRecord(record) {
  if (!isPlainObject(record) ||
      Object.keys(record).some((key) => !['id', 'createdAt', 'updatedAt', 'revision', 'projectSession', 'reviewMode', 'selectedPreset'].includes(key)) ||
      !validUuid(record.id) || !validTimestamp(record.createdAt) || !validTimestamp(record.updatedAt)) {
    throw new ProjectStoreError(422, 'Backup includes an invalid or unsupported project record');
  }
  const normalized = validateProjectPayload({
    projectSession: record.projectSession,
    reviewMode: record.reviewMode,
    selectedPreset: record.selectedPreset,
  });
  const revision = recordRevision(record);
  if (!Number.isSafeInteger(revision) || revision < 1) {
    throw new ProjectStoreError(422, 'Backup includes an invalid project revision');
  }
  return { id: record.id.toLowerCase(), createdAt: record.createdAt,
    updatedAt: record.updatedAt, revision, ...normalized };
}
export function validateMetadataBackup(backup) {
  if (!isPlainObject(backup) || Object.keys(backup).some((key) =>
      !['type', 'exportedAt', 'schemaVersion', 'projects', 'history'].includes(key)) ||
      backup.type !== BACKUP_TYPE || backup.schemaVersion !== 1 ||
      !validTimestamp(backup.exportedAt) || !Array.isArray(backup.projects) ||
      !Array.isArray(backup.history) || backup.projects.length > MAX_RECORDS ||
      backup.history.length > MAX_HISTORY) {
    throw new ProjectStoreError(422, 'Unsupported or malformed SoulFrame metadata backup');
  }
  const projects = backup.projects.map(normalizeImportedRecord);
  const projectIds = new Set(projects.map((p) => p.id));
  if (projectIds.size !== projects.length) throw new ProjectStoreError(422, 'Backup contains duplicate project IDs');
  const historyIds = new Set();
  const history = backup.history.map((entry) => {
    if (!isPlainObject(entry) || Object.keys(entry).some((key) =>
        !['id', 'reason', 'capturedAt', 'record'].includes(key)) ||
        !validUuid(entry.id) || !validTimestamp(entry.capturedAt) ||
        !['update', 'delete', 'restore'].includes(entry.reason)) {
      throw new ProjectStoreError(422, 'Backup contains an invalid recovery snapshot');
    }
    const record = normalizeImportedRecord(entry.record);
    const id = entry.id.toLowerCase();
    if (historyIds.has(id)) throw new ProjectStoreError(422, 'Backup contains duplicate recovery snapshot IDs');
    historyIds.add(id);
    return { id, capturedAt: entry.capturedAt, reason: entry.reason, record };
  });
  return { projects, history };
}

function databaseFingerprint(data) {
  return createHash('sha256').update(JSON.stringify(data)).digest('hex');
}
function planMetadataImport(data, backup) {
  const existingIds = new Set(data.projects.map((p) => p.id.toLowerCase()));
  const newProjects = backup.projects.filter((p) => !existingIds.has(p.id));
  const skippedProjects = backup.projects.length - newProjects.length;
  const eligibleIds = new Set([...newProjects.map((p) => p.id),
    ...backup.history.map((item) => item.record.id).filter((id) => !existingIds.has(id))]);
  // A bounded history is kept for each project, including deleted projects with no active record.
  const recoveredHistory = backup.history.filter((item) => eligibleIds.has(item.record.id) &&
    !data.history.some((old) => old.record.id.toLowerCase() === item.record.id &&
      recordRevision(old.record) === recordRevision(item.record) &&
      old.capturedAt === item.capturedAt && old.reason === item.reason));
  const histories = new Map();
  for (const entry of recoveredHistory) {
    const id = entry.record.id;
    const items = histories.get(id) || [];
    items.push(entry);
    histories.set(id, items);
  }
  for (const [id, items] of histories) {
    const alreadyStored = data.history.filter((item) => item.record.id.toLowerCase() === id).length;
    const available = Math.max(0, HISTORY_PER_PROJECT - alreadyStored);
    histories.set(id, available ? items.slice(-available) : []);
  }
  const availableSlots = Math.max(0, MAX_HISTORY - data.history.length);
  const addedHistory = availableSlots ? [...histories.values()].flat().slice(-availableSlots) : [];
  return { newProjects, skippedProjects,
    addedHistory, skippedHistory: backup.history.length - addedHistory.length };
}

export class LocalProjectStore {
  constructor({ filePath = FILENAME } = {}) {
    this.filePath = resolve(filePath);
    this.pending = Promise.resolve();
    this.importPreviews = new Map();
  }

  async read() {
    let raw;
    try {
      raw = await readFile(this.filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return { schemaVersion: 1, projects: [], history: [] };
      throw error;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new ProjectStoreError(500, 'Project database is invalid; no data was changed');
    }
    if (!validDatabase(parsed)) throw new ProjectStoreError(500, 'Project database format is invalid; no data was changed');
    return { ...parsed, history: parsed.history ?? [] };
  }

  async write(data) {
    await mkdir(dirname(this.filePath), { recursive: true, mode: 0o700 });
    const temp = `${this.filePath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temp, JSON.stringify(data, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      await rename(temp, this.filePath);
    } finally {
      await unlink(temp).catch((error) => {
        if (error.code !== 'ENOENT') throw error;
      });
    }
  }

  queue(operation) {
    const task = this.pending.then(operation);
    this.pending = task.catch(() => {}); // A failed write must not block subsequent requests.
    return task;
  }

  async list() {
    await this.pending;
    const data = await this.read();
    return data.projects.map((record) => ({
      id: record.id,
      title: record.projectSession.projectName,
      reviewMode: record.reviewMode,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      revision: recordRevision(record),
    }));
  }

  async get(id) {
    await this.pending;
    const record = (await this.read()).projects.find((p) => p.id === id);
    return record ? withRevision(record) : null;
  }

  create(payload) {
    const validated = validateProjectPayload(payload);
    return this.queue(async () => {
      const data = await this.read();
      if (data.projects.length >= MAX_RECORDS) throw new ProjectStoreError(409, 'Local project limit reached');
      const now = new Date().toISOString();
      const record = { id: randomUUID(), ...validated, revision: 1, createdAt: now, updatedAt: now };
      data.projects.push(record);
      await this.write(data);
      return record;
    });
  }

  update(id, payload, { expectedRevision } = {}) {
    const validated = validateProjectPayload(payload);
    requireExpectedRevision(expectedRevision);
    return this.queue(async () => {
      const data = await this.read();
      const index = data.projects.findIndex((p) => p.id === id);
      if (index === -1) return null;
      const current = data.projects[index];
      if (recordRevision(current) !== expectedRevision) {
        throw new ProjectStoreError(412, 'This project changed since you last refreshed it. Refresh, review, and try again.');
      }
      // A monotonic revision prevents two edits in the same millisecond from sharing a version.
      if (expectedRevision >= Number.MAX_SAFE_INTEGER) throw new ProjectStoreError(409, 'Revision limit reached');
      recordSnapshot(data, current, 'update');
      data.projects[index] = {
        ...current, ...validated, revision: expectedRevision + 1,
        updatedAt: new Date().toISOString(),
      };
      await this.write(data);
      return withRevision(data.projects[index]);
    });
  }

  delete(id, { expectedRevision } = {}) {
    requireExpectedRevision(expectedRevision);
    return this.queue(async () => {
      const data = await this.read();
      const index = data.projects.findIndex((p) => p.id === id);
      if (index === -1) return false;
      if (recordRevision(data.projects[index]) !== expectedRevision) {
        throw new ProjectStoreError(412, 'This project changed since you last refreshed it. Refresh, review, and try again.');
      }
      recordSnapshot(data, data.projects[index], 'delete');
      data.projects.splice(index, 1);
      await this.write(data);
      return true;
    });
  }

  async recoveryList() {
    await this.pending;
    const data = await this.read();
    return [...data.history].reverse().map((entry) => {
      const current = data.projects.find((record) => record.id === entry.record.id);
      return {
        id: entry.id,
        projectId: entry.record.id,
        title: entry.record.projectSession.projectName,
        revision: recordRevision(entry.record),
        reason: entry.reason,
        capturedAt: entry.capturedAt,
        activeRevision: current ? recordRevision(current) : null,
      };
    });
  }

  async recoveryGet(snapshotId) {
    await this.pending;
    const entry = (await this.read()).history.find((snapshot) => snapshot.id === snapshotId);
    return entry ? structuredClone(entry) : null;
  }

  restore(snapshotId, { expectedRevision, requireAbsent = false } = {}) {
    return this.queue(async () => {
      const data = await this.read();
      const entry = data.history.find((snapshot) => snapshot.id === snapshotId);
      if (!entry) return null;
      const index = data.projects.findIndex((p) => p.id === entry.record.id);
      const current = index === -1 ? null : data.projects[index];
      // Check preconditions inside the write queue: no stale tab can restore over newer work.
      if (current) {
        if (requireAbsent || !Number.isSafeInteger(expectedRevision) || expectedRevision !== recordRevision(current)) {
          throw new ProjectStoreError(412, 'Project changed since recovery was reviewed. Refresh before restoring.');
        }
        recordSnapshot(data, current, 'restore'); // Recovery itself is reversible.
      } else if (!requireAbsent) {
        throw new ProjectStoreError(412, 'Project was deleted. Refresh recovery history before restoring.');
      }
      const highestRevision = Math.max(
        current ? recordRevision(current) : 0,
        ...data.history.filter((s) => s.record.id === entry.record.id).map((s) => recordRevision(s.record)),
      );
      if (highestRevision >= Number.MAX_SAFE_INTEGER) throw new ProjectStoreError(409, 'Revision limit reached');
      if (!current && data.projects.length >= MAX_RECORDS) throw new ProjectStoreError(409, 'Local project limit reached');
      const restored = {
        ...entry.record,
        revision: highestRevision + 1,
        createdAt: current?.createdAt ?? entry.record.createdAt,
        updatedAt: new Date().toISOString(),
      };
      if (current) data.projects[index] = restored;
      else data.projects.push(restored);
      await this.write(data);
      return withRevision(restored);
    });
  }

  // Preview tokens are short-lived and only held in memory. Import does not mutate at preview time.
  async previewBackupImport(backupFile) {
    const backup = validateMetadataBackup(backupFile);
    await this.pending;
    const data = await this.read();
    const plan = planMetadataImport(data, backup);
    if (data.projects.length + plan.newProjects.length > MAX_RECORDS) {
      throw new ProjectStoreError(409, 'Project limit reached; import cannot fit without overwriting existing records');
    }
    const now = Date.now();
    for (const [token, preview] of this.importPreviews) {
      if (preview.expiresAt <= now) this.importPreviews.delete(token);
    }
    if (this.importPreviews.size >= 10) this.importPreviews.delete(this.importPreviews.keys().next().value);
    const token = randomUUID();
    const expiresAt = now + 5 * 60 * 1000;
    this.importPreviews.set(token, { backup, fingerprint: databaseFingerprint(data), expiresAt });
    return { token, expiresAt: new Date(expiresAt).toISOString(),
      newProjects: plan.newProjects.length, skippedProjects: plan.skippedProjects,
      recoverableSnapshots: plan.addedHistory.length, skippedSnapshots: plan.skippedHistory,
      totalProjects: backup.projects.length, totalSnapshots: backup.history.length };
  }

  commitBackupImport(token) {
    if (!validUuid(token)) throw new ProjectStoreError(422, 'Invalid backup preview token');
    return this.queue(async () => {
      const preview = this.importPreviews.get(token);
      this.importPreviews.delete(token); // No automatic retry, even after a failed confirmation.
      if (!preview || preview.expiresAt <= Date.now()) {
        throw new ProjectStoreError(410, 'Import preview expired. Preview the backup again.');
      }
      const data = await this.read();
      if (databaseFingerprint(data) !== preview.fingerprint) {
        throw new ProjectStoreError(412, 'The local database changed since preview. Import cancelled; review the backup again.');
      }
      const plan = planMetadataImport(data, preview.backup);
      if (data.projects.length + plan.newProjects.length > MAX_RECORDS) {
        throw new ProjectStoreError(409, 'Project limit reached; import cancelled');
      }
      if (plan.newProjects.length === 0 && plan.addedHistory.length === 0) {
        return { importedProjects: 0, skippedProjects: plan.skippedProjects,
          importedSnapshots: 0, skippedSnapshots: plan.skippedHistory };
      }
      data.projects.push(...structuredClone(plan.newProjects));
      // New snapshot IDs prevent collisions with snapshots created on this server.
      data.history.push(...plan.addedHistory.map((entry) => ({ ...structuredClone(entry), id: randomUUID() })));
      await this.write(data);
      return { importedProjects: plan.newProjects.length, skippedProjects: plan.skippedProjects,
        importedSnapshots: plan.addedHistory.length, skippedSnapshots: plan.skippedHistory };
    });
  }

  async exportBackup() {
    await this.pending;
    const data = await this.read();
    return {
      type: BACKUP_TYPE,
      exportedAt: new Date().toISOString(),
      schemaVersion: data.schemaVersion,
      projects: structuredClone(data.projects),
      history: structuredClone(data.history),
    };
  }

}
