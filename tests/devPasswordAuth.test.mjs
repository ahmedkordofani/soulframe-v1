import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { isDevPasswordLoginEnabled } from '../src/hosted/devPasswordGate.js';
import { signInDevTestAccountWithPassword } from '../src/hosted/hostedIdentity.js';

function fakeClient({ error = null, userId = 'user-a' } = {}) {
  const calls = [];
  return {
    calls,
    auth: {
      async signInWithOtp() { throw new Error('Not expected'); },
      async verifyOtp() { throw new Error('Not expected'); },
      async signOut() { throw new Error('Not expected'); },
      async signInWithPassword(input) { calls.push(['password', input]); return { error }; },
      async getUser() { calls.push(['getUser']); return { data: { user: userId ? { id: userId, email: 'test@example.com' } : null }, error: null }; },
    },
  };
}

test('password sign-in requires both a Vite dev build and explicit local opt-in', () => {
  assert.equal(isDevPasswordLoginEnabled({ DEV: true, VITE_SOULFRAME_DEV_PASSWORD_LOGIN: 'true' }), true);
  for (const env of [
    {}, { DEV: true }, { DEV: false, VITE_SOULFRAME_DEV_PASSWORD_LOGIN: 'true' },
    { DEV: true, VITE_SOULFRAME_DEV_PASSWORD_LOGIN: 'false' },
    { DEV: 'true', VITE_SOULFRAME_DEV_PASSWORD_LOGIN: 'true' },
  ]) assert.equal(isDevPasswordLoginEnabled(env), false);
});

test('disabled password path cannot reach Supabase at all', async () => {
  const client = fakeClient();
  await assert.rejects(signInDevTestAccountWithPassword(client, 'test@example.com', 'test-only-password'), /disabled/);
  assert.deepEqual(client.calls, []);
});

test('valid development password flow uses provider then independently verifies account', async () => {
  const client = fakeClient();
  const result = await signInDevTestAccountWithPassword(client, ' test@example.com ', 'test-only-password', { enabled: true });
  assert.deepEqual(result, { id: 'user-a', email: 'test@example.com' });
  assert.deepEqual(client.calls, [
    ['password', { email: 'test@example.com', password: 'test-only-password' }],
    ['getUser'],
  ]);
});

test('empty passwords and malformed emails never reach Supabase', async () => {
  const client = fakeClient();
  await assert.rejects(signInDevTestAccountWithPassword(client, 'invalid', 'valid-pass', { enabled: true }), /valid email/);
  await assert.rejects(signInDevTestAccountWithPassword(client, 'test@example.com', '', { enabled: true }), /password/);
  assert.deepEqual(client.calls, []);
});

test('provider failure and missing independently verified identity fail closed', async () => {
  const failed = fakeClient({error: new Error('bad secret')});
  await assert.rejects(signInDevTestAccountWithPassword(failed, 'test@example.com', 'incorrect', {enabled: true}), /not accepted/);
  assert.equal(failed.calls.filter(x => x[0] === 'getUser').length, 0);
  const noUser = fakeClient({userId: null});
  await assert.rejects(signInDevTestAccountWithPassword(noUser, 'test@example.com', 'valid', {enabled: true}), /No verified hosted identity/);
});

test('development-only password form does not replace email-code flow', () => {
  const ui = readFileSync(new URL('../src/hosted/HostedIdentityPanel.jsx', import.meta.url), 'utf8');
  assert.match(ui, /isDevPasswordLoginEnabled\(import\.meta\.env\)/);
  assert.match(ui, /signInMethod === 'password'/);
  assert.match(ui, /onSubmit={signInWithTestPassword}/);
  assert.match(ui, /onSubmit={sendCode}/);
  assert.match(ui, /onSubmit={verifyCode}/);
  assert.match(ui, /type="password"/);
  assert.match(ui, /setTestPassword\(''\)/);
  assert.match(ui, /await signOutIdentity\(client\)/);
});

test('password path never persists credentials or touches cloud project data directly', () => {
  const helper = readFileSync(new URL('../src/hosted/hostedIdentity.js', import.meta.url), 'utf8');
  const ui = readFileSync(new URL('../src/hosted/HostedIdentityPanel.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(helper + ui, /localStorage|sessionStorage|console\.log|\.auth\.signUp\(/);
  assert.doesNotMatch(helper + ui, /\.from\(['"]soulframe_projects/);
  assert.match(ui, /phase === 'signed-in' && identity && client && \(/);
});
