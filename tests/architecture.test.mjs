// V5.4.10 - Architecture boundary checks.
// Static guardrails complement behavioural report, session, and integration tests.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const app = read("src/App.jsx");
const analysis = read("src/analysis/audioAnalysis.js");
const report = read("src/report/reportBuilders.js");
const session = read("src/session/sessionStorage.js");
const hook = read("src/session/useProjectSessions.js");

test("audio and report engines are imported from separate modules", () => {
  assert.match(app, /from "\.\/analysis\/audioAnalysis"/);
  assert.match(app, /from "\.\/report\/reportBuilders"/);
  assert.match(app, /from "\.\/core\/projectDefaults"/);
  assert.match(app, /from "\.\/session\/useProjectSessions"/);
  assert.match(app, /from "\.\/session\/sessionStorage"/);
});

test("analysis and report builders remain UI-independent", () => {
  for (const source of [analysis, report, session]) {
    assert.doesNotMatch(source, /from ["'][^"']*App(?:\.jsx)?["']/);
    assert.doesNotMatch(source, /from ["']react["']/);
  }
  assert.ok(report.includes('from "../analysis/audioAnalysis.js"'));
  assert.ok(report.includes('from "../core/projectDefaults.js"'));
});

test("session hook owns state and legacy persistence keys remain", () => {
  assert.match(hook, /export function useProjectSessions/);
  assert.match(session, /soulframe-project-session/);
  assert.match(session, /soulframe-saved-projects/);
  assert.match(session, /type: "saved-projects-backup"/);
});

test("secondary views and Classic Demo remain lazy-loaded", () => {
  assert.match(app, /React\.lazy\(\(\) => import\("\.\/views\/SecondaryViews"\)\)/);
  assert.match(app, /React\.lazy\(\(\) => import\("\.\/demo\/ClassicDemo"\)\)/);
  assert.match(app, /React\.Suspense/);
});

test("V6.0.2 version and product summary are in sync", () => {
  assert.match(app, /V6\.0\.2 Project Store/);
  assert.match(app, /V6\.0\.2 local project persistence/);
  assert.doesNotMatch(app, /V5\.4\.9 Integration QA/);
});

test("the release gate runs regression tests and a production build in CI", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.scripts.test, "node --test");
  assert.equal(pkg.scripts.verify, "npm run test && npm run build");
  const workflow = read(".github/workflows/verify.yml");
  assert.match(workflow, /npm ci/);
  assert.match(workflow, /npm run verify/);
  assert.match(workflow, /pull_request:/);
});


test("V6.0.2 local persistence is explicit and never commits local metadata", () => {
  const ignored = read(".gitignore");
  const projectClient = read("src/api/projectClient.js");
  assert.match(ignored, /\.soulframe-local\//);
  assert.match(projectClient, /export const createApiProject/);
  assert.doesNotMatch(app, /from ["']\.\/api\/projectClient["']/);
});
