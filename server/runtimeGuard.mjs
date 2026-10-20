// V6.0.9 - Fail-closed boundary between local development and public deployment.
// A local process token is not production authentication. Never enable remote hosting here.
const CLOUD_MARKERS = Object.freeze([
  'VERCEL', 'NETLIFY', 'RENDER', 'FLY_APP_NAME', 'K_SERVICE',
  'AWS_LAMBDA_FUNCTION_NAME', 'CF_PAGES', 'DYNO',
]);

function populated(value) {
  return value !== undefined && value !== null && String(value).trim() !== '' &&
    !['0', 'false'].includes(String(value).trim().toLowerCase());
}

function localOrigin(value) {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    return u.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(u.hostname) &&
      u.port !== '' && Number(u.port) >= 1 && Number(u.port) <= 65535 &&
      !u.username && !u.password && u.pathname === '/' && !u.search && !u.hash;
  } catch {
    return false;
  }
}

export const HOSTED_BLOCKERS = Object.freeze([
  'Use a verified identity provider, with token validation and session revocation',
  'Enforce per-user project ownership and role-based authorization at every endpoint',
  'Replace local single-process JSON storage with a transactional, access-controlled database',
  'Configure TLS, protected secrets, rate limits and an appropriate public API gateway',
  'Implement tenant-isolated backups, restore testing, retention and deletion policies',
  'Add production monitoring, audit logging, incident response and security review',
  'Establish user consent, privacy notice and data-processing requirements before client uploads',
]);

export function assessLocalRuntime(env = process.env) {
  const problems = [];
  if (String(env.NODE_ENV || '').trim().toLowerCase() === 'production') {
    problems.push('NODE_ENV=production is not supported by the local API');
  }
  const target = String(env.SOULFRAME_DEPLOYMENT_TARGET || 'local').trim().toLowerCase();
  if (!['local', 'development'].includes(target)) {
    problems.push('SOULFRAME_DEPLOYMENT_TARGET must be local or development');
  }
  for (const marker of CLOUD_MARKERS) {
    if (populated(env[marker])) problems.push(`Hosted platform environment detected: ${marker}`);
  }
  if (populated(env.SOULFRAME_API_HOST) &&
      !['127.0.0.1', 'localhost'].includes(String(env.SOULFRAME_API_HOST).trim().toLowerCase())) {
    problems.push('SOULFRAME_API_HOST must remain on loopback');
  }
  if (populated(env.SOULFRAME_ALLOWED_ORIGIN) && !localOrigin(String(env.SOULFRAME_ALLOWED_ORIGIN))) {
    problems.push('SOULFRAME_ALLOWED_ORIGIN must be a local HTTP origin with an explicit port');
  }
  return { ok: problems.length === 0, mode: 'local-development', problems };
}

export function assertLocalRuntime(env = process.env) {
  const result = assessLocalRuntime(env);
  if (!result.ok) {
    throw new Error(`SoulFrame local API startup blocked: ${result.problems.join('; ')}. Use a dedicated hosted backend, not this development server.`);
  }
  return result;
}
