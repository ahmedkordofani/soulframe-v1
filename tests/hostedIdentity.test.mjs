import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveHostedIdentityConfig } from '../src/hosted/authConfig.js';
import { requestIdentityCode, verifyIdentityCode, readVerifiedIdentity, signOutIdentity, validateIdentityEmail, validateIdentityCode } from '../src/hosted/hostedIdentity.js';

const config = { VITE_SUPABASE_URL: 'https://project.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_publictest123456' };
function fakeClient() {
  const calls = [];
  return { calls, auth: {
    async signInWithOtp(input) { calls.push(['send', input]); return { error: null }; },
    async verifyOtp(input) { calls.push(['verify', input]); return { error: null }; },
    async getUser() { calls.push(['getUser']); return { data: { user: { id: 'owner-123', email: 'producer@example.com' } }, error: null }; },
    async signOut(input) { calls.push(['signOut', input]); return { error: null }; },
  } };
}

test('disabled by default without Supabase configuration', () => {
  assert.deepEqual(resolveHostedIdentityConfig(), { enabled: false, reason: 'not-configured' });
  assert.deepEqual(resolveHostedIdentityConfig({ VITE_SUPABASE_URL: config.VITE_SUPABASE_URL }), { enabled: false, reason: 'invalid-config' });
});
test('accepts a public publishable key and normalizes safe HTTPS URL', () => {
  const got = resolveHostedIdentityConfig(config);
  assert.deepEqual(got, { enabled: true, url: config.VITE_SUPABASE_URL, publishableKey: config.VITE_SUPABASE_PUBLISHABLE_KEY });
});
test('rejects secret/service keys and untrusted remote HTTP or embedded credentials', () => {
  for (const [url, key] of [
    ['http://attacker.example', config.VITE_SUPABASE_PUBLISHABLE_KEY],
    ['https://user:pass@project.supabase.co', config.VITE_SUPABASE_PUBLISHABLE_KEY],
    ['https://project.supabase.co/other', config.VITE_SUPABASE_PUBLISHABLE_KEY],
    [config.VITE_SUPABASE_URL, 'sb_secret_unsafe'],
  ]) assert.equal(resolveHostedIdentityConfig({ VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key }).enabled, false);
});
test('allows local Supabase CLI URLs only on loopback', () => {
  assert.equal(resolveHostedIdentityConfig({ ...config, VITE_SUPABASE_URL: 'http://127.0.0.1:54321' }).enabled, true);
  assert.equal(resolveHostedIdentityConfig({ ...config, VITE_SUPABASE_URL: 'http://192.168.1.5:54321' }).enabled, false);
});
test('email and numeric OTP input are validated before SDK calls', () => {
  assert.equal(validateIdentityEmail(' TEST@example.com '), 'TEST@example.com');
  assert.equal(validateIdentityCode(' 123456 '), '123456');
  assert.throws(() => validateIdentityEmail('not-an-email'), /valid email/);
  assert.throws(() => validateIdentityCode('abc'), /numeric/);
});
test('request code never silently registers new users', async () => {
  const client = fakeClient();
  assert.equal(await requestIdentityCode(client, 'producer@example.com'), 'producer@example.com');
  assert.deepEqual(client.calls, [['send', { email: 'producer@example.com', options: { shouldCreateUser: false } }]]);
});
test('verification uses OTP then independently verifies user through getUser', async () => {
  const client = fakeClient();
  const user = await verifyIdentityCode(client, 'producer@example.com', '123456');
  assert.deepEqual(user, { id: 'owner-123', email: 'producer@example.com' });
  assert.deepEqual(client.calls[0], ['verify', { email: 'producer@example.com', token: '123456', type: 'email' }]);
  assert.deepEqual(client.calls[1], ['getUser']);
});
test('a missing identity or SDK error cannot be treated as signed in', async () => {
  const client = fakeClient();
  client.auth.getUser = async () => ({ data: { user: null }, error: null });
  await assert.rejects(readVerifiedIdentity(client), /No verified hosted identity/);
  client.auth.verifyOtp = async () => ({ error: new Error('Invalid token') });
  await assert.rejects(verifyIdentityCode(client, 'producer@example.com', '123456'), /Invalid token/);
});
test('sign-out uses local session scope and propagates errors', async () => {
  const client = fakeClient();
  await signOutIdentity(client);
  assert.deepEqual(client.calls, [['signOut', { scope: 'local' }]]);
  client.auth.signOut = async () => ({ error: new Error('Logout rejected') });
  await assert.rejects(signOutIdentity(client), /Logout rejected/);
});
test('identity layer has no project/audio requests or persistent session storage', () => {
  const sources = ['src/hosted/hostedIdentity.js', 'src/hosted/supabaseIdentityClient.js', 'src/hosted/HostedIdentityPanel.jsx']
    .map(path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'));
  assert.doesNotMatch(sources.join('\n'), /\.from\(['"]soulframe_projects|\.storage\.from\(/);
  assert.match(sources[1], /persistSession:\s*false/);
  assert.match(sources[1], /detectSessionInUrl:\s*false/);
});
