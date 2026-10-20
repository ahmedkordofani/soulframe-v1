// SoulFrame V6.0.5 - local metadata API with recovery snapshots and manual backups.
// Listen only on loopback; no cloud authentication or hosted user data.
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalProjectStore, ProjectStoreError } from './projectStore.mjs';

export const API_VERSION = 'v6.0.5';
export const API_CAPABILITIES = Object.freeze({
  healthCheck: true,
  audioUpload: false,
  projectPersistence: true,
  projectRevisions: true,
  projectRecovery: true,
  metadataBackupExport: true,
  hostedReports: false,
  authentication: false,
});
const MAX_BODY_BYTES = 16 * 1024;

// ETag/If-Match use an integer revision in a quoted HTTP entity tag: "1", "2", etc.
// Require a fresh revision for BOTH updating and deleting a saved record.
function parseExpectedRevision(request) {
  const header = request.headers['if-match'];
  if (header === undefined) {
    throw new ProjectStoreError(428, 'Refresh the project list before editing or deleting (If-Match revision required)');
  }
  if (typeof header !== 'string' || !/^"[1-9]\d*"$/.test(header)) {
    throw new ProjectStoreError(400, 'If-Match must be a quoted numeric project revision, such as "1"');
  }
  const revision = Number(header.slice(1, -1));
  if (!Number.isSafeInteger(revision)) {
    throw new ProjectStoreError(400, 'Project revision is invalid');
  }
  return revision;
}

function parseRecoveryPrecondition(request) {
  if (request.headers['if-match'] !== undefined && request.headers['if-none-match'] !== undefined) {
    throw new ProjectStoreError(400, 'Use exactly one revision precondition');
  }
  if (request.headers['if-none-match'] !== undefined) {
    if (request.headers['if-none-match'] !== '*') throw new ProjectStoreError(400, 'If-None-Match must be * for recovery of a deleted project');
    return { requireAbsent: true };
  }
  return { expectedRevision: parseExpectedRevision(request) };
}

const SNAPSHOT_ROUTE = /^\/api\/recovery\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})(\/restore)?$/i;
const UUID_ROUTE = /^\/api\/projects\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/i;

function writeJson(response, statusCode, payload, requestMethod = 'GET', extraHeaders = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...extraHeaders,
  });
  response.end(requestMethod === 'HEAD' ? undefined : body);
}

async function readJson(request) {
  const type = request.headers['content-type']?.split(';', 1)[0].trim().toLowerCase();
  if (type !== 'application/json') throw new ProjectStoreError(415, 'Use application/json');
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new ProjectStoreError(413, 'Project metadata exceeds 16 KB');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new ProjectStoreError(400, 'Malformed JSON'); }
}

