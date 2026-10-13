import test from "node:test";
import assert from "node:assert/strict";
import {
  getSessionValue, loadSavedSession, loadSavedSetting, saveSetting,
  loadSavedProjects, saveSavedProjects, buildSavedProjectRecord,
  buildSavedProjectsBackup, parseSavedProjectsBackup,
} from "../src/session/sessionStorage.js";
import { defaultProjectSession } from "../src/core/projectDefaults.js";

function withStorage(action) {
  const previous = globalThis.window;
  const values = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
    },
  };
  try { action(values); } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
}

test("session values still use the original project template", () => {
  assert.equal(getSessionValue({ projectName: "  Test Mix  " }, "projectName"), "Test Mix");
  assert.equal(getSessionValue({ projectName: "" }, "projectName"), defaultProjectSession.projectName);
});

test("legacy project-session key loads with defaults merged", () => withStorage((values) => {
  values.set("soulframe-project-session", JSON.stringify({ projectName: "Saved Track", clientName: "Studio" }));
  const session = loadSavedSession();
  assert.equal(session.projectName, "Saved Track");
  assert.equal(session.clientName, "Studio");
  assert.equal(session.trackType, defaultProjectSession.trackType);
}));

test("settings retain existing keys and fallback behavior", () => withStorage((values) => {
  assert.equal(loadSavedSetting("soulframe-review-mode", "draft"), "draft");
  saveSetting("soulframe-review-mode", "compare");
  assert.equal(loadSavedSetting("soulframe-review-mode", "draft"), "compare");
  assert.equal(values.get("soulframe-review-mode"), "compare");
}));

test("saved-project list round-trips through the original key", () => withStorage((values) => {
  const list = [{ id: "soulframe-1", title: "Project 1" }];
  saveSavedProjects(list);
  assert.deepEqual(loadSavedProjects(), list);
  assert.ok(values.has("soulframe-saved-projects"));
}));

test("saved-project record keeps the existing record shape", () => {
  const record = buildSavedProjectRecord(defaultProjectSession, "draft", "marcel");
  assert.match(record.id, /^soulframe-\d+$/);
  assert.equal(record.title, defaultProjectSession.projectName);
  assert.equal(record.reviewMode, "draft");
  assert.equal(record.selectedPreset, "marcel");
  assert.ok(!Number.isNaN(Date.parse(record.savedAt)));
});

test("backup export/import retains legacy type and data", () => {
  const list = [{ id: "soulframe-42", title: "Mix", projectSession: defaultProjectSession }];
  const backup = buildSavedProjectsBackup(list);
  assert.equal(JSON.parse(backup).type, "saved-projects-backup");
  assert.deepEqual(parseSavedProjectsBackup(backup), list);
});

test("missing storage, invalid JSON and invalid backup are handled safely", () => {
  const previous = globalThis.window;
  try {
    delete globalThis.window;
    assert.deepEqual(loadSavedProjects(), []);
    assert.equal(loadSavedSession().projectName, defaultProjectSession.projectName);
    globalThis.window = { localStorage: { getItem: () => "{broken", setItem: () => { throw new Error("disabled"); } } };
    assert.deepEqual(loadSavedProjects(), []);
    assert.equal(loadSavedSession().projectName, defaultProjectSession.projectName);
    assert.doesNotThrow(() => saveSavedProjects([]));
    assert.doesNotThrow(() => saveSetting("x", "y"));
    assert.deepEqual(parseSavedProjectsBackup("{}"), []);
    assert.deepEqual(parseSavedProjectsBackup("invalid"), []);
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});
