// V6.0.2 - explicit, local-only project metadata persistence.
// No file/audio bytes, accounts, sync, or hosted services.
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

export const PROJECT_FIELDS = Object.freeze([
  'projectName', 'clientName', 'trackType', 'aiTool',
  'currentStage', 'mainConcern', 'clientGoal', 'producerNotes',
]);
const MAX_RECORDS = 1000;
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

function validDatabase(data) {
  if (!isPlainObject(data) || data.schemaVersion !== 1 || !Array.isArray(data.projects) || data.projects.length > MAX_RECORDS) return false;
  return data.projects.every((p) => isPlainObject(p) && typeof p.id === 'string' && typeof p.updatedAt === 'string' &&
    isPlainObject(p.projectSession) && typeof p.projectSession.projectName === 'string');
}

export class LocalProjectStore {
  constructor({ filePath = FILENAME } = {}) {
    this.filePath = resolve(filePath);
    this.pending = Promise.resolve();
  }

  async read() {
    let raw;
    try {
      raw = await readFile(this.filePath, 'utf8');
    } catch (error) {
      if (error.code === 'ENOENT') return { schemaVersion: 1, projects: [] };
      throw error;
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new ProjectStoreError(500, 'Project database is invalid; no data was changed');
    }
    if (!validDatabase(parsed)) throw new ProjectStoreError(500, 'Project database format is invalid; no data was changed');
    return parsed;
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
    return data.projects.map(({ id, projectSession, reviewMode, updatedAt, createdAt }) => ({
      id, title: projectSession.projectName, reviewMode, createdAt, updatedAt,
    }));
  }

  async get(id) {
    await this.pending;
    return (await this.read()).projects.find((p) => p.id === id) ?? null;
  }

  create(payload) {
    const validated = validateProjectPayload(payload);
    return this.queue(async () => {
      const data = await this.read();
      if (data.projects.length >= MAX_RECORDS) throw new ProjectStoreError(409, 'Local project limit reached');
      const now = new Date().toISOString();
      const record = { id: randomUUID(), ...validated, createdAt: now, updatedAt: now };
      data.projects.push(record);
      await this.write(data);
      return record;
    });
  }

  update(id, payload) {
    const validated = validateProjectPayload(payload);
    return this.queue(async () => {
      const data = await this.read();
      const index = data.projects.findIndex((p) => p.id === id);
      if (index === -1) return null;
      data.projects[index] = { ...data.projects[index], ...validated, updatedAt: new Date().toISOString() };
      await this.write(data);
      return data.projects[index];
    });
  }

  delete(id) {
    return this.queue(async () => {
      const data = await this.read();
      const index = data.projects.findIndex((p) => p.id === id);
      if (index === -1) return false;
      data.projects.splice(index, 1);
      await this.write(data);
      return true;
    });
  }
}
