// A small, testable adapter around Supabase Auth. No database or audio operations.
function requireAuth(client) {
  if (!client?.auth || typeof client.auth.getUser !== 'function' ||
      typeof client.auth.signInWithOtp !== 'function' ||
      typeof client.auth.verifyOtp !== 'function' ||
      typeof client.auth.signOut !== 'function') {
    throw new TypeError('An initialized Supabase Auth client is required');
  }
  return client.auth;
}

export function validateIdentityEmail(input) {
  const email = typeof input === 'string' ? input.trim() : '';
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address');
  }
  return email;
}

export function validateIdentityCode(input) {
  const code = typeof input === 'string' ? input.trim() : '';
  if (!/^\d{6,8}$/.test(code)) throw new Error('Enter the numeric code from your email');
  return code;
}

export async function requestIdentityCode(client, email) {
  const address = validateIdentityEmail(email);
  const { error } = await requireAuth(client).signInWithOtp({
    email: address,
    // Don't silently create accounts while multi-tenant data isolation remains unverified.
    options: { shouldCreateUser: false },
  });
  if (error) throw new Error(error.message || 'Could not send an email code');
  return address;
}

export async function readVerifiedIdentity(client) {
  const { data, error } = await requireAuth(client).getUser();
  if (error) throw new Error(error.message || 'Could not verify hosted identity');
  const user = data?.user;
  if (typeof user?.id !== 'string' || !user.id) throw new Error('No verified hosted identity');
  return { id: user.id, email: typeof user.email === 'string' ? user.email : '' };
}

export async function verifyIdentityCode(client, email, code) {
  const address = validateIdentityEmail(email);
  const token = validateIdentityCode(code);
  const { error } = await requireAuth(client).verifyOtp({ email: address, token, type: 'email' });
  if (error) throw new Error(error.message || 'The code could not be verified');
  // Do not trust a locally decoded token or a user object returned solely by verifyOtp.
  return readVerifiedIdentity(client);
}

export async function signOutIdentity(client) {
  const { error } = await requireAuth(client).signOut({ scope: 'local' });
  if (error) throw new Error(error.message || 'Could not sign out');
}

// Existing-password sign-in for two pre-provisioned test accounts only.
// The caller must explicitly enable the DEV-only UI gate; this never signs up users.
export async function signInDevTestAccountWithPassword(client, email, password, { enabled = false } = {}) {
  if (!enabled) throw new Error('Development password sign-in is disabled');
  const address = validateIdentityEmail(email);
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Enter the test-account password');
  }
  if (typeof client?.auth?.signInWithPassword !== 'function') {
    throw new TypeError('Supabase password authentication is unavailable');
  }
  const { error } = await client.auth.signInWithPassword({ email: address, password });
  if (error) throw new Error('Test-account sign-in was not accepted');
  // RLS project actions independently call this verification again.
  return readVerifiedIdentity(client);
}
