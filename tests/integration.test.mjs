import test from "node:test";
import assert from "node:assert/strict";

import {
  loadAudioHealthCheck,
  getHumanizationPriorityScore,
  getAudioHealthRecommendation,
  buildArtifactClues,
  getBeforeAfterImprovementScore,
} from "../src/analysis/audioAnalysis.js";
import {
  buildV42SmartReportComposer,
  buildV42ReportQualityGate,
  buildV42ReportOutputPack,
  buildV42BeforeAfterExplanation,
  buildV42ReportExportManifest,
  buildV42FinalReportHandoff,
} from "../src/report/reportBuilders.js";
import {
  buildSavedProjectRecord,
  buildSavedProjectsBackup,
  parseSavedProjectsBackup,
  loadSavedSession,
  loadSavedProjects,
  loadSavedSetting,
  saveSetting,
  saveSavedProjects,
} from "../src/session/sessionStorage.js";
import { defaultProjectSession } from "../src/core/projectDefaults.js";

const session = {
  ...defaultProjectSession,
  projectName: "Producer Demo - Vocal Humanization",
  clientName: "Demo Artist",
  trackType: "hip hop vocal track",
  producerNotes: "Focus on natural vocal phrasing and cleaner gain staging.",
};

// The same decoded-audio -> report flow as the browser, with only browser APIs stubbed.
// Synthetic PCM validates integration plumbing; it does not validate AI detection accuracy.
async function withDecodedSamples(samples, run, { fail = false } = {}) {
  const originalWindow = globalThis.window;
  const originalFetch = globalThis.fetch;
  let didClose = false;
  try {
    class FakeAudioContext {
      async decodeAudioData() {
        if (fail) throw new Error("Unsupported audio encoding");
        return {
          sampleRate: 44100,
          numberOfChannels: 1,
          getChannelData: () => samples,
        };
      }
      async close() {
        didClose = true;
      }
    }
    globalThis.window = { AudioContext: FakeAudioContext };
    globalThis.fetch = async () => ({ arrayBuffer: async () => new ArrayBuffer(64) });
    let result = null;
    const statuses = [];
    await loadAudioHealthCheck("blob:soulframe-synthetic", (next) => {
      result = next;
      statuses.push(next.status);
    });
    await run(result, statuses);
    if (!fail) assert.equal(didClose, true, "Successful decode closes the audio context");
  } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
    if (originalFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = originalFetch;
  }
}

function makeSamples(amplitude, wavelength = 9) {
  return Float32Array.from({ length: 4096 }, (_, index) => amplitude * Math.sin((index / wavelength) * Math.PI * 2));
}

function withFakeStorage(run) {
  const originalWindow = globalThis.window;
  const data = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => data.set(key, String(value)),
      removeItem: (key) => data.delete(key),
    },
  };
  try { run(data); } finally {
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
}

const analyzedDraft = {
  status: "Ready",
  brightness: "Bright / Potentially Harsh",
  textureStability: "Unstable / Busy",
  dynamics: "Compressed",
  clippingRisk: "High",
  sampleRate: 44100,
  peakDb: "-0.1 dB",
  averageEnergyDb: "-8.0 dB",
};
const analyzedEdit = {
  ...analyzedDraft,
  brightness: "Balanced",
  textureStability: "Stable",
  dynamics: "Moderate",
  clippingRisk: "Low",
  peakDb: "-6.0 dB",
  averageEnergyDb: "-16.0 dB",
};

test("synthetic decoded audio feeds the real analysis and draft report builders", async () => {
  await withDecodedSamples(makeSamples(0.99), async (analysis, statuses) => {
    assert.deepEqual(statuses, ["Analyzing audio...", "Ready"]);
    assert.equal(analysis.sampleRate, 44100);
    assert.equal(analysis.channels, 1);
    assert.ok(Number.isFinite(analysis.peak));
    assert.ok(getHumanizationPriorityScore(analysis) >= 0);
    assert.ok(getAudioHealthRecommendation(analysis).length > 20);
    assert.ok(buildArtifactClues(analysis).length > 0);

    const composer = buildV42SmartReportComposer(session, "draft", analysis);
    const quality = buildV42ReportQualityGate(session, "draft", analysis);
    const output = buildV42ReportOutputPack(session, "draft", analysis);
    assert.equal(composer.reportPath, "Vocal Humanization Report");
    assert.equal(composer.genreFocus, "Hip-Hop / Rap");
    assert.ok(composer.producerPlan.length > 0);
    assert.equal(quality.checks[0].passed, true);
    assert.ok(output.producerBrief.includes(composer.reportTitle));
    assert.ok(output.clientUpdate.length > 50);
  });
});

