import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildLocalApiProjectPayload } from "../src/api/projectMetadata.js";
import { validateProjectPayload } from "../server/projectStore.mjs";
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

test("UI metadata mapper only sends fields allowed by the server", () => {
  const projectSession = {
    projectName: "Demo", clientName: "Local test", producerNotes: "Human review",
    audioBytes: new Uint8Array([1, 2, 3]), draftAudioAnalysis: { status: "Ready" },
    audioUrl: "blob:secret", file: "private.mp3",
  };
  const payload = buildLocalApiProjectPayload(projectSession, "compare", "marcel");
  assert.deepEqual(Object.keys(payload.projectSession), ["projectName", "clientName", "producerNotes"]);
  assert.equal(payload.projectSession.audioBytes, undefined);
  assert.equal(payload.projectSession.audioUrl, undefined);
  assert.deepEqual(validateProjectPayload(payload), payload);
});

test("mapper rejects invalid or oversized project metadata before sending", () => {
  assert.throws(() => buildLocalApiProjectPayload({ projectName: "  " }), /project name/);
  assert.throws(() => buildLocalApiProjectPayload({ projectName: "Test", producerNotes: "a".repeat(4001) }), /producerNotes/);
  assert.throws(() => buildLocalApiProjectPayload({ projectName: "Test" }, "invalid"), /review mode/);
  assert.throws(() => buildLocalApiProjectPayload({ projectName: "Test" }, "draft", "x".repeat(121)), /preset/);
});

test("browser project persistence and backup keys remain unchanged", () => {
  const session = read("src/session/sessionStorage.js");
  assert.match(session, /soulframe-saved-projects/);
  assert.match(session, /saved-projects-backup/);
  const hook = read("src/session/useProjectSessions.js");
  assert.match(hook, /loadSavedProjectSnapshot/);
  assert.match(hook, /saveProjectSnapshot/);
});

test("V6 interface requires explicit user actions and confirmations for destructive operations", () => {
  const ui = read("src/api/ApiProjectManager.jsx");
  assert.match(ui, /onClick={saveNewProject}/);
  assert.match(ui, /onClick={confirmAction}/);
  assert.match(ui, /onClick={refreshProjects}/);
  assert.match(ui, /setPending\(\{ kind: "load"/);
  assert.match(ui, /setPending\(\{ kind: "overwrite"/);
  assert.match(ui, /setPending\(\{ kind: "delete"/);
  assert.doesNotMatch(ui, /useEffect\(\(\) => \{[^}]*createApiProject/s);
});

test("loading server metadata clears stale audio and preserves browser saved project controls", () => {
  const app = read("src/App.jsx");
  assert.match(app, /<ApiProjectManager/);
  assert.match(app, /<SavedProjectHistory/);
  assert.match(app, /setDraftAudioUrl\(""\)/);
  assert.match(app, /setHumanizedAudioUrl\(""\)/);
  assert.match(app, /setDraftAudioAnalysis\(null\)/);
  assert.match(app, /setHumanizedAudioAnalysis\(null\)/);
});
