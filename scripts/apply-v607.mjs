// One-time, verified V6.0.7 migration of the already installed V6.0.6 source.
// Run from repository root: node scripts/apply-v607.mjs
import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
const root = resolve(process.cwd());
const updates = new Map();
function read(relative) {
  const path = join(root, relative);
  if (!existsSync(path)) throw new Error(`Required file missing: ${relative}. Confirm you are in the SoulFrame repository.`);
  return readFileSync(path, 'utf8');
}
function replaceRequired(value, find, substitute, name) {
  if (!value.includes(find)) throw new Error(`Expected ${name} marker not found. Installation cancelled without changes.`);
  return value.replace(find, substitute);
}
const indexPath = 'server/index.mjs';
let api = read(indexPath);
if (api.includes("export const API_VERSION = 'v6.0.7';")) {
  console.log('V6.0.7 already installed. Nothing to change.');
  process.exit(0);
}
api = replaceRequired(api, "import { LocalProjectStore, ProjectStoreError } from './projectStore.mjs';",
  "import { LocalProjectStore, ProjectStoreError } from './projectStore.mjs';\nimport { isAllowedLocalRequest, setLocalSecurityHeaders, checkDeclaredContentLength, createLocalRateLimiter } from './requestSecurity.mjs';", 'API import');
api = replaceRequired(api, "export const API_VERSION = 'v6.0.6';", "export const API_VERSION = 'v6.0.7';", 'API version');
api = replaceRequired(api, "  authentication: false,", "  authentication: false,\n  localSecurityHardening: true,", 'capabilities');
api = replaceRequired(api,
  "  const type = request.headers['content-type']?.split(';', 1)[0].trim().toLowerCase();",
  "  checkDeclaredContentLength(request, maxBytes);\n  const type = request.headers['content-type']?.split(';', 1)[0].trim().toLowerCase();", 'JSON size validation');
const start = api.indexOf('function requestIsLocal(request) {');
const end = api.indexOf('\nexport function createApiHandler(', start);
if (start < 0 || end < 0) throw new Error('Local request check boundary not found. Installation cancelled.');
api = api.slice(0, start) + 'function requestIsLocal(request) {\n  return isAllowedLocalRequest(request);\n}\n' + api.slice(end);
api = replaceRequired(api,
  "export function createApiHandler({ store = new LocalProjectStore() } = {}) {\n  return async (request, response) => {\n    const method = request.method || 'GET';\n    try {",
  "export function createApiHandler({ store = new LocalProjectStore() } = {}) {\n  const limiter = createLocalRateLimiter();\n  return async (request, response) => {\n    const method = request.method || 'GET';\n    try {\n      setLocalSecurityHeaders(response);", 'handler security headers');
api = replaceRequired(api,
  "      const url = new URL(request.url || '/', 'http://127.0.0.1');",
  "      const url = new URL(request.url || '/', 'http://127.0.0.1');\n      if (!limiter.allow(method, url.pathname)) {\n        writeJson(response, 429, { ok: false, error: 'Local API request rate exceeded. Retry shortly.' }, method, { 'Retry-After': '60' });\n        return;\n      }", 'rate limiting');
api = replaceRequired(api,
  "export function createSoulFrameApiServer(options = {}) {\n  return createServer(createApiHandler(options));\n}",
  "export function createSoulFrameApiServer(options = {}) {\n  const server = createServer(createApiHandler(options));\n  server.headersTimeout = 15_000;\n  server.requestTimeout = 30_000;\n  server.maxHeadersCount = 64;\n  return server;\n}", 'HTTP server limits');
updates.set(indexPath, api);

const appPath = 'src/App.jsx';
let app = read(appPath);
app = replaceRequired(app, 'V6.0.6 Backup Import', 'V6.0.7 Local Security', 'UI badge');
app = replaceRequired(app, 'V6.0.6 validated metadata backup import with preview and no overwrites',
  'V6.0.7 local API request hardening, validated backup import with preview and no overwrites', 'product stage');
updates.set(appPath, app);

const testPath = 'tests/architecture.test.mjs';
let architecture = read(testPath);
architecture = architecture.replaceAll('V6\\.0\\.6 Backup Import', 'V6\\.0\\.7 Local Security');
architecture = architecture.replaceAll('V6\\.0\\.6 validated metadata backup import with preview and no overwrites',
  'V6\\.0\\.7 local API request hardening, validated backup import with preview and no overwrites');
updates.set(testPath, architecture);

for (const f of readdirSync(join(root, 'tests')).filter((x) => x.endsWith('.mjs') && x !== 'architecture.test.mjs' && x !== 'requestSecurity.test.mjs')) {
  const path = `tests/${f}`;
  const old = read(path);
  const next = old.replaceAll('v6.0.6', 'v6.0.7');
  if (next !== old) updates.set(path, next);
}

const readmePath = 'README.md';
let readme = read(readmePath);
if (!readme.includes('## V6.0.7 - Local Backend Security and Privacy Hardening')) {
  readme += `\n\n## V6.0.7 - Local Backend Security and Privacy Hardening\n\nThe loopback-only development API now validates browser request context more strictly, sends defensive response headers, rejects announced oversized JSON bodies early, limits repeated metadata requests and uses HTTP timeouts. The existing local project database and backup format remain unchanged.\n\nThis is not login authentication, authorization, encryption at rest or a secure public deployment. Keep the API bound to 127.0.0.1, keep .soulframe-local private, and use demo metadata until a proper security architecture is implemented.\n`;
}
updates.set(readmePath, readme);

if (process.argv.includes('--check')) {
  console.log(`Ready to update ${updates.size} tracked files. No changes written.`);
} else {
  for (const [path, body] of updates) writeFileSync(join(root, path), body, 'utf8');
  console.log(`Applied V6.0.7 security changes to ${updates.size} files. Run npm run verify.`);
}