test("a rejected audio decode stays unavailable and cannot pass the analysis gate", async () => {
  await withDecodedSamples(makeSamples(0.7), async (analysis, statuses) => {
    assert.deepEqual(statuses, ["Analyzing audio...", "Unavailable"]);
    const quality = buildV42ReportQualityGate(session, "draft", analysis);
    assert.equal(quality.checks[0].passed, false);
    assert.ok(quality.score < 100);
  }, { fail: true });
});

test("draft and humanized comparison flows into client-facing explanation and handoff", () => {
  assert.ok(getBeforeAfterImprovementScore(analyzedDraft, analyzedEdit) > 50);
  const explanation = buildV42BeforeAfterExplanation(analyzedDraft, analyzedEdit);
  const composer = buildV42SmartReportComposer(session, "compare", analyzedDraft, analyzedEdit);
  const output = buildV42ReportOutputPack(session, "compare", analyzedDraft, analyzedEdit);
  const manifest = buildV42ReportExportManifest(session, "compare", analyzedDraft, analyzedEdit);
  const handoff = buildV42FinalReportHandoff(session, "compare", analyzedDraft, analyzedEdit);

  assert.equal(composer.reportPath, "Before / After Humanization Report");
  assert.equal(explanation.improvementLabel, "Improved");
  assert.ok(explanation.clientSafeLine.length > 20);
  assert.ok(output.clientUpdate.length > 50);
  assert.ok(manifest.totalItems > 0);
  assert.ok(handoff.finalRecommendation.length > 20);
});

test("saved project and original backup format restore the same report context", () => withFakeStorage((data) => {
  const record = buildSavedProjectRecord(session, "compare", "marcel");
  saveSetting("soulframe-project-session", JSON.stringify(session));
  saveSetting("soulframe-review-mode", record.reviewMode);
  saveSavedProjects([record]);

  const restoredSession = loadSavedSession();
  const restoredRecord = loadSavedProjects()[0];
  const restoredMode = loadSavedSetting("soulframe-review-mode", "draft");
  const backup = buildSavedProjectsBackup([restoredRecord]);
  const imported = parseSavedProjectsBackup(backup);
  const restoredComposer = buildV42SmartReportComposer(restoredSession, restoredMode, analyzedDraft, analyzedEdit);

  assert.equal(data.get("soulframe-review-mode"), "compare");
  assert.equal(restoredSession.projectName, session.projectName);
  assert.equal(restoredRecord.client, session.clientName);
  assert.equal(imported[0].projectSession.projectName, session.projectName);
  assert.equal(JSON.parse(backup).type, "saved-projects-backup");
  assert.equal(restoredComposer.reportPath, "Before / After Humanization Report");
  assert.equal(restoredComposer.genreFocus, "Hip-Hop / Rap");
}));

test("invalid backup cannot replace or silently delete valid saved projects", () => withFakeStorage(() => {
  const existing = buildSavedProjectRecord(session, "draft", "marcel");
  saveSavedProjects([existing]);
  assert.deepEqual(parseSavedProjectsBackup("not-json"), []);
  assert.deepEqual(parseSavedProjectsBackup('{"type":"other","projects":[]}'), []);
  assert.deepEqual(loadSavedProjects(), [existing]);
}));

test("missing project details fall back to defaults without mutating the template", () => {
  const partial = { projectName: "Minimal Draft" };
  const composer = buildV42SmartReportComposer(partial, "draft", null);
  const gate = buildV42ReportQualityGate(partial, "draft", null);
  assert.ok(composer.reportTitle.length > 0);
  assert.equal(gate.checks[0].passed, false);
  assert.equal(defaultProjectSession.projectName, "Untitled AI Draft");
  assert.equal(defaultProjectSession.clientName, "Client");
});
