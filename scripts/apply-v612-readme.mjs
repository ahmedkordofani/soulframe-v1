#!/usr/bin/env node
// Small idempotent README upgrade so existing V6.1.1 documentation is retained.
import { readFileSync, writeFileSync } from 'node:fs';
const filename = new URL('../README.md', import.meta.url);
const oldTitle = '**V6.1.1 - Optional Hosted Identity Integration (development, not deployed)**';
const newTitle = '**V6.1.2 - Database Ownership Verification Harness (live test required)**';
const file = readFileSync(filename, 'utf8');
if (file.includes(newTitle)) {
  console.log('README already records V6.1.2. No changes needed.');
  process.exit(0);
}
const startMarker = 'SoulFrame now includes a **proposed** Supabase/PostgreSQL hosted project metadata schema';
const endMarker = 'Read [V6.1.1 hosted identity setup]';
if (!file.includes(oldTitle) || !file.includes(startMarker) || !file.includes(endMarker)) {
  console.error('README differs from the expected committed V6.1.1 baseline. Not modified.');
  process.exit(1);
}
const start = file.indexOf(startMarker);
const end = file.indexOf(endMarker, start);
const replacement = `V6.1.2 adds an **opt-in two-account Supabase Data API ownership test** for the proposed owner-scoped project table. This test is not a live cloud feature and does not activate hosted saves. Supabase email-code sign-in remains optional from V6.1.1; local/browser projects and audio remain unchanged. **Real account isolation remains UNVERIFIED until the live test passes in a disposable database.**\n\nRead [V6.1.2 ownership verification](docs/v6-ownership-verification.md), `;
const withBody = file.slice(0,start) + replacement + file.slice(end + 'Read '.length);
const result = withBody.replace(oldTitle,newTitle);
if (!result.includes(newTitle) || !result.includes('V6.1.2 ownership verification')) {
  console.error('README update validation failed. Not modified.');
  process.exit(1);
}
writeFileSync(filename, result, 'utf8');
console.log('README updated for V6.1.2. No other source files changed.');
