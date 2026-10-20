// SoulFrame V6.0.7 - layered protections for a loopback-only development API.
// This is NOT authentication, authorization, encryption at rest or cloud security.
import { ProjectStoreError } from './projectStore.mjs';

const DEFAULT_ORIGINS = new Set([
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:8787',
  'http://127.0.0.1:8787',
]);
const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

function localHttpOrigin(candidate) {
  if (typeof candidate !== 'string') return null;
  try {
    const origin = new URL(candidate);
    if (origin.protocol !== 'http:' || !['localhost', '127.0.0.1'].includes(origin.hostname) ||
        origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash ||
        !origin.port || Number(origin.port) < 1 || Number(origin.port) > 65535) return null;
    return origin.origin;
  } catch { return null; }
}

export function isAllowedLocalRequest(request, { allowedOrigin = process.env.SOULFRAME_ALLOWED_ORIGIN } = {}) {
  const host = request.headers?.host;
  if (typeof host !== 'string' || !/^(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/i.test(host)) return false;
  const port = host.match(/:(\d+)$/)?.[1];
  if (port && (+port < 1 || +port > 65535)) return false;
  const remote = request.socket?.remoteAddress;
  if (remote && !LOOPBACK.has(remote)) return false;
  const site = request.headers?.['sec-fetch-site'];
  if (site && !['same-origin', 'same-site', 'none'].includes(site)) return false;
  const origin = request.headers?.origin;
  if (site === 'same-site' && !origin) return false;
  if (!origin) return true; // CLI clients without Origin headers; still require loopback.
  const configured = localHttpOrigin(allowedOrigin);
  return DEFAULT_ORIGINS.has(origin) || (configured !== null && origin === configured);
}

export function setLocalSecurityHeaders(response) {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'no-referrer');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  response.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
  response.setHeader('Cache-Control', 'no-store');
  // Intentionally no Access-Control-Allow-Origin.
}

export function checkDeclaredContentLength(request, maxBytes) {
  const size = request.headers?.['content-length'];
  if (size === undefined) return;
  if (typeof size !== 'string' || !/^\d+$/.test(size) ||
      !Number.isSafeInteger(Number(size))) {
    throw new ProjectStoreError(400, 'Invalid Content-Length');
  }
  if (Number(size) > maxBytes) {
    throw new ProjectStoreError(413, 'JSON request exceeds the allowed size');
  }
}

// Limits help with accidental local request floods; they are NOT user quotas or anti-abuse auth.
export function createLocalRateLimiter({ clock = Date.now, windowMs = 60_000,
  maxWrites = 180, maxSensitiveReads = 90 } = {}) {
  const windows = new Map();
  return {
    allow(method, path) {
      const sensitiveRead = method === 'GET' && (path === '/api/backup' || path === '/api/recovery');
      const mutation = !['GET', 'HEAD'].includes(method);
      if (!sensitiveRead && !mutation) return true;
      const kind = sensitiveRead ? 'sensitive' : 'mutation';
      const now = clock();
      const key = kind;
      const prev = windows.get(key);
      const record = !prev || now - prev.started >= windowMs ? { started: now, count: 0 } : prev;
      if (record.count >= (sensitiveRead ? maxSensitiveReads : maxWrites)) {
        windows.set(key, record);
        return false;
      }
      record.count++;
      windows.set(key, record);
      return true;
    },
  };
}
