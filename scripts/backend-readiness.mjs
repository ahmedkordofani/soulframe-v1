#!/usr/bin/env node
// Read-only readiness check. Never sends data or prints tokens, project names or client details.
import { assessLocalRuntime, HOSTED_BLOCKERS } from '../server/runtimeGuard.mjs';
import { auditLocalStorage } from '../server/storageAudit.mjs';

const args = process.argv.slice(2);
if (args.includes('--help')) {
  console.log('Usage: npm run backend:readiness -- [--target=local|--target=hosted] [--json]');
  process.exit(0);
}
if (args.some((arg) => !['--target=local', '--target=hosted', '--json'].includes(arg)) ||
    (args.includes('--target=local') && args.includes('--target=hosted'))) {
  console.error('Invalid arguments. Use --help for supported options.');
  process.exit(1);
}
const target = args.includes('--target=hosted') ? 'hosted' : 'local';
const runtime = assessLocalRuntime();
const storage = await auditLocalStorage();
const findings = [
  ...runtime.problems.map((reason) => ({ category: 'runtime', reason })),
  ...(!storage.ok ? [{ category: 'storage', reason: storage.error }] : []),
];
if (target === 'hosted') {
  findings.push(...HOSTED_BLOCKERS.map((reason) => ({ category: 'hosting', reason })));
}
const result = {
  target,
  ready: findings.length === 0,
  runtime: { mode: 'local-development', safeForLocalUse: runtime.ok },
  storage,
  findings,
  note: target === 'hosted'
    ? 'NOT DEPLOYABLE. This check is a requirements gate, not a hosted backend.'
    : 'Local development only. Do not expose this server publicly.',
};
if (args.includes('--json')) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`SoulFrame backend readiness - ${target.toUpperCase()}: ${result.ready ? 'PASS' : 'BLOCKED'}`);
  console.log(`Local storage: ${storage.ok ? (storage.exists ? 'valid' : 'not yet created') : 'INVALID'}`);
  if (storage.ok) console.log(`Project records: ${storage.projectCount}; recovery snapshots: ${storage.snapshotCount}`);
  for (const finding of findings) console.log(`  - [${finding.category}] ${finding.reason}`);
  console.log(result.note);
}
process.exitCode = result.ready ? 0 : 1;
