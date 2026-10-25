#!/usr/bin/env node
// SoulFrame V6.1.2. Executes ONLY with --live against an explicitly configured throwaway DB.
// Uses two ordinary authenticated users and a publishable key, NEVER a service-role key.
import { randomUUID } from 'node:crypto';
import {
  OWNERSHIP_TABLE, TEST_RECORD_PREFIX, validateOwnershipEnvironment,
  requireVerifiedDifferentUsers, assertPermissionDenied,
  assertRowVisible, assertRowHidden, assertCreated,
} from '../src/hosted/ownershipContract.js';

function usage() {
  console.log(`SoulFrame hosted database ownership verification (V6.1.2)
Usage: npm run hosted:ownership -- --live

This opt-in test REQUIRES a disposable Supabase database with V6.1.0 migration,
and two distinct, email-confirmed Auth users with passwords.
Provide credentials ONLY in git-ignored .env.rls.local (see docs/v6-ownership-verification.md).
Do not use a production database. No service-role/secret keys are accepted.
Without --live, no network or database operations occur.`);
}

const args = process.argv.slice(2);
if (args.length === 0 || (args.length === 1 && args[0] === '--help')) {
  usage();
  process.exit(0);
}
if (args.length !== 1 || args[0] !== '--live') {
  console.error('Invalid argument. Use --help or --live.');
  process.exit(2);
}

let config;
try { config = validateOwnershipEnvironment(process.env); }
catch (err) { console.error(`Configuration rejected: ${err.message}`); process.exit(2); }

// Lazy import makes --help safe even before the optional Supabase SDK is installed.
const { createClient } = await import('@supabase/supabase-js');
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const anon = createClient(config.url, config.publishableKey, options);
const clients = config.users.map(() => createClient(config.url, config.publishableKey, options));
const marker = `${TEST_RECORD_PREFIX}${randomUUID().slice(0, 12)}`;
const rows = [];
let passed = 0;
const check = (name, assertion) => { assertion(); passed++; console.log(`PASS ${passed}: ${name}`); };

console.log('Running LIVE owner-isolation checks against the configured test database.');
console.log('Only synthetic test metadata is inserted. No existing SoulFrame project is uploaded.');
console.log(`Test record prefix: ${marker}`);
try {
  const users = [];
  for (let i = 0; i < 2; i++) {
    const result = await clients[i].auth.signInWithPassword(config.users[i]);
    if (result.error || !result.data?.session?.access_token) {
      throw new Error(`Test account ${i ? 'B' : 'A'} could not sign in. Check its credentials and email confirmation.`);
    }
    const verified = await clients[i].auth.getUser();
    if (verified.error || !verified.data?.user?.id) throw new Error(`Test account ${i ? 'B' : 'A'} was not verified.`);
    users.push(verified.data.user);
  }
  check('two different verified accounts', () => requireVerifiedDifferentUsers(...users));

  // Existing SELECT grant must be absent for anon. A denied HTTP request is expected here.
  const anonymousRead = await anon.from(OWNERSHIP_TABLE).select('id').limit(1);
  check('anonymous SELECT denied', () => assertPermissionDenied(anonymousRead, 'Anonymous SELECT'));

  // Creates two deliberately disposable metadata-only records.
  for (let i = 0; i < 2; i++) {
    const name = `${marker}-${i ? 'B' : 'A'}`;
    const result = await clients[i].from(OWNERSHIP_TABLE)
      .insert({ project_name: name, producer_notes: 'DISPOSABLE OWNERSHIP TEST ONLY' })
      .select('id,owner_id,revision,project_name').single();
    rows.push(assertCreated(result, users[i].id, name, `Account ${i ? 'B' : 'A'} insert`));
    check(`account ${i ? 'B' : 'A'} inserts an owner-scoped row`, () => {});
  }

  for (let i = 0; i < 2; i++) {
    const self = await clients[i].from(OWNERSHIP_TABLE).select('id,owner_id,project_name').eq('id', rows[i].id);
    check(`account ${i ? 'B' : 'A'} can read own row`, () => assertRowVisible(self, rows[i].id, users[i].id, 'Own SELECT'));
    const other = await clients[i].from(OWNERSHIP_TABLE).select('id,owner_id,project_name').eq('id', rows[1-i].id);
    check(`account ${i ? 'B' : 'A'} cannot read the other row`, () => assertRowHidden(other, 'Cross-user SELECT'));
  }

  for (let i = 0; i < 2; i++) {
    const spoof = await clients[i].from(OWNERSHIP_TABLE)
      .insert({ project_name: `${marker}-SPOOF`, owner_id: users[1-i].id });
    check(`account ${i ? 'B' : 'A'} cannot spoof owner_id on insert`, () => assertPermissionDenied(spoof, 'Owner spoofing'));
    const revision = await clients[i].from(OWNERSHIP_TABLE)
      .insert({ project_name: `${marker}-REVISION`, revision: 900 });
    check(`account ${i ? 'B' : 'A'} cannot set revision`, () => assertPermissionDenied(revision, 'Revision spoofing'));
    const update = await clients[i].from(OWNERSHIP_TABLE)
      .update({ project_name: `${marker}-CHANGED` }).eq('id', rows[i].id);
    check(`account ${i ? 'B' : 'A'} cannot UPDATE own row yet`, () => assertPermissionDenied(update, 'Update permission'));
    const deletion = await clients[i].from(OWNERSHIP_TABLE).delete().eq('id', rows[i].id);
    check(`account ${i ? 'B' : 'A'} cannot DELETE own row yet`, () => assertPermissionDenied(deletion, 'Delete permission'));
  }

  const anonymousInsert = await anon.from(OWNERSHIP_TABLE).insert({ project_name: `${marker}-ANON` });
  check('anonymous INSERT denied', () => assertPermissionDenied(anonymousInsert, 'Anonymous INSERT'));

  for (let i = 0; i < 2; i++) {
    const after = await clients[i].from(OWNERSHIP_TABLE).select('id,owner_id,project_name').eq('id', rows[i].id);
    check(`account ${i ? 'B' : 'A'} row unchanged after blocked writes`, () => {
      assertRowVisible(after, rows[i].id, users[i].id, 'Post-check read');
      if (after.data[0].project_name !== rows[i].project_name) throw new Error('Test record was changed');
    });
  }
  console.log(`RESULT: PASS (${passed} live assertions). Owner-isolation matrix verified in this test project.`);
  console.log('REMINDER: This is NOT a production security certification or a cloud-sync release.');
} catch (err) {
  // Do not print tokens, credentials, raw SDK errors, SQL rows or Supabase URLs.
  console.error(`RESULT: FAIL after ${passed} checks. ${err.message}`);
  console.error('No cloud syncing was enabled. Review migration/grants and test account configuration.');
  process.exitCode = 1;
} finally {
  await Promise.allSettled(clients.map(client => client.auth.signOut({ scope: 'local' })));
  console.log(`Test records, if inserted, remain in the test database under prefix ${marker}.`);
  console.log('Clean up only those records via the TEST project SQL Editor (instructions in docs/v6-ownership-verification.md).');
}
