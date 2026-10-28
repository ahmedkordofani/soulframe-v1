#!/usr/bin/env node
// SoulFrame V6.1.4 Step 3.16: READ-ONLY two-account deleted-project RPC test.
// Uses existing git-ignored .env.rls.local and a publishable key, NEVER a secret key.
import { validateOwnershipEnvironment, requireVerifiedDifferentUsers, assertPermissionDenied } from '../src/hosted/ownershipContract.js';
import { parseDeletedList, requireOwnedTestTombstone, requireHiddenFromOtherAccount } from './lib/restoreListAssertions.mjs';

if (process.argv.length === 2 || (process.argv.length === 3 && process.argv[2] === '--help')) {
  console.log(`SoulFrame V6.1.4 read-only deleted project isolation test.\nUsage: node --env-file=.env.rls.local scripts/verify-cloud-restore-list-v614.mjs --live\nRequires existing disposable Supabase test accounts A and B.\nNo projects are created, restored, updated, or deleted. Only checks the known Step 2.9 synthetic tombstone.`);
  process.exit(0);
}
if (process.argv.length !== 3 || process.argv[2] !== '--live') {
  console.error('Use --help or --live only.');
  process.exit(2);
}
let config;
try { config = validateOwnershipEnvironment(process.env); }
catch (error) { console.error(`Configuration rejected: ${error.message}`); process.exit(2); }

const { createClient } = await import('@supabase/supabase-js');
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const anon = createClient(config.url, config.publishableKey, options);
const clients = [0, 1].map(() => createClient(config.url, config.publishableKey, options));
let passed = 0;
const pass = description => { console.log(`PASS ${++passed}: ${description}`); };
console.log('LIVE READ-ONLY TEST: two user accounts, no project mutations.');
try {
  const users = [];
  for (let index = 0; index < 2; index++) {
    const login = await clients[index].auth.signInWithPassword(config.users[index]);
    if (login.error || !login.data?.session?.access_token) throw new Error(`Test account ${index ? 'B' : 'A'} authentication failed`);
    const verified = await clients[index].auth.getUser();
    if (verified.error || !verified.data?.user?.id) throw new Error(`Test account ${index ? 'B' : 'A'} verification failed`);
    users.push(verified.data.user);
  }
  requireVerifiedDifferentUsers(...users);
  pass('two different verified accounts');

  const anonymous = await anon.rpc('sf_list_deleted_projects');
  assertPermissionDenied(anonymous, 'Anonymous deleted-project listing');
  pass('anonymous deleted-project listing denied');

  const a = parseDeletedList(await clients[0].rpc('sf_list_deleted_projects'), 'Account A listing');
  pass('account A deleted-project list has a minimal allowlisted response');
  const target = requireOwnedTestTombstone(a);
  pass('account A sees the exact known revision-3 test tombstone');

  const b = parseDeletedList(await clients[1].rpc('sf_list_deleted_projects'), 'Account B listing');
  pass('account B deleted-project list has a minimal allowlisted response');
  requireHiddenFromOtherAccount(b, target.id);
  pass('account B cannot discover account A test tombstone');

  console.log(`RESULT: PASS (${passed} read-only live assertions).`);
  console.log('No restore, update, delete or insert RPCs were called.');
} catch (error) {
  // Only deterministic, sanitized messages. Never print credentials or raw payloads.
  console.error(`RESULT: FAIL after ${passed} assertions. ${error.message}`);
  console.error('Stop; do not restore the tombstone or change access settings.');
  process.exitCode = 1;
} finally {
  await Promise.allSettled(clients.map(client => client.auth.signOut({ scope: 'local' })));
}