function requestIsLocal(request) {
  const host = request.headers.host || '';
  if (!/^(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/i.test(host)) return false;
  const origin = request.headers.origin;
  if (!origin) return true; // Local CLI requests without an Origin header.
  const allowedOrigins = new Set([
    'http://localhost:5173', 'http://127.0.0.1:5173',
    'http://localhost:8787', 'http://127.0.0.1:8787',
  ]);
  if (process.env.SOULFRAME_ALLOWED_ORIGIN) allowedOrigins.add(process.env.SOULFRAME_ALLOWED_ORIGIN);
  return allowedOrigins.has(origin);
}

export function createApiHandler({ store = new LocalProjectStore() } = {}) {
  return async (request, response) => {
    const method = request.method || 'GET';
    try {
      if (!requestIsLocal(request)) {
        writeJson(response, 403, { ok: false, error: 'Local development API only' }, method);
        return;
      }
      const url = new URL(request.url || '/', 'http://127.0.0.1');
      if (url.pathname === '/api/health') {
        if (method !== 'GET' && method !== 'HEAD') {
          writeJson(response, 405, { ok: false, error: 'Method not allowed' }, method, { Allow: 'GET, HEAD' });
          return;
        }
        writeJson(response, 200, {
          ok: true, service: 'soulframe-api', version: API_VERSION,
          mode: 'local-development', capabilities: API_CAPABILITIES,
        }, method);
        return;
      }
      if (url.pathname === '/api/projects') {
        if (method === 'GET') {
          writeJson(response, 200, { ok: true, projects: await store.list() }, method);
          return;
        }
        if (method === 'POST') {
          const record = await store.create(await readJson(request));
          writeJson(response, 201, { ok: true, project: record }, method);
          return;
        }
        writeJson(response, 405, { ok: false, error: 'Method not allowed' }, method, { Allow: 'GET, POST' });
        return;
      }
      if (url.pathname === '/api/backup' && method === 'GET') {
        writeJson(response, 200, { ok: true, backup: await store.exportBackup() }, method);
        return;
      }
      if (url.pathname === '/api/recovery' && method === 'GET') {
        writeJson(response, 200, { ok: true, entries: await store.recoveryList() }, method);
        return;
      }
      const recovery = SNAPSHOT_ROUTE.exec(url.pathname);
      if (recovery) {
        const snapshotId = recovery[1].toLowerCase();
        const isRestore = Boolean(recovery[2]);
        if (!isRestore && method === 'GET') {
          const snapshot = await store.recoveryGet(snapshotId);
          writeJson(response, snapshot ? 200 : 404,
            snapshot ? { ok: true, snapshot } : { ok: false, error: 'Recovery snapshot not found' }, method);
          return;
        }
        if (isRestore && method === 'POST') {
          const precondition = parseRecoveryPrecondition(request);
          const project = await store.restore(snapshotId, precondition);
          writeJson(response, project ? 200 : 404,
            project ? { ok: true, project } : { ok: false, error: 'Recovery snapshot not found' }, method,
            project ? { ETag: `"${project.revision}"` } : {});
          return;
        }
        writeJson(response, 405, { ok: false, error: 'Method not allowed' }, method);
        return;
      }
      const match = UUID_ROUTE.exec(url.pathname);
      if (match) {
        const id = match[1].toLowerCase();
        if (method === 'GET') {
          const project = await store.get(id);
          writeJson(response, project ? 200 : 404,
            project ? { ok: true, project } : { ok: false, error: 'Project not found' },
            method, project ? { ETag: `"${project.revision}"` } : {});
          return;
        }
        if (method === 'PUT') {
          const expectedRevision = parseExpectedRevision(request);
          const project = await store.update(id, await readJson(request), { expectedRevision });
          writeJson(response, project ? 200 : 404,
            project ? { ok: true, project } : { ok: false, error: 'Project not found' },
            method, project ? { ETag: `"${project.revision}"` } : {});
          return;
        }
        if (method === 'DELETE') {
          const expectedRevision = parseExpectedRevision(request);
          const deleted = await store.delete(id, { expectedRevision });
          writeJson(response, deleted ? 200 : 404,
            deleted ? { ok: true, deleted: true } : { ok: false, error: 'Project not found' }, method);
          return;
        }
        writeJson(response, 405, { ok: false, error: 'Method not allowed' }, method, { Allow: 'GET, PUT, DELETE' });
        return;
      }
      writeJson(response, 404, { ok: false, error: 'Endpoint not found' }, method);
    } catch (error) {
      const status = error instanceof ProjectStoreError ? error.status : 500;
      const message = error instanceof ProjectStoreError ? error.message : 'Local project storage failed';
      if (!response.headersSent) writeJson(response, status, { ok: false, error: message }, method);
    }
  };
}

// V6.0.1 test compatibility: handler remains callable on its own.
export const handleApiRequest = createApiHandler();
export function createSoulFrameApiServer(options = {}) {
  return createServer(createApiHandler(options));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const host = '127.0.0.1';
  const requestedPort = Number(process.env.SOULFRAME_API_PORT || 8787);
  if (!Number.isSafeInteger(requestedPort) || requestedPort < 1 || requestedPort > 65535) {
    console.error('SOULFRAME_API_PORT must be an integer between 1 and 65535.');
    process.exitCode = 1;
  } else {
    const server = createSoulFrameApiServer();
    server.on('error', (error) => {
      console.error('Could not start SoulFrame API:', error.message);
      process.exitCode = 1;
    });
    server.listen(requestedPort, host, () => {
      console.log(`SoulFrame local API: http://${host}:${requestedPort}/api/health`);
      console.log('Metadata-only local project storage. No audio uploads, remote sync, or authentication.');
    });
  }
}
