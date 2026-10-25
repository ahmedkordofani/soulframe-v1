// SoulFrame V6.1.2 - pure rules for a two-account RLS integration test.
// No network operations, test passwords, API keys or sessions belong here.

export const OWNERSHIP_TABLE = 'soulframe_projects';
export const TEST_RECORD_PREFIX = 'SF-RLS-VERIFY-';

const TEST_KEYS = Object.freeze([
  'SOULFRAME_TEST_SUPABASE_URL',
  'SOULFRAME_TEST_PUBLISHABLE_KEY',
  'SOULFRAME_TEST_USER_A_EMAIL',
  'SOULFRAME_TEST_USER_A_PASSWORD',
  'SOULFRAME_TEST_USER_B_EMAIL',
  'SOULFRAME_TEST_USER_B_PASSWORD',
]);

export function validateOwnershipEnvironment(environment) {
  const missing = TEST_KEYS.filter(key => !String(environment[key] ?? '').trim());
  if (missing.length) {
    throw new Error(`Missing test configuration: ${missing.join(', ')}. Provide a private .env.rls.local file.`);
  }
  const rawUrl = environment.SOULFRAME_TEST_SUPABASE_URL.trim();
  let parsed;
  try { parsed = new URL(rawUrl); }
  catch { throw new Error('The test Supabase URL is invalid'); }
  const local = ['localhost', '127.0.0.1'].includes(parsed.hostname);
  if ((parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) ||
      parsed.username || parsed.password || parsed.pathname !== '/' || parsed.search || parsed.hash) {
    throw new Error('Use an HTTPS Supabase project URL (or loopback HTTP for local development)');
  }
  const key = environment.SOULFRAME_TEST_PUBLISHABLE_KEY.trim();
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key)) {
    throw new Error('Only sb_publishable_ keys are accepted. NEVER use secret or service-role keys.');
  }
  const a = environment.SOULFRAME_TEST_USER_A_EMAIL.trim();
  const b = environment.SOULFRAME_TEST_USER_B_EMAIL.trim();
  if (!/^\S+@\S+\.\S+$/.test(a) || !/^\S+@\S+\.\S+$/.test(b) || a.toLowerCase() === b.toLowerCase()) {
    throw new Error('Provide two different valid email addresses for independently provisioned test users');
  }
  return {
    url: parsed.origin,
    publishableKey: key,
    users: [
      { email: a, password: environment.SOULFRAME_TEST_USER_A_PASSWORD },
      { email: b, password: environment.SOULFRAME_TEST_USER_B_PASSWORD },
    ],
  };
}

export function requireVerifiedDifferentUsers(a, b) {
  if (!a || !b || typeof a.id !== 'string' || typeof b.id !== 'string' || !a.id || !b.id || a.id === b.id) {
    throw new Error('Two separate authenticated user IDs are required');
  }
}

export function isPermissionDenied(result) {
  // Expected PostgreSQL privilege/RLS error via PostgREST, not a network failure or a missing table.
  return Boolean(result?.error && result.error.code === '42501');
}

export function assertPermissionDenied(result, check) {
  if (!isPermissionDenied(result)) {
    throw new Error(`${check}: expected database permission denied (42501), got ${result?.error?.code || 'success/other error'}`);
  }
}

export function assertRowVisible(result, id, ownerId, check) {
  if (result?.error || !Array.isArray(result?.data) || result.data.length !== 1 ||
      result.data[0].id !== id || result.data[0].owner_id !== ownerId) {
    throw new Error(`${check}: owner row was not returned correctly`);
  }
}

export function assertRowHidden(result, check) {
  if (result?.error || !Array.isArray(result?.data) || result.data.length !== 0) {
    throw new Error(`${check}: another account's row was visible or query failed`);
  }
}

export function assertCreated(result, ownerId, expectedName, check) {
  const row = result?.data;
  if (result?.error || !row || typeof row.id !== 'string' || row.owner_id !== ownerId ||
      row.revision !== 1 || row.project_name !== expectedName) {
    throw new Error(`${check}: database did not generate the expected owner-scoped project`);
  }
  return row;
}
