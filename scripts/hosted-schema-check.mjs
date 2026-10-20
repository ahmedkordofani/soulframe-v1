#!/usr/bin/env node
// Design-time contract checks only. Does NOT connect to Supabase or execute SQL.
import { readFileSync } from 'node:fs';
const sql = readFileSync(new URL('../supabase/migrations/20261020000100_hosted_projects.sql', import.meta.url), 'utf8');
const checks = [
  ['proposed table', /create table public\.soulframe_projects\s*\(/i],
  ['owner tied to authenticated identity', /owner_id uuid not null default auth\.uid\(\) references auth\.users\(id\)/i],
  ['row level security enabled', /alter table public\.soulframe_projects enable row level security;/i],
  ['revoke default access', /revoke all on table public\.soulframe_projects from public, anon, authenticated;/i],
  ['select only for authenticated', /grant select on table public\.soulframe_projects to authenticated;/i],
  ['column limited insert for authenticated', /grant insert \([\s\S]*?\) on table public\.soulframe_projects to authenticated;/i],
  ['read policy scoped to owner', /for select to authenticated\s+using \(owner_id = \(select auth\.uid\(\)\)\)/i],
  ['insert policy scoped to owner', /for insert to authenticated\s+with check \(owner_id = \(select auth\.uid\(\)\)\)/i],
  ['no direct update grant', /^\s*grant\s+update\b/im, true],
  ['no direct delete grant', /^\s*grant\s+delete\b/im, true],
  ['no permissive anon policies', /for\s+\w+\s+to\s+anon\b/im, true],
  ['first revision fixed to one', /revision integer not null default 1 check \(revision = 1\)/i],
  ['no published audio columns', /^\s*(?:audio|audio_bytes|audio_url|raw_audio)\s+\w+/im, true],
];
const failures = checks.filter(([_, pattern, forbidden]) => forbidden ? pattern.test(sql) : !pattern.test(sql));
const insertGrant = sql.match(/grant insert \(([\s\S]*?)\) on table public\.soulframe_projects to authenticated;/i);
if (!insertGrant || /\b(owner_id|id|revision|created_at|updated_at)\b/i.test(insertGrant[1])) {
  failures.push(['Caller cannot insert identity, revision or timestamp columns']);
}
const totalChecks = checks.length + 1;
console.log(`SoulFrame hosted schema design check: ${failures.length ? 'FAIL' : 'PASS'} (${totalChecks - failures.length}/${totalChecks} static invariants)`);
for (const [name] of failures) console.error(`  - Missing or unsafe: ${name}`);
console.log('This does NOT verify SQL execution or user isolation. Use real two-user database tests before hosting.');
process.exitCode = failures.length ? 1 : 0;
