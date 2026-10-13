import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  V51FocusedWorkspaceHeader,
  V51ProductWorkspace,
  V51WorkspaceProgressRail,
  V52PublicBetaPresentationHero,
  V52PublicBetaValueStrip,
  V52PublicBetaWorkflowPreview,
} from "./product/ProductWorkspace";
import { V53CleanReportPreview } from "./report/CleanReportPreview";
import { V53BeforeAfterCaseStudy } from "./report/BeforeAfterCaseStudy";
import { V53ClientDeliveryExperience } from "./report/ClientDeliveryExperience";
import { V53ReportSharingExportHandoff } from "./report/ReportSharingExportHandoff";
import { V54ReportWorkspaceCleanup } from "./report/ReportWorkspaceCleanup";
import { V54OutputWorkspaceCleanup, getV54OutputEvidenceStatus } from "./output/OutputWorkspace";
import { V54AdvancedWorkspaceCleanup, ADVANCED_SECTIONS } from "./advanced/AdvancedWorkspace";
import {
  clampScore,
  getScoreLabel,
  getDeliveryReadiness,
  formatFileSize,
  formatDuration,
  buildInitialAudioMetadata,
  loadAudioDuration,
  amplitudeToDb,
  getClippingRisk,
  getDynamicsLabel,
  getBrightnessLabel,
  getTextureStabilityLabel,
  loadAudioHealthCheck,
  getAudioHealthRecommendation,
  buildArtifactClues,
  buildListeningFocusItems,
  getHumanizationPriorityScore,
  getHumanizationPriorityLabel,
  getHumanizationPriorityNote,
  buildSectionReviewNotes,
  buildHumanizationActionPlan,
  getHumanizationDelta,
  getTechnicalFormatNotes,
  getTechnicalReadinessScore,
  getTechnicalReadinessLabel,
  buildAudioFactRows,
  buildAudioFactsSentence,
  buildArtifactClueSentence,
  parseDbValue,
  getRiskRank,
  getDynamicsRank,
  getComparisonLabel,
  buildBeforeAfterComparison,
  getBeforeAfterImprovementScore,
  getBeforeAfterImprovementLabel,
} from "./analysis/audioAnalysis";
import { defaultProjectSession } from "./core/projectDefaults";
import {
  getSessionValue,
  loadSavedSession,
  loadSavedSetting,
  saveSetting,
  loadSavedProjects,
  saveSavedProjects,
  buildSavedProjectRecord,
  buildSavedProjectsBackup,
  parseSavedProjectsBackup,
} from "./session/sessionStorage";
import { useProjectSessions } from "./session/useProjectSessions";
import {
  normalizeV42Text,
  detectV42GenreFocus,
  detectV42ReportPath,
  buildV42SuggestedEditOrder,
  estimateV42RevisionDifficulty,
  buildV42ToneOptions,
  buildV42ReportContext,
  buildV42SmarterReportText,
  buildV42GenreRecommendationProfile,
  buildV42GenreRecommendationText,
  buildV42PathSpecificReportSections,
  buildV42PathSpecificReportText,
  buildV42ClientToneDrafts,
  buildV42ClientToneDraftText,
  buildV42BeforeAfterExplanation,
  buildV42BeforeAfterExplanationText,
  buildV42SmartReportComposer,
  buildV42SmartReportComposerText,
  buildV42ReportQualityGate,
  buildV42ReportQualityGateText,
  buildV42ReportOutputPack,
  buildV42ReportOutputPackText,
  buildV42FinalReportHandoff,
  buildV42FinalReportHandoffText,
  buildV42ReportExportManifest,
  buildV42ReportExportManifestText,
  buildV42ReportControlCenter,
  buildV42ReportControlCenterText,
} from "./report/reportBuilders";

// Secondary pages are not needed until someone opens their corresponding header tab.
const SecondaryViews = React.lazy(() => import("./views/SecondaryViews"));
// Separate legacy demo presentation so Product does not request it on first load.
const ClassicDemo = React.lazy(() => import("./demo/ClassicDemo"));

const analysisSteps = [
  "Uploading audio files",
  "Scanning vocal realism and synthetic artifacts",
  "Checking instrumental texture and audio stability",
  "Reviewing arrangement flow and emotional movement",
  "Generating SoulFrame report",
];

const makeIssue = (id, time, title, severity, category, note, fix) => ({ id, time, title, severity, category, note, fix });

const draftReports = {
  vocal: {
    name: "AI Vocal Draft Review",
    project: "Synthetic Vocal Draft",
    verdict: "Needs Vocal Humanization",
    score: 62,
    summary: "The instrumental has a usable foundation, but the vocal is carrying the strongest AI signature. The main priorities are metallic resonance, cracking during higher phrases, and static emotional delivery.",
    priorities: ["Repair vocal cracking in high transitions", "Reduce metallic upper-mid resonance", "Add phrase-level dynamics and subtle breath texture", "Check final chorus for emotional lift"],
    clientRisk: "High. A client is likely to notice the vocal realism issues before anything else, especially the cracking and metallic sustain.",
    scores: [
      { label: "Overall Humanization", value: 62, status: "Moderate AI Presence" },
      { label: "Vocal Realism", value: 48, status: "Needs Work" },
      { label: "Instrument Realism", value: 78, status: "Usable" },
      { label: "Arrangement Logic", value: 69, status: "Moderate" },
      { label: "Audio Stability", value: 58, status: "Unstable" },
    ],
    issues: [
      makeIssue("metallic-vocal-sustain", "0:38-0:55", "Metallic vocal sustain", "High", "Vocal Realism", "The vocal has a bright metallic coating during sustained vowels, making it feel AI-generated.", "Smooth harsh upper mids, add subtle saturation, and automate phrase-level warmth."),
      makeIssue("vocal-cracking-highs", "1:21-1:34", "Cracking on higher notes", "High", "Vocal Stability", "The vocal fractures slightly when reaching the upper register.", "Repair the phrase manually, replace the cracked syllable, or layer a cleaner vocal pass."),
      makeIssue("static-emotion", "2:02-2:19", "Static emotional delivery", "Moderate", "Emotional Authenticity", "The phrase intensity stays too even and does not build naturally across the section.", "Use volume automation, subtle timing offsets, and breath or texture layers to create a more human performance arc."),
    ],
  },
  instrumental: {
    name: "Instrumental Draft Review",
    project: "AI Instrumental Draft",
    verdict: "Strong Base, Needs Texture Cleanup",
    score: 74,
    summary: "The draft has a strong musical base, but the instrumental texture still contains artificial shimmer, low-level buzzing, and repeated phrase movement that could make the track feel AI-generated.",
    priorities: ["Soften artificial shimmer in the upper harmonics", "Clean buzzing residue in the midrange", "Add variation to repeated phrases", "Check low-end stability before mastering"],
    clientRisk: "Medium. The track is usable, but repeated phrases and synthetic brightness may stand out after repeated listening.",
    scores: [
      { label: "Overall Humanization", value: 74, status: "Good Foundation" },
      { label: "Vocal Realism", value: 0, status: "No Vocal Detected" },
      { label: "Instrument Realism", value: 68, status: "Needs Polish" },
      { label: "Arrangement Logic", value: 71, status: "Moderate" },
      { label: "Audio Stability", value: 70, status: "Moderate" },
    ],
    issues: [
      makeIssue("artificial-shimmer", "0:16-0:44", "Artificial shimmer", "Moderate", "Instrument Realism", "The top-end sparkle feels overly glossy and digitally generated.", "Soften upper harmonics, add analog-style coloration, and rebalance the brightness."),
      makeIssue("buzzing-residue", "1:08-1:25", "Buzzing residue", "Moderate", "Audio Stability", "A low-level buzz is embedded beneath the instrumental layer.", "Use spectral cleanup, denoising, or replace the affected layer with a cleaner sound."),
      makeIssue("loop-repetition", "2:10-2:46", "Repetition syndrome", "Low", "Arrangement Logic", "The phrase repeats too consistently without enough human variation.", "Add articulation changes, small fills, timing variation, or a counter-layer."),
    ],
  },
  marcel: {
    name: "Commercial Client Draft Review",
    project: "Commercial AI Track Draft",
    verdict: "Close, Needs Targeted Humanization",
    score: 79,
    summary: "The draft has strong commercial potential. The main improvements should focus on reducing AI artifacts, improving chorus impact, and tightening vocal delay so the track translates more naturally across playback systems.",
    priorities: ["Clean harsh AI-related vocal and mix artifacts", "Strengthen chorus entry impact after pauses", "Tighten vocal delay so it feels like depth, not echo", "Balance the track for real-world playback translation"],
    clientRisk: "Medium. The track is close, but the chorus entries and vocal delay are likely to be noticed by a careful client on different playback systems.",
    scores: [
      { label: "Overall Humanization", value: 79, status: "Mostly Human" },
      { label: "Vocal Realism", value: 73, status: "Good, Needs Polish" },
      { label: "Instrument Realism", value: 84, status: "Strong" },
      { label: "Arrangement Logic", value: 76, status: "Good" },
      { label: "Audio Stability", value: 74, status: "Good" },
    ],
    issues: [
      makeIssue("ai-resonance", "0:42-0:58", "AI-related harsh resonance", "Moderate", "Vocal Realism", "The vocal or mix contains harsh resonant energy that makes the track feel slightly synthetic.", "Use artifact cleanup, resonance control, tonal balancing, and subtle saturation."),
      makeIssue("chorus-impact", "0:34, 1:19, 2:07", "Chorus entries need more impact", "Moderate", "Arrangement Logic", "The first hits into the choruses could land with more intention after the pauses.", "Add subtle punch reinforcement through transient shaping, micro-automation, or supportive low-end impact layers."),
      makeIssue("delay-prominence", "General vocal space", "Vocal delay slightly prominent", "Low", "Spatial Translation", "The delay supports depth, but the repeat could become too noticeable on some systems.", "Lower feedback, reduce wet level slightly, filter the delay, and keep stereo depth if the image remains stable."),
    ],
  },
};

const beforeAfterReport = {
  name: "Before / After Review",
  project: "AI Draft vs Humanized Edit",
  verdict: "Improved, Still Needs Final Humanization Pass",
  score: 84,
  summary: "The humanized edit improves the realism, impact, and client-readiness of the original AI draft. The next pass should focus on the remaining synthetic traces rather than rebuilding the full track.",
  priorities: ["Check whether the vocal now feels natural across the full song", "Confirm that chorus impact improved compared with the AI draft", "Clean any remaining harsh or metallic resonance", "Make sure the edit preserves the original emotional direction"],
  clientRisk: "Low to medium. The edit is closer to delivery, but a final pass should confirm that no AI artifacts still stand out on repeated listening.",
  scores: [
    { label: "Humanization Improvement", value: 84, status: "Clear Improvement" },
    { label: "Vocal Realism", value: 78, status: "Improved" },
    { label: "Instrument Realism", value: 86, status: "Strong" },
    { label: "Arrangement Logic", value: 82, status: "Improved Flow" },
    { label: "Audio Stability", value: 80, status: "Mostly Stable" },
  ],
  issues: [
    makeIssue("improved-impact", "0:34, 1:19, 2:07", "Chorus impact improved", "Positive", "Before / After Change", "The edit gives the chorus entries more intention and makes the track feel less flat compared with the original AI draft.", "Keep the added impact, but check that it does not overpower the vocal or change the client's intended direction."),
    makeIssue("remaining-vocal-edge", "0:42-0:58", "Remaining synthetic vocal edge", "Moderate", "Remaining Issue", "The vocal is improved, but a slight AI-like edge may still be present during sustained phrases.", "Apply a final resonance check, automate warmth, and compare against the raw AI draft."),
    makeIssue("preserve-emotion", "Full track", "Preserve emotional direction", "Low", "Creative Risk", "The edit sounds cleaner, but humanization should not remove too much of the original raw character.", "Avoid overprocessing. Keep the parts that already feel emotionally convincing."),
  ],
};

const artifactDatabase = [
  { name: "Metallic Resonance", category: "Vocal Realism", severity: "High", description: "A robotic upper-mid or high-frequency sheen that makes the vocal sound synthetic.", fix: "Resonance reduction, warmth layering, subtle saturation, and phrase automation." },
  { name: "Vocal Cracking", category: "Vocal Stability", severity: "High", description: "Broken transitions, fractured sustains, or glitch-like movement in AI vocals.", fix: "Manual repair, phrase replacement, spectral smoothing, or cleaner vocal layering." },
  { name: "Artificial Shimmer", category: "Instrument Realism", severity: "Moderate", description: "Overly glossy digital brightness in instrumental stems.", fix: "Harmonic softening, analog coloration, EQ rebalancing, and transient reshaping." },
  { name: "Buzzing Residue", category: "Audio Stability", severity: "Moderate", description: "Low-level digital distortion or AI residue embedded in stems.", fix: "Spectral cleanup, denoising, stem replacement, or selective masking." },
  { name: "Repetition Syndrome", category: "Arrangement Logic", severity: "Moderate", description: "Phrases repeat too mechanically without enough human variation or development.", fix: "Add fills, articulation changes, timing variation, or new counter-melodies." },
  { name: "Waveform Instability", category: "Audio Stability", severity: "Moderate", description: "Unnatural energy spikes, unstable density, or inconsistent waveform behavior.", fix: "Gain riding, compression balancing, transient repair, and stem cleanup." },
];



const demoPresets = {
  vocalDraft: {
    label: "AI Vocal Draft",
    reviewMode: "draft",
    selectedPreset: "vocal",
    projectSession: {
      projectName: "AI Vocal Humanization Demo",
      clientName: "Demo Client",
      trackType: "AI-generated vocal song",
      aiTool: "Suno / Udio style draft",
      currentStage: "Raw AI Draft",
      mainConcern: "Metallic vocal tone and flat emotional delivery",
      clientGoal: "Make the vocal feel more believable, expressive, and release-ready.",
      producerNotes: "Demo preset focused on vocal realism, high-frequency harshness, and emotional phrasing.",
    },
  },
  instrumentalDraft: {
    label: "AI Instrumental Draft",
    reviewMode: "draft",
    selectedPreset: "instrumental",
    projectSession: {
      projectName: "AI Instrumental Texture Demo",
      clientName: "Demo Client",
      trackType: "AI-generated instrumental",
      aiTool: "AI music generator",
      currentStage: "Texture cleanup pass",
      mainConcern: "Artificial shimmer, repetition, and busy generated movement",
      clientGoal: "Make the instrumental feel warmer, more intentional, and less synthetic.",
      producerNotes: "Demo preset focused on instrumental texture, arrangement movement, and high-end smoothing.",
    },
  },
  clientReady: {
    label: "Client-Ready Review",
    reviewMode: "draft",
    selectedPreset: "marcel",
    projectSession: {
      projectName: "Client Delivery Review Demo",
      clientName: "Commercial Demo Client",
      trackType: "Commercial AI-assisted track",
      aiTool: "AI draft with human production edits",
      currentStage: "Final polish before delivery",
      mainConcern: "Remaining AI edge, chorus impact, and playback translation",
      clientGoal: "Prepare a clean, professional update and final-pass checklist for client delivery.",
      producerNotes: "Demo preset focused on client communication, delivery readiness, and final polish.",
    },
  },
  beforeAfter: {
    label: "Before / After Humanized Edit",
    reviewMode: "compare",
    selectedPreset: "marcel",
    projectSession: {
      projectName: "Before After Humanization Demo",
      clientName: "Demo Client",
      trackType: "AI draft compared with humanized edit",
      aiTool: "AI-generated draft + producer edit",
      currentStage: "Before / After Review",
      mainConcern: "Confirm what improved and what still needs a final human pass",
      clientGoal: "Show the improvement clearly while identifying the final polish priorities.",
      producerNotes: "Demo preset focused on before/after delta, client-safe reporting, and session summary.",
    },
  },
};

const demoWalkthroughSteps = [
  { title: "Start with Project Intake", note: "Load or enter the client context so the review stays grounded in the actual creative goal." },
  { title: "Upload or preview the draft", note: "Use the audio intake panel to inspect waveform, metadata, health, brightness, and texture movement." },
  { title: "Review the listening layer", note: "Check Real Audio Facts, Early Artifact Clues, Humanization Priority, and Producer Listening Focus." },
  { title: "Turn analysis into decisions", note: "Use the Humanization Action Plan, section notes, and revision checklist to plan the next pass." },
  { title: "Export the right message", note: "Choose producer or client-safe outputs, then copy summaries, reports, action plans, or checklists." },
];

const publicShareLinks = [
  { label: "Live Demo", href: "https://soulframe-v1.vercel.app" },
  { label: "GitHub Repository", href: "https://github.com/ahmedkordofani/soulframe-v1" },
  { label: "ChordOfAnnie", href: "https://chordofannie.com" },
];

function makeClientSafeAction(actionItem) {
  const clientSafeMap = {
    "Smooth harsh top-end": {
      action: "Refine high-frequency detail",
      detail: "I will smooth the brighter details so the track feels more natural, balanced, and comfortable to listen to.",
    },
    "Stabilize generated texture": {
      action: "Tighten the arrangement texture",
      detail: "I will make the background movement feel more intentional so the track supports the song rather than feeling overcrowded.",
    },
    "Restore emotional movement": {
      action: "Improve section contrast",
      detail: "I will help the track breathe more naturally by improving the rise, fall, and emotional lift between sections.",
    },
    "Create safer headroom": {
      action: "Prepare a cleaner export balance",
      detail: "I will create a safer mix balance so the track has enough space for a cleaner and more polished final export.",
    },
    "Focus on musical realism": {
      action: "Refine musical realism",
      detail: "I will focus on phrasing, transitions, groove, and emotional delivery so the final version feels more alive and intentional.",
    },
  };

  const safeVersion = clientSafeMap[actionItem.action];
  if (!safeVersion) return actionItem;

  return {
    ...actionItem,
    action: safeVersion.action,
    detail: safeVersion.detail,
  };
}

function buildActionPlanForTone(analysis, tone = "producer") {
  const actionPlan = buildHumanizationActionPlan(analysis);
  if (tone !== "client") return actionPlan;
  return actionPlan.map(makeClientSafeAction);
}

function buildClientActionPlanText(projectSession, analysis) {
  const newline = String.fromCharCode(10);
  const actionPlan = buildActionPlanForTone(analysis, "client");
  const lines = [];

  lines.push("SOULFRAME CLIENT ACTION PLAN");
  lines.push("");
  lines.push(`Project: ${getSessionValue(projectSession, "projectName")}`);
  lines.push(`Client: ${getSessionValue(projectSession, "clientName")}`);
  lines.push("");
  lines.push("Recommended next steps:");

  actionPlan.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.action}`);
    lines.push(`   ${item.detail}`);
  });

  return lines.join(newline);
}

function buildClientSafeReportSummaryText(projectSession, report, analysis, reviewMode) {
  const newline = String.fromCharCode(10);
  const actionPlan = buildActionPlanForTone(analysis, "client").slice(0, 3);
  const priorityScore = getHumanizationPriorityScore(analysis);
  const priorityLabel = getHumanizationPriorityLabel(priorityScore);
  const readinessScore = getTechnicalReadinessScore(analysis);
  const lines = [];

  lines.push("SOULFRAME CLIENT-SAFE REPORT SUMMARY");
  lines.push("");
  lines.push(`Project: ${getSessionValue(projectSession, "projectName")}`);
  lines.push(`Client: ${getSessionValue(projectSession, "clientName")}`);
  lines.push(`Review Mode: ${reviewMode === "compare" ? "Before / After Review" : "Draft Review"}`);
  lines.push("");
  lines.push("Summary:");
  lines.push(`I reviewed the track and mapped out the main areas that will help it feel more natural, polished, and emotionally convincing. The current review focus is ${report.priorities.slice(0, 2).join(" and ").toLowerCase()}.`);
  lines.push("");
  lines.push("Current Status:");
  lines.push(`- Humanization priority: ${analysis && analysis.status === "Ready" ? `${priorityLabel} (${priorityScore}/100)` : "Waiting for uploaded audio"}`);
  lines.push(`- Technical readiness: ${analysis && analysis.status === "Ready" ? `${readinessScore}/100` : "Waiting for uploaded audio"}`);
  lines.push("");
  lines.push("Client-friendly next steps:");
  actionPlan.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.action} - ${item.detail}`);
  });
  lines.push("");
  lines.push("Next step:");
  lines.push("I will use these points to guide the next pass while keeping the original creative direction intact.");

  return lines.join(newline);
}

function buildRevisionChecklistItems(report, analysis, reviewMode) {
  const items = [];

  items.push({ label: "Confirm the client goal before making the next pass", status: "Creative Direction" });
  items.push({ label: `Focus first on ${report.priorities[0] || "the highest-impact humanization issue"}`, status: "Main Priority" });

  if (analysis && analysis.status === "Ready") {
    if (analysis.brightness === "Bright / Potentially Harsh") {
      items.push({ label: "Check harsh top-end, sibilance, cymbals, and brittle synth layers", status: "Tone Check" });
    }

    if (analysis.textureStability === "Unstable / Busy") {
      items.push({ label: "Simplify any generated movement that feels too restless or random", status: "Texture Check" });
    }

    if (analysis.dynamics === "Compressed") {
      items.push({ label: "Add more breath and contrast between sections", status: "Dynamics Check" });
    }

    if (analysis.clippingRisk === "High" || analysis.clippingRisk === "Medium") {
      items.push({ label: "Create safer headroom before judging final loudness", status: "Headroom Check" });
    }
  } else {
    items.push({ label: "Upload audio before finalizing technical revision decisions", status: "Waiting" });
  }

  if (reviewMode === "compare") {
    items.push({ label: "A/B the humanized edit against the original AI draft", status: "Before / After" });
    items.push({ label: "Confirm the edit improves the track without losing the original emotional direction", status: "Creative Check" });
  }

  items.push({ label: "Listen on headphones, phone speaker, and laptop speaker", status: "Playback Check" });
  items.push({ label: "Prepare a clear client-safe update before sending the next version", status: "Client Update" });

  return items.slice(0, 9);
}

function buildRevisionChecklistText(projectSession, report, analysis, reviewMode) {
  const newline = String.fromCharCode(10);
  const lines = [];

  lines.push("SOULFRAME REVISION CHECKLIST");
  lines.push("");
  lines.push(`Project: ${getSessionValue(projectSession, "projectName")}`);
  lines.push(`Client: ${getSessionValue(projectSession, "clientName")}`);
  lines.push(`Mode: ${reviewMode === "compare" ? "Before / After Review" : "Draft Review"}`);
  lines.push("");

  buildRevisionChecklistItems(report, analysis, reviewMode).forEach((item, index) => {
    lines.push(`${index + 1}. ${item.label} [${item.status}]`);
  });

  return lines.join(newline);
}

function getActionPlanToneLabel(tone) {
  return tone === "client" ? "Client-Safe Notes" : "Producer Notes";
}

function buildDeliveryChecklist(analysis, reviewMode = "draft") {
  const baseItems = [
    { label: "Confirm the track still feels emotionally natural after technical cleanup", status: "Creative Check" },
    { label: "Listen on headphones, laptop speakers, and phone speakers", status: "Playback Check" },
    { label: "Check intro, chorus entries, bridge, and ending for AI-like transitions", status: "Arrangement Check" },
  ];

  if (!analysis || analysis.status !== "Ready") {
    return [
      { label: "Upload audio to generate technical delivery checks", status: "Waiting" },
      ...baseItems,
    ];
  }

  const technicalItems = [];

  if (analysis.clippingRisk === "High" || analysis.clippingRisk === "Medium") {
    technicalItems.push({ label: "Create more headroom before final delivery", status: "Needs Attention" });
  } else {
    technicalItems.push({ label: "Headroom looks safe for review export", status: "Passed" });
  }

  if (analysis.dynamics === "Compressed") {
    technicalItems.push({ label: "Check whether the track has enough dynamic movement", status: "Needs Attention" });
  } else {
    technicalItems.push({ label: "Dynamics are acceptable for a review pass", status: "Passed" });
  }

  if (analysis.sampleRate && analysis.sampleRate < 44100) {
    technicalItems.push({ label: "Export at 44.1 kHz or 48 kHz before client delivery", status: "Needs Attention" });
  } else {
    technicalItems.push({ label: "Sample rate is suitable for normal delivery", status: "Passed" });
  }

  if (analysis.channels === 1) {
    technicalItems.push({ label: "Check stereo width if the final version should feel wide", status: "Review" });
  } else {
    technicalItems.push({ label: "Stereo format detected", status: "Passed" });
  }

  if (reviewMode === "compare") {
    technicalItems.push({ label: "A/B the humanized edit against the original AI draft", status: "Before / After" });
  }

  return [...technicalItems, ...baseItems];
}

function buildDeliveryChecklistText(projectSession, checklist) {
  const newline = String.fromCharCode(10);
  const lines = [];

  lines.push("SOULFRAME CLIENT DELIVERY CHECKLIST");
  lines.push("");
  lines.push(`Project: ${getSessionValue(projectSession, "projectName")}`);
  lines.push(`Client: ${getSessionValue(projectSession, "clientName")}`);
  lines.push("");

  checklist.forEach((item, index) => {
    lines.push(`${index + 1}. ${item.label} [${item.status}]`);
  });

  return lines.join(newline);
}

function buildHumanizationBrief(projectSession, report) {
  return `${getSessionValue(projectSession, "projectName")} for ${getSessionValue(projectSession, "clientName")} is a ${getSessionValue(projectSession, "trackType")} at the ${getSessionValue(projectSession, "currentStage")} stage. AI tool: ${getSessionValue(projectSession, "aiTool")}. Main concern: ${getSessionValue(projectSession, "mainConcern")}. Client goal: ${getSessionValue(projectSession, "clientGoal")} Current SoulFrame focus: ${report.priorities[0]}.`;
}

function buildRevisionTimeline(reviewMode, report) {
  return [
    { title: "Original AI Draft", status: "Complete", focus: "Identify what sounds artificial" },
    { title: "Edit 1 Humanization", status: reviewMode === "compare" ? "Complete" : "Next", focus: report.priorities[0] },
    { title: "Edit 2 Refinement", status: reviewMode === "compare" ? "Recommended" : "Pending", focus: report.priorities[1] || "Refine remaining synthetic details" },
    { title: "Final Polish", status: getDeliveryReadiness(report.score), focus: report.priorities[2] || "Confirm client-ready delivery" },
  ];
}

function buildClientUpdate(report, mode = "balanced", projectSession = defaultProjectSession, audioContext = {}) {
  const score = clampScore(report.score);
  const projectName = getSessionValue(projectSession, "projectName");
  const clientName = getSessionValue(projectSession, "clientName");
  const mainConcern = getSessionValue(projectSession, "mainConcern");
  const topIssues = report.issues.slice(0, 3).map((issue) => `${issue.time}: ${issue.title}`).join("; ");
  const topPriorities = report.priorities.slice(0, 3).join(", ").toLowerCase();
  const audioSentence = [
    buildAudioFactsSentence(audioContext.draftMetadata, audioContext.draftAnalysis, "draft"),
    buildAudioFactsSentence(audioContext.humanizedMetadata, audioContext.humanizedAnalysis, "humanized edit"),
  ].filter(Boolean).join(" ");
  const activeAudioAnalysis = audioContext.humanizedAnalysis || audioContext.draftAnalysis;
  const artifactClueSentence = buildArtifactClueSentence(activeAudioAnalysis);
  const audioAndClueSentence = [audioSentence, artifactClueSentence].filter(Boolean).join(" ");

  if (mode === "short") {
    const mainPriorities = report.priorities.slice(0, 2).join(" and ").toLowerCase();
    return `Quick update on ${projectName} for ${clientName} - I reviewed the AI draft and found the main areas that need attention. The biggest priorities are ${mainPriorities}. The track is currently scoring ${score}/100 for humanization, so the next pass will focus on targeted improvements rather than changing the whole direction. ${audioAndClueSentence}`.trim();
  }

  if (mode === "detailed") {
    const allPriorities = report.priorities.join(", ").toLowerCase();
    return `I went through ${projectName} in detail and identified the specific areas affecting realism and translation. The main concern going into the review was: ${mainConcern}. The main issues are: ${topIssues}. The next pass should focus on ${allPriorities}. ${audioAndClueSentence} This should help the track feel more natural and emotionally convincing while keeping the original creative direction intact.`.trim();
  }

  return `I've reviewed ${projectName} for ${clientName} and mapped out the main areas affecting realism. The current SoulFrame humanization score is ${score}/100, with the main focus now being ${topPriorities}. The key areas identified were ${topIssues}. ${audioAndClueSentence} I'll use these points to guide the next pass so the track feels more natural, more polished, and closer to client-ready without changing the original direction too much.`.trim();
}

function buildFullReportText({ report, reviewMode, projectSession, draftAudioMetadata, humanizedAudioMetadata, draftAudioAnalysis, humanizedAudioAnalysis, clientUpdate, reportTone = "producer" }) {
  const lines = [];
  const newline = String.fromCharCode(10);
  const isClientReport = reportTone === "client";

  lines.push(isClientReport ? "SOULFRAME CLIENT-FRIENDLY HUMANIZATION REPORT" : "SOULFRAME PRODUCER HUMANIZATION REPORT");
  lines.push("");
  lines.push(`Project: ${getSessionValue(projectSession, "projectName")}`);
  lines.push(`Client: ${getSessionValue(projectSession, "clientName")}`);
  lines.push(`Track Type: ${getSessionValue(projectSession, "trackType")}`);
  lines.push(`AI Tool: ${getSessionValue(projectSession, "aiTool")}`);
  lines.push(`Stage: ${getSessionValue(projectSession, "currentStage")}`);
  lines.push(`Main Concern: ${getSessionValue(projectSession, "mainConcern")}`);
  lines.push("");
  lines.push(`Verdict: ${report.verdict}`);
  lines.push(`SoulFrame Score: ${report.score}/100`);
  lines.push(`Summary: ${report.summary}`);
  lines.push("");

  lines.push("REAL AUDIO FACTS");
  buildAudioFactRows(draftAudioMetadata, draftAudioAnalysis, "Draft").forEach((row) => {
    lines.push(`${row.label}: ${row.value}`);
  });

  if (reviewMode === "compare") {
    buildAudioFactRows(humanizedAudioMetadata, humanizedAudioAnalysis, "Edit").forEach((row) => {
      lines.push(`${row.label}: ${row.value}`);
    });
  }

  lines.push("");

  if (reviewMode === "compare") {
    lines.push("BEFORE / AFTER COMPARISON");
    buildBeforeAfterComparison(draftAudioMetadata, humanizedAudioMetadata, draftAudioAnalysis, humanizedAudioAnalysis).forEach((row) => {
      lines.push(`${row.label}: ${row.before} -> ${row.after} (${row.verdict})`);
    });
    lines.push("");
  }

  const activeAnalysis = reviewMode === "compare" ? humanizedAudioAnalysis || draftAudioAnalysis : draftAudioAnalysis;

  if (isClientReport) {
    lines.push("CLIENT-FRIENDLY FOCUS AREAS");
    buildActionPlanForTone(activeAnalysis, "client").forEach((item, index) => {
      lines.push(`${index + 1}. ${item.action} - ${item.detail}`);
    });
    lines.push("");
  } else {
    lines.push("EARLY ARTIFACT CLUES");
    buildArtifactClues(activeAnalysis).forEach((clue, index) => {
      lines.push(`${index + 1}. ${clue.title} [${clue.level}] - ${clue.note}`);
    });
    lines.push("");
  }

  lines.push("SESSION SUMMARY");
  lines.push(`Project: ${projectSession.projectName || "Untitled Project"}`);
  lines.push(`Client: ${projectSession.clientName || "Not specified"}`);
  lines.push(`Mode: ${reviewMode === "compare" ? "Before / After Review" : "Draft Review"}`);
  lines.push(`Technical Readiness: ${activeAnalysis && activeAnalysis.status === "Ready" ? `${getTechnicalReadinessScore(activeAnalysis)}/100` : "Waiting"}`);
  lines.push(`Humanization Priority: ${activeAnalysis && activeAnalysis.status === "Ready" ? `${getHumanizationPriorityLabel(getHumanizationPriorityScore(activeAnalysis))} (${getHumanizationPriorityScore(activeAnalysis)}/100)` : "Waiting"}`);
  lines.push("");

  lines.push("HUMANIZATION PRIORITY SCORE");
  lines.push(`${getHumanizationPriorityScore(activeAnalysis)}/100 - ${getHumanizationPriorityLabel(getHumanizationPriorityScore(activeAnalysis))}`);
  lines.push(getHumanizationPriorityNote(activeAnalysis));
  lines.push("");

  if (reviewMode === "compare") {
    lines.push("BEFORE / AFTER HUMANIZATION DELTA");
    getHumanizationDelta(draftAudioAnalysis, humanizedAudioAnalysis).forEach((item, index) => {
      lines.push(`${index + 1}. ${item.label} [${item.status}] - ${item.note}`);
    });
    lines.push("");
  }

  lines.push(isClientReport ? "CLIENT-SAFE ACTION PLAN" : "HUMANIZATION ACTION PLAN");
  buildActionPlanForTone(activeAnalysis, isClientReport ? "client" : "producer").forEach((item, index) => {
    lines.push(`${index + 1}. [${item.priority}] ${item.action} - ${item.detail}`);
  });
  lines.push("");

  lines.push("SECTION-BY-SECTION REVIEW NOTES");
  buildSectionReviewNotes(activeAnalysis).forEach((item) => {
    lines.push(`${item.section}: ${item.note}`);
  });
  lines.push("");

  lines.push("PRODUCER LISTENING FOCUS");
  buildListeningFocusItems(activeAnalysis).forEach((item, index) => {
    lines.push(`${index + 1}. ${item}`);
  });
  lines.push("");

  lines.push("CLIENT DELIVERY CHECKLIST");
  buildDeliveryChecklist(activeAnalysis, reviewMode).forEach((item, index) => {
    lines.push(`${index + 1}. ${item.label} [${item.status}]`);
  });
  lines.push("");

  lines.push("PRIORITIES");
  report.priorities.forEach((priority, index) => {
    lines.push(`${index + 1}. ${priority}`);
  });
  lines.push("");

  if (!isClientReport) {
    lines.push("DETECTED ISSUES");
    report.issues.forEach((issue) => {
      lines.push(`- ${issue.time} | ${issue.title}: ${issue.note} Fix: ${issue.fix}`);
    });
    lines.push("");
  }

  lines.push("CLIENT UPDATE");
  lines.push(clientUpdate || "");

  return lines.join(newline);
}

function makeSafeFileName(value) {
  const fallback = "SoulFrame_Report";
  if (!value || typeof value !== "string") return fallback;
  const safeName = value
    .trim()
    .replace(/[^a-z0-9]+/gi, "_")
    .replace(/^_+|_+$/g, "");
  return safeName || fallback;
}

function downloadTextFile(fileName, content) {
  if (typeof window === "undefined") return false;

  try {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    return false;
  }
}

function runSoulFrameTests() {
  const scoreTestsPassed = clampScore(79) === 79 && clampScore(-12) === 0 && clampScore(140) === 100;
  const labelTestsPassed = getScoreLabel(90) === "Highly Humanized" && getScoreLabel(75) === "Mostly Human" && getScoreLabel(39) === "Heavy AI Artifacting";
  const reportTestsPassed = Object.values(draftReports).every((report) => report.issues.length > 0 && report.priorities.length > 0 && report.scores.length > 0);
  const audioTestsPassed =
    amplitudeToDb(1) === "0.0 dB" &&
    getClippingRisk(0.999) === "High" &&
    getTechnicalReadinessScore(null) === null &&
    getClippingRisk(0.98) === "Medium" &&
    getDynamicsLabel(0.15) === "Moderate" &&
    getBrightnessLabel(0.5) === "Bright / Potentially Harsh" &&
    getTextureStabilityLabel(0.4) === "Unstable / Busy" &&
    buildArtifactClues({ status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).some((clue) => clue.title.includes("shimmer")) &&
    buildAudioFactRows(null, { status: "Ready", peakDb: "-1.0 dB", clippingRisk: "Low", dynamics: "Moderate", sampleRate: 44100, channels: 2 }, "Draft").some((row) => row.label === "Draft Sample Rate") &&
    buildArtifactClueSentence({ status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).includes("artifact clue") &&
    buildListeningFocusItems({ status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).length > 0 &&
    getHumanizationPriorityScore({ status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }) > 0 &&
    buildSectionReviewNotes({ status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).length === 5 &&
    buildHumanizationActionPlan({ status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).some((item) => item.action.includes("top-end")) &&
    buildActionPlanForTone({ status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, "client").some((item) => item.action.includes("high-frequency")) &&
    buildClientActionPlanText(defaultProjectSession, { status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).includes("SOULFRAME CLIENT ACTION PLAN") &&
    buildClientSafeReportSummaryText(defaultProjectSession, beforeAfterReport, { status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, "draft").includes("SOULFRAME CLIENT-SAFE REPORT SUMMARY") &&
    buildRevisionChecklistText(defaultProjectSession, beforeAfterReport, { status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, "draft").includes("SOULFRAME REVISION CHECKLIST") &&
    getHumanizationPriorityLabel(60) === "Medium Priority" &&
    getHumanizationDelta(
      { status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Unstable / Busy", dynamics: "Compressed", clippingRisk: "Medium" },
      { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }
    ).some((item) => item.status === "Improved") &&
    getTechnicalFormatNotes({ status: "Ready", sampleRate: 44100, channels: 2, clippingRisk: "Low" }).length >= 2 &&
    getTechnicalReadinessScore({ status: "Ready", clippingRisk: "Low", dynamics: "Moderate", sampleRate: 44100, channels: 2 }) >= 85 &&
    getTechnicalReadinessLabel(85) === "Client-Ready Technically" &&
    buildDeliveryChecklist({ status: "Ready", clippingRisk: "Low", dynamics: "Moderate", sampleRate: 44100, channels: 2 }, "draft").length >= 6 &&
    buildDeliveryChecklistText(defaultProjectSession, buildDeliveryChecklist(null)).includes("SOULFRAME CLIENT DELIVERY CHECKLIST");
  const comparisonTestsPassed =
    buildBeforeAfterComparison({ duration: 120, size: 1 }, { duration: 118, size: 1 }, { status: "Ready", peakDb: "-0.2 dB", clippingRisk: "Medium", dynamics: "Compressed" }, { status: "Ready", peakDb: "-1.5 dB", clippingRisk: "Low", dynamics: "Moderate" }).length === 4 &&
    getBeforeAfterImprovementScore({ status: "Ready", peakDb: "-0.2 dB", clippingRisk: "Medium", dynamics: "Compressed" }, { status: "Ready", peakDb: "-1.5 dB", clippingRisk: "Low", dynamics: "Moderate" }) > 70 &&
    getBeforeAfterImprovementLabel(82) === "Strong Technical Improvement";
  const copyReportTestsPassed =
    buildFullReportText({ report: beforeAfterReport, reviewMode: "compare", projectSession: defaultProjectSession, draftAudioMetadata: null, humanizedAudioMetadata: null, draftAudioAnalysis: null, humanizedAudioAnalysis: null, clientUpdate: "Test" }).includes("SOULFRAME PRODUCER HUMANIZATION REPORT") &&
    buildFullReportText({ report: beforeAfterReport, reviewMode: "draft", projectSession: defaultProjectSession, draftAudioMetadata: null, humanizedAudioMetadata: null, draftAudioAnalysis: null, humanizedAudioAnalysis: null, clientUpdate: "Test", reportTone: "client" }).includes("CLIENT-SAFE ACTION PLAN") &&
    buildFullReportText({ report: beforeAfterReport, reviewMode: "draft", projectSession: defaultProjectSession, draftAudioMetadata: null, humanizedAudioMetadata: null, draftAudioAnalysis: null, humanizedAudioAnalysis: null, clientUpdate: "Test" }).includes("CLIENT DELIVERY CHECKLIST") &&
    buildSessionSummaryText(defaultProjectSession, null, null, "draft", "marcel").includes("SOULFRAME SESSION SUMMARY");
  const exportReportTestsPassed =
    makeSafeFileName("Client Project 01") === "Client_Project_01" &&
    makeSafeFileName("") === "SoulFrame_Report" &&
    typeof downloadTextFile === "function";
  const storageTestsPassed =
    typeof loadSavedSession === "function" &&
    typeof loadSavedSetting === "function" &&
    typeof saveSetting === "function" &&
    typeof loadSavedProjects === "function" &&
    typeof saveSavedProjects === "function" &&
    buildSavedProjectRecord(defaultProjectSession, "draft", "marcel").title === "Untitled AI Draft" &&
    demoPresets.beforeAfter.reviewMode === "compare" &&
    demoWalkthroughSteps.length === 5 &&
    typeof SecondaryViews === "object" &&
    buildProductSummaryText().includes("SOULFRAME PRODUCT SUMMARY") &&
    buildProductSummaryText().includes("V5.3 report sharing and export prototype") &&
    buildSavedProjectRecord(demoPresets.vocalDraft.projectSession, demoPresets.vocalDraft.reviewMode, demoPresets.vocalDraft.selectedPreset).title === "AI Vocal Humanization Demo" &&
    typeof QuickStartGuide === "function" &&
    typeof SoulFrameFooter === "function" &&
    typeof ClassicDemo === "object" &&
    typeof PublicDemoNotice === "function" &&
    typeof V41BackendScaffoldPanel === "function" &&
    typeof V41AnalysisEngineSeparationPanel === "function" &&
    typeof V41MockApiResponsePanel === "function" &&
    typeof V41FrontendApiAdapterPanel === "function" &&
    typeof V42SmarterReportRouterPanel === "function" &&
    typeof V42GenreRecommendationPanel === "function" &&
    typeof V42PathSpecificReportPanel === "function" &&
    typeof V42ClientToneDraftPanel === "function" &&
    typeof V42BeforeAfterExplanationPanel === "function" &&
    typeof V42SmartReportComposerPanel === "function" &&
    typeof V42ReportQualityGatePanel === "function" &&
    typeof V42ReportOutputPackPanel === "function" &&
    typeof V42FinalReportHandoffPanel === "function" &&
    typeof V42ReportExportManifestPanel === "function" &&
    typeof V42ReportControlCenterPanel === "function" &&
    typeof V50ProductDashboardPreviewPanel === "function" &&
    typeof V50ProductNavigationBlueprintPanel === "function" &&
    typeof V50ProgressiveDisclosurePanel === "function" &&
    typeof V50TabbedWorkflowShellPanel === "function" &&
    typeof V50CleanDashboardPriorityPanel === "function" &&
    typeof V50AdvancedPanelCollapseStrategyPanel === "function" &&
    typeof V50PublicBetaUxHandoffPanel === "function" &&
    typeof V51ProductWorkspace === "function" &&
    typeof V51FocusedWorkspaceHeader === "function" &&
    typeof V51DashboardActionCardsPanel === "function" &&
    typeof V51FocusedAnalyzeWorkspacePanel === "function" &&
    typeof V51FocusedReportWorkspacePanel === "function" &&
    typeof V51FocusedOutputWorkspacePanel === "function" &&
    typeof V51FocusedAdvancedWorkspacePanel === "function" &&
    typeof V51WorkspaceProgressRail === "function" &&
    typeof V51LayoutRefactorHandoffPanel === "function" &&
    typeof V52PublicBetaPresentationHero === "function" &&
    typeof V52PublicDemoScenarioCards === "function" &&
    typeof V52PublicBetaValueStrip === "function" &&
    typeof V52PublicBetaWorkflowPreview === "function" &&
    typeof V52DashboardClarityCleanupPanel === "function" &&
    typeof V52PublicBetaScreenshotGuidePanel === "function" &&
    typeof V52PublicBetaPresentationHandoffPanel === "function" &&
    buildV53ProductWorkspaceModuleSummary().feature === "Product Workspace Modularization" &&
    buildV53ProductWorkspaceModuleSummary().modulePath === "src/product/ProductWorkspace.jsx" &&
    buildV53ProductWorkspaceModuleText().includes("SOULFRAME V5.3 PRODUCT WORKSPACE MODULARIZATION") &&
    typeof V53CleanReportPreview === "function" &&
    buildV53CleanReportPreview(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Clean Report Preview" &&
    buildV53CleanReportPreviewText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null, "producer").includes("SOULFRAME CLEAN HUMANIZATION REPORT") &&
    buildV53CleanReportPreviewText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null, "client").includes("CLIENT SUMMARY") &&
    buildV53DownloadableReportExport(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Downloadable Report Export" &&
    buildV53DownloadableReportExport(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).producerFileName.endsWith(".txt") &&
    buildV53DownloadableReportExportText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.3 DOWNLOADABLE REPORT EXPORT") &&
    buildV53ShareableReportDirection(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Shareable Report Direction" &&
    buildV53ShareableReportDirection(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).routePreview.startsWith("/report/") &&
    buildV53ShareableReportDirectionText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.3 SHAREABLE REPORT DIRECTION") &&
    typeof V53BeforeAfterCaseStudy === "function" &&
    buildV53BeforeAfterCaseStudy(defaultProjectSession, "compare", { status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Unstable / Busy", dynamics: "Compressed", clippingRisk: "High" }, { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).feature === "Before / After Case Study" &&
    buildV53BeforeAfterCaseStudy(defaultProjectSession, "compare", { status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Unstable / Busy", dynamics: "Compressed", clippingRisk: "High" }, { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).comparisonReady === true &&
    buildV53BeforeAfterCaseStudyText(defaultProjectSession, "compare", { status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Unstable / Busy", dynamics: "Compressed", clippingRisk: "High" }, { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).includes("SOULFRAME V5.3 BEFORE / AFTER CASE STUDY") &&
    typeof V53ClientDeliveryExperience === "function" &&
    buildV53ClientDeliveryExperience(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Client Delivery Experience" &&
    buildV53ClientDeliveryExperience(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).fileName.endsWith(".txt") &&
    buildV53ClientDeliveryExperienceText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.3 CLIENT DELIVERY EXPERIENCE") &&
    typeof V53ReportSharingExportHandoff === "function" &&
    buildV53ReportSharingExportHandoff(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Report Sharing & Export Handoff" &&
    buildV53ReportSharingExportHandoff(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).readinessScore === 100 &&
    buildV53ReportSharingExportHandoffText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.3 REPORT SHARING & EXPORT HANDOFF") &&
    typeof V54ReportWorkspaceCleanup === "function" &&
    buildV54ReportWorkspaceCleanup(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Report Workspace Cleanup" &&
    buildV54ReportWorkspaceCleanup(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).showComparison === false &&
    buildV54ReportWorkspaceCleanup(defaultProjectSession, "compare", { status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Unstable / Busy", dynamics: "Compressed", clippingRisk: "High" }, { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).showComparison === true &&
    buildV54ReportWorkspaceCleanupText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.4 REPORT WORKSPACE CLEANUP") &&
    typeof V54AdvancedWorkspaceCleanup === "function" &&
    ADVANCED_SECTIONS.length === 4 &&
    ADVANCED_SECTIONS[0].id === "technical" &&
    ADVANCED_SECTIONS[3].id === "history" &&
    typeof V54OutputWorkspaceCleanup === "function" &&
    getV54OutputEvidenceStatus("draft", null, null).needsAnalysis === true &&
    getV54OutputEvidenceStatus("draft", { status: "Ready" }, null).label === "Draft analyzed" &&
    getV54OutputEvidenceStatus("compare", { status: "Ready" }, null).label === "Comparison incomplete" &&
    getV54OutputEvidenceStatus("compare", { status: "Ready" }, { status: "Ready" }).needsAnalysis === false &&
    buildV41AdapterContractText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V4.1 FRONTEND API ADAPTER") &&
    buildV41AdapterState(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).uiState === "ready" &&
    buildV42ReportContext(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).version === "v4.2" &&
    buildV42SmarterReportText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).includes("SOULFRAME V4.2 SMARTER HUMANIZATION REPORT ROUTER") &&
    buildV42GenreRecommendationProfile("R&B / Soul", "Vocal Humanization Report", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).title === "Vocal Humanization Focus" &&
    buildV42GenreRecommendationText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).includes("SOULFRAME V4.2 GENRE-AWARE RECOMMENDATION LAYER") &&
    buildV42PathSpecificReportSections("Vocal Humanization Report", "R&B / Soul", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" })[0].title === "Vocal Realism" &&
    buildV42PathSpecificReportText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).includes("SOULFRAME V4.2 PATH-SPECIFIC REPORT BUILDER") &&
    buildV42ClientToneDrafts(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).length === 3 &&
    buildV42ClientToneDraftText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).includes("SOULFRAME V4.2 CLIENT TONE DRAFT LAYER") &&
    buildV42BeforeAfterExplanation({ status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Unstable / Busy", dynamics: "Compressed", clippingRisk: "Medium" }, { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).improvementLabel === "Improved" &&
    buildV42BeforeAfterExplanationText({ status: "Ready", brightness: "Bright / Potentially Harsh", textureStability: "Unstable / Busy", dynamics: "Compressed", clippingRisk: "Medium" }, { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).includes("SOULFRAME V4.2 BEFORE/AFTER EXPLANATION LAYER") &&
    buildV42SmartReportComposer(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Smart Report Composer" &&
    buildV42SmartReportComposerText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V4.2 SMART REPORT COMPOSER") &&
    buildV42ReportQualityGate(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Report Quality Gate" &&
    buildV42ReportQualityGateText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V4.2 REPORT QUALITY GATE") &&
    buildV42ReportOutputPack(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Report Output Pack" &&
    buildV42ReportOutputPackText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V4.2 REPORT OUTPUT PACK") &&
    buildV42FinalReportHandoff(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Final Report Handoff" &&
    buildV42FinalReportHandoffText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V4.2 FINAL REPORT HANDOFF") &&
    buildV42ReportExportManifest(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Report Export Manifest" &&
    buildV42ReportExportManifestText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V4.2 REPORT EXPORT MANIFEST") &&
    buildV42ReportControlCenter(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Report Control Center" &&
    buildV42ReportControlCenterText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V4.2 REPORT CONTROL CENTER") &&
    buildV50ProductDashboardSummary(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Product Dashboard Preview" &&
    buildV50ProductDashboardText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.0 PRODUCT DASHBOARD PREVIEW") &&
    buildV50ProductNavigationBlueprint(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Product Navigation Blueprint" &&
    buildV50ProductNavigationText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.0 PRODUCT NAVIGATION BLUEPRINT") &&
    buildV50ProgressiveDisclosureMap(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Progressive Disclosure Layout" &&
    buildV50ProgressiveDisclosureText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.0 PROGRESSIVE DISCLOSURE LAYOUT") &&
    buildV50TabbedWorkflowShell(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Tabbed Workflow Shell" &&
    buildV50TabbedWorkflowText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.0 TABBED WORKFLOW SHELL") &&
    buildV50CleanDashboardPrioritySummary(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Clean Dashboard Priority Summary" &&
    buildV50CleanDashboardPriorityText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.0 CLEAN DASHBOARD PRIORITY SUMMARY") &&
    buildV50AdvancedPanelCollapseStrategy(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Advanced Panel Collapse Strategy" &&
    buildV50AdvancedPanelCollapseText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.0 ADVANCED PANEL COLLAPSE STRATEGY") &&
    buildV50PublicBetaUxHandoff(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Public Beta UX Handoff" &&
    buildV50PublicBetaUxHandoffText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.0 PUBLIC BETA UX HANDOFF") &&
    buildV51DashboardShellState(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Dashboard Layout Shell" &&
    buildV51DashboardShellText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.1 DASHBOARD LAYOUT SHELL") &&
    buildV51WorkspaceHeaderState("dashboard", defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Focused Workspace Header" &&
    buildV51WorkspaceHeaderText("dashboard", defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.1 FOCUSED WORKSPACE HEADER") &&
    buildV51DashboardActionCards(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Dashboard Action Cards" &&
    buildV51DashboardActionCardsText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.1 DASHBOARD ACTION CARDS") &&
    buildV51AnalyzeWorkspaceSummary(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Focused Analyze Workspace" &&
    buildV51AnalyzeWorkspaceText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.1 FOCUSED ANALYZE WORKSPACE") &&
    buildV51ReportWorkspaceSummary(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Focused Report Workspace" &&
    buildV51ReportWorkspaceText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.1 FOCUSED REPORT WORKSPACE") &&
    buildV51OutputWorkspaceSummary(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Focused Output Workspace" &&
    buildV51OutputWorkspaceText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.1 FOCUSED OUTPUT WORKSPACE") &&
    buildV51AdvancedWorkspaceSummary(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Focused Advanced Workspace" &&
    buildV51AdvancedWorkspaceText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.1 FOCUSED ADVANCED WORKSPACE") &&
    buildV51WorkspaceProgressRailState("dashboard", defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Workspace Progress Rail" &&
    buildV51WorkspaceProgressRailText("dashboard", defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.1 WORKSPACE PROGRESS RAIL") &&
    buildV51LayoutRefactorHandoff(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Layout Refactor Handoff" &&
    buildV51LayoutRefactorHandoffText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.1 LAYOUT REFACTOR HANDOFF") &&
    buildProductSummaryText().includes("V5.3 report sharing and export prototype") &&
    buildV52PresentationHeroState(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Public Beta Presentation Hero" &&
    buildV52PresentationHeroText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.2 PUBLIC BETA PRESENTATION HERO") &&
    buildV52PublicDemoScenarios().feature === "Public Demo Scenario Cards" &&
    buildV52PublicDemoScenariosText().includes("SOULFRAME V5.2 PUBLIC DEMO SCENARIO CARDS") &&
    buildV52PublicBetaValueStrip(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Public Beta Value Strip" &&
    buildV52PublicBetaValueStripText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.2 PUBLIC BETA VALUE STRIP") &&
    buildV52PublicBetaWorkflowPreview(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Public Beta Workflow Preview" &&
    buildV52PublicBetaWorkflowPreviewText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.2 PUBLIC BETA WORKFLOW PREVIEW") &&
    buildV52DashboardClarityCleanup(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Dashboard Clarity Cleanup" &&
    buildV52DashboardClarityCleanupText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.2 DASHBOARD CLARITY CLEANUP") &&
    buildV52PublicBetaScreenshotGuide(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Public Beta Screenshot Guide" &&
    buildV52PublicBetaScreenshotGuideText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.2 PUBLIC BETA SCREENSHOT GUIDE") &&
    buildV52PublicBetaPresentationHandoff(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).feature === "Public Beta Presentation Handoff" &&
    buildV52PublicBetaPresentationHandoffText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }, null).includes("SOULFRAME V5.2 PUBLIC BETA PRESENTATION HANDOFF") &&
    buildShareLinksText().includes("SOULFRAME PUBLIC LINKS") &&
    buildV41ApiContractText().includes("SOULFRAME V4.1 BACKEND/API ARCHITECTURE") &&
    buildV41MockApiResponseShape().apiVersion === "v4.1" &&
    buildV41EngineSeparationText().includes("SOULFRAME V4.1 ANALYSIS ENGINE SEPARATION PLAN") &&
    buildV41EngineResultShape().engineVersion === "v4.1" &&
    buildV41MockApiExchangeText(defaultProjectSession, "draft", { status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).includes("SOULFRAME V4.1 MOCK API EXCHANGE") &&
    buildV41MockAnalysisResponse({ status: "Ready", brightness: "Balanced", textureStability: "Stable", dynamics: "Moderate", clippingRisk: "Low" }).status === "complete" &&
    buildSavedProjectsBackup([]).includes("saved-projects-backup") &&
    parseSavedProjectsBackup(buildSavedProjectsBackup([])).length === 0;
  return scoreTestsPassed && labelTestsPassed && reportTestsPassed && audioTestsPassed && comparisonTestsPassed && copyReportTestsPassed && exportReportTestsPassed && storageTestsPassed;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error && error.message ? error.message : "Unknown error" };
  }

  componentDidCatch(error, errorInfo) {
    // Keep the app visible even if one review panel fails.
    console.error("SoulFrame panel error", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold">SoulFrame recovered from a panel error</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Something went wrong in this review panel, but the app stayed open instead of showing a blank screen.
          </p>
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-black p-4 text-sm text-zinc-400">
            {this.state.errorMessage}
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={this.handleReset}>
              Try Again
            </Button>
            <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={() => window.location.reload()}>
              Refresh App
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
}

function Icon({ children }) {
  return <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-base leading-none" aria-hidden="true">{children}</span>;
}

function Button({ children, className = "", ...props }) {
  return <button type="button" className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold transition focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 ${className}`} {...props}>{children}</button>;
}

function Card({ children, className = "" }) {
  return <div className={`rounded-3xl border border-zinc-800 bg-zinc-950 text-white shadow-2xl ${className}`}>{children}</div>;
}

function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

function Panel({ title, subtitle, children, action }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
          </div>
          {action || null}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

function ScoreBar({ label, value, status }) {
  const scoreValue = clampScore(value);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-100">{label}</p>
          <p className="text-xs text-zinc-400">{status}</p>
        </div>
        <span className="text-sm font-semibold text-zinc-100">{scoreValue}/100</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
        <div className="h-full rounded-full bg-zinc-100 transition-all duration-700 ease-out" style={{ width: `${scoreValue}%` }} />
      </div>
    </div>
  );
}

function UploadBox({ fileName, onFileChange, title, description }) {
  return (
    <label className="block w-full cursor-pointer rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-6 text-left transition hover:bg-zinc-900/70 focus-within:ring-2 focus-within:ring-zinc-500">
      <input type="file" accept="audio/*" className="sr-only" onChange={onFileChange} />
      <span className="flex items-start gap-4">
        <span className="rounded-2xl bg-zinc-800 p-3"><Icon>⇧</Icon></span>
        <span>
          <span className="block font-semibold text-zinc-100">{title}</span>
          <span className="mt-1 block text-sm text-zinc-400">{description}</span>
          <span className="mt-3 block text-xs text-zinc-500">WAV, MP3, AIFF supported</span>
          {fileName ? <span className="mt-3 block rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-200">{fileName}</span> : null}
        </span>
      </span>
    </label>
  );
}

function AudioPreview({ src, label }) {
  if (!src) return null;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-4">
      <p className="mb-3 text-sm font-semibold text-zinc-100">{label}</p>
      <audio controls src={src} className="w-full" />
    </div>
  );
}

function WaveformPreview({ src, label }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Waiting for audio...");

  useEffect(() => {
    if (!src || !canvasRef.current) return undefined;
    let cancelled = false;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;
    context.clearRect(0, 0, width, height);
    setStatus("Drawing waveform...");

    async function drawWaveform() {
      try {
        const response = await fetch(src);
        const arrayBuffer = await response.arrayBuffer();
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioContext = new AudioContextClass();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);
        const samples = 900;
        const blockSize = Math.max(1, Math.floor(channelData.length / samples));
        const middle = height / 2;
        if (cancelled) return;
        context.clearRect(0, 0, width, height);
        context.beginPath();
        context.moveTo(0, middle);
        for (let i = 0; i < samples; i += 1) {
          const start = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j += 1) sum += Math.abs(channelData[start + j] || 0);
          const x = (i / samples) * width;
          const y = middle - (sum / blockSize) * middle * 2.4;
          context.lineTo(x, y);
        }
        context.lineWidth = 2;
        context.strokeStyle = "#f4f4f5";
        context.stroke();
        setStatus("Waveform ready");
        audioContext.close();
      } catch (error) {
        if (!cancelled) setStatus("Waveform unavailable for this file");
      }
    }

    drawWaveform();
    return () => { cancelled = true; };
  }, [src]);

  if (!src) return null;
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-100">{label}</p>
        <p className="text-xs text-zinc-500">{status}</p>
      </div>
      <canvas ref={canvasRef} width="900" height="140" className="h-28 w-full rounded-xl border border-zinc-800 bg-black" />
    </div>
  );
}

function AudioHealthCheck({ analysis, label }) {
  if (!analysis) return null;
  const rows = analysis.status === "Ready"
    ? [
        { label: "Peak Level", value: analysis.peakDb },
        { label: "Clipping Risk", value: analysis.clippingRisk },
        { label: "Average Energy", value: analysis.averageEnergyDb },
        { label: "Dynamics", value: analysis.dynamics },
        { label: "Sample Rate", value: analysis.sampleRate ? `${analysis.sampleRate} Hz` : "Unknown" },
        { label: "Channels", value: analysis.channels ? `${analysis.channels}` : "Unknown" },
        { label: "Technical Readiness", value: `${getTechnicalReadinessScore(analysis)}/100` },
        { label: "Brightness", value: analysis.brightness || "Unknown" },
        { label: "Texture Stability", value: analysis.textureStability || "Unknown" },
      ]
    : [{ label: "Status", value: analysis.status }];

  const technicalNotes = getTechnicalFormatNotes(analysis);

  return (
    <div className="space-y-4">
      <InfoGrid title={label} rows={rows} />
      {technicalNotes.length ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold text-zinc-100">Technical Format Notes</p>
            <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
              {getTechnicalReadinessLabel(getTechnicalReadinessScore(analysis))}
            </span>
          </div>
          <div className="space-y-2">
            {technicalNotes.map((note) => (
              <div key={note} className="rounded-xl border border-zinc-800 bg-black p-3 text-sm text-zinc-300">
                {note}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AudioMetadata({ metadata, label }) {
  if (!metadata) return null;
  return <InfoGrid title={label} rows={[{ label: "Name", value: metadata.name }, { label: "Type", value: metadata.type }, { label: "Size", value: formatFileSize(metadata.size) }, { label: "Duration", value: formatDuration(metadata.duration) }]} />;
}

function InfoGrid({ title, rows }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="mb-4 text-sm font-semibold text-zinc-100">{title}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {rows.map((row) => (
          <div key={row.label} className="rounded-xl border border-zinc-800 bg-black p-3">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{row.label}</p>
            <p className="mt-1 break-words text-sm text-zinc-200">{row.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SoulFrameFooter({ setView }) {
  const links = [
    { label: "Live Demo", href: "https://soulframe-v1.vercel.app" },
    { label: "GitHub", href: "https://github.com/ahmedkordofani/soulframe-v1" },
    { label: "ChordOfAnnie", href: "https://chordofannie.com" },
  ];

  return (
    <footer className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">SoulFrame</p>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
            Built by ChordOfAnnie to support producers humanizing AI-generated music without replacing the human ear.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl border border-zinc-800 bg-black px-5 py-3 text-sm font-semibold text-zinc-100 transition hover:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500"
            >
              {link.label}
            </a>
          ))}
          <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={() => setView("about")}>About SoulFrame</Button>
        </div>
      </div>
    </footer>
  );
}

function QuickStartGuide({ applyDemoPreset, setView }) {
  const steps = [
    {
      title: "1. Choose a demo scenario",
      note: "Start with a vocal, instrumental, client-ready, or before/after preset so the app makes sense immediately.",
    },
    {
      title: "2. Review the generated report",
      note: "Scroll through the humanization score, artifact clues, action plan, checklist, and client update sections.",
    },
    {
      title: "3. Export something useful",
      note: "Copy a client-safe summary, download a report, or save the demo as a project session.",
    },
  ];

  return (
    <Panel
      title="Quick Start"
      subtitle="A simple first-time path for anyone opening the public SoulFrame demo."
      action={
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={() => applyDemoPreset("vocalDraft")}>Vocal Demo</Button>
          <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={() => applyDemoPreset("instrumentalDraft")}>Instrumental Demo</Button>
          <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={() => applyDemoPreset("beforeAfter")}>Before / After</Button>
          <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={() => setView("walkthrough")}>Walkthrough</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <article key={step.title} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <h3 className="font-semibold text-zinc-100">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{step.note}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}



function PublicDemoNotice() {
  return (
    <div className="rounded-[2rem] border border-zinc-800 bg-black p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Public Demo Note</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-100">Prototype tool, human-led workflow.</h2>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-400">
            SoulFrame is a browser-based prototype for reviewing AI-generated music drafts. It supports producer decision-making, but it does not replace human listening, taste, or final creative judgement.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 text-sm text-zinc-300 sm:grid-cols-2 md:min-w-[22rem]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">Audio is inspected in-browser.</div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">Saved sessions use local storage.</div>
        </div>
      </div>
    </div>
  );
}











function buildV41BackendArchitecturePlan() {
  return {
    title: "V4.1 Backend/API Prototype",
    status: "Architecture scaffold",
    goal: "Prepare SoulFrame for a future backend without breaking the current browser-based demo.",
    responsibilities: [
      {
        layer: "Frontend",
        role: "Keep the public demo fast, visual, and interactive.",
        examples: "Project intake, demo presets, local sessions, audio preview, report UI, and client-facing copy.",
      },
      {
        layer: "API Adapter",
        role: "Create a safe bridge between the app and any future backend service.",
        examples: "Mock request/response format, analysis status handling, error states, and versioned payloads.",
      },
      {
        layer: "Backend",
        role: "Handle heavier analysis and future server-side processing.",
        examples: "Audio feature extraction, stored analysis records, authenticated projects, and scalable report generation.",
      },
      {
        layer: "Human Review",
        role: "Keep the producer as the final decision-maker.",
        examples: "Taste, emotion, context, musical judgement, and final client delivery choices.",
      },
    ],
    roadmap: [
      "V4.1.1 — Backend Architecture Scaffold",
      "V4.1.2 — Analysis Engine Separation Plan",
      "V4.1.3 — Mock API Response Layer",
      "V4.1.4 — Frontend API Adapter",
      "V4.1.5 — README + Release Prep",
    ],
  };
}

function buildV41MockApiResponseShape() {
  return {
    apiVersion: "v4.1",
    mode: "mock-backend",
    status: "ready",
    analysisId: "sf_mock_analysis_001",
    source: "browser-demo",
    sections: [
      "audioIntelligence",
      "riskProfile",
      "humanizationConfidence",
      "revisionPlan",
      "clientSafeSummary",
      "finalRecommendation",
    ],
    note: "This is a frontend-safe mock shape for planning backend integration. It does not upload audio or call a server yet.",
  };
}

function buildV41ApiContractText() {
  const plan = buildV41BackendArchitecturePlan();
  const mock = buildV41MockApiResponseShape();
  const newline = String.fromCharCode(10);
  return [
    "SOULFRAME V4.1 BACKEND/API ARCHITECTURE",
    "",
    `Goal: ${plan.goal}`,
    "",
    "Responsibilities:",
    ...plan.responsibilities.map((item) => `- ${item.layer}: ${item.role} ${item.examples}`),
    "",
    "Mock response shape:",
    `- apiVersion: ${mock.apiVersion}`,
    `- mode: ${mock.mode}`,
    `- status: ${mock.status}`,
    `- analysisId: ${mock.analysisId}`,
    `- source: ${mock.source}`,
    `- sections: ${mock.sections.join(", ")}`,
    "",
    "Roadmap:",
    ...plan.roadmap.map((item) => `- ${item}`),
  ].join(newline);
}

function V41BackendScaffoldPanel() {
  const plan = buildV41BackendArchitecturePlan();
  const mock = buildV41MockApiResponseShape();

  return (
    <Panel title="V4.1 Backend/API Scaffold" subtitle="A safe architecture layer for planning backend integration before adding a real server.">
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{plan.status}</p>
            <h3 className="mt-2 text-xl font-semibold text-zinc-100">{plan.title}</h3>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-400">{plan.goal}</p>
          </div>
          <span className="rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">
            V4.1.1 Scaffold
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plan.responsibilities.map((item) => (
          <article key={item.layer} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{item.layer}</p>
            <h4 className="mt-3 font-semibold text-zinc-100">{item.role}</h4>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{item.examples}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Mock API Response Shape</p>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <p><span className="text-zinc-500">apiVersion:</span> {mock.apiVersion}</p>
            <p><span className="text-zinc-500">mode:</span> {mock.mode}</p>
            <p><span className="text-zinc-500">status:</span> {mock.status}</p>
            <p><span className="text-zinc-500">analysisId:</span> {mock.analysisId}</p>
            <p><span className="text-zinc-500">source:</span> {mock.source}</p>
            <p><span className="text-zinc-500">sections:</span> {mock.sections.join(", ")}</p>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-500">{mock.note}</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">V4.1 Roadmap</p>
          <div className="mt-4 space-y-3">
            {plan.roadmap.map((item) => (
              <div key={item} className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-sm text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function buildV41AnalysisEngineSeparationPlan() {
  return {
    title: "V4.1 Analysis Engine Separation Plan",
    status: "Planning layer",
    goal: "Separate SoulFrame's analysis logic into clearer engine-style responsibilities before a real backend is introduced.",
    currentState: [
      "Audio analysis currently runs safely in the browser.",
      "V4 producer intelligence is generated inside the frontend app.",
      "Reports and client-safe summaries are produced locally.",
      "No audio is uploaded to a server in this scaffold stage.",
    ],
    futureEngineLayers: [
      {
        layer: "Audio Feature Engine",
        role: "Extract measurable audio facts from uploaded files.",
        output: "Peak, RMS, dynamics, brightness proxy, texture movement, sample rate, and channel data.",
      },
      {
        layer: "Risk Interpretation Engine",
        role: "Translate audio features into review risks.",
        output: "Harshness risk, mud risk, thinness risk, AI texture risk, and listening priority stack.",
      },
      {
        layer: "Humanization Engine",
        role: "Turn risk interpretation into producer guidance.",
        output: "Humanization confidence, revision moves, readiness checklist, touchpoints, and final recommendation.",
      },
      {
        layer: "Communication Engine",
        role: "Convert producer reasoning into usable outputs.",
        output: "Client-safe summary, client update draft, executive summary, and export-ready report sections.",
      },
    ],
    separationSteps: [
      "Keep browser-based analysis working as the default path.",
      "Group analysis functions by responsibility instead of mixing all logic together.",
      "Create a stable internal result shape that can later be returned by an API.",
      "Make frontend panels read from normalized analysis objects rather than raw helper chains.",
      "Only introduce a real backend after the frontend engine boundaries are clear.",
    ],
  };
}

function buildV41EngineResultShape() {
  return {
    engineVersion: "v4.1",
    mode: "frontend-engine-scaffold",
    audioFeatures: {
      peak: "number",
      rms: "number",
      dynamicRange: "number",
      brightnessScore: "number",
      textureMovement: "number",
      sampleRate: "number",
      channels: "number",
    },
    riskProfile: {
      harshnessRisk: "number",
      mudRisk: "number",
      thinnessRisk: "number",
      aiTextureRisk: "number",
    },
    humanization: {
      confidenceScore: "number",
      confidenceLabel: "string",
      listeningPriorityStack: "array",
      revisionMoves: "array",
      readinessChecklist: "array",
      finalRecommendation: "object",
    },
    communication: {
      clientSafeSummary: "array",
      clientUpdateDraft: "array",
      executiveSummary: "object",
      reportSections: "array",
    },
  };
}

function buildV41EngineSeparationText() {
  const plan = buildV41AnalysisEngineSeparationPlan();
  const shape = buildV41EngineResultShape();
  const newline = String.fromCharCode(10);

  return [
    "SOULFRAME V4.1 ANALYSIS ENGINE SEPARATION PLAN",
    "",
    `Goal: ${plan.goal}`,
    "",
    "Current state:",
    ...plan.currentState.map((item) => `- ${item}`),
    "",
    "Future engine layers:",
    ...plan.futureEngineLayers.map((item) => `- ${item.layer}: ${item.role} Output: ${item.output}`),
    "",
    "Separation steps:",
    ...plan.separationSteps.map((item) => `- ${item}`),
    "",
    "Normalized result shape:",
    `- engineVersion: ${shape.engineVersion}`,
    `- mode: ${shape.mode}`,
    "- audioFeatures",
    "- riskProfile",
    "- humanization",
    "- communication",
  ].join(newline);
}

function V41AnalysisEngineSeparationPanel() {
  const plan = buildV41AnalysisEngineSeparationPlan();
  const shape = buildV41EngineResultShape();

  return (
    <Panel title="V4.1 Analysis Engine Separation" subtitle="A planning layer for separating browser analysis, risk interpretation, humanization logic, and communication outputs.">
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{plan.status}</p>
            <h3 className="mt-2 text-xl font-semibold text-zinc-100">{plan.title}</h3>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-400">{plan.goal}</p>
          </div>
          <span className="rounded-full border border-zinc-700 bg-zinc-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-300">
            V4.1.2 Plan
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {plan.futureEngineLayers.map((item) => (
          <article key={item.layer} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{item.layer}</p>
            <h4 className="mt-3 font-semibold text-zinc-100">{item.role}</h4>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{item.output}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Separation Steps</p>
          <div className="mt-4 space-y-3">
            {plan.separationSteps.map((item) => (
              <div key={item} className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-sm leading-6 text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Normalized Engine Result Shape</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {Object.keys(shape).map((key) => (
              <div key={key} className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-sm font-semibold text-zinc-100">{key}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{typeof shape[key] === "string" ? shape[key] : "structured object"}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function buildV41MockAnalysisRequest(projectSession, reviewMode = "draft") {
  return {
    apiVersion: "v4.1",
    requestType: "mock-analysis-request",
    project: {
      projectName: getSessionValue(projectSession, "projectName"),
      clientName: getSessionValue(projectSession, "clientName"),
      trackType: getSessionValue(projectSession, "trackType"),
      aiTool: getSessionValue(projectSession, "aiTool"),
      goal: getSessionValue(projectSession, "goal"),
    },
    reviewMode,
    requestedSections: [
      "audioFeatures",
      "riskProfile",
      "humanizationPriority",
      "revisionGuidance",
      "clientSummary",
    ],
    privacy: "mock-only-no-upload",
  };
}

function buildV41RiskProfileFromAnalysis(analysis) {
  if (!analysis || analysis.status !== "Ready") {
    return {
      harshnessRisk: 0,
      movementRisk: 0,
      headroomRisk: 0,
      dynamicsRisk: 0,
      status: "waiting-for-audio",
    };
  }

  const harshnessRisk = analysis.brightness === "Bright / Potentially Harsh" ? 78 : analysis.brightness === "Balanced" ? 38 : 24;
  const movementRisk = analysis.textureStability === "Unstable / Busy" ? 82 : analysis.textureStability === "Moderate Movement" ? 48 : 26;
  const headroomRisk = analysis.clippingRisk === "High" ? 90 : analysis.clippingRisk === "Medium" ? 58 : 22;
  const dynamicsRisk = analysis.dynamics === "Compressed" ? 76 : analysis.dynamics === "Moderate" ? 38 : 28;

  return {
    harshnessRisk,
    movementRisk,
    headroomRisk,
    dynamicsRisk,
    status: "ready",
  };
}

function buildV41MockAnalysisResponse(analysis) {
  const ready = analysis && analysis.status === "Ready";
  const riskProfile = buildV41RiskProfileFromAnalysis(analysis);
  const priorityScore = ready ? getHumanizationPriorityScore(analysis) : 0;
  const priorityLabel = ready ? getHumanizationPriorityLabel(priorityScore) : "Waiting for Audio";
  const actionPlan = ready ? buildHumanizationActionPlan(analysis).slice(0, 3).map((item) => item.action) : [];

  return {
    apiVersion: "v4.1",
    responseType: "mock-analysis-response",
    status: ready ? "complete" : "waiting-for-audio",
    analysisId: ready ? "sf_mock_complete_001" : "sf_mock_waiting_001",
    source: "frontend-mock",
    audioFeatures: ready
      ? {
          peakDb: analysis.peakDb || "Not available",
          rmsDb: analysis.rmsDb || "Not available",
          dynamics: analysis.dynamics || "Not available",
          brightness: analysis.brightness || "Not available",
          textureStability: analysis.textureStability || "Not available",
          clippingRisk: analysis.clippingRisk || "Not available",
          sampleRate: analysis.sampleRate || null,
          channels: analysis.channels || null,
        }
      : null,
    riskProfile,
    humanization: {
      priorityScore,
      priorityLabel,
      suggestedActions: actionPlan,
    },
    communication: {
      clientSummary: ready
        ? buildArtifactClueSentence(analysis)
        : "Waiting for audio analysis before generating a client-safe summary.",
      reportMode: "frontend mock only",
    },
    note: "This response is generated locally as a mock API layer. It does not call a backend or upload audio.",
  };
}

function buildV41MockApiExchangeText(projectSession, reviewMode, analysis) {
  const request = buildV41MockAnalysisRequest(projectSession, reviewMode);
  const response = buildV41MockAnalysisResponse(analysis);
  const newline = String.fromCharCode(10);

  return [
    "SOULFRAME V4.1 MOCK API EXCHANGE",
    "",
    "Request:",
    `- apiVersion: ${request.apiVersion}`,
    `- requestType: ${request.requestType}`,
    `- reviewMode: ${request.reviewMode}`,
    `- projectName: ${request.project.projectName}`,
    `- requestedSections: ${request.requestedSections.join(", ")}`,
    `- privacy: ${request.privacy}`,
    "",
    "Response:",
    `- apiVersion: ${response.apiVersion}`,
    `- responseType: ${response.responseType}`,
    `- status: ${response.status}`,
    `- analysisId: ${response.analysisId}`,
    `- source: ${response.source}`,
    `- priority: ${response.humanization.priorityScore}/100 · ${response.humanization.priorityLabel}`,
    "",
    response.note,
  ].join(newline);
}

function V41MockApiResponsePanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const request = buildV41MockAnalysisRequest(projectSession, reviewMode);
  const response = buildV41MockAnalysisResponse(activeAnalysis);

  return (
    <Panel title="V4.1 Mock API Response Layer" subtitle="A local request/response model for testing backend-style integration without uploading audio or calling a real server.">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Mock Request</p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-100">{request.requestType}</h3>
            </div>
            <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{request.apiVersion}</span>
          </div>
          <div className="mt-5 space-y-3 text-sm text-zinc-300">
            <p><span className="text-zinc-500">Project:</span> {request.project.projectName}</p>
            <p><span className="text-zinc-500">Client:</span> {request.project.clientName}</p>
            <p><span className="text-zinc-500">Review Mode:</span> {request.reviewMode}</p>
            <p><span className="text-zinc-500">Privacy:</span> {request.privacy}</p>
            <p><span className="text-zinc-500">Sections:</span> {request.requestedSections.join(", ")}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Mock Response</p>
              <h3 className="mt-2 text-lg font-semibold text-zinc-100">{response.responseType}</h3>
            </div>
            <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{response.status}</span>
          </div>
          <div className="mt-5 space-y-3 text-sm text-zinc-300">
            <p><span className="text-zinc-500">Analysis ID:</span> {response.analysisId}</p>
            <p><span className="text-zinc-500">Source:</span> {response.source}</p>
            <p><span className="text-zinc-500">Priority:</span> {response.humanization.priorityScore}/100 · {response.humanization.priorityLabel}</p>
            <p className="leading-6 text-zinc-500">{response.note}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Risk Profile</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {response.riskProfile.status === "ready" ? `Harshness ${response.riskProfile.harshnessRisk}/100 · Movement ${response.riskProfile.movementRisk}/100 · Headroom ${response.riskProfile.headroomRisk}/100 · Dynamics ${response.riskProfile.dynamicsRisk}/100` : "Waiting for audio analysis."}
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Suggested Actions</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {response.humanization.suggestedActions.length ? response.humanization.suggestedActions.join(" · ") : "Waiting for action plan suggestions."}
          </p>
        </div>
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Communication Output</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            {response.communication.clientSummary}
          </p>
        </div>
      </div>
    </Panel>
  );
}

function buildV41FrontendApiAdapterConfig() {
  return {
    adapterVersion: "v4.1",
    mode: "local-mock-adapter",
    purpose: "Give the frontend one stable place to request analysis results, whether the source is local browser logic now or a backend later.",
    sources: [
      {
        source: "local-browser",
        status: "Active",
        role: "Uses the current in-browser SoulFrame analysis and V4 intelligence layers.",
      },
      {
        source: "mock-api",
        status: "Active",
        role: "Formats local analysis as if it came from an API response.",
      },
      {
        source: "future-backend",
        status: "Planned",
        role: "Reserved for a real server/API once the contract is stable.",
      },
    ],
    adapterSteps: [
      "Receive project context and review mode from the app.",
      "Read the current browser analysis result.",
      "Normalize the result into a backend-style response shape.",
      "Return safe loading, success, and waiting states to the UI.",
      "Keep the backend optional until a real API exists.",
    ],
  };
}

function buildV41AdapterState(projectSession, reviewMode, draftAnalysis, humanizedAnalysis) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const request = buildV41MockAnalysisRequest(projectSession, reviewMode);
  const response = buildV41MockAnalysisResponse(activeAnalysis);

  return {
    adapterVersion: "v4.1",
    adapterMode: "local-mock-adapter",
    isBackendConnected: false,
    source: response.source,
    status: response.status,
    request,
    response,
    uiState: response.status === "complete" ? "ready" : "waiting-for-audio",
    safeToDemo: true,
    note: "The adapter is intentionally local-only. It prepares the frontend for a future backend without sending audio anywhere.",
  };
}

function buildV41AdapterContractText(projectSession, reviewMode, draftAnalysis, humanizedAnalysis) {
  const config = buildV41FrontendApiAdapterConfig();
  const adapter = buildV41AdapterState(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const newline = String.fromCharCode(10);

  return [
    "SOULFRAME V4.1 FRONTEND API ADAPTER",
    "",
    `Adapter version: ${adapter.adapterVersion}`,
    `Mode: ${adapter.adapterMode}`,
    `Backend connected: ${adapter.isBackendConnected ? "yes" : "no"}`,
    `UI state: ${adapter.uiState}`,
    `Source: ${adapter.source}`,
    "",
    "Purpose:",
    config.purpose,
    "",
    "Adapter steps:",
    ...config.adapterSteps.map((step) => `- ${step}`),
    "",
    "Sources:",
    ...config.sources.map((item) => `- ${item.source}: ${item.status} — ${item.role}`),
    "",
    adapter.note,
  ].join(newline);
}

function V41FrontendApiAdapterPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const config = buildV41FrontendApiAdapterConfig();
  const adapter = buildV41AdapterState(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel title="V4.1 Frontend API Adapter" subtitle="A local adapter layer that prepares SoulFrame for future backend analysis while keeping the current demo browser-safe.">
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Adapter Mode</p>
            <h3 className="mt-2 text-xl font-semibold text-zinc-100">{config.mode}</h3>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-400">{config.purpose}</p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-4 text-right">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">UI State</p>
            <p className="mt-2 text-lg font-semibold text-zinc-100">{adapter.uiState}</p>
            <p className="mt-1 text-xs text-zinc-500">Backend connected: {adapter.isBackendConnected ? "Yes" : "No"}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        {config.sources.map((item) => (
          <article key={item.source} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{item.source}</p>
              <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{item.status}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{item.role}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Adapter Steps</p>
          <div className="mt-4 space-y-3">
            {config.adapterSteps.map((step) => (
              <div key={step} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-sm leading-6 text-zinc-300">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Current Adapter State</p>
          <div className="mt-4 space-y-3 text-sm text-zinc-300">
            <p><span className="text-zinc-500">Version:</span> {adapter.adapterVersion}</p>
            <p><span className="text-zinc-500">Mode:</span> {adapter.adapterMode}</p>
            <p><span className="text-zinc-500">Source:</span> {adapter.source}</p>
            <p><span className="text-zinc-500">Status:</span> {adapter.status}</p>
            <p><span className="text-zinc-500">Safe to demo:</span> {adapter.safeToDemo ? "Yes" : "No"}</p>
            <p className="leading-6 text-zinc-500">{adapter.note}</p>
          </div>
        </div>
      </div>
    </Panel>
  );
}


















function V42SmarterReportRouterPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const context = buildV42ReportContext(projectSession, reviewMode, activeAnalysis);

  return (
    <Panel
      title="V4.2 Smarter Report Router"
      subtitle="Routes the same analysis into a clearer report path before the app generates client-facing language."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V4.2.1: <span className="font-semibold text-zinc-100">Report Intelligence</span></div>}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Report Path</p>
          <h3 className="mt-3 text-xl font-semibold text-zinc-100">{context.reportPath}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Genre focus: {context.genreFocus}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Revision difficulty: {context.difficulty.label}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-500">{context.difficulty.note}</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-black p-5 lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Suggested Edit Order</p>
          <div className="mt-4 space-y-3">
            {context.suggestedEditOrder.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-100">{index + 1}</span>
                <p className="text-sm leading-6 text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        {context.toneOptions.map((tone) => (
          <article key={tone.label} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Client Tone</p>
            <h3 className="mt-3 font-semibold text-zinc-100">{tone.label}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{tone.use}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}






function V42GenreRecommendationPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const context = buildV42ReportContext(projectSession, reviewMode, activeAnalysis);
  const profile = buildV42GenreRecommendationProfile(context.genreFocus, context.reportPath, activeAnalysis);

  return (
    <Panel
      title="V4.2 Genre-Aware Recommendations"
      subtitle="Turns the report route into genre-sensitive listening priorities and practical production moves."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V4.2.2: <span className="font-semibold text-zinc-100">Genre Guidance</span></div>}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Recommendation Profile</p>
          <h3 className="mt-3 text-xl font-semibold text-zinc-100">{profile.title}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{profile.listeningLens}</p>
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Priority</p>
            <p className="mt-2 font-semibold text-zinc-100">{profile.priority}</p>
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-black p-5 lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Genre-Sensitive Moves</p>
          <div className="mt-4 space-y-3">
            {profile.musicalMoves.map((move, index) => (
              <div key={move} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Move {index + 1}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{move}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Client Angle</p>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{profile.clientAngle}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-500">Emotional target: {profile.emotionalTarget}</p>
      </div>
    </Panel>
  );
}






function V42PathSpecificReportPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const context = buildV42ReportContext(projectSession, reviewMode, activeAnalysis);
  const sections = buildV42PathSpecificReportSections(context.reportPath, context.genreFocus, activeAnalysis);

  return (
    <Panel
      title="V4.2 Path-Specific Report Builder"
      subtitle="Shapes the report differently depending on whether SoulFrame is reviewing vocals, instrumentals, before/after edits, or general AI drafts."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V4.2.3: <span className="font-semibold text-zinc-100">Report Paths</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Active Path</p>
        <h3 className="mt-3 text-xl font-semibold text-zinc-100">{context.reportPath}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">SoulFrame will now structure the report around this path instead of treating every project the same way.</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <article key={section.title} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Report Section</p>
            <h3 className="mt-3 font-semibold text-zinc-100">{section.title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{section.purpose}</p>
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-black p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Report Focus</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{section.reportFocus}</p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}






function V42ClientToneDraftPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const drafts = buildV42ClientToneDrafts(projectSession, reviewMode, activeAnalysis);

  return (
    <Panel
      title="V4.2 Client Tone Drafts"
      subtitle="Creates multiple client-facing versions of the same report direction so the producer can choose the right communication style."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V4.2.4: <span className="font-semibold text-zinc-100">Client Tone</span></div>}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {drafts.map((item) => (
          <article key={item.tone} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Tone Option</p>
            <h3 className="mt-3 text-xl font-semibold text-zinc-100">{item.tone}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-500">{item.bestFor}</p>
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Draft</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{item.draft}</p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}






function V42BeforeAfterExplanationPanel({ draftAnalysis, humanizedAnalysis }) {
  const explanation = buildV42BeforeAfterExplanation(draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V4.2 Before/After Explanation Layer"
      subtitle="Explains what actually changed between the original AI draft and the humanized edit without overwhelming the client."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V4.2.5: <span className="font-semibold text-zinc-100">Before/After Clarity</span></div>}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Comparison Result</p>
          <h3 className="mt-3 text-xl font-semibold text-zinc-100">{explanation.improvementLabel}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{explanation.priorityChange}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-500">{explanation.headline}</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-black p-5 lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Producer Explanation</p>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{explanation.mainExplanation}</p>
          <div className="mt-4 space-y-3">
            {explanation.producerFocus.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Point {index + 1}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Client-Safe Line</p>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{explanation.clientSafeLine}</p>
      </div>
    </Panel>
  );
}






function V42SmartReportComposerPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const report = buildV42SmartReportComposer(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V4.2 Smart Report Composer"
      subtitle="Combines the V4.2 report route, genre guidance, path-specific sections, client tone, and before/after explanation into one cleaner report preview."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V4.2.6: <span className="font-semibold text-zinc-100">Report Composer</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Composed Report</p>
        <h3 className="mt-3 text-xl font-semibold text-zinc-100">{report.reportTitle}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{report.executiveSummary}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-500">{report.confidenceLine}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Producer Plan</p>
          <div className="mt-4 space-y-3">
            {report.producerPlan.map((item, index) => (
              <div key={`${item}-${index}`} className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Step {index + 1}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Client-Ready Summary</p>
          <p className="mt-4 text-sm leading-6 text-zinc-300">{report.clientReadySummary}</p>
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-black p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Before / After Line</p>
            <p className="mt-2 text-sm leading-6 text-zinc-400">{report.beforeAfterLine}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Export Readiness</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          {report.exportReadiness.map((item) => (
            <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">{item}</div>
          ))}
        </div>
      </div>
    </Panel>
  );
}






function V42ReportQualityGatePanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const gate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V4.2 Report Quality Gate"
      subtitle="Checks whether the smarter humanization report is ready for producer review, client sharing, or another setup pass."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V4.2.7: <span className="font-semibold text-zinc-100">Quality Gate</span></div>}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Report Readiness</p>
          <h3 className="mt-3 text-3xl font-semibold text-zinc-100">{gate.score}/100</h3>
          <p className="mt-3 text-lg font-semibold text-zinc-200">{gate.label}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-500">{gate.recommendation}</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-black p-5 lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Quality Checks</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {gate.checks.map((check) => (
              <div key={check.label} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-sm font-semibold text-zinc-100">{check.passed ? "PASS" : "REVIEW"} · {check.label}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{check.guidance}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Next Action</p>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {gate.missingItems.length ? gate.missingItems[0] : "Do a final producer read-through, then use the composed client summary as the clean report direction."}
        </p>
      </div>
    </Panel>
  );
}






function V42ReportOutputPackPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const pack = buildV42ReportOutputPack(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V4.2 Report Output Pack"
      subtitle="Packages the smarter report into three usable outputs: producer brief, client update, and revision checklist."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V4.2.8: <span className="font-semibold text-zinc-100">Report Output Pack</span></div>}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {pack.outputTypes.map((item) => (
          <article key={item.label} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Output</p>
            <h3 className="mt-3 text-xl font-semibold text-zinc-100">{item.label}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-500">{item.use}</p>
            <pre className="mt-4 max-h-72 overflow-auto whitespace-pre-wrap rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-5 text-zinc-300">{item.content}</pre>
          </article>
        ))}
      </div>
    </Panel>
  );
}






function V42FinalReportHandoffPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const handoff = buildV42FinalReportHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V4.2 Final Report Handoff"
      subtitle="Turns the smarter report pack into a final producer handoff check before export, delivery, or client sharing."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V4.2.9: <span className="font-semibold text-zinc-100">Final Handoff</span></div>}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Handoff Status</p>
          <h3 className="mt-3 text-3xl font-semibold text-zinc-100">{handoff.handoffScore}/100</h3>
          <p className="mt-3 text-lg font-semibold text-zinc-200">{handoff.handoffStatus}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-500">{handoff.finalRecommendation}</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-black p-5 lg:col-span-2">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Final Handoff Steps</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {handoff.handoffSteps.map((step) => (
              <div key={step.label} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-sm font-semibold text-zinc-100">{step.done ? "READY" : "REVIEW"} · {step.label}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{step.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Final Outputs</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {handoff.finalOutputs.map((item) => (
            <div key={item} className="rounded-2xl border border-zinc-800 bg-black p-4 text-sm font-semibold text-zinc-200">{item}</div>
          ))}
        </div>
      </div>
    </Panel>
  );
}






function V42ReportExportManifestPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const manifest = buildV42ReportExportManifest(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V4.2 Report Export Manifest"
      subtitle="Maps the smarter report into clear export-ready deliverables so the producer knows exactly what files or notes to prepare."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V4.2.10: <span className="font-semibold text-zinc-100">Export Manifest</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Export Pack</p>
        <h3 className="mt-3 text-xl font-semibold text-zinc-100">{manifest.reportTitle}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Ready outputs: {manifest.readyCount}/{manifest.totalItems}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-500">{manifest.exportRecommendation}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {manifest.manifestItems.map((item) => (
          <article key={item.fileLabel} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{item.ready ? "Ready" : "Review"}</p>
            <h3 className="mt-3 font-semibold text-zinc-100">{item.fileLabel}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{item.purpose}</p>
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-black p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Suggested Filename</p>
              <p className="mt-2 break-all text-xs leading-5 text-zinc-300">{item.suggestedFilename}</p>
              <p className="mt-3 text-xs leading-5 text-zinc-500">Source: {item.source}</p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}






function V42ReportControlCenterPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const center = buildV42ReportControlCenter(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V4.2 Report Control Center"
      subtitle="Condenses the smarter report system into one practical status view: route, quality, handoff, exports, and next move."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V4.2.11: <span className="font-semibold text-zinc-100">Report Control</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Current Status</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{center.statusLabel}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">Recommended output: {center.recommendedOutput}</p>
        <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Next Move</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{center.nextMove}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        {center.controlCards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{card.label}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{card.value}</h3>
            <p className="mt-3 text-xs leading-5 text-zinc-500">{card.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Review Warnings</p>
          <div className="mt-4 space-y-3">
            {(center.warnings.length ? center.warnings : ["No major warnings detected."]).map((item) => (
              <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm leading-6 text-zinc-300">{item}</div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Client Update Preview</p>
          <p className="mt-4 text-sm leading-6 text-zinc-300">{center.clientUpdatePreview}</p>
        </div>
      </div>
    </Panel>
  );
}


function buildV50ProductDashboardSummary(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const reportControl = buildV42ReportControlCenter(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const reportContext = buildV42ReportContext(projectSession, reviewMode, activeAnalysis);
  const smartReport = buildV42SmartReportComposer(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const workflowSteps = [
    {
      label: "Start Project",
      status: projectSession?.projectName ? "Ready" : "Needs intake",
      note: projectSession?.projectName ? `Project: ${projectSession.projectName}` : "Add project name and client goal.",
    },
    {
      label: "Analyze Audio",
      status: activeAnalysis && activeAnalysis.status === "Ready" ? "Ready" : "Waiting",
      note: activeAnalysis && activeAnalysis.status === "Ready" ? "Audio analysis is available." : "Upload audio or load a demo preset.",
    },
    {
      label: "Review Report",
      status: reportControl.statusLabel,
      note: reportControl.nextMove,
    },
    {
      label: "Prepare Output",
      status: reportControl.recommendedOutput,
      note: "Use the strongest output for the current project state.",
    },
  ];

  return {
    version: "v5.0",
    feature: "Product Dashboard Preview",
    headline: "Simple experience on top. Complex intelligence underneath.",
    currentRoute: reportContext.reportPath,
    currentGenre: reportContext.genreFocus,
    mainRecommendation: reportControl.nextMove,
    recommendedOutput: reportControl.recommendedOutput,
    reportTitle: smartReport.reportTitle,
    workflowSteps,
    primaryActions: [
      "Upload or choose a demo",
      "Review the summary",
      "Open details only when needed",
      "Export the right client or producer output",
    ],
  };
}

function buildV50ProductDashboardText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const dashboard = buildV50ProductDashboardSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.0 PRODUCT DASHBOARD PREVIEW",
    "",
    dashboard.headline,
    "",
    `Report: ${dashboard.reportTitle}`,
    `Route: ${dashboard.currentRoute}`,
    `Genre: ${dashboard.currentGenre}`,
    `Recommended output: ${dashboard.recommendedOutput}`,
    "",
    "MAIN RECOMMENDATION",
    dashboard.mainRecommendation,
    "",
    "WORKFLOW",
    ...dashboard.workflowSteps.map((step, index) => `${index + 1}. ${step.label} — ${step.status}: ${step.note}`),
    "",
    "PRIMARY ACTIONS",
    ...dashboard.primaryActions.map((action) => `- ${action}`),
  ].join(newline);
}

function V50ProductDashboardPreviewPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const dashboard = buildV50ProductDashboardSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.0 Product Dashboard Preview"
      subtitle="The first V5 step: stop presenting SoulFrame as one long technical scroll and start shaping it into a cleaner product dashboard."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.0.1: <span className="font-semibold text-zinc-100">Product Dashboard</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Product Direction</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{dashboard.headline}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">V5 starts by turning the existing intelligence layers into a calmer workflow: start, analyze, review, prepare output.</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {dashboard.workflowSteps.map((step, index) => (
          <article key={step.label} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Step {index + 1}</p>
            <h3 className="mt-3 font-semibold text-zinc-100">{step.label}</h3>
            <p className="mt-3 text-sm font-semibold text-zinc-300">{step.status}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{step.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Dashboard Summary</p>
          <h3 className="mt-3 text-xl font-semibold text-zinc-100">{dashboard.reportTitle}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Route: {dashboard.currentRoute}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Genre: {dashboard.currentGenre}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Recommended output: {dashboard.recommendedOutput}</p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Next Move</p>
          <p className="mt-3 text-sm leading-6 text-zinc-300">{dashboard.mainRecommendation}</p>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {dashboard.primaryActions.map((action) => (
              <div key={action} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">{action}</div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}


function buildV50ProductNavigationBlueprint(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const dashboard = buildV50ProductDashboardSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const reportControl = buildV42ReportControlCenter(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const navItems = [
    {
      label: "Dashboard",
      purpose: "Show the simple project overview, next move, and recommended output.",
      status: "Primary",
      visibleByDefault: true,
    },
    {
      label: "Analyze",
      purpose: "Keep upload, waveform, metadata, and audio health checks in one focused area.",
      status: activeAnalysis && activeAnalysis.status === "Ready" ? "Ready" : "Waiting",
      visibleByDefault: true,
    },
    {
      label: "Report",
      purpose: "Group V4 and V4.2 intelligence into one smarter report workspace.",
      status: reportControl.statusLabel,
      visibleByDefault: true,
    },
    {
      label: "Output",
      purpose: "Place producer brief, client update, revision checklist, and export manifest together.",
      status: dashboard.recommendedOutput,
      visibleByDefault: true,
    },
    {
      label: "Advanced",
      purpose: "Move deeper technical panels, architecture notes, and internal checks out of the main scroll.",
      status: "Collapsed",
      visibleByDefault: false,
    },
  ];

  return {
    version: "v5.0",
    feature: "Product Navigation Blueprint",
    goal: "Turn the long prototype scroll into a calmer tab-style product structure.",
    recommendedDefaultTab: "Dashboard",
    navItems,
    simplifiedFlow: navItems.filter((item) => item.visibleByDefault).map((item) => item.label),
    advancedFlow: navItems.filter((item) => !item.visibleByDefault).map((item) => item.label),
    productRule: "Show only what the user needs first. Keep deeper intelligence available, but not always visible.",
  };
}

function buildV50ProductNavigationText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const blueprint = buildV50ProductNavigationBlueprint(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.0 PRODUCT NAVIGATION BLUEPRINT",
    "",
    `Goal: ${blueprint.goal}`,
    `Default tab: ${blueprint.recommendedDefaultTab}`,
    "",
    "MAIN FLOW",
    ...blueprint.simplifiedFlow.map((item, index) => `${index + 1}. ${item}`),
    "",
    "ADVANCED FLOW",
    ...blueprint.advancedFlow.map((item) => `- ${item}`),
    "",
    "NAVIGATION ITEMS",
    ...blueprint.navItems.map((item) => `- ${item.label}: ${item.purpose} Status: ${item.status}`),
    "",
    "PRODUCT RULE",
    blueprint.productRule,
  ].join(newline);
}

function V50ProductNavigationBlueprintPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const blueprint = buildV50ProductNavigationBlueprint(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.0 Product Navigation Blueprint"
      subtitle="Defines how SoulFrame can move from a long stacked prototype into a cleaner tabbed product experience."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.0.2: <span className="font-semibold text-zinc-100">Product Navigation</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Navigation Goal</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{blueprint.goal}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{blueprint.productRule}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {blueprint.navItems.map((item) => (
          <article key={item.label} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{item.visibleByDefault ? "Main" : "Hidden First"}</p>
            <h3 className="mt-3 font-semibold text-zinc-100">{item.label}</h3>
            <p className="mt-3 text-sm font-semibold text-zinc-300">{item.status}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{item.purpose}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Simplified Main Flow</p>
          <div className="mt-4 space-y-3">
            {blueprint.simplifiedFlow.map((item, index) => (
              <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
                {index + 1}. {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Advanced Area</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">Technical details stay available, but move out of the first-time user path.</p>
          <div className="mt-4 space-y-3">
            {blueprint.advancedFlow.map((item) => (
              <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">{item}</div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}


function buildV50ProgressiveDisclosureMap(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const dashboard = buildV50ProductDashboardSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const navigation = buildV50ProductNavigationBlueprint(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const qualityGate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const visibleFirst = [
    {
      label: "Project Status",
      reason: "The user needs to know where they are before seeing technical detail.",
      source: "V5 Dashboard",
    },
    {
      label: "Next Move",
      reason: "The app should lead with the single most useful action.",
      source: dashboard.mainRecommendation,
    },
    {
      label: "Recommended Output",
      reason: "The user should know whether to use a Producer Brief, Client Update, or Revision Checklist.",
      source: dashboard.recommendedOutput,
    },
    {
      label: "Upload / Analyze",
      reason: activeAnalysis && activeAnalysis.status === "Ready" ? "Analysis is ready, so this can become a compact status card." : "Audio is not ready, so upload guidance should stay visible.",
      source: activeAnalysis && activeAnalysis.status === "Ready" ? "Ready" : "Waiting",
    },
  ];

  const collapsedByDefault = [
    {
      label: "V4 Audio Intelligence Details",
      reason: "Useful for producers, but too dense for the first screen.",
    },
    {
      label: "V4.1 Backend/API Architecture",
      reason: "Important for development, but not necessary for most product users.",
    },
    {
      label: "V4.2 Report Subsystems",
      reason: "Router, genre guidance, quality gate, manifest, and handoff should feed the dashboard instead of appearing as a long stack.",
    },
    {
      label: "Internal Self-Tests",
      reason: "Useful for confidence, but should sit inside an advanced/developer area.",
    },
  ];

  const revealRules = [
    {
      trigger: "User wants detail",
      behavior: "Open the relevant panel from the dashboard instead of forcing it into the main scroll.",
    },
    {
      trigger: "Report quality is below 60",
      behavior: "Reveal missing setup steps and quality warnings first.",
    },
    {
      trigger: "Before / After mode is active",
      behavior: "Reveal comparison explanation and client-safe before/after line.",
    },
    {
      trigger: "Export is requested",
      behavior: "Reveal output pack, export manifest, and final handoff only at the end of the workflow.",
    },
  ];

  return {
    version: "v5.0",
    feature: "Progressive Disclosure Layout",
    goal: "Reduce the long-scroll feeling by showing summary first and revealing deeper intelligence only when needed.",
    recommendedLayout: navigation.simplifiedFlow,
    qualityStatus: `${qualityGate.label} (${qualityGate.score}/100)`,
    visibleFirst,
    collapsedByDefault,
    revealRules,
    productPrinciple: "Do not delete the intelligence. Hide complexity until it helps the user.",
  };
}

function buildV50ProgressiveDisclosureText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const map = buildV50ProgressiveDisclosureMap(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.0 PROGRESSIVE DISCLOSURE LAYOUT",
    "",
    `Goal: ${map.goal}`,
    `Quality status: ${map.qualityStatus}`,
    "",
    "VISIBLE FIRST",
    ...map.visibleFirst.map((item) => `- ${item.label}: ${item.reason}`),
    "",
    "COLLAPSED BY DEFAULT",
    ...map.collapsedByDefault.map((item) => `- ${item.label}: ${item.reason}`),
    "",
    "REVEAL RULES",
    ...map.revealRules.map((item) => `- ${item.trigger}: ${item.behavior}`),
    "",
    "PRODUCT PRINCIPLE",
    map.productPrinciple,
  ].join(newline);
}

function V50ProgressiveDisclosurePanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const map = buildV50ProgressiveDisclosureMap(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.0 Progressive Disclosure Layout"
      subtitle="Defines what should appear first, what should collapse, and when deeper SoulFrame intelligence should be revealed."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.0.3: <span className="font-semibold text-zinc-100">Progressive Layout</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Product Principle</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{map.productPrinciple}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{map.goal}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Visible First</p>
          <div className="mt-4 space-y-3">
            {map.visibleFirst.map((item) => (
              <div key={item.label} className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-sm font-semibold text-zinc-100">{item.label}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{item.reason}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-600">Source: {item.source}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Collapsed By Default</p>
          <div className="mt-4 space-y-3">
            {map.collapsedByDefault.map((item) => (
              <div key={item.label} className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-sm font-semibold text-zinc-100">{item.label}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Reveal Rules</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          {map.revealRules.map((rule) => (
            <div key={rule.trigger} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-sm font-semibold text-zinc-100">{rule.trigger}</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{rule.behavior}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}


function buildV50TabbedWorkflowShell(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const navigation = buildV50ProductNavigationBlueprint(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const disclosure = buildV50ProgressiveDisclosureMap(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const dashboard = buildV50ProductDashboardSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      role: "Default landing view",
      summary: "Shows project status, next move, and recommended output.",
      shouldShowFirst: true,
      contentSource: "V5 dashboard summary",
    },
    {
      id: "analyze",
      label: "Analyze",
      role: "Audio review workspace",
      summary: activeAnalysis && activeAnalysis.status === "Ready"
        ? "Audio analysis is ready and can be shown as compact cards."
        : "Upload and demo guidance should remain visible until analysis is ready.",
      shouldShowFirst: true,
      contentSource: "Audio upload, metadata, waveform, health check, and V4 audio intelligence",
    },
    {
      id: "report",
      label: "Report",
      role: "Humanization intelligence workspace",
      summary: "Groups report route, genre guidance, path-specific sections, client tone, and report composer.",
      shouldShowFirst: true,
      contentSource: "V4.2 smarter report system",
    },
    {
      id: "output",
      label: "Output",
      role: "Export and delivery workspace",
      summary: `Prioritizes the ${dashboard.recommendedOutput} based on the current report state.`,
      shouldShowFirst: true,
      contentSource: "Output pack, handoff, export manifest, and client update",
    },
    {
      id: "advanced",
      label: "Advanced",
      role: "Developer and technical detail workspace",
      summary: "Keeps backend/API scaffold, internal checks, and deeper diagnostic panels available without dominating the user flow.",
      shouldShowFirst: false,
      contentSource: "V4.1 backend scaffold, internal tests, architecture notes, and technical panels",
    },
  ];

  return {
    version: "v5.0",
    feature: "Tabbed Workflow Shell",
    defaultTab: navigation.recommendedDefaultTab,
    productGoal: "Convert the prototype into a tab-style workflow without removing the intelligence already built.",
    dashboardHeadline: dashboard.headline,
    disclosurePrinciple: disclosure.productPrinciple,
    tabs,
    firstUserPath: tabs.filter((tab) => tab.shouldShowFirst).map((tab) => tab.label),
    hiddenUntilNeeded: tabs.filter((tab) => !tab.shouldShowFirst).map((tab) => tab.label),
  };
}

function buildV50TabbedWorkflowText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const shell = buildV50TabbedWorkflowShell(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.0 TABBED WORKFLOW SHELL",
    "",
    `Default tab: ${shell.defaultTab}`,
    `Product goal: ${shell.productGoal}`,
    "",
    "FIRST USER PATH",
    ...shell.firstUserPath.map((item, index) => `${index + 1}. ${item}`),
    "",
    "HIDDEN UNTIL NEEDED",
    ...shell.hiddenUntilNeeded.map((item) => `- ${item}`),
    "",
    "TABS",
    ...shell.tabs.map((tab) => `- ${tab.label}: ${tab.role} — ${tab.summary}`),
    "",
    "DISCLOSURE PRINCIPLE",
    shell.disclosurePrinciple,
  ].join(newline);
}

function V50TabbedWorkflowShellPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const shell = buildV50TabbedWorkflowShell(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.0 Tabbed Workflow Shell"
      subtitle="Maps SoulFrame into a future tab-style product structure so users are guided through the workflow instead of scrolling through every system at once."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.0.4: <span className="font-semibold text-zinc-100">Tabbed Workflow</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Shell Goal</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{shell.productGoal}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{shell.dashboardHeadline}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
        {shell.tabs.map((tab) => (
          <article key={tab.id} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{tab.shouldShowFirst ? "Main Tab" : "Advanced Tab"}</p>
            <h3 className="mt-3 font-semibold text-zinc-100">{tab.label}</h3>
            <p className="mt-3 text-sm font-semibold text-zinc-300">{tab.role}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{tab.summary}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">First User Path</p>
          <div className="mt-4 space-y-3">
            {shell.firstUserPath.map((item, index) => (
              <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">
                {index + 1}. {item}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Hidden Until Needed</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{shell.disclosurePrinciple}</p>
          <div className="mt-4 space-y-3">
            {shell.hiddenUntilNeeded.map((item) => (
              <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">{item}</div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}


function buildV50CleanDashboardPrioritySummary(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const dashboard = buildV50ProductDashboardSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const reportControl = buildV42ReportControlCenter(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const qualityGate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const handoff = buildV42FinalReportHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const context = buildV42ReportContext(projectSession, reviewMode, activeAnalysis);

  let mainStatus = "Waiting for audio";
  if (activeAnalysis && activeAnalysis.status === "Ready" && qualityGate.score >= 85) {
    mainStatus = "Client-ready after final read-through";
  } else if (activeAnalysis && activeAnalysis.status === "Ready" && qualityGate.score >= 60) {
    mainStatus = "Producer-ready";
  } else if (activeAnalysis && activeAnalysis.status === "Ready") {
    mainStatus = "Needs report setup";
  }

  const priorityCards = [
    {
      label: "Main Status",
      value: mainStatus,
      detail: reportControl.nextMove,
    },
    {
      label: "Report Path",
      value: context.reportPath,
      detail: `Genre focus: ${context.genreFocus}`,
    },
    {
      label: "Quality",
      value: `${qualityGate.score}/100`,
      detail: qualityGate.label,
    },
    {
      label: "Handoff",
      value: `${handoff.handoffScore}/100`,
      detail: handoff.handoffStatus,
    },
  ];

  const cleanSummaryLines = [
    `Status: ${mainStatus}`,
    `Next move: ${reportControl.nextMove}`,
    `Recommended output: ${dashboard.recommendedOutput}`,
    `Route: ${context.reportPath}`,
  ];

  return {
    version: "v5.0",
    feature: "Clean Dashboard Priority Summary",
    headline: mainStatus,
    subheadline: dashboard.headline,
    nextMove: reportControl.nextMove,
    recommendedOutput: dashboard.recommendedOutput,
    priorityCards,
    cleanSummaryLines,
    displayRule: "The dashboard should show a small set of priority cards first, then let the user open deeper report sections only when needed.",
  };
}

function buildV50CleanDashboardPriorityText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const summary = buildV50CleanDashboardPrioritySummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.0 CLEAN DASHBOARD PRIORITY SUMMARY",
    "",
    `Headline: ${summary.headline}`,
    `Recommended output: ${summary.recommendedOutput}`,
    "",
    "CLEAN SUMMARY",
    ...summary.cleanSummaryLines.map((line) => `- ${line}`),
    "",
    "PRIORITY CARDS",
    ...summary.priorityCards.map((card) => `- ${card.label}: ${card.value} — ${card.detail}`),
    "",
    "DISPLAY RULE",
    summary.displayRule,
  ].join(newline);
}

function V50CleanDashboardPriorityPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const summary = buildV50CleanDashboardPrioritySummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.0 Clean Dashboard Priority Summary"
      subtitle="Condenses the app into a small set of high-value cards so the first screen feels calm, useful, and product-ready."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.0.5: <span className="font-semibold text-zinc-100">Clean Summary</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Dashboard Headline</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{summary.headline}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{summary.nextMove}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        {summary.priorityCards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{card.label}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{card.value}</h3>
            <p className="mt-3 text-xs leading-5 text-zinc-500">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Clean Summary Lines</p>
          <div className="mt-4 space-y-3">
            {summary.cleanSummaryLines.map((line) => (
              <div key={line} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-sm text-zinc-300">{line}</div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Recommended Output</p>
          <h3 className="mt-3 text-xl font-semibold text-zinc-100">{summary.recommendedOutput}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{summary.displayRule}</p>
        </div>
      </div>
    </Panel>
  );
}


function buildV50AdvancedPanelCollapseStrategy(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const navigation = buildV50ProductNavigationBlueprint(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const disclosure = buildV50ProgressiveDisclosureMap(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const qualityGate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const advancedGroups = [
    {
      group: "Audio Intelligence Details",
      panels: [
        "Frequency Balance Insight",
        "Listening Priority Stack",
        "Revision Move Suggestions",
        "Humanization Confidence",
        "Analysis Stack Overview",
      ],
      defaultState: qualityGate.score < 60 ? "Open when troubleshooting" : "Collapsed",
      reason: "Useful for production decisions, but too detailed for the first screen.",
    },
    {
      group: "Report Subsystems",
      panels: [
        "Report Router",
        "Genre-Aware Recommendations",
        "Path-Specific Report Builder",
        "Client Tone Drafts",
        "Before/After Explanation",
        "Quality Gate",
        "Export Manifest",
      ],
      defaultState: "Collapsed into Report tab",
      reason: "These systems should feed the composed report instead of appearing as separate long-scroll blocks.",
    },
    {
      group: "Backend/API Planning",
      panels: [
        "Backend Architecture Scaffold",
        "Analysis Engine Separation Plan",
        "Mock API Response Layer",
        "Frontend API Adapter",
      ],
      defaultState: "Advanced only",
      reason: "Important for development, but not part of the main user journey.",
    },
    {
      group: "Developer / Safety Checks",
      panels: [
        "Internal Self-Tests",
        "Demo Readiness",
        "Launch Checklist",
        "Roadmap Preview",
      ],
      defaultState: "Advanced only",
      reason: "Helpful for maintaining confidence, but should not distract public demo visitors.",
    },
  ];

  const collapseRules = [
    {
      rule: "Show the dashboard first",
      detail: "The first view should communicate status, next move, and recommended output.",
    },
    {
      rule: "Collapse details after summary",
      detail: "Technical explanations should sit behind View Details, tabs, or Advanced sections.",
    },
    {
      rule: "Open advanced panels only with a reason",
      detail: "Reveal deeper panels when quality is low, the user asks for detail, or export is being prepared.",
    },
    {
      rule: "Keep the intelligence connected",
      detail: "Collapsed panels should still feed summaries, report composer, quality gate, and output pack.",
    },
  ];

  return {
    version: "v5.0",
    feature: "Advanced Panel Collapse Strategy",
    goal: "Preserve SoulFrame's deeper systems while preventing the app from feeling like a never-ending technical document.",
    mainNavigation: navigation.simplifiedFlow,
    disclosurePrinciple: disclosure.productPrinciple,
    advancedGroups,
    collapseRules,
    recommendedAdvancedLabel: "Advanced Details",
    productOutcome: "The user sees a clean workflow first, while producers and developers can still inspect the deeper layers when needed.",
  };
}

function buildV50AdvancedPanelCollapseText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const strategy = buildV50AdvancedPanelCollapseStrategy(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.0 ADVANCED PANEL COLLAPSE STRATEGY",
    "",
    `Goal: ${strategy.goal}`,
    `Advanced label: ${strategy.recommendedAdvancedLabel}`,
    "",
    "ADVANCED GROUPS",
    ...strategy.advancedGroups.flatMap((group) => [
      `- ${group.group}`,
      `  Default: ${group.defaultState}`,
      `  Reason: ${group.reason}`,
      `  Panels: ${group.panels.join(", ")}`,
    ]),
    "",
    "COLLAPSE RULES",
    ...strategy.collapseRules.map((item) => `- ${item.rule}: ${item.detail}`),
    "",
    "PRODUCT OUTCOME",
    strategy.productOutcome,
  ].join(newline);
}

function V50AdvancedPanelCollapseStrategyPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const strategy = buildV50AdvancedPanelCollapseStrategy(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.0 Advanced Panel Collapse Strategy"
      subtitle="Defines how SoulFrame can keep all deeper intelligence while making the public product feel simpler and less crowded."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.0.6: <span className="font-semibold text-zinc-100">Advanced Collapse</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Collapse Goal</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{strategy.goal}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{strategy.productOutcome}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {strategy.advancedGroups.map((group) => (
          <article key={group.group} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{group.defaultState}</p>
            <h3 className="mt-3 font-semibold text-zinc-100">{group.group}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-500">{group.reason}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {group.panels.map((panel) => (
                <span key={panel} className="rounded-full border border-zinc-800 bg-black px-3 py-1 text-xs text-zinc-400">{panel}</span>
              ))}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Collapse Rules</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          {strategy.collapseRules.map((item) => (
            <div key={item.rule} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-sm font-semibold text-zinc-100">{item.rule}</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}


function buildV50PublicBetaUxHandoff(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const dashboard = buildV50ProductDashboardSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const navigation = buildV50ProductNavigationBlueprint(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const progressive = buildV50ProgressiveDisclosureMap(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const tabbedShell = buildV50TabbedWorkflowShell(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const cleanSummary = buildV50CleanDashboardPrioritySummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const collapseStrategy = buildV50AdvancedPanelCollapseStrategy(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const betaReadinessChecks = [
    {
      label: "Clear first screen",
      ready: cleanSummary.priorityCards.length === 4,
      note: "The product has a dashboard summary direction with a small number of priority cards.",
    },
    {
      label: "Simple workflow path",
      ready: navigation.simplifiedFlow.length >= 4,
      note: "The main flow is defined as Dashboard, Analyze, Report, and Output.",
    },
    {
      label: "Tabbed product shell",
      ready: tabbedShell.tabs.length >= 5,
      note: "The future layout can be shaped into Dashboard, Analyze, Report, Output, and Advanced.",
    },
    {
      label: "Complexity hidden by default",
      ready: progressive.collapsedByDefault.length >= 3 && collapseStrategy.advancedGroups.length >= 3,
      note: "Advanced panels can be grouped and collapsed instead of shown as one long stack.",
    },
    {
      label: "Actionable next move",
      ready: Boolean(dashboard.mainRecommendation),
      note: "The dashboard can lead with one practical next action.",
    },
    {
      label: "Human-led final review",
      ready: true,
      note: "V5 keeps the producer as the final decision-maker before client sharing or export.",
    },
  ];

  const readyCount = betaReadinessChecks.filter((check) => check.ready).length;
  const readinessScore = Math.round((readyCount / betaReadinessChecks.length) * 100);

  const finalUxDirection = [
    "Keep the first screen calm and summary-led.",
    "Move the long report stack into tabs or collapsible sections.",
    "Show the recommended output before showing every technical panel.",
    "Keep Advanced available for producers and developers, but not as the default user path.",
    "Treat V5 as a product simplification milestone, not a feature-bloat milestone.",
  ];

  return {
    version: "v5.0",
    feature: "Public Beta UX Handoff",
    readinessScore,
    readyCount,
    totalChecks: betaReadinessChecks.length,
    status: readinessScore >= 85 ? "Ready for V5 release prep" : readinessScore >= 60 ? "Needs one UX cleanup pass" : "Needs more product structure",
    betaReadinessChecks,
    finalUxDirection,
    recommendedNextMilestone: "V5.0 README update, release notes, merge, tag, and then pause before any real layout refactor.",
    releasePositioning: "V5.0 turns SoulFrame from a feature-heavy prototype into a clearer product direction for public beta presentation.",
  };
}

function buildV50PublicBetaUxHandoffText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const handoff = buildV50PublicBetaUxHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.0 PUBLIC BETA UX HANDOFF",
    "",
    `Status: ${handoff.status}`,
    `Readiness: ${handoff.readinessScore}/100`,
    `Checks ready: ${handoff.readyCount}/${handoff.totalChecks}`,
    "",
    "RELEASE POSITIONING",
    handoff.releasePositioning,
    "",
    "FINAL UX DIRECTION",
    ...handoff.finalUxDirection.map((item, index) => `${index + 1}. ${item}`),
    "",
    "READINESS CHECKS",
    ...handoff.betaReadinessChecks.map((check) => `- ${check.ready ? "READY" : "REVIEW"}: ${check.label} — ${check.note}`),
    "",
    "NEXT MILESTONE",
    handoff.recommendedNextMilestone,
  ].join(newline);
}

function V50PublicBetaUxHandoffPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const handoff = buildV50PublicBetaUxHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.0 Public Beta UX Handoff"
      subtitle="Wraps the V5 simplification direction into a release-ready product UX handoff before README, merge, tag, and release."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.0.7: <span className="font-semibold text-zinc-100">Beta UX Handoff</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">V5 Release Readiness</p>
        <h3 className="mt-3 text-3xl font-semibold text-zinc-100">{handoff.readinessScore}/100</h3>
        <p className="mt-3 text-lg font-semibold text-zinc-200">{handoff.status}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-500">{handoff.releasePositioning}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Final UX Direction</p>
          <div className="mt-4 space-y-3">
            {handoff.finalUxDirection.map((item, index) => (
              <div key={item} className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Direction {index + 1}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Beta Readiness Checks</p>
          <div className="mt-4 space-y-3">
            {handoff.betaReadinessChecks.map((check) => (
              <div key={check.label} className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="text-sm font-semibold text-zinc-100">{check.ready ? "READY" : "REVIEW"} · {check.label}</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">{check.note}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Recommended Next Milestone</p>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{handoff.recommendedNextMilestone}</p>
      </div>
    </Panel>
  );
}


function buildV51DashboardShellState(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const dashboard = buildV50CleanDashboardPrioritySummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const tabbedShell = buildV50TabbedWorkflowShell(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;

  const tabs = [
    {
      id: "dashboard",
      label: "Dashboard",
      purpose: "Show the calm project overview, status, next move, and recommended output.",
      ready: true,
    },
    {
      id: "analyze",
      label: "Analyze",
      purpose: "Keep project intake, upload, waveform, metadata, and audio health in one workspace.",
      ready: !!activeAnalysis && activeAnalysis.status === "Ready",
    },
    {
      id: "report",
      label: "Report",
      purpose: "Show the smarter humanization report without forcing every subsystem into the first screen.",
      ready: dashboard.priorityCards.some((card) => card.label === "Quality"),
    },
    {
      id: "output",
      label: "Output",
      purpose: "Group producer brief, client update, checklist, handoff, and export readiness.",
      ready: Boolean(dashboard.recommendedOutput),
    },
    {
      id: "advanced",
      label: "Advanced",
      purpose: "Keep backend/API planning and deeper technical systems available but out of the default path.",
      ready: true,
    },
  ];

  return {
    version: "v5.1",
    feature: "Dashboard Layout Shell",
    defaultTab: "dashboard",
    currentSummary: dashboard.headline,
    recommendedOutput: dashboard.recommendedOutput,
    tabCount: tabs.length,
    tabs,
    productShift: "V5.1 starts turning the V5 product plan into a real dashboard-first app shell.",
    layoutRule: tabbedShell.disclosurePrinciple || "Show the workflow first and reveal deeper systems only when needed.",
  };
}

function buildV51DashboardShellText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const shell = buildV51DashboardShellState(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.1 DASHBOARD LAYOUT SHELL",
    "",
    `Feature: ${shell.feature}`,
    `Default tab: ${shell.defaultTab}`,
    `Tabs: ${shell.tabCount}`,
    `Current summary: ${shell.currentSummary}`,
    `Recommended output: ${shell.recommendedOutput}`,
    "",
    "PRODUCT SHIFT",
    shell.productShift,
    "",
    "TABS",
    ...shell.tabs.map((tab) => `- ${tab.label}: ${tab.purpose} Ready: ${tab.ready ? "Yes" : "No"}`),
    "",
    "LAYOUT RULE",
    shell.layoutRule,
  ].join(newline);
}

function buildV51WorkspaceHeaderState(activeTab = "dashboard", projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const shell = buildV51DashboardShellState(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const dashboard = buildV50CleanDashboardPrioritySummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const reportControl = buildV42ReportControlCenter(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const tabCopy = {
    dashboard: {
      eyebrow: "Project Overview",
      title: dashboard.headline,
      description: "Start with the cleanest summary before opening deeper SoulFrame systems.",
      primaryAction: dashboard.recommendedOutput,
    },
    analyze: {
      eyebrow: "Audio Workspace",
      title: "Analyze the track",
      description: "Use this space for intake, upload, waveform, metadata, and core audio review.",
      primaryAction: "Run or review analysis",
    },
    report: {
      eyebrow: "Report Workspace",
      title: "Review the humanization direction",
      description: "Use V4.2 report intelligence without making the first screen feel crowded.",
      primaryAction: reportControl.recommendedOutput,
    },
    output: {
      eyebrow: "Delivery Workspace",
      title: "Prepare the right output",
      description: "Group client update, producer brief, checklist, handoff, and export readiness.",
      primaryAction: dashboard.recommendedOutput,
    },
    advanced: {
      eyebrow: "Advanced Details",
      title: "Inspect deeper systems",
      description: "Keep backend/API planning, internal logic, and technical panels available when needed.",
      primaryAction: "Open technical details",
    },
  };

  const current = tabCopy[activeTab] || tabCopy.dashboard;

  return {
    version: "v5.1",
    feature: "Focused Workspace Header",
    activeTab,
    tabLabel: shell.tabs.find((tab) => tab.id === activeTab)?.label || "Dashboard",
    tabCount: shell.tabCount,
    ...current,
    helperLine: "Each tab now gets its own focused heading so SoulFrame feels less like a long scroll and more like a guided product workspace.",
  };
}

function buildV51WorkspaceHeaderText(activeTab = "dashboard", projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const header = buildV51WorkspaceHeaderState(activeTab, projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.1 FOCUSED WORKSPACE HEADER",
    "",
    `Active tab: ${header.tabLabel}`,
    `Eyebrow: ${header.eyebrow}`,
    `Title: ${header.title}`,
    `Primary action: ${header.primaryAction}`,
    "",
    "DESCRIPTION",
    header.description,
    "",
    "HELPER LINE",
    header.helperLine,
  ].join(newline);
}

function buildV51DashboardActionCards(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const dashboard = buildV50CleanDashboardPrioritySummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const reportControl = buildV42ReportControlCenter(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const qualityGate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const cards = [
    {
      label: "Project",
      value: projectSession?.projectName || "Untitled project",
      detail: projectSession?.clientGoal || "Add a client goal to improve report routing.",
      action: "Review intake",
      targetTab: "analyze",
    },
    {
      label: "Audio",
      value: activeAnalysis && activeAnalysis.status === "Ready" ? "Analysis ready" : "Waiting for audio",
      detail: activeAnalysis && activeAnalysis.status === "Ready" ? "SoulFrame can now summarize the analysis." : "Upload audio or load a demo preset.",
      action: activeAnalysis && activeAnalysis.status === "Ready" ? "Open analysis" : "Add audio",
      targetTab: "analyze",
    },
    {
      label: "Report",
      value: qualityGate.label,
      detail: reportControl.nextMove,
      action: "Open report",
      targetTab: "report",
    },
    {
      label: "Output",
      value: dashboard.recommendedOutput,
      detail: "Use the output workspace when the producer direction is clear.",
      action: "Prepare output",
      targetTab: "output",
    },
  ];

  return {
    version: "v5.1",
    feature: "Dashboard Action Cards",
    headline: dashboard.headline,
    nextMove: reportControl.nextMove,
    recommendedOutput: dashboard.recommendedOutput,
    cards,
    layoutChange: "The dashboard now leads with four practical action cards instead of stacking multiple full report panels on the first screen.",
  };
}

function buildV51DashboardActionCardsText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const summary = buildV51DashboardActionCards(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.1 DASHBOARD ACTION CARDS",
    "",
    `Headline: ${summary.headline}`,
    `Recommended output: ${summary.recommendedOutput}`,
    "",
    "LAYOUT CHANGE",
    summary.layoutChange,
    "",
    "ACTION CARDS",
    ...summary.cards.map((card) => `- ${card.label}: ${card.value} — ${card.action} -> ${card.targetTab}`),
    "",
    "NEXT MOVE",
    summary.nextMove,
  ].join(newline);
}

function V51DashboardActionCardsPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis, setActiveTab }) {
  const summary = buildV51DashboardActionCards(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.1 Dashboard Action Cards"
      subtitle="Turns the Product dashboard into a practical first screen with clear next actions instead of a long stack of panels."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.1.3: <span className="font-semibold text-zinc-100">Action Cards</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Dashboard Focus</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{summary.headline}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{summary.nextMove}</p>
        <p className="mt-2 text-xs leading-5 text-zinc-600">{summary.layoutChange}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        {summary.cards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{card.label}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{card.value}</h3>
            <p className="mt-3 min-h-16 text-xs leading-5 text-zinc-500">{card.detail}</p>
            <button
              type="button"
              onClick={() => setActiveTab(card.targetTab)}
              className="mt-4 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
            >
              {card.action}
            </button>
          </article>
        ))}
      </div>
    </Panel>
  );
}


function buildV51AnalyzeWorkspaceSummary(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const draftReady = draftAnalysis && draftAnalysis.status === "Ready";
  const humanizedReady = humanizedAnalysis && humanizedAnalysis.status === "Ready";
  const context = buildV42ReportContext(projectSession, reviewMode, activeAnalysis);
  const qualityGate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const uploadState = reviewMode === "compare"
    ? draftReady && humanizedReady
      ? "Both versions ready"
      : draftReady || humanizedReady
        ? "Comparison incomplete"
        : "Waiting for both versions"
    : draftReady
      ? "Draft ready"
      : "Waiting for draft";

  const analysisCards = [
    {
      label: "Review Mode",
      value: reviewMode === "compare" ? "Before / After" : "Draft Review",
      detail: reviewMode === "compare" ? "Compare the AI draft against the humanized edit." : "Review one AI draft and prepare the next humanization direction.",
    },
    {
      label: "Upload State",
      value: uploadState,
      detail: activeAnalysis && activeAnalysis.status === "Ready" ? "Analysis data is available for the active version." : "Upload audio or load a demo preset to activate analysis.",
    },
    {
      label: "Report Route",
      value: context.reportPath,
      detail: `Genre focus: ${context.genreFocus}`,
    },
    {
      label: "Quality Preview",
      value: `${qualityGate.score}/100`,
      detail: qualityGate.label,
    },
  ];

  const nextAnalyzeAction = activeAnalysis && activeAnalysis.status === "Ready"
    ? "Review the analysis cards, then move to the Report tab for the smarter humanization direction."
    : "Use Project Intake and Upload Setup below to load a track or demo preset.";

  return {
    version: "v5.1",
    feature: "Focused Analyze Workspace",
    uploadState,
    nextAnalyzeAction,
    analysisCards,
    layoutChange: "The Analyze tab now starts with a compact status summary before showing intake, upload, waveform, and analysis controls.",
  };
}

function buildV51AnalyzeWorkspaceText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const summary = buildV51AnalyzeWorkspaceSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.1 FOCUSED ANALYZE WORKSPACE",
    "",
    `Upload state: ${summary.uploadState}`,
    "",
    "NEXT ANALYZE ACTION",
    summary.nextAnalyzeAction,
    "",
    "ANALYZE CARDS",
    ...summary.analysisCards.map((card) => `- ${card.label}: ${card.value} — ${card.detail}`),
    "",
    "LAYOUT CHANGE",
    summary.layoutChange,
  ].join(newline);
}

function V51FocusedAnalyzeWorkspacePanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis, setActiveTab }) {
  const summary = buildV51AnalyzeWorkspaceSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;

  return (
    <Panel
      title="V5.1 Focused Analyze Workspace"
      subtitle="Gives the Analyze tab a clearer status layer before the user reaches upload controls and technical analysis panels."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.1.4: <span className="font-semibold text-zinc-100">Analyze Workspace</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Analyze Status</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{summary.uploadState}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{summary.nextAnalyzeAction}</p>
        <p className="mt-2 text-xs leading-5 text-zinc-600">{summary.layoutChange}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        {summary.analysisCards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{card.label}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{card.value}</h3>
            <p className="mt-3 text-xs leading-5 text-zinc-500">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setActiveTab("report")}
          className="rounded-2xl border border-zinc-800 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!activeAnalysis || activeAnalysis.status !== "Ready"}
        >
          Continue to Report
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
        >
          Back to Dashboard
        </button>
      </div>
    </Panel>
  );
}


function buildV51ReportWorkspaceSummary(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const control = buildV42ReportControlCenter(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const composer = buildV42SmartReportComposer(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const qualityGate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const beforeAfter = buildV42BeforeAfterExplanation(draftAnalysis, humanizedAnalysis);
  const context = buildV42ReportContext(projectSession, reviewMode, activeAnalysis);

  const reportCards = [
    {
      label: "Route",
      value: context.reportPath,
      detail: `Genre focus: ${context.genreFocus}`,
    },
    {
      label: "Quality",
      value: `${qualityGate.score}/100`,
      detail: qualityGate.recommendation,
    },
    {
      label: "Composer",
      value: composer.reportTitle,
      detail: composer.confidenceLine,
    },
    {
      label: "Comparison",
      value: beforeAfter.improvementLabel,
      detail: beforeAfter.clientSafeLine,
    },
  ];

  const canContinueToOutput = qualityGate.score >= 35 || Boolean(control.recommendedOutput);

  return {
    version: "v5.1",
    feature: "Focused Report Workspace",
    headline: control.statusLabel,
    nextMove: control.nextMove,
    recommendedOutput: control.recommendedOutput,
    canContinueToOutput,
    reportCards,
    layoutChange: "The Report tab now starts with one focused report summary before showing the deeper composer, quality, comparison, workflow, and revision panels.",
  };
}

function buildV51ReportWorkspaceText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const summary = buildV51ReportWorkspaceSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.1 FOCUSED REPORT WORKSPACE",
    "",
    `Headline: ${summary.headline}`,
    `Recommended output: ${summary.recommendedOutput}`,
    `Can continue to output: ${summary.canContinueToOutput ? "Yes" : "No"}`,
    "",
    "NEXT MOVE",
    summary.nextMove,
    "",
    "REPORT CARDS",
    ...summary.reportCards.map((card) => `- ${card.label}: ${card.value} — ${card.detail}`),
    "",
    "LAYOUT CHANGE",
    summary.layoutChange,
  ].join(newline);
}

function V51FocusedReportWorkspacePanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis, setActiveTab }) {
  const summary = buildV51ReportWorkspaceSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.1 Focused Report Workspace"
      subtitle="Gives the Report tab a clean summary layer before the user opens the deeper report intelligence panels."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.1.5: <span className="font-semibold text-zinc-100">Report Workspace</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Report Status</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{summary.headline}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{summary.nextMove}</p>
        <p className="mt-2 text-xs leading-5 text-zinc-600">{summary.layoutChange}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        {summary.reportCards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{card.label}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{card.value}</h3>
            <p className="mt-3 text-xs leading-5 text-zinc-500">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setActiveTab("output")}
          className="rounded-2xl border border-zinc-800 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!summary.canContinueToOutput}
        >
          Continue to Output
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("analyze")}
          className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
        >
          Back to Analyze
        </button>
      </div>
    </Panel>
  );
}


function buildV51OutputWorkspaceSummary(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const outputPack = buildV42ReportOutputPack(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const handoff = buildV42FinalReportHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const manifest = buildV42ReportExportManifest(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const control = buildV42ReportControlCenter(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const outputCards = [
    {
      label: "Recommended",
      value: control.recommendedOutput,
      detail: control.nextMove,
    },
    {
      label: "Producer Brief",
      value: outputPack.producerBrief.length > 120 ? "Ready" : "Review",
      detail: "Internal direction for the next humanization pass.",
    },
    {
      label: "Client Update",
      value: outputPack.clientUpdate.length > 100 ? "Ready" : "Review",
      detail: "Client-safe message for explaining the revision direction.",
    },
    {
      label: "Export Pack",
      value: `${manifest.readyCount}/${manifest.totalItems}`,
      detail: manifest.exportRecommendation,
    },
  ];

  const canReturnToReport = true;
  const canReviewAdvanced = handoff.handoffScore >= 60 || manifest.readyCount > 0;

  return {
    version: "v5.1",
    feature: "Focused Output Workspace",
    headline: handoff.handoffStatus,
    handoffScore: handoff.handoffScore,
    finalRecommendation: handoff.finalRecommendation,
    canReturnToReport,
    canReviewAdvanced,
    outputCards,
    layoutChange: "The Output tab now starts with a delivery-focused summary before showing output pack, handoff, export manifest, and saved projects.",
  };
}

function buildV51OutputWorkspaceText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const summary = buildV51OutputWorkspaceSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.1 FOCUSED OUTPUT WORKSPACE",
    "",
    `Headline: ${summary.headline}`,
    `Handoff score: ${summary.handoffScore}/100`,
    "",
    "FINAL RECOMMENDATION",
    summary.finalRecommendation,
    "",
    "OUTPUT CARDS",
    ...summary.outputCards.map((card) => `- ${card.label}: ${card.value} — ${card.detail}`),
    "",
    "LAYOUT CHANGE",
    summary.layoutChange,
  ].join(newline);
}

function V51FocusedOutputWorkspacePanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis, setActiveTab }) {
  const summary = buildV51OutputWorkspaceSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.1 Focused Output Workspace"
      subtitle="Gives the Output tab a delivery-first summary before the user reaches report exports, handoff, manifest, and saved project tools."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.1.6: <span className="font-semibold text-zinc-100">Output Workspace</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Output Status</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{summary.headline}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{summary.finalRecommendation}</p>
        <p className="mt-2 text-xs leading-5 text-zinc-600">{summary.layoutChange}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        {summary.outputCards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{card.label}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{card.value}</h3>
            <p className="mt-3 text-xs leading-5 text-zinc-500">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setActiveTab("report")}
          className="rounded-2xl border border-zinc-800 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Back to Report
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("advanced")}
          className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!summary.canReviewAdvanced}
        >
          Review Advanced Details
        </button>
      </div>
    </Panel>
  );
}


function buildV51AdvancedWorkspaceSummary(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const collapseStrategy = buildV50AdvancedPanelCollapseStrategy(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const betaHandoff = buildV50PublicBetaUxHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const shell = buildV51DashboardShellState(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const advancedCards = [
    {
      label: "Collapse Plan",
      value: `${collapseStrategy.advancedGroups.length} groups`,
      detail: "Audio intelligence, report subsystems, backend/API planning, and developer checks are grouped away from the main workflow.",
    },
    {
      label: "Backend/API",
      value: "Mock only",
      detail: "V4.1 architecture remains browser-safe with no real server calls or audio uploads.",
    },
    {
      label: "Beta Readiness",
      value: `${betaHandoff.readinessScore}/100`,
      detail: betaHandoff.status,
    },
    {
      label: "Workspace Shell",
      value: `${shell.tabCount} tabs`,
      detail: "Dashboard, Analyze, Report, Output, and Advanced now form the main product layout.",
    },
  ];

  const advancedRules = [
    "Keep Advanced available for producers, developers, and deeper review.",
    "Do not make technical architecture the first thing a public visitor sees.",
    "Keep backend/API panels visible here until the real backend is implemented.",
    "Use Advanced as the home for product planning, diagnostics, and deeper explainability.",
  ];

  return {
    version: "v5.1",
    feature: "Focused Advanced Workspace",
    headline: "Advanced details are available without controlling the main user journey.",
    advancedCards,
    advancedRules,
    layoutChange: "The Advanced tab now has its own focused entry point instead of feeling like an overflow dump of every technical panel.",
  };
}

function buildV51AdvancedWorkspaceText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const summary = buildV51AdvancedWorkspaceSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.1 FOCUSED ADVANCED WORKSPACE",
    "",
    `Headline: ${summary.headline}`,
    "",
    "ADVANCED CARDS",
    ...summary.advancedCards.map((card) => `- ${card.label}: ${card.value} — ${card.detail}`),
    "",
    "ADVANCED RULES",
    ...summary.advancedRules.map((rule, index) => `${index + 1}. ${rule}`),
    "",
    "LAYOUT CHANGE",
    summary.layoutChange,
  ].join(newline);
}

function V51FocusedAdvancedWorkspacePanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis, setActiveTab }) {
  const summary = buildV51AdvancedWorkspaceSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.1 Focused Advanced Workspace"
      subtitle="Keeps deeper architecture, technical explanation, and product planning available without letting them dominate the main user journey."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.1.7: <span className="font-semibold text-zinc-100">Advanced Workspace</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Advanced Status</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{summary.headline}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{summary.layoutChange}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        {summary.advancedCards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{card.label}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{card.value}</h3>
            <p className="mt-3 text-xs leading-5 text-zinc-500">{card.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Advanced Rules</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {summary.advancedRules.map((rule, index) => (
            <div key={rule} className="rounded-2xl border border-zinc-800 bg-black p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">Rule {index + 1}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{rule}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => setActiveTab("dashboard")}
          className="rounded-2xl border border-zinc-800 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          Back to Dashboard
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("output")}
          className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
        >
          Back to Output
        </button>
      </div>
    </Panel>
  );
}


function buildV51WorkspaceProgressRailState(activeTab = "dashboard", projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const shell = buildV51DashboardShellState(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const orderedTabs = shell.tabs.map((tab, index) => {
    const isCurrent = tab.id === activeTab;
    const activeIndex = shell.tabs.findIndex((item) => item.id === activeTab);
    const completed = activeIndex > index && tab.id !== "advanced";
    const optional = tab.id === "advanced";

    return {
      ...tab,
      index,
      status: isCurrent ? "Current" : completed ? "Complete" : optional ? "Optional" : tab.ready ? "Ready" : "Waiting",
      isCurrent,
      completed,
      optional,
    };
  });

  const activeIndex = Math.max(0, shell.tabs.findIndex((tab) => tab.id === activeTab));
  const previousTab = activeIndex > 0 ? shell.tabs[activeIndex - 1] : null;
  const nextTab = activeIndex < shell.tabs.length - 2 ? shell.tabs[activeIndex + 1] : null;

  return {
    version: "v5.1",
    feature: "Workspace Progress Rail",
    activeTab,
    activeLabel: shell.tabs.find((tab) => tab.id === activeTab)?.label || "Dashboard",
    orderedTabs,
    previousTab,
    nextTab,
    routeLabel: "Dashboard → Analyze → Report → Output",
    advancedNote: "Advanced stays available as an optional inspection area rather than part of the required user path.",
    layoutChange: "The workspace now gives users a visible sense of progress through the product flow instead of leaving each tab feeling isolated.",
  };
}

function buildV51WorkspaceProgressRailText(activeTab = "dashboard", projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const rail = buildV51WorkspaceProgressRailState(activeTab, projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.1 WORKSPACE PROGRESS RAIL",
    "",
    `Active tab: ${rail.activeLabel}`,
    `Route: ${rail.routeLabel}`,
    "",
    "WORKSPACE STEPS",
    ...rail.orderedTabs.map((tab) => `- ${tab.label}: ${tab.status}`),
    "",
    "ADVANCED NOTE",
    rail.advancedNote,
    "",
    "LAYOUT CHANGE",
    rail.layoutChange,
  ].join(newline);
}

function buildV51LayoutRefactorHandoff(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const shell = buildV51DashboardShellState(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const progressRail = buildV51WorkspaceProgressRailState("dashboard", projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const dashboardCards = buildV51DashboardActionCards(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const analyzeWorkspace = buildV51AnalyzeWorkspaceSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const reportWorkspace = buildV51ReportWorkspaceSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const outputWorkspace = buildV51OutputWorkspaceSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const advancedWorkspace = buildV51AdvancedWorkspaceSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const handoffChecks = [
    {
      label: "Product view is default",
      ready: true,
      note: "SoulFrame now opens into the Product workspace instead of the older Classic Demo view.",
    },
    {
      label: "Main tabs exist",
      ready: shell.tabCount === 5,
      note: "Dashboard, Analyze, Report, Output, and Advanced are defined as the main workspace areas.",
    },
    {
      label: "Dashboard has action cards",
      ready: dashboardCards.cards.length === 4,
      note: "The first screen now gives practical actions instead of leading with stacked report panels.",
    },
    {
      label: "Analyze workspace is focused",
      ready: analyzeWorkspace.analysisCards.length === 4,
      note: "The Analyze tab has its own compact status layer before upload and analysis controls.",
    },
    {
      label: "Report workspace is focused",
      ready: reportWorkspace.reportCards.length === 4,
      note: "The Report tab has its own summary before deeper V4.2 report intelligence.",
    },
    {
      label: "Output workspace is focused",
      ready: outputWorkspace.outputCards.length === 4,
      note: "The Output tab now begins with delivery status before handoff and export tools.",
    },
    {
      label: "Advanced workspace is contained",
      ready: advancedWorkspace.advancedCards.length === 4,
      note: "Technical planning and backend/API panels have a clearer home outside the main route.",
    },
    {
      label: "Progress route is visible",
      ready: progressRail.routeLabel.includes("Dashboard") && progressRail.routeLabel.includes("Output"),
      note: "The user can see the route through Dashboard, Analyze, Report, and Output.",
    },
  ];

  const readyCount = handoffChecks.filter((check) => check.ready).length;
  const readinessScore = Math.round((readyCount / handoffChecks.length) * 100);

  return {
    version: "v5.1",
    feature: "Layout Refactor Handoff",
    readinessScore,
    readyCount,
    totalChecks: handoffChecks.length,
    status: readinessScore >= 90 ? "V5.1 layout refactor ready for release prep" : "Needs final layout review",
    handoffChecks,
    productRoute: progressRail.routeLabel,
    finalSummary: "V5.1 turns the V5 product plan into a real dashboard-first workspace with focused tabs, guided headers, action cards, progress navigation, and contained advanced details.",
    recommendedNextMilestone: "Update README for V5.1, merge the layout refactor branch, tag v5.1.0, and then pause before deeper visual redesign or backend implementation.",
  };
}

function buildV51LayoutRefactorHandoffText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const handoff = buildV51LayoutRefactorHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.1 LAYOUT REFACTOR HANDOFF",
    "",
    `Status: ${handoff.status}`,
    `Readiness: ${handoff.readinessScore}/100`,
    `Checks ready: ${handoff.readyCount}/${handoff.totalChecks}`,
    `Route: ${handoff.productRoute}`,
    "",
    "FINAL SUMMARY",
    handoff.finalSummary,
    "",
    "HANDOFF CHECKS",
    ...handoff.handoffChecks.map((check) => `- ${check.ready ? "READY" : "REVIEW"}: ${check.label} — ${check.note}`),
    "",
    "NEXT MILESTONE",
    handoff.recommendedNextMilestone,
  ].join(newline);
}

function V51LayoutRefactorHandoffPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const handoff = buildV51LayoutRefactorHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.1 Layout Refactor Handoff"
      subtitle="Wraps the V5.1 layout refactor into a release-ready handoff before README, merge, tag, and release prep."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.1.9: <span className="font-semibold text-zinc-100">Layout Handoff</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Layout Refactor Status</p>
        <h3 className="mt-3 text-3xl font-semibold text-zinc-100">{handoff.readinessScore}/100</h3>
        <p className="mt-3 text-lg font-semibold text-zinc-200">{handoff.status}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-500">{handoff.finalSummary}</p>
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Product Route</p>
        <h3 className="mt-3 text-xl font-semibold text-zinc-100">{handoff.productRoute}</h3>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {handoff.handoffChecks.map((check) => (
          <article key={check.label} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{check.ready ? "Ready" : "Review"}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{check.label}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-500">{check.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Recommended Next Milestone</p>
        <p className="mt-3 text-sm leading-6 text-zinc-300">{handoff.recommendedNextMilestone}</p>
      </div>
    </Panel>
  );
}


function buildV52PresentationHeroState(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const dashboard = buildV51DashboardActionCards(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const handoff = buildV51LayoutRefactorHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;

  const heroActions = [
    {
      label: activeAnalysis && activeAnalysis.status === "Ready" ? "Review Analysis" : "Start with Analyze",
      targetTab: "analyze",
      intent: activeAnalysis && activeAnalysis.status === "Ready" ? "Open the active audio review workspace." : "Upload audio or load a demo preset.",
    },
    {
      label: "Open Report",
      targetTab: "report",
      intent: "Move into the smarter humanization report workspace.",
    },
    {
      label: "Prepare Output",
      targetTab: "output",
      intent: "Package the producer brief, client update, checklist, and handoff.",
    },
  ];

  const proofPoints = [
    "Browser-safe audio review",
    "Producer-led humanization",
    "Client-ready reporting",
    "Classic Demo preserved",
  ];

  return {
    version: "v5.2",
    feature: "Public Beta Presentation Hero",
    eyebrow: "AI Music Humanization Review Tool",
    title: "Turn AI music drafts into clearer human-led revision decisions.",
    description: "SoulFrame helps producers inspect AI-generated music, identify what feels synthetic or unfinished, and prepare clearer notes for the next humanization pass.",
    projectLine: dashboard.headline,
    readinessLine: `${handoff.readinessScore}/100 layout readiness`,
    heroActions,
    proofPoints,
    presentationShift: "V5.2 starts polishing SoulFrame's first impression for public beta presentation instead of adding more deep technical systems.",
  };
}

function buildV52PresentationHeroText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const hero = buildV52PresentationHeroState(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.2 PUBLIC BETA PRESENTATION HERO",
    "",
    `Eyebrow: ${hero.eyebrow}`,
    `Title: ${hero.title}`,
    `Readiness: ${hero.readinessLine}`,
    "",
    "DESCRIPTION",
    hero.description,
    "",
    "PROOF POINTS",
    ...hero.proofPoints.map((point) => `- ${point}`),
    "",
    "HERO ACTIONS",
    ...hero.heroActions.map((action) => `- ${action.label}: ${action.intent} -> ${action.targetTab}`),
    "",
    "PRESENTATION SHIFT",
    hero.presentationShift,
  ].join(newline);
}

function buildV52PublicDemoScenarios() {
  const scenarios = [
    {
      key: "vocalDraft",
      label: "Vocal Draft",
      title: "AI Vocal Humanization Demo",
      description: "Start with a vocal-focused review for metallic tone, expression, and release-readiness.",
      targetTab: "analyze",
    },
    {
      key: "instrumentalDraft",
      label: "Instrumental",
      title: "AI Instrumental Texture Demo",
      description: "Review shimmer, generated movement, arrangement repetition, and instrumental warmth.",
      targetTab: "analyze",
    },
    {
      key: "clientReady",
      label: "Client Ready",
      title: "Client Delivery Review Demo",
      description: "Load a more polished scenario focused on client communication and final-pass delivery.",
      targetTab: "report",
    },
    {
      key: "beforeAfter",
      label: "Before / After",
      title: "Humanized Edit Comparison",
      description: "Compare an AI draft against a humanized edit and explain what improved.",
      targetTab: "report",
    },
  ];

  return {
    version: "v5.2",
    feature: "Public Demo Scenario Cards",
    headline: "Choose a demo path instead of starting from a blank product.",
    description: "Public beta visitors can now understand SoulFrame faster by loading a clear scenario and jumping into the right workspace.",
    scenarios,
    presentationShift: "The first-screen experience becomes more guided for visitors, screenshots, walkthroughs, and public demos.",
  };
}

function buildV52PublicDemoScenariosText() {
  const newline = String.fromCharCode(10);
  const summary = buildV52PublicDemoScenarios();

  return [
    "SOULFRAME V5.2 PUBLIC DEMO SCENARIO CARDS",
    "",
    `Headline: ${summary.headline}`,
    "",
    "DESCRIPTION",
    summary.description,
    "",
    "SCENARIOS",
    ...summary.scenarios.map((scenario) => `- ${scenario.label}: ${scenario.title} -> ${scenario.targetTab}`),
    "",
    "PRESENTATION SHIFT",
    summary.presentationShift,
  ].join(newline);
}

function V52PublicDemoScenarioCards({ applyDemoPreset, setActiveTab }) {
  const summary = buildV52PublicDemoScenarios();

  return (
    <Panel
      title="V5.2 Public Demo Scenario Cards"
      subtitle="Gives first-time visitors a faster way to understand SoulFrame by choosing a clear demo path."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.2.2: <span className="font-semibold text-zinc-100">Demo Scenarios</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Public Demo Entry</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{summary.headline}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{summary.description}</p>
        <p className="mt-2 text-xs leading-5 text-zinc-600">{summary.presentationShift}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-4">
        {summary.scenarios.map((scenario) => (
          <article key={scenario.key} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{scenario.label}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{scenario.title}</h3>
            <p className="mt-3 min-h-20 text-xs leading-5 text-zinc-500">{scenario.description}</p>
            <button
              type="button"
              onClick={() => {
                applyDemoPreset(scenario.key);
                setActiveTab(scenario.targetTab);
              }}
              className="mt-4 w-full rounded-2xl border border-zinc-800 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Load Demo
            </button>
          </article>
        ))}
      </div>
    </Panel>
  );
}


function buildV52PublicBetaValueStrip(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const reportControl = buildV42ReportControlCenter(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const handoff = buildV51LayoutRefactorHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const valueCards = [
    {
      label: "For Producers",
      value: "Human-led review",
      detail: "SoulFrame supports the producer's ear instead of replacing musical judgement.",
    },
    {
      label: "Privacy",
      value: "Browser-safe demo",
      detail: "The public prototype keeps audio inspection local and does not upload files to a server.",
    },
    {
      label: "Workflow",
      value: "Draft → Report → Output",
      detail: "The product now guides users from analysis into a practical handoff path.",
    },
    {
      label: "Readiness",
      value: activeAnalysis && activeAnalysis.status === "Ready" ? reportControl.statusLabel : "Demo-ready",
      detail: activeAnalysis && activeAnalysis.status === "Ready" ? reportControl.nextMove : `${handoff.readinessScore}/100 layout readiness for public beta presentation.`,
    },
  ];

  return {
    version: "v5.2",
    feature: "Public Beta Value Strip",
    headline: "A clearer first impression for visitors.",
    description: "The value strip explains who SoulFrame is for, how the demo behaves, and what the product helps users prepare.",
    valueCards,
    presentationShift: "This makes the top of the product feel more like a public beta landing experience and less like a developer demo.",
  };
}

function buildV52PublicBetaValueStripText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const strip = buildV52PublicBetaValueStrip(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.2 PUBLIC BETA VALUE STRIP",
    "",
    `Headline: ${strip.headline}`,
    "",
    "DESCRIPTION",
    strip.description,
    "",
    "VALUE CARDS",
    ...strip.valueCards.map((card) => `- ${card.label}: ${card.value} — ${card.detail}`),
    "",
    "PRESENTATION SHIFT",
    strip.presentationShift,
  ].join(newline);
}

function buildV52PublicBetaWorkflowPreview(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const shell = buildV51DashboardShellState(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const workflowSteps = [
    {
      number: "01",
      label: "Dashboard",
      title: "Start with the project picture",
      description: "See project status, demo paths, action cards, and the next practical move before opening deeper panels.",
      targetTab: "dashboard",
    },
    {
      number: "02",
      label: "Analyze",
      title: "Inspect the audio",
      description: "Use intake, upload, metadata, waveform, and audio health to understand what the draft needs.",
      targetTab: "analyze",
    },
    {
      number: "03",
      label: "Report",
      title: "Translate analysis into direction",
      description: "Turn findings into producer priorities, client-safe language, comparison notes, and revision logic.",
      targetTab: "report",
    },
    {
      number: "04",
      label: "Output",
      title: "Prepare the handoff",
      description: "Package the producer brief, client update, revision checklist, export manifest, and saved project flow.",
      targetTab: "output",
    },
  ];

  return {
    version: "v5.2",
    feature: "Public Beta Workflow Preview",
    headline: "A simple walkthrough of how SoulFrame works.",
    description: "This visitor-friendly workflow preview explains the product journey before someone reaches the more detailed workspace panels.",
    workflowSteps,
    optionalArea: shell.tabs.find((tab) => tab.id === "advanced")?.label || "Advanced",
    optionalNote: "Advanced remains available for deeper architecture, product planning, backend/API notes, and technical explainability.",
    presentationShift: "The app now communicates the product flow visually before asking visitors to understand the full interface.",
  };
}

function buildV52PublicBetaWorkflowPreviewText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const preview = buildV52PublicBetaWorkflowPreview(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.2 PUBLIC BETA WORKFLOW PREVIEW",
    "",
    `Headline: ${preview.headline}`,
    "",
    "DESCRIPTION",
    preview.description,
    "",
    "WORKFLOW STEPS",
    ...preview.workflowSteps.map((step) => `- ${step.number} ${step.label}: ${step.title} -> ${step.targetTab}`),
    "",
    "OPTIONAL AREA",
    `${preview.optionalArea}: ${preview.optionalNote}`,
    "",
    "PRESENTATION SHIFT",
    preview.presentationShift,
  ].join(newline);
}

function buildV52DashboardClarityCleanup(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const actionCards = buildV51DashboardActionCards(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const scenarios = buildV52PublicDemoScenarios();
  const handoff = buildV51LayoutRefactorHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const visibleDashboardSections = [
    "Dashboard Action Cards",
    "Public Demo Scenario Cards",
    "Quick Start Guide",
  ];

  const movedToAdvanced = [
    "V5.1 Layout Refactor Handoff",
  ];

  const cleanupRules = [
    "Keep the Dashboard focused on visitor action, not internal release proof.",
    "Move release-readiness details into Advanced where they remain available.",
    "Keep demo entry points visible because they help first-time visitors understand the product quickly.",
    "Keep Quick Start visible, but after the more visual demo scenario cards.",
  ];

  return {
    version: "v5.2",
    feature: "Dashboard Clarity Cleanup",
    headline: "The Dashboard is now more visitor-facing.",
    dashboardFocus: actionCards.headline,
    scenarioCount: scenarios.scenarios.length,
    handoffReadiness: `${handoff.readinessScore}/100`,
    visibleDashboardSections,
    movedToAdvanced,
    cleanupRules,
    presentationShift: "This reduces internal product-management weight on the Dashboard while preserving the release handoff inside Advanced.",
  };
}

function buildV52DashboardClarityCleanupText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const cleanup = buildV52DashboardClarityCleanup(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.2 DASHBOARD CLARITY CLEANUP",
    "",
    `Headline: ${cleanup.headline}`,
    `Dashboard focus: ${cleanup.dashboardFocus}`,
    `Demo scenarios: ${cleanup.scenarioCount}`,
    `Handoff readiness: ${cleanup.handoffReadiness}`,
    "",
    "VISIBLE DASHBOARD SECTIONS",
    ...cleanup.visibleDashboardSections.map((section) => `- ${section}`),
    "",
    "MOVED TO ADVANCED",
    ...cleanup.movedToAdvanced.map((section) => `- ${section}`),
    "",
    "CLEANUP RULES",
    ...cleanup.cleanupRules.map((rule, index) => `${index + 1}. ${rule}`),
    "",
    "PRESENTATION SHIFT",
    cleanup.presentationShift,
  ].join(newline);
}

function V52DashboardClarityCleanupPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const cleanup = buildV52DashboardClarityCleanup(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.2 Dashboard Clarity Cleanup"
      subtitle="Keeps the public Dashboard focused on visitor action while moving internal release-readiness proof into Advanced."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.2.5: <span className="font-semibold text-zinc-100">Dashboard Cleanup</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Cleanup Result</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{cleanup.headline}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{cleanup.presentationShift}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Dashboard Keeps</p>
          <div className="mt-4 space-y-2">
            {cleanup.visibleDashboardSections.map((section) => (
              <div key={section} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">{section}</div>
            ))}
          </div>
        </article>

        <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Advanced Keeps</p>
          <div className="mt-4 space-y-2">
            {cleanup.movedToAdvanced.map((section) => (
              <div key={section} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">{section}</div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-zinc-500">Release readiness remains accessible without crowding the visitor-facing Dashboard.</p>
        </article>

        <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Cleanup Rules</p>
          <div className="mt-4 space-y-2">
            {cleanup.cleanupRules.map((rule, index) => (
              <div key={rule} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-xs leading-5 text-zinc-400">{index + 1}. {rule}</div>
            ))}
          </div>
        </article>
      </div>
    </Panel>
  );
}


function buildV52PublicBetaScreenshotGuide(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const hero = buildV52PresentationHeroState(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const workflow = buildV52PublicBetaWorkflowPreview(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const handoff = buildV51LayoutRefactorHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const screenshotShots = [
    {
      label: "Hero",
      targetTab: "dashboard",
      shot: "Top of Product workspace",
      purpose: "Show SoulFrame's public beta positioning and first impression.",
      captureNote: hero.title,
    },
    {
      label: "Workflow",
      targetTab: "dashboard",
      shot: "How It Works section",
      purpose: "Show the product journey without requiring visitors to read the full app.",
      captureNote: workflow.headline,
    },
    {
      label: "Analyze",
      targetTab: "analyze",
      shot: "Analyze workspace status",
      purpose: "Show upload, review mode, report route, and quality preview in context.",
      captureNote: "Use a demo preset before capturing this screen.",
    },
    {
      label: "Report",
      targetTab: "report",
      shot: "Report workspace summary",
      purpose: "Show how SoulFrame turns analysis into producer/client direction.",
      captureNote: "Capture after demo analysis is loaded.",
    },
    {
      label: "Output",
      targetTab: "output",
      shot: "Output workspace summary",
      purpose: "Show producer brief, client update, handoff, and export direction.",
      captureNote: "Best captured after opening the Client Ready or Before / After demo.",
    },
    {
      label: "Advanced",
      targetTab: "advanced",
      shot: "Advanced workspace overview",
      purpose: "Show that deeper architecture exists without making it the main path.",
      captureNote: `${handoff.readinessScore}/100 layout readiness remains available here.`,
    },
  ];

  const publicBetaChecklist = [
    "Use the Product view, not Classic Demo, for screenshots.",
    "Load one demo scenario before capturing Analyze, Report, or Output.",
    "Keep screenshots focused on one workspace at a time.",
    "Avoid showing every technical panel in a single public-facing screenshot.",
    "Use Advanced only when explaining roadmap, architecture, or build depth.",
  ];

  return {
    version: "v5.2",
    feature: "Public Beta Screenshot Guide",
    headline: "Capture the product as a guided workflow, not a long prototype scroll.",
    screenshotShots,
    publicBetaChecklist,
    presentationShift: "This gives SoulFrame a cleaner screenshot and walkthrough strategy for GitHub, LinkedIn, portfolio pages, and public beta demos.",
  };
}

function buildV52PublicBetaScreenshotGuideText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const guide = buildV52PublicBetaScreenshotGuide(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.2 PUBLIC BETA SCREENSHOT GUIDE",
    "",
    `Headline: ${guide.headline}`,
    "",
    "SCREENSHOT SHOTS",
    ...guide.screenshotShots.map((shot) => `- ${shot.label}: ${shot.shot} -> ${shot.targetTab}`),
    "",
    "PUBLIC BETA CHECKLIST",
    ...guide.publicBetaChecklist.map((item, index) => `${index + 1}. ${item}`),
    "",
    "PRESENTATION SHIFT",
    guide.presentationShift,
  ].join(newline);
}

function V52PublicBetaScreenshotGuidePanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis, setActiveTab }) {
  const guide = buildV52PublicBetaScreenshotGuide(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.2 Public Beta Screenshot Guide"
      subtitle="Defines the cleanest screens to capture for portfolio, GitHub, LinkedIn, walkthroughs, and public beta presentation."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.2.6: <span className="font-semibold text-zinc-100">Screenshot Guide</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Screenshot Strategy</p>
        <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{guide.headline}</h3>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{guide.presentationShift}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {guide.screenshotShots.map((shot) => (
          <article key={shot.label} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{shot.label}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{shot.shot}</h3>
            <p className="mt-3 text-xs leading-5 text-zinc-500">{shot.purpose}</p>
            <p className="mt-3 rounded-2xl border border-zinc-800 bg-black p-3 text-xs leading-5 text-zinc-400">{shot.captureNote}</p>
            <button
              type="button"
              onClick={() => setActiveTab(shot.targetTab)}
              className="mt-4 w-full rounded-2xl border border-zinc-800 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Open {shot.label}
            </button>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Public Beta Checklist</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          {guide.publicBetaChecklist.map((item, index) => (
            <div key={item} className="rounded-2xl border border-zinc-800 bg-black p-4 text-xs leading-5 text-zinc-400">
              <span className="font-semibold text-zinc-200">{index + 1}.</span> {item}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}


function buildV52PublicBetaPresentationHandoff(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const hero = buildV52PresentationHeroState(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const valueStrip = buildV52PublicBetaValueStrip(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const workflowPreview = buildV52PublicBetaWorkflowPreview(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const demoScenarios = buildV52PublicDemoScenarios();
  const dashboardCleanup = buildV52DashboardClarityCleanup(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const screenshotGuide = buildV52PublicBetaScreenshotGuide(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const layoutHandoff = buildV51LayoutRefactorHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const handoffChecks = [
    {
      label: "Hero communicates the product",
      ready: hero.title.length > 20 && hero.heroActions.length === 3,
      note: "The top of the Product workspace now explains SoulFrame clearly and gives direct actions.",
    },
    {
      label: "Value is visible early",
      ready: valueStrip.valueCards.length === 4,
      note: "Visitors can quickly see producer value, browser-safe behavior, workflow, and readiness.",
    },
    {
      label: "Workflow is easy to understand",
      ready: workflowPreview.workflowSteps.length === 4,
      note: "Dashboard, Analyze, Report, and Output are explained before deeper panels appear.",
    },
    {
      label: "Demo entry is guided",
      ready: demoScenarios.scenarios.length === 4,
      note: "Visitors can load Vocal, Instrumental, Client Ready, or Before / After scenarios.",
    },
    {
      label: "Dashboard is cleaner",
      ready: dashboardCleanup.visibleDashboardSections.length <= 3,
      note: "Internal release proof has been moved into Advanced so the Dashboard stays visitor-facing.",
    },
    {
      label: "Screenshots have a strategy",
      ready: screenshotGuide.screenshotShots.length >= 6,
      note: "Portfolio, GitHub, LinkedIn, and walkthrough screenshots now have a recommended capture plan.",
    },
    {
      label: "Layout foundation is stable",
      ready: layoutHandoff.readinessScore >= 90,
      note: "The V5.1 dashboard-first layout remains the foundation for V5.2 presentation polish.",
    },
  ];

  const readyCount = handoffChecks.filter((check) => check.ready).length;
  const readinessScore = Math.round((readyCount / handoffChecks.length) * 100);

  const nextPresentationMoves = [
    "Review the live Vercel deployment as a first-time visitor.",
    "Capture screenshots from Hero, Workflow, Analyze, Report, Output, and Advanced.",
    "Update README for V5.2 after final visual review.",
    "Prepare release notes around public beta presentation rather than deep feature expansion.",
    "Pause before adding backend features so the product polish can breathe.",
  ];

  return {
    version: "v5.2",
    feature: "Public Beta Presentation Handoff",
    readinessScore,
    readyCount,
    totalChecks: handoffChecks.length,
    status: readinessScore >= 90 ? "V5.2 presentation polish ready for release prep" : "Needs one more presentation review",
    handoffChecks,
    nextPresentationMoves,
    finalSummary: "V5.2 makes SoulFrame feel more presentable as a public beta product by improving the first impression, demo paths, value explanation, workflow clarity, dashboard focus, and screenshot strategy.",
  };
}

function buildV52PublicBetaPresentationHandoffText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const handoff = buildV52PublicBetaPresentationHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.2 PUBLIC BETA PRESENTATION HANDOFF",
    "",
    `Status: ${handoff.status}`,
    `Readiness: ${handoff.readinessScore}/100`,
    `Checks ready: ${handoff.readyCount}/${handoff.totalChecks}`,
    "",
    "FINAL SUMMARY",
    handoff.finalSummary,
    "",
    "HANDOFF CHECKS",
    ...handoff.handoffChecks.map((check) => `- ${check.ready ? "READY" : "REVIEW"}: ${check.label} — ${check.note}`),
    "",
    "NEXT PRESENTATION MOVES",
    ...handoff.nextPresentationMoves.map((move, index) => `${index + 1}. ${move}`),
  ].join(newline);
}

function V52PublicBetaPresentationHandoffPanel({ projectSession, reviewMode, draftAnalysis, humanizedAnalysis }) {
  const handoff = buildV52PublicBetaPresentationHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return (
    <Panel
      title="V5.2 Public Beta Presentation Handoff"
      subtitle="Wraps the V5.2 public beta polish into a release-ready presentation handoff before README, screenshots, merge, tag, and release."
      action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.2.7: <span className="font-semibold text-zinc-100">Beta Handoff</span></div>}
    >
      <div className="rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Presentation Readiness</p>
        <h3 className="mt-3 text-3xl font-semibold text-zinc-100">{handoff.readinessScore}/100</h3>
        <p className="mt-3 text-lg font-semibold text-zinc-200">{handoff.status}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-500">{handoff.finalSummary}</p>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {handoff.handoffChecks.map((check) => (
          <article key={check.label} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{check.ready ? "Ready" : "Review"}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{check.label}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-500">{check.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-black p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Next Presentation Moves</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          {handoff.nextPresentationMoves.map((move, index) => (
            <div key={move} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 text-xs leading-5 text-zinc-400">
              <span className="font-semibold text-zinc-200">{index + 1}.</span> {move}
            </div>
          ))}
        </div>
      </div>
    </Panel>
  );
}


function buildV53ProductWorkspaceModuleSummary() {
  return {
    version: "v5.3",
    feature: "Product Workspace Modularization",
    modulePath: "src/product/ProductWorkspace.jsx",
    extractedComponents: [
      "V51ProductWorkspace",
      "V51FocusedWorkspaceHeader",
      "V51WorkspaceProgressRail",
      "V52PublicBetaPresentationHero",
      "V52PublicBetaValueStrip",
      "V52PublicBetaWorkflowPreview",
    ],
    architectureMove: "Presentation components now live outside App.jsx while existing analysis/report builder logic stays stable for the first modularization pass.",
    productOutcome: "SoulFrame keeps the same Product experience while creating a safer foundation for report sharing, export, and future code splitting.",
  };
}

function buildV53ProductWorkspaceModuleText() {
  const newline = String.fromCharCode(10);
  const summary = buildV53ProductWorkspaceModuleSummary();

  return [
    "SOULFRAME V5.3 PRODUCT WORKSPACE MODULARIZATION",
    "",
    `Module: ${summary.modulePath}`,
    `Extracted components: ${summary.extractedComponents.length}`,
    "",
    "ARCHITECTURE MOVE",
    summary.architectureMove,
    "",
    "PRODUCT OUTCOME",
    summary.productOutcome,
  ].join(newline);
}


function buildV53CleanReportPreview(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const composer = buildV42SmartReportComposer(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const qualityGate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const control = buildV42ReportControlCenter(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const outputPack = buildV42ReportOutputPack(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const beforeAfter = buildV42BeforeAfterExplanation(draftAnalysis, humanizedAnalysis);

  return {
    version: "v5.3",
    feature: "Clean Report Preview",
    projectName: projectSession?.projectName || "Untitled AI Draft",
    clientName: projectSession?.clientName || "Client",
    trackType: projectSession?.trackType || "AI-generated music",
    currentStage: projectSession?.currentStage || "Review",
    reportTitle: composer.reportTitle,
    reportPath: composer.reportPath,
    genreFocus: composer.genreFocus,
    qualityScore: qualityGate.score,
    qualityLabel: qualityGate.label,
    executiveSummary: composer.executiveSummary,
    producerPriorities: composer.producerPlan.slice(0, 4),
    clientSummary: outputPack.clientUpdate || composer.clientReadySummary,
    beforeAfterLine: beforeAfter.clientSafeLine,
    showComparison: reviewMode === "compare",
    nextMove: control.nextMove,
    clientNextStep: qualityGate.score >= 80
      ? "The track is ready for a final human read-through before the next client-facing delivery step."
      : "The next revision will focus on the clearest humanization priorities before the track is treated as final.",
    recommendedOutput: control.recommendedOutput,
    generatedStatus: activeAnalysis && activeAnalysis.status === "Ready"
      ? "Analysis-backed preview"
      : "Preview awaiting audio analysis",
  };
}

function buildV53CleanReportPreviewText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null, audience = "producer") {
  const newline = String.fromCharCode(10);
  const report = buildV53CleanReportPreview(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const clientMode = audience === "client";

  return [
    "SOULFRAME CLEAN HUMANIZATION REPORT",
    "",
    report.reportTitle,
    `${report.projectName} · ${report.genreFocus}`,
    "",
    clientMode ? "CLIENT SUMMARY" : "EXECUTIVE SUMMARY",
    clientMode ? report.clientSummary : report.executiveSummary,
    "",
    ...(clientMode
      ? []
      : [
          "PRODUCER PRIORITIES",
          ...report.producerPriorities.map((item, index) => `${index + 1}. ${item}`),
          "",
        ]),
    ...(report.showComparison
      ? [
          "BEFORE / AFTER",
          report.beforeAfterLine,
          "",
        ]
      : []),
    clientMode ? "NEXT STEP" : "PRODUCER NEXT MOVE",
    clientMode ? report.clientNextStep : report.nextMove,
    "",
    `Report quality: ${report.qualityScore}/100 · ${report.qualityLabel}`,
    `Recommended output: ${report.recommendedOutput}`,
    "",
    "SoulFrame supports the review process. Final musical judgement and client communication remain human-led.",
  ].join(newline);
}


function sanitizeV53ReportFilename(value = "soulframe-report") {
  return String(value || "soulframe-report")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70) || "soulframe-report";
}

function buildV53DownloadableReportExport(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const report = buildV53CleanReportPreview(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const baseName = sanitizeV53ReportFilename(report.projectName);
  const producerText = buildV53CleanReportPreviewText(projectSession, reviewMode, draftAnalysis, humanizedAnalysis, "producer");
  const clientText = buildV53CleanReportPreviewText(projectSession, reviewMode, draftAnalysis, humanizedAnalysis, "client");

  return {
    version: "v5.3",
    feature: "Downloadable Report Export",
    format: "txt",
    producerFileName: `${baseName}-soulframe-producer-report.txt`,
    clientFileName: `${baseName}-soulframe-client-report.txt`,
    producerText,
    clientText,
    exportNote: "Reports are generated and downloaded locally in the browser. No report or audio file is uploaded to a server.",
  };
}

function buildV53DownloadableReportExportText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const exportPack = buildV53DownloadableReportExport(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.3 DOWNLOADABLE REPORT EXPORT",
    "",
    `Format: ${exportPack.format.toUpperCase()}`,
    `Producer file: ${exportPack.producerFileName}`,
    `Client file: ${exportPack.clientFileName}`,
    "",
    "EXPORT NOTE",
    exportPack.exportNote,
  ].join(newline);
}


function buildV53ShareableReportDirection(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const report = buildV53CleanReportPreview(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const slug = sanitizeV53ReportFilename(report.projectName);
  const clientText = buildV53CleanReportPreviewText(projectSession, reviewMode, draftAnalysis, humanizedAnalysis, "client");

  const shareTitle = `${report.projectName} — SoulFrame Humanization Report`;
  const shareSummary = [
    shareTitle,
    "",
    report.clientSummary,
    "",
    `Next step: ${report.clientNextStep}`,
    "",
    "Prepared with SoulFrame — AI Music Humanization Review Tool.",
  ].join(String.fromCharCode(10));

  return {
    version: "v5.3",
    feature: "Shareable Report Direction",
    shareTitle,
    shareSummary,
    clientText,
    routePreview: `/report/${slug}`,
    shareMode: "Local text share",
    privacyNote: "V5.3.4 does not create a public cloud report URL. Sharing uses browser-native text sharing or clipboard copy only.",
    futureDirection: "A future backend can map the route preview to a secure, revocable report URL with project permissions.",
  };
}

function buildV53ShareableReportDirectionText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const share = buildV53ShareableReportDirection(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.3 SHAREABLE REPORT DIRECTION",
    "",
    `Share mode: ${share.shareMode}`,
    `Future route preview: ${share.routePreview}`,
    "",
    "PRIVACY NOTE",
    share.privacyNote,
    "",
    "FUTURE DIRECTION",
    share.futureDirection,
  ].join(newline);
}


function buildV53BeforeAfterCaseStudy(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const comparison = buildV42BeforeAfterExplanation(draftAnalysis, humanizedAnalysis);
  const draftReady = draftAnalysis && draftAnalysis.status === "Ready";
  const humanizedReady = humanizedAnalysis && humanizedAnalysis.status === "Ready";
  const comparisonReady = reviewMode === "compare" && draftReady && humanizedReady;

  const beforePriority = draftReady ? getHumanizationPriorityScore(draftAnalysis) : 0;
  const afterPriority = humanizedReady ? getHumanizationPriorityScore(humanizedAnalysis) : 0;
  const projectName = projectSession?.projectName || "Untitled AI Draft";

  const metrics = [
    {
      label: "Brightness",
      before: draftReady ? draftAnalysis.brightness || "Not available" : "Awaiting draft",
      after: humanizedReady ? humanizedAnalysis.brightness || "Not available" : "Awaiting edit",
    },
    {
      label: "Texture",
      before: draftReady ? draftAnalysis.textureStability || "Not available" : "Awaiting draft",
      after: humanizedReady ? humanizedAnalysis.textureStability || "Not available" : "Awaiting edit",
    },
    {
      label: "Dynamics",
      before: draftReady ? draftAnalysis.dynamics || "Not available" : "Awaiting draft",
      after: humanizedReady ? humanizedAnalysis.dynamics || "Not available" : "Awaiting edit",
    },
    {
      label: "Clipping Risk",
      before: draftReady ? draftAnalysis.clippingRisk || "Not available" : "Awaiting draft",
      after: humanizedReady ? humanizedAnalysis.clippingRisk || "Not available" : "Awaiting edit",
    },
  ];

  const publicNarrative = comparisonReady
    ? `${projectName} was reviewed as an original AI-generated draft and then compared against a humanized edit. ${comparison.mainExplanation} The comparison is used as decision support rather than as an automatic verdict on the music.`
    : "Load the Before / After demo or switch to Before / After Review with both versions available to generate a complete case study.";

  return {
    version: "v5.3",
    feature: "Before / After Case Study",
    title: `${projectName} — Humanization Case Study`,
    subtitle: "A clean before/after story showing how the revision changed the listening risks and what still needs a producer's ear.",
    comparisonReady,
    status: comparison.improvementLabel,
    emptyState: "SoulFrame needs both the original AI draft and the humanized edit in Before / After mode before it can generate a credible comparison case study.",
    improvementLabel: comparison.improvementLabel,
    priorityChange: comparison.priorityChange,
    beforePriority,
    afterPriority,
    metrics,
    improvements: comparison.producerFocus.slice(0, 4),
    clientSafeLine: comparison.clientSafeLine,
    publicNarrative,
    humanCheck: "Measured changes can support the explanation, but the producer should still confirm emotion, groove, tone, movement, and musical intent by ear.",
    fileName: `${sanitizeV53ReportFilename(projectName)}-soulframe-before-after-case-study.txt`,
    caseStudyPurpose: "Designed as a portfolio/demo-ready explanation of the humanization process without exposing private client material or overstating automated analysis.",
  };
}

function buildV53BeforeAfterCaseStudyText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const study = buildV53BeforeAfterCaseStudy(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  if (!study.comparisonReady) {
    return [
      "SOULFRAME V5.3 BEFORE / AFTER CASE STUDY",
      "",
      study.title,
      "",
      "STATUS",
      study.status,
      "",
      study.emptyState,
    ].join(newline);
  }

  return [
    "SOULFRAME V5.3 BEFORE / AFTER CASE STUDY",
    "",
    study.title,
    "",
    "OUTCOME",
    `${study.improvementLabel} · ${study.priorityChange}`,
    "",
    "CASE STUDY NARRATIVE",
    study.publicNarrative,
    "",
    "WHAT CHANGED",
    ...study.improvements.map((item, index) => `${index + 1}. ${item}`),
    "",
    "METRICS",
    ...study.metrics.map((metric) => `- ${metric.label}: ${metric.before} → ${metric.after}`),
    "",
    "CLIENT-SAFE EXPLANATION",
    study.clientSafeLine,
    "",
    "HUMAN CHECK",
    study.humanCheck,
  ].join(newline);
}


function buildV53ClientDeliveryExperience(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const report = buildV53CleanReportPreview(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const outputPack = buildV42ReportOutputPack(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const handoff = buildV42FinalReportHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const manifest = buildV42ReportExportManifest(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const qualityGate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const readinessScore = Math.round(
    Math.min(
      100,
      (qualityGate.score * 0.45) +
      (handoff.handoffScore * 0.35) +
      ((manifest.readyCount / Math.max(1, manifest.totalItems)) * 100 * 0.20)
    )
  );

  const deliverables = [
    {
      label: "Producer Brief",
      status: outputPack.producerBrief.length > 120 ? "Ready" : "Review",
      detail: "Internal production direction for the final humanization pass.",
    },
    {
      label: "Client Update",
      status: outputPack.clientUpdate.length > 100 ? "Ready" : "Review",
      detail: "Client-safe explanation of what changed and what happens next.",
    },
    {
      label: "Revision Checklist",
      status: outputPack.revisionChecklist.length > 0 ? "Ready" : "Review",
      detail: "Practical revision tasks before final delivery.",
    },
  ];

  const readinessLabel = readinessScore >= 85
    ? "Ready for final human read-through"
    : readinessScore >= 65
      ? "Almost ready"
      : "Needs another focused pass";

  const clientMessage = outputPack.clientUpdate || report.clientSummary;

  return {
    version: "v5.3",
    feature: "Client Delivery Experience",
    title: `${report.projectName} — Delivery Handoff`,
    subtitle: "A final producer-facing checkpoint for deciding what is ready to send, what still needs review, and how to communicate the next step clearly.",
    readinessScore,
    readinessLabel,
    readinessNote: "Readiness combines report quality, handoff checks, and export completeness. It remains decision support rather than an automatic approval.",
    deliveryStatus: handoff.handoffStatus,
    recommendedOutput: report.recommendedOutput,
    deliverySummary: handoff.finalRecommendation,
    deliverables,
    humanChecks: [
      "Listen through the full track once without watching the analysis.",
      "Confirm the revision still serves the emotional and musical intention.",
      "Read the client message out loud and remove anything that sounds overly technical or automated.",
      "Confirm filenames, version labels, and the actual files being delivered.",
    ],
    clientMessage,
    nextMove: handoff.finalRecommendation,
    fileName: `${sanitizeV53ReportFilename(report.projectName)}-soulframe-client-delivery-note.txt`,
    deliveryPrinciple: "SoulFrame can organise the handoff, but a human producer should make the final call before anything is sent to a client.",
  };
}

function buildV53ClientDeliveryExperienceText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const delivery = buildV53ClientDeliveryExperience(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.3 CLIENT DELIVERY EXPERIENCE",
    "",
    delivery.title,
    "",
    `Readiness: ${delivery.readinessScore}/100 · ${delivery.readinessLabel}`,
    `Delivery status: ${delivery.deliveryStatus}`,
    `Recommended output: ${delivery.recommendedOutput}`,
    "",
    "DELIVERY SUMMARY",
    delivery.deliverySummary,
    "",
    "DELIVERABLES",
    ...delivery.deliverables.map((item) => `- ${item.label}: ${item.status} — ${item.detail}`),
    "",
    "FINAL HUMAN CHECK",
    ...delivery.humanChecks.map((item, index) => `${index + 1}. ${item}`),
    "",
    "CLIENT MESSAGE",
    delivery.clientMessage,
    "",
    "NEXT MOVE",
    delivery.nextMove,
    "",
    delivery.deliveryPrinciple,
  ].join(newline);
}


function buildV53ReportSharingExportHandoff(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const cleanReport = buildV53CleanReportPreview(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const exportPack = buildV53DownloadableReportExport(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const sharePack = buildV53ShareableReportDirection(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const delivery = buildV53ClientDeliveryExperience(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const features = [
    {
      version: "V5.3.1",
      title: "Product Workspace Modularization",
      detail: "Moved key product presentation components out of the monolithic App.jsx to create safer module boundaries.",
      status: "Complete",
    },
    {
      version: "V5.3.2",
      title: "Clean Report Preview",
      detail: "Introduced a polished Producer / Client report presentation layer.",
      status: "Complete",
    },
    {
      version: "V5.3.3",
      title: "Downloadable Report Export",
      detail: `Added browser-local TXT export including ${exportPack.producerFileName}.`,
      status: "Complete",
    },
    {
      version: "V5.3.4",
      title: "Shareable Report Direction",
      detail: `Added browser-native text sharing and the future route model ${sharePack.routePreview}.`,
      status: "Complete",
    },
    {
      version: "V5.3.5",
      title: "Before / After Case Study",
      detail: "Turned humanization comparison into a cleaner portfolio/client-safe case study format.",
      status: "Complete",
    },
    {
      version: "V5.3.6",
      title: "Client Delivery Experience",
      detail: "Added a final delivery checkpoint with readiness, deliverables, human checks, and client messaging.",
      status: "Complete",
    },
  ];

  const completedCount = features.filter((feature) => feature.status === "Complete").length;
  const readinessScore = Math.round((completedCount / features.length) * 100);

  return {
    version: "v5.3",
    feature: "Report Sharing & Export Handoff",
    title: "Report Sharing & Export Handoff",
    subtitle: "The V5.3 report experience is now connected from clean preview through export, sharing direction, comparison storytelling, and final client delivery.",
    releaseLabel: "SoulFrame V5.3.0 — Report Sharing & Export",
    readinessScore,
    readinessLabel: readinessScore === 100 ? "V5.3 feature set complete" : "V5.3 needs review",
    readinessNote: "This score tracks the planned V5.3 feature set, not production backend readiness.",
    outcome: `SoulFrame can now turn ${cleanReport.projectName} from an internal humanization review into a cleaner producer/client report, local download, browser-native share summary, before/after case study, and final delivery handoff.`,
    features,
    releaseChecks: [
      "Producer and Client report modes remain clearly separated.",
      "TXT report and delivery exports work entirely in the browser.",
      "Share actions do not pretend that a live public report URL exists.",
      "Before / After storytelling only claims a comparison when both versions are available.",
      "Client delivery keeps a required final human listening and communication check.",
      "V5.3 presentation components continue moving into dedicated product/report modules.",
    ],
    architectureBoundary: "V5.3 improves the report and delivery experience without turning the earlier V4.1 backend/API scaffold into a real backend. Local browser behaviour remains the source of truth for this release.",
    backendNote: "Secure hosted report URLs, user accounts, permissions, database persistence, revocable links, and server-generated PDFs belong to a later real-backend phase.",
    nextChapter: "V5.4 — UI Simplification & Codebase Cleanup",
    fileName: `${sanitizeV53ReportFilename(cleanReport.projectName)}-soulframe-v5-3-handoff.txt`,
  };
}

function buildV53ReportSharingExportHandoffText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const handoff = buildV53ReportSharingExportHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.3 REPORT SHARING & EXPORT HANDOFF",
    "",
    handoff.releaseLabel,
    `Readiness: ${handoff.readinessScore}/100 · ${handoff.readinessLabel}`,
    "",
    "OUTCOME",
    handoff.outcome,
    "",
    "FEATURES",
    ...handoff.features.map((feature) => `- ${feature.version} — ${feature.title}: ${feature.status}`),
    "",
    "RELEASE CHECKS",
    ...handoff.releaseChecks.map((item, index) => `${index + 1}. ${item}`),
    "",
    "ARCHITECTURE BOUNDARY",
    handoff.architectureBoundary,
    "",
    "BACKEND NOTE",
    handoff.backendNote,
    "",
    `Next chapter: ${handoff.nextChapter}`,
  ].join(newline);
}


function buildV54ReportWorkspaceCleanup(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const focused = buildV51ReportWorkspaceSummary(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const quality = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const draftReady = draftAnalysis && draftAnalysis.status === "Ready";
  const humanizedReady = humanizedAnalysis && humanizedAnalysis.status === "Ready";

  return {
    version: "v5.4",
    feature: "Report Workspace Cleanup",
    headline: focused.headline,
    nextMove: focused.nextMove,
    recommendedOutput: focused.recommendedOutput,
    canContinueToOutput: focused.canContinueToOutput,
    qualityScore: quality.score,
    qualityLabel: quality.label,
    showComparison: reviewMode === "compare" && Boolean(draftReady && humanizedReady),
    visiblePriority: "Clean report preview first, before/after evidence only when available, detailed report tools collapsed by default.",
    preservedTools: [
      "Report Control Center",
      "Smart Report Composer",
      "Report Quality Gate",
      "Before / After Explanation",
      "Project Workflow",
      "Revision Plan",
    ],
  };
}

function buildV54ReportWorkspaceCleanupText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const cleanup = buildV54ReportWorkspaceCleanup(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V5.4 REPORT WORKSPACE CLEANUP",
    "",
    `Status: ${cleanup.headline}`,
    `Quality: ${cleanup.qualityScore}/100 - ${cleanup.qualityLabel}`,
    `Recommended output: ${cleanup.recommendedOutput}`,
    `Comparison visible: ${cleanup.showComparison ? "Yes" : "No"}`,
    "",
    "VISIBLE PRIORITY",
    cleanup.visiblePriority,
    "",
    "PRESERVED DETAILED TOOLS",
    ...cleanup.preservedTools.map((tool) => `- ${tool}`),
  ].join(newline);
}

function ProjectIntake({ projectSession, setProjectSession, selectedReport, resetProjectSession, saveProjectSnapshot, savedProjectsCount, applyDemoPreset, saveDemoPresetAsProject }) {
  const fields = [
    { key: "projectName", label: "Project Name", placeholder: "Untitled AI Draft" },
    { key: "clientName", label: "Client Name", placeholder: "Client" },
    { key: "trackType", label: "Track Type", placeholder: "Vocal pop, rock, cinematic, instrumental..." },
    { key: "aiTool", label: "AI Tool Used", placeholder: "Suno, Udio, custom model, unknown..." },
    { key: "currentStage", label: "Current Stage", placeholder: "Raw AI Draft, Edit 1, final polish..." },
    { key: "mainConcern", label: "Main Concern", placeholder: "Metallic vocal, flat emotion, strange ending..." },
  ];
  const updateField = (key, value) => setProjectSession((current) => ({ ...current, [key]: value }));

  return (
    <Panel title="Project Intake" subtitle="Set up any client AI draft before reviewing it inside SoulFrame." action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V2: <span className="font-semibold text-zinc-100">Functional Audio Intake</span></div>}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <label key={field.key} className="block rounded-2xl border border-zinc-800 bg-black p-4">
            <span className="text-sm font-semibold text-zinc-100">{field.label}</span>
            <input className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-zinc-500" value={projectSession[field.key]} onChange={(event) => updateField(field.key, event.target.value)} placeholder={field.placeholder} />
          </label>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label className="block rounded-2xl border border-zinc-800 bg-black p-4">
          <span className="text-sm font-semibold text-zinc-100">Client Goal</span>
          <textarea className="mt-3 h-28 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-zinc-500" value={projectSession.clientGoal} onChange={(event) => updateField("clientGoal", event.target.value)} placeholder="What does the client want this track to become?" />
        </label>
        <label className="block rounded-2xl border border-zinc-800 bg-black p-4">
          <span className="text-sm font-semibold text-zinc-100">Producer Notes</span>
          <textarea className="mt-3 h-28 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-zinc-500" value={projectSession.producerNotes} onChange={(event) => updateField("producerNotes", event.target.value)} placeholder="Private notes, references, client comments, creative direction..." />
        </label>
      </div>
      <div className="mt-5 rounded-2xl border border-zinc-800 bg-black p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Demo Mode Presets</p>
        <p className="mt-2 text-sm text-zinc-400">Load a ready-made SoulFrame scenario for demos, screenshots, or quick testing.</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {Object.entries(demoPresets).map(([key, preset]) => (
            <div key={key} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
              <p className="mb-3 text-sm font-semibold text-zinc-100">{preset.label}</p>
              <div className="grid grid-cols-1 gap-2">
                <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={() => applyDemoPreset(key)}>
                  Load Preset
                </Button>
                <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={() => saveDemoPresetAsProject(key)}>
                  Save as Project
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">Humanization Brief</p>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{buildHumanizationBrief(projectSession, selectedReport)}</p>
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Button className="border border-zinc-700 bg-black text-zinc-100 hover:bg-zinc-800" onClick={saveProjectSnapshot}>Save Project</Button>
          <Button className="border border-zinc-700 bg-black text-zinc-100 hover:bg-zinc-800" onClick={resetProjectSession}>Reset Session</Button>
          <p className="text-center text-xs text-zinc-500">Saved: {savedProjectsCount}</p>
        </div>
      </div>
    </Panel>
  );
}



function SavedProjectHistory({ savedProjects, loadSavedProjectSnapshot, deleteSavedProject, clearSavedProjects, importSavedProjectsBackup }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [importStatus, setImportStatus] = useState("Import Backup");

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredProjects = savedProjects.filter((project) => {
    const searchableText = `${project.title || ""} ${project.client || ""} ${project.stage || ""} ${project.reviewMode || ""}`.toLowerCase();
    return searchableText.includes(normalizedSearch);
  });

  function handleDownloadProjectsBackup() {
    const backupText = buildSavedProjectsBackup(savedProjects);
    downloadTextFile("SoulFrame_Saved_Projects_Backup.json", backupText);
  }

  function handleImportProjectsBackup(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const importedProjects = parseSavedProjectsBackup(String(reader.result || ""));

      if (!importedProjects.length) {
        setImportStatus("Import failed");
        window.setTimeout(() => setImportStatus("Import Backup"), 1500);
        event.target.value = "";
        return;
      }

      importSavedProjectsBackup(String(reader.result || ""));
      setImportStatus("Imported");
      window.setTimeout(() => setImportStatus("Import Backup"), 1500);
      event.target.value = "";
    };

    reader.onerror = () => {
      setImportStatus("Import failed");
      window.setTimeout(() => setImportStatus("Import Backup"), 1500);
      event.target.value = "";
    };

    reader.readAsText(file);
  }

  return (
    <Panel
      title="Saved Project Sessions"
      subtitle="Load previous SoulFrame setups, export a local backup, or import a backup before any new projects are saved."
      action={
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={handleDownloadProjectsBackup}>
            Download Backup
          </Button>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 px-5 py-3 text-sm font-semibold text-zinc-100 hover:bg-zinc-800">
            {importStatus}
            <input type="file" accept="application/json,.json" className="sr-only" onChange={handleImportProjectsBackup} />
          </label>
          <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40" onClick={clearSavedProjects} disabled={!savedProjects.length}>
            Clear All
          </Button>
        </div>
      }
    >
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-black p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Saved Sessions</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">{savedProjects.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-black p-4">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Visible Results</p>
          <p className="mt-2 text-2xl font-semibold text-zinc-100">{filteredProjects.length}</p>
        </div>
        <label className="rounded-2xl border border-zinc-800 bg-black p-4">
          <span className="text-xs uppercase tracking-wide text-zinc-500">Search Projects</span>
          <input
            className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-zinc-500"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search project, client, stage..."
          />
        </label>
      </div>

      {!savedProjects.length ? (
        <div className="rounded-3xl border border-zinc-800 bg-black p-6">
          <p className="text-lg font-semibold text-zinc-100">No saved project sessions yet.</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Save a project from the intake panel, save one of the demo presets as a project, or import a previous SoulFrame backup to restore earlier work.
          </p>
        </div>
      ) : filteredProjects.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <article key={project.id} className="rounded-3xl border border-zinc-800 bg-black p-5">
              <p className="text-xs uppercase tracking-wide text-zinc-500">{project.reviewMode === "compare" ? "Before / After" : "Draft Review"}</p>
              <h3 className="mt-3 text-lg font-semibold text-zinc-100">{project.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">Client: {project.client}</p>
              <p className="mt-1 text-sm text-zinc-500">Stage: {project.stage}</p>
              <p className="mt-3 text-xs text-zinc-600">Saved: {new Date(project.savedAt).toLocaleString()}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={() => loadSavedProjectSnapshot(project.id)}>Load</Button>
                <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={() => deleteSavedProject(project.id)}>Delete</Button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-800 bg-black p-6 text-sm text-zinc-400">
          No saved projects match that search. Try a client name, project title, stage, or review mode.
        </div>
      )}
    </Panel>
  );
}

function ProjectWorkflow({ reviewMode, selectedReport }) {
  const steps = [
    { title: "Original AI Draft", status: reviewMode === "draft" ? "Active" : "Completed", output: "Synthetic issues mapped" },
    { title: "Edit 1 / Humanized Pass", status: reviewMode === "compare" ? "Active" : "Next", output: "Improvements detected" },
    { title: "Client Update", status: "Ready", output: "Progress note ready" },
    { title: "Next Pass Plan", status: "Generated", output: selectedReport.priorities[0] },
  ];
  return (
    <Panel title="Project Workflow" subtitle="The full SoulFrame loop from AI draft to client-ready update." action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">Current mode: <span className="font-semibold text-zinc-100">{reviewMode === "compare" ? "Before / After" : "Draft Scan"}</span></div>}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{steps.map((step, index) => <article key={step.title} className="rounded-3xl border border-zinc-800 bg-black p-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span><h3 className="mt-4 font-semibold text-zinc-100">{step.title}</h3><p className="mt-2 text-sm text-zinc-400">{step.status}</p><p className="mt-3 text-sm text-zinc-200">{step.output}</p></article>)}</div>
    </Panel>
  );
}

function RevisionPlan({ selectedReport, reviewMode }) {
  return (
    <Panel title="Next Revision Plan" subtitle="A focused production checklist generated from the SoulFrame report." action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">Target: <span className="font-semibold text-zinc-100">{reviewMode === "compare" ? "Final polish" : "Edit 1"}</span></div>}>
      <div className="space-y-3">{selectedReport.priorities.map((priority, index) => <article key={priority} className="rounded-3xl border border-zinc-800 bg-black p-5"><div className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span><div><h3 className="font-semibold text-zinc-100">{priority}</h3><p className="mt-1 text-sm text-zinc-400">{index === 0 ? "Highest impact on perceived human realism." : "Supports the next humanization pass."}</p></div></div></article>)}</div>
    </Panel>
  );
}



function BeforeAfterComparisonSummary({ draftMetadata, humanizedMetadata, draftAnalysis, humanizedAnalysis, reviewMode }) {
  if (reviewMode !== "compare") return null;
  const comparisonRows = buildBeforeAfterComparison(draftMetadata, humanizedMetadata, draftAnalysis, humanizedAnalysis);
  const improvementScore = getBeforeAfterImprovementScore(draftAnalysis, humanizedAnalysis);
  const improvementLabel = getBeforeAfterImprovementLabel(improvementScore);
  if (!comparisonRows.length) return <Card><CardContent className="p-6"><h2 className="text-2xl font-semibold">Before / After Audio Comparison</h2><p className="mt-2 text-sm text-zinc-400">Upload both the original AI draft and the humanized edit to compare the real audio changes.</p></CardContent></Card>;
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold">Before / After Audio Comparison</h2>
        <p className="mt-1 text-sm text-zinc-400">A real comparison between the uploaded AI draft and the humanized edit.</p>
        <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Technical Improvement Score</p>
          <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-4xl font-bold text-zinc-100">{improvementScore}/100</p>
              <p className="mt-2 text-sm text-zinc-300">{improvementLabel}</p>
            </div>
            <p className="max-w-xl text-sm leading-6 text-zinc-400">
              This score is based only on measurable technical changes: headroom, clipping risk, and dynamics. It does not replace your human ear.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">{comparisonRows.map((row) => <article key={row.label} className="rounded-3xl border border-zinc-800 bg-black p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-xs uppercase tracking-wide text-zinc-500">{row.label}</p><h3 className="mt-2 text-lg font-semibold text-zinc-100">{row.change}</h3></div><span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{row.verdict}</span></div><div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">AI Draft</p><p className="mt-2 text-sm font-semibold text-zinc-100">{row.before}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">Humanized Edit</p><p className="mt-2 text-sm font-semibold text-zinc-100">{row.after}</p></div></div></article>)}</div>
      </CardContent>
    </Card>
  );
}

function AudioFactsSummary({ draftMetadata, humanizedMetadata, draftAnalysis, humanizedAnalysis, reviewMode }) {
  const draftRows = buildAudioFactRows(draftMetadata, draftAnalysis, "Draft");
  const editRows = reviewMode === "compare" ? buildAudioFactRows(humanizedMetadata, humanizedAnalysis, "Edit") : [];
  const allRows = [...draftRows, ...editRows];
  if (!allRows.length) return null;
  const recommendation = reviewMode === "compare" ? getAudioHealthRecommendation(humanizedAnalysis || draftAnalysis) : getAudioHealthRecommendation(draftAnalysis);
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold">Real Audio Facts</h2>
        <p className="mt-1 text-sm text-zinc-400">SoulFrame is now connecting real uploaded-file data into the report.</p>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{allRows.map((row) => <div key={`${row.label}-${row.value}`} className="rounded-2xl border border-zinc-800 bg-black p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">{row.label}</p><p className="mt-2 text-sm font-semibold text-zinc-100">{row.value}</p></div>)}</div>
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">Technical Note</p><p className="mt-2 text-sm leading-6 text-zinc-300">{recommendation}</p></div>
      </CardContent>
    </Card>
  );
}

function ArtifactCluePanel({ draftAnalysis, humanizedAnalysis, reviewMode }) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const clues = buildArtifactClues(activeAnalysis);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold">Early Artifact Clues</h2>
        <p className="mt-1 text-sm text-zinc-400">
          A first-pass guide based on technical proxies. These clues should support your ears, not replace them.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {clues.map((clue) => (
            <article key={clue.title} className="rounded-3xl border border-zinc-800 bg-black p-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-zinc-100">{clue.title}</h3>
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{clue.level}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{clue.note}</p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ListeningFocusPanel({ draftAnalysis, humanizedAnalysis, reviewMode }) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const focusItems = buildListeningFocusItems(activeAnalysis);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold">Producer Listening Focus</h2>
        <p className="mt-1 text-sm text-zinc-400">
          A practical listening checklist for the next humanization pass.
        </p>
        <div className="mt-5 space-y-3">
          {focusItems.map((item, index) => (
            <div key={item} className="flex gap-4 rounded-3xl border border-zinc-800 bg-black p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-sm font-semibold text-zinc-300">
                {index + 1}
              </span>
              <p className="text-sm leading-6 text-zinc-300">{item}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HumanizationPriorityPanel({ draftAnalysis, humanizedAnalysis, reviewMode }) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const priorityScore = getHumanizationPriorityScore(activeAnalysis);
  const priorityLabel = getHumanizationPriorityLabel(priorityScore);
  const priorityNote = getHumanizationPriorityNote(activeAnalysis);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Humanization Priority Score</h2>
            <p className="mt-1 text-sm text-zinc-400">
              A producer-focused estimate of how urgently the track needs human attention.
            </p>
          </div>
          <div className="rounded-3xl border border-zinc-800 bg-black px-5 py-4 text-right">
            <p className="text-3xl font-bold text-zinc-100">{priorityScore}/100</p>
            <p className="text-sm text-zinc-400">{priorityLabel}</p>
          </div>
        </div>
        <p className="mt-5 rounded-3xl border border-zinc-800 bg-black p-5 text-sm leading-6 text-zinc-300">
          {priorityNote}
        </p>
      </CardContent>
    </Card>
  );
}

function SectionReviewNotesPanel({ draftAnalysis, humanizedAnalysis, reviewMode }) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const sectionNotes = buildSectionReviewNotes(activeAnalysis);

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold">Section-by-Section Review Notes</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Producer prompts for checking the track as a song, not just as an audio file.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {sectionNotes.map((item) => (
            <article key={item.section} className="rounded-3xl border border-zinc-800 bg-black p-5">
              <h3 className="font-semibold text-zinc-100">{item.section}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{item.note}</p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HumanizationActionPlanPanel({ draftAnalysis, humanizedAnalysis, reviewMode, projectSession }) {
  const [noteTone, setNoteTone] = useState("producer");
  const [copyActionStatus, setCopyActionStatus] = useState("Copy Client Plan");
  const [downloadActionStatus, setDownloadActionStatus] = useState("Download Client Plan");
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const actions = buildActionPlanForTone(activeAnalysis, noteTone);

  async function handleCopyClientActionPlan() {
    try {
      await navigator.clipboard.writeText(buildClientActionPlanText(projectSession || defaultProjectSession, activeAnalysis));
      setCopyActionStatus("Copied");
      window.setTimeout(() => setCopyActionStatus("Copy Client Plan"), 1500);
    } catch (error) {
      setCopyActionStatus("Copy failed");
      window.setTimeout(() => setCopyActionStatus("Copy Client Plan"), 1500);
    }
  }

  function handleDownloadClientActionPlan() {
    const projectName = getSessionValue(projectSession || defaultProjectSession, "projectName");
    const fileName = `${makeSafeFileName(projectName)}_Client_Action_Plan.txt`;
    const downloaded = downloadTextFile(fileName, buildClientActionPlanText(projectSession || defaultProjectSession, activeAnalysis));
    setDownloadActionStatus(downloaded ? "Downloaded" : "Download failed");
    window.setTimeout(() => setDownloadActionStatus("Download Client Plan"), 1500);
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Humanization Action Plan</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Practical production moves based on the current SoulFrame review.
            </p>
          </div>
          <div className="flex rounded-2xl border border-zinc-800 bg-black p-1">
            {["producer", "client"].map((tone) => (
              <button
                key={tone}
                type="button"
                onClick={() => setNoteTone(tone)}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${noteTone === tone ? "bg-zinc-100 text-black" : "text-zinc-400 hover:text-zinc-100"}`}
              >
                {getActionPlanToneLabel(tone)}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={handleCopyClientActionPlan}>
            {copyActionStatus}
          </Button>
          <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={handleDownloadClientActionPlan}>
            {downloadActionStatus}
          </Button>
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.25em] text-zinc-500">Viewing: {getActionPlanToneLabel(noteTone)}</p>
        <div className="mt-5 space-y-3">
          {actions.map((item) => (
            <article key={`${item.priority}-${item.action}`} className="rounded-3xl border border-zinc-800 bg-black p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <h3 className="font-semibold text-zinc-100">{item.action}</h3>
                <span className="w-fit rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{item.priority} Priority</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{item.detail}</p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function HumanizationDeltaPanel({ draftAnalysis, humanizedAnalysis, reviewMode }) {
  const deltaItems = getHumanizationDelta(draftAnalysis, humanizedAnalysis);

  if (reviewMode !== "compare") return null;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold">Before / After Humanization Delta</h2>
        <p className="mt-1 text-sm text-zinc-400">
          A producer-focused comparison of what changed between the AI draft and the humanized edit.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {deltaItems.map((item) => (
            <article key={item.label} className="rounded-3xl border border-zinc-800 bg-black p-5">
              <div className="flex items-start justify-between gap-4">
                <h3 className="font-semibold text-zinc-100">{item.label}</h3>
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{item.status}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{item.note}</p>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function buildSessionSummaryText(projectSession, draftAnalysis, humanizedAnalysis, reviewMode, selectedPreset) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const readinessScore = getTechnicalReadinessScore(activeAnalysis);
  const priorityScore = getHumanizationPriorityScore(activeAnalysis);
  const priorityLabel = getHumanizationPriorityLabel(priorityScore);
  const actionPlan = buildHumanizationActionPlan(activeAnalysis);
  const mainFocus = actionPlan.map((item) => item.action).slice(0, 3).join(", ");
  const exportStatus = activeAnalysis && activeAnalysis.status === "Ready" ? "Ready for report/export" : "Waiting for audio";
  const newline = String.fromCharCode(10);

  return [
    "SOULFRAME SESSION SUMMARY",
    "",
    `Project: ${projectSession.projectName || "Untitled Project"}`,
    `Client: ${projectSession.clientName || "Not specified"}`,
    `Mode: ${reviewMode === "compare" ? "Before / After Review" : "Draft Review"}`,
    `Review Preset: ${selectedPreset || "Standard"}`,
    `Technical Readiness: ${activeAnalysis && activeAnalysis.status === "Ready" ? `${readinessScore}/100` : "Waiting"}`,
    `Humanization Priority: ${activeAnalysis && activeAnalysis.status === "Ready" ? `${priorityLabel} (${priorityScore}/100)` : "Waiting"}`,
    `Main Focus: ${mainFocus || "Upload audio to generate focus"}`,
    `Export Status: ${exportStatus}`,
  ].join(newline);
}

function SessionSummaryCard({ projectSession, draftAnalysis, humanizedAnalysis, reviewMode, selectedPreset }) {
  const [copyStatus, setCopyStatus] = useState("Copy Summary");
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const readinessScore = getTechnicalReadinessScore(activeAnalysis);
  const priorityScore = getHumanizationPriorityScore(activeAnalysis);
  const priorityLabel = getHumanizationPriorityLabel(priorityScore);
  const actionPlan = buildHumanizationActionPlan(activeAnalysis);
  const mainFocus = actionPlan.map((item) => item.action).slice(0, 3).join(", ");
  const exportStatus = activeAnalysis && activeAnalysis.status === "Ready" ? "Ready for report/export" : "Waiting for audio";

  async function handleCopySummary() {
    try {
      await navigator.clipboard.writeText(buildSessionSummaryText(projectSession, draftAnalysis, humanizedAnalysis, reviewMode, selectedPreset));
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy Summary"), 1500);
    } catch (error) {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus("Copy Summary"), 1500);
    }
  }

  const summaryRows = [
    { label: "Project", value: projectSession.projectName || "Untitled Project" },
    { label: "Client", value: projectSession.clientName || "Not specified" },
    { label: "Mode", value: reviewMode === "compare" ? "Before / After Review" : "Draft Review" },
    { label: "Review Preset", value: selectedPreset || "Standard" },
    { label: "Technical Readiness", value: activeAnalysis && activeAnalysis.status === "Ready" ? `${readinessScore}/100` : "Waiting" },
    { label: "Humanization Priority", value: activeAnalysis && activeAnalysis.status === "Ready" ? `${priorityLabel} (${priorityScore}/100)` : "Waiting" },
    { label: "Main Focus", value: mainFocus || "Upload audio to generate focus" },
    { label: "Export Status", value: exportStatus },
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Session Summary Card</h2>
            <p className="mt-1 text-sm text-zinc-400">
              A clean snapshot of the current review session for screenshots, handoff, or final checks.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="w-fit rounded-full border border-zinc-700 px-4 py-2 text-xs uppercase tracking-[0.25em] text-zinc-400">
              SoulFrame Summary
            </span>
            <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={handleCopySummary}>
              {copyStatus}
            </Button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {summaryRows.map((row) => (
            <div key={row.label} className="rounded-3xl border border-zinc-800 bg-black p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">{row.label}</p>
              <p className="mt-2 text-sm font-semibold text-zinc-100">{row.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RevisionChecklistPanel({ projectSession, report, draftAnalysis, humanizedAnalysis, reviewMode }) {
  const [copyStatus, setCopyStatus] = useState("Copy Revision Checklist");
  const [downloadStatus, setDownloadStatus] = useState("Download Revision Checklist");
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const checklistItems = buildRevisionChecklistItems(report, activeAnalysis, reviewMode);

  async function handleCopyRevisionChecklist() {
    try {
      await navigator.clipboard.writeText(buildRevisionChecklistText(projectSession, report, activeAnalysis, reviewMode));
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy Revision Checklist"), 1500);
    } catch (error) {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus("Copy Revision Checklist"), 1500);
    }
  }

  function handleDownloadRevisionChecklist() {
    const projectName = getSessionValue(projectSession, "projectName");
    const fileName = `${makeSafeFileName(projectName)}_Revision_Checklist.txt`;
    const downloaded = downloadTextFile(fileName, buildRevisionChecklistText(projectSession, report, activeAnalysis, reviewMode));
    setDownloadStatus(downloaded ? "Downloaded" : "Download failed");
    window.setTimeout(() => setDownloadStatus("Download Revision Checklist"), 1500);
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Revision Checklist Generator</h2>
            <p className="mt-1 text-sm text-zinc-400">A focused checklist for the next humanization pass.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={handleCopyRevisionChecklist}>{copyStatus}</Button>
            <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={handleDownloadRevisionChecklist}>{downloadStatus}</Button>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {checklistItems.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex gap-3 rounded-2xl border border-zinc-800 bg-black p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-200">{item.label}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DeliveryChecklist({ draftAnalysis, humanizedAnalysis, reviewMode, projectSession }) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const checklist = buildDeliveryChecklist(activeAnalysis, reviewMode);
  const [copyStatus, setCopyStatus] = useState("Copy Checklist");
  const [downloadStatus, setDownloadStatus] = useState("Download Checklist");

  async function handleCopyChecklist() {
    const checklistText = buildDeliveryChecklistText(projectSession, checklist);
    try {
      await navigator.clipboard.writeText(checklistText);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy Checklist"), 1500);
    } catch (error) {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus("Copy Checklist"), 1500);
    }
  }

  function handleDownloadChecklist() {
    const checklistText = buildDeliveryChecklistText(projectSession, checklist);
    const projectName = getSessionValue(projectSession, "projectName");
    const fileName = `${makeSafeFileName(projectName)}_Delivery_Checklist.txt`;
    const downloaded = downloadTextFile(fileName, checklistText);
    setDownloadStatus(downloaded ? "Downloaded" : "Download failed");
    window.setTimeout(() => setDownloadStatus("Download Checklist"), 1500);
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Client Delivery Checklist</h2>
            <p className="mt-1 text-sm text-zinc-400">A practical final-pass checklist before sending the track or report to a client.</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={handleCopyChecklist}>{copyStatus}</Button>
            <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={handleDownloadChecklist}>{downloadStatus}</Button>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          {checklist.map((item, index) => (
            <div key={`${item.label}-${index}`} className="flex gap-3 rounded-2xl border border-zinc-800 bg-black p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-200">{item.label}</p>
                <p className="mt-1 text-xs text-zinc-500">{item.status}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ReportView({ report, reviewMode, projectSession, draftAudioMetadata, humanizedAudioMetadata, draftAudioAnalysis, humanizedAudioAnalysis, selectedPreset }) {
  const scoreLabel = useMemo(() => getScoreLabel(report.score), [report.score]);
  const audioContext = useMemo(() => ({ draftMetadata: draftAudioMetadata, humanizedMetadata: humanizedAudioMetadata, draftAnalysis: draftAudioAnalysis, humanizedAnalysis: humanizedAudioAnalysis }), [draftAudioMetadata, humanizedAudioMetadata, draftAudioAnalysis, humanizedAudioAnalysis]);
  const [clientUpdate, setClientUpdate] = useState(() => buildClientUpdate(report, "balanced", projectSession, audioContext));
  const [copyStatus, setCopyStatus] = useState("Copy Full Report");
  const [downloadStatus, setDownloadStatus] = useState("Download Report");
  const [clientCopyStatus, setClientCopyStatus] = useState("Copy Client Update");
  const [clientDownloadStatus, setClientDownloadStatus] = useState("Download Client Update");
  const [clientSummaryStatus, setClientSummaryStatus] = useState("Copy Client-Safe Summary");
  const [reportTone, setReportTone] = useState("producer");

  useEffect(() => { setClientUpdate(buildClientUpdate(report, "balanced", projectSession, audioContext)); }, [report, projectSession, audioContext]);

  async function handleCopyFullReport() {
    const reportText = buildFullReportText({ report, reviewMode, projectSession, draftAudioMetadata, humanizedAudioMetadata, draftAudioAnalysis, humanizedAudioAnalysis, clientUpdate, reportTone });
    try {
      await navigator.clipboard.writeText(reportText);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy Full Report"), 1500);
    } catch (error) {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus("Copy Full Report"), 1500);
    }
  }

  function handleDownloadFullReport() {
    const reportText = buildFullReportText({ report, reviewMode, projectSession, draftAudioMetadata, humanizedAudioMetadata, draftAudioAnalysis, humanizedAudioAnalysis, clientUpdate, reportTone });
    const projectName = getSessionValue(projectSession, "projectName");
    const fileName = `${makeSafeFileName(projectName)}_SoulFrame_Report.txt`;
    const downloaded = downloadTextFile(fileName, reportText);
    setDownloadStatus(downloaded ? "Downloaded" : "Download failed");
    window.setTimeout(() => setDownloadStatus("Download Report"), 1500);
  }

  async function handleCopyClientUpdate() {
    try {
      await navigator.clipboard.writeText(clientUpdate);
      setClientCopyStatus("Copied");
      window.setTimeout(() => setClientCopyStatus("Copy Client Update"), 1500);
    } catch (error) {
      setClientCopyStatus("Copy failed");
      window.setTimeout(() => setClientCopyStatus("Copy Client Update"), 1500);
    }
  }

  function handleDownloadClientUpdate() {
    const projectName = getSessionValue(projectSession, "projectName");
    const fileName = `${makeSafeFileName(projectName)}_Client_Update.txt`;
    const downloaded = downloadTextFile(fileName, clientUpdate);
    setClientDownloadStatus(downloaded ? "Downloaded" : "Download failed");
    window.setTimeout(() => setClientDownloadStatus("Download Client Update"), 1500);
  }

  async function handleCopyClientSafeSummary() {
    const activeAnalysis = reviewMode === "compare" ? humanizedAudioAnalysis || draftAudioAnalysis : draftAudioAnalysis;
    const summaryText = buildClientSafeReportSummaryText(projectSession, report, activeAnalysis, reviewMode);
    try {
      await navigator.clipboard.writeText(summaryText);
      setClientSummaryStatus("Copied");
      window.setTimeout(() => setClientSummaryStatus("Copy Client-Safe Summary"), 1500);
    } catch (error) {
      setClientSummaryStatus("Copy failed");
      window.setTimeout(() => setClientSummaryStatus("Copy Client-Safe Summary"), 1500);
    }
  }

  return (
    <section className="space-y-6 lg:col-span-2">
      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div><h2 className="text-2xl font-semibold">{reviewMode === "compare" ? "Before / After Report" : "Draft Review Report"}</h2><p className="mt-1 text-zinc-400">{report.project}</p><p className="mt-3 max-w-3xl text-sm text-zinc-400">{report.summary}</p></div>
            <div className="flex flex-col gap-3"><div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm"><p className="text-zinc-400">Verdict</p><p className="mt-1 font-semibold text-zinc-100">{report.verdict}</p></div><div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2 rounded-2xl border border-zinc-800 bg-black p-1">
                    {["producer", "client"].map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setReportTone(tone)}
                        className={`rounded-xl px-3 py-2 text-xs font-semibold transition ${reportTone === tone ? "bg-zinc-100 text-black" : "text-zinc-400 hover:text-zinc-100"}`}
                      >
                        {tone === "client" ? "Client Report" : "Producer Report"}
                      </button>
                    ))}
                  </div>
                  <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={handleCopyFullReport}>{copyStatus}</Button>
                  <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={handleDownloadFullReport}>{downloadStatus}</Button>
                  <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={handleCopyClientSafeSummary}>{clientSummaryStatus}</Button>
                </div></div>
          </div>
          <div className="mb-6 rounded-3xl border border-zinc-800 bg-black p-5"><p className="text-sm text-zinc-400">{scoreLabel}</p><p className="mt-1 text-4xl font-bold text-zinc-100">{clampScore(report.score)}/100</p></div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">{report.scores.map((score) => <ScoreBar key={score.label} label={score.label} value={score.value} status={score.status} />)}</div>
        </CardContent>
      </Card>

      <AudioFactsSummary draftMetadata={draftAudioMetadata} humanizedMetadata={humanizedAudioMetadata} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} reviewMode={reviewMode} />
      <BeforeAfterComparisonSummary draftMetadata={draftAudioMetadata} humanizedMetadata={humanizedAudioMetadata} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} reviewMode={reviewMode} />
      <ArtifactCluePanel draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} reviewMode={reviewMode} />
      <ListeningFocusPanel draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} reviewMode={reviewMode} />
      <HumanizationPriorityPanel draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} reviewMode={reviewMode} />
      <SectionReviewNotesPanel draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} reviewMode={reviewMode} />
      <HumanizationActionPlanPanel draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} reviewMode={reviewMode} projectSession={projectSession} />
      <HumanizationDeltaPanel draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} reviewMode={reviewMode} />
      <SessionSummaryCard projectSession={projectSession} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} reviewMode={reviewMode} selectedPreset={selectedPreset} />
      <RevisionChecklistPanel projectSession={projectSession} report={report} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} reviewMode={reviewMode} />
      <DeliveryChecklist draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} reviewMode={reviewMode} projectSession={projectSession} />

      <Panel title={reviewMode === "compare" ? "Next Pass Priorities" : "Fix Priorities"} subtitle="The recommended order of work for a more human result."><div className="space-y-3">{report.priorities.map((priority, index) => <div key={priority} className="flex gap-3 rounded-2xl border border-zinc-800 bg-black p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span><p className="text-sm text-zinc-200">{priority}</p></div>)}</div></Panel>
      <Panel title={reviewMode === "compare" ? "Comparison Findings" : "Detected Issues"} subtitle="Timestamped notes showing what improved and what still needs work."><div className="space-y-4">{report.issues.map((issue) => <article key={issue.id} className="rounded-3xl border border-zinc-800 bg-black p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-zinc-400">{issue.time} - {issue.category}</p><h3 className="mt-2 text-lg font-semibold text-zinc-100">{issue.title}</h3><p className="mt-2 text-sm text-zinc-400">{issue.note}</p></div><span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{issue.severity}</span></div><div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="text-xs uppercase tracking-wide text-zinc-500">Suggested Humanization</p><p className="mt-1 text-sm text-zinc-200">{issue.fix}</p></div></article>)}</div></Panel>
      <Card><CardContent className="p-6"><h2 className="text-2xl font-semibold">Client-Risk Summary</h2><p className="mt-3 text-sm text-zinc-300">{report.clientRisk}</p></CardContent></Card>
      <Card><CardContent className="p-6"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-semibold">Generate Client Update</h2><p className="mt-1 text-sm text-zinc-400">Turn the technical review into a clean message you can send to a client.</p></div><Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={() => setClientUpdate(buildClientUpdate(report, "balanced", projectSession, audioContext))}>Generate Update</Button></div><div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3"><button type="button" className="rounded-2xl border border-zinc-800 bg-black p-4 text-left text-sm text-zinc-300 hover:bg-zinc-900" onClick={() => setClientUpdate(buildClientUpdate(report, "balanced", projectSession, audioContext))}><span className="block font-semibold text-zinc-100">Balanced</span><span className="mt-1 block text-xs text-zinc-500">Clear, professional, detailed.</span></button><button type="button" className="rounded-2xl border border-zinc-800 bg-black p-4 text-left text-sm text-zinc-300 hover:bg-zinc-900" onClick={() => setClientUpdate(buildClientUpdate(report, "short", projectSession, audioContext))}><span className="block font-semibold text-zinc-100">Short Update</span><span className="mt-1 block text-xs text-zinc-500">Useful for quick client check-ins.</span></button><button type="button" className="rounded-2xl border border-zinc-800 bg-black p-4 text-left text-sm text-zinc-300 hover:bg-zinc-900" onClick={() => setClientUpdate(buildClientUpdate(report, "detailed", projectSession, audioContext))}><span className="block font-semibold text-zinc-100">Detailed</span><span className="mt-1 block text-xs text-zinc-500">Best for technical progress updates.</span></button></div><textarea className="min-h-40 w-full resize-none rounded-2xl border border-zinc-800 bg-black p-5 text-sm leading-6 text-zinc-300 outline-none focus:ring-2 focus:ring-zinc-500" value={clientUpdate} onChange={(event) => setClientUpdate(event.target.value)} />
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={handleCopyClientUpdate}>{clientCopyStatus}</Button>
          <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={handleDownloadClientUpdate}>{clientDownloadStatus}</Button>
        </div></CardContent></Card>
    </section>
  );
}

function buildShareLinksText() {
  const newline = String.fromCharCode(10);
  return [
    "SOULFRAME PUBLIC LINKS",
    "",
    ...publicShareLinks.map((link) => `${link.label}: ${link.href}`),
    "",
    "SoulFrame is an AI music humanization review tool built to support producers working with AI-generated music.",
  ].join(newline);
}

function buildProductSummaryText() {
  const newline = String.fromCharCode(10);
  return [
    "SOULFRAME PRODUCT SUMMARY",
    "",
    "SoulFrame is an AI music humanization review tool built to support producers working with AI-generated music.",
    "",
    "Mission:",
    "Humanize sound. Bring soul back into music. Use AI as a tool, not a replacement.",
    "",
    "Core workflow:",
    "Review → Decide → Export → Send → Revise",
    "",
    "What it does:",
    "- Upload and inspect AI-generated music drafts",
    "- Read waveform, metadata, audio health, brightness, and texture movement",
    "- Generate early artifact clues and humanization priorities",
    "- Create producer action plans and client-safe summaries",
    "- Export reports, client plans, revision checklists, and project summaries",
    "",
    "Current stage:",
    "V5.3 report sharing and export prototype with a dashboard-first product shell, modular product/report UI, cleaner producer/client reports, local downloads, browser-native share direction, before/after case studies, client delivery handoff, V4 audio intelligence, V4.2 smarter reports, V4.1 backend/API scaffolding, and local project sessions.",
  ].join(newline);
}

function AnalysisProgress({ activeStep }) {
  return <Card className="lg:col-span-2"><CardContent className="p-6"><h2 className="text-2xl font-semibold">SoulFrame is listening</h2><div className="mt-6 space-y-4">{analysisSteps.map((step, index) => <div key={step} className="rounded-2xl border border-zinc-800 bg-black p-4"><p className="font-semibold text-zinc-100">{index < activeStep ? "✓" : index + 1}. {step}</p></div>)}</div></CardContent></Card>;
}

function ReviewSetupPanel({ reviewMode, setReviewMode, draftFile, humanizedFile, draftAudioUrl, humanizedAudioUrl, draftAudioMetadata, humanizedAudioMetadata, draftAudioAnalysis, humanizedAudioAnalysis, handleDraftFileChange, handleHumanizedFileChange, selectedPreset, setSelectedPreset, handleRunAnalysis, testsPassed }) {
  return (
    <Card className="lg:col-span-1">
      <CardContent className="space-y-6 p-6">
        <div><h2 className="flex items-center gap-2 text-xl font-semibold"><Icon>〰</Icon>{reviewMode === "compare" ? "Before / After Review" : "New Draft Review"}</h2><p className="mt-2 text-sm text-zinc-400">{reviewMode === "compare" ? "Compare the original AI draft against your humanized edit." : "Start with one AI-generated draft and identify what needs to be humanized first."}</p></div>
        <div className="grid grid-cols-2 gap-3"><button type="button" className={`rounded-2xl border p-4 text-left text-sm ${reviewMode === "draft" ? "border-white bg-zinc-900 text-white" : "border-zinc-800 bg-black text-zinc-400"}`} onClick={() => setReviewMode("draft")}>Draft Review</button><button type="button" className={`rounded-2xl border p-4 text-left text-sm ${reviewMode === "compare" ? "border-white bg-zinc-900 text-white" : "border-zinc-800 bg-black text-zinc-400"}`} onClick={() => setReviewMode("compare")}>Before / After</button></div>
        <UploadBox fileName={draftFile} onFileChange={handleDraftFileChange} title="Upload Original AI Draft" description="Upload the raw AI-generated track before humanization." />
        <AudioPreview src={draftAudioUrl} label="Original AI Draft Preview" />
        <WaveformPreview src={draftAudioUrl} label="Original AI Draft Waveform" />
        <AudioHealthCheck analysis={draftAudioAnalysis} label="Original AI Draft Health Check" />
        <AudioMetadata metadata={draftAudioMetadata} label="Original AI Draft Metadata" />
        {reviewMode === "compare" ? <><UploadBox fileName={humanizedFile} onFileChange={handleHumanizedFileChange} title="Upload Humanized Edit" description="Upload your edited version so SoulFrame can compare what improved and what still needs work." /><AudioPreview src={humanizedAudioUrl} label="Humanized Edit Preview" /><WaveformPreview src={humanizedAudioUrl} label="Humanized Edit Waveform" /><AudioHealthCheck analysis={humanizedAudioAnalysis} label="Humanized Edit Health Check" /><AudioMetadata metadata={humanizedAudioMetadata} label="Humanized Edit Metadata" /></> : null}
        {reviewMode === "draft" ? <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><label htmlFor="preset-select" className="block text-sm font-semibold text-zinc-100">Sample Report Type</label><select id="preset-select" value={selectedPreset} onChange={(event) => setSelectedPreset(event.target.value)} className="mt-3 w-full rounded-xl border border-zinc-800 bg-black p-3 text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-zinc-500">{Object.entries(draftReports).map(([key, report]) => <option key={key} value={key}>{report.name}</option>)}</select></div> : <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300"><span className="block font-semibold text-zinc-100">Comparison Mode</span><span className="mt-2 block text-zinc-400">SoulFrame will compare the AI draft against the humanized edit and summarize what improved.</span></div>}
        <Button className="w-full bg-white py-6 text-black hover:bg-zinc-200" onClick={handleRunAnalysis}>{reviewMode === "compare" ? "Run Before / After Review" : "Run Draft Review"}</Button>
        <div className="rounded-2xl border border-zinc-800 bg-black p-3 text-xs text-zinc-400">Prototype mode: simulated analysis. Audio preview, metadata, waveform, health check, spectral texture proxies, early artifact clues, producer listening focus, humanization priority score, section-by-section review notes, humanization action plan, client action plan export, client-safe summary copy, revision checklist generator, producer/client-safe note toggle, before/after humanization delta, session summary card, copy session summary, error boundary protection, producer/client report export modes, demo mode presets, quick start guide, demo launcher presets, demo readiness banner, public demo notice, demo use cases panel, public launch checklist, public demo stats, release notes panel, roadmap preview, header version badge, share links panel, public footer links, neutral public demo naming, save demo preset as project, product summary export, client update export, searchable saved projects, import/export backup, and local session save: <span className="text-zinc-100">enabled</span>. Self-tests: <span className={testsPassed ? "text-zinc-100" : "text-red-300"}>{testsPassed ? "passed" : "failed"}</span>.</div>
      </CardContent>
    </Card>
  );
}

export default function SoulFrameDraftReviewV2() {
  const [view, setView] = useState("product");
  const [activeStep, setActiveStep] = useState(0);
  const [draftFile, setDraftFile] = useState("");
  const [humanizedFile, setHumanizedFile] = useState("");
  const [draftAudioUrl, setDraftAudioUrl] = useState("");
  const [humanizedAudioUrl, setHumanizedAudioUrl] = useState("");
  const [draftAudioMetadata, setDraftAudioMetadata] = useState(null);
  const [humanizedAudioMetadata, setHumanizedAudioMetadata] = useState(null);
  const [draftAudioAnalysis, setDraftAudioAnalysis] = useState(null);
  const [humanizedAudioAnalysis, setHumanizedAudioAnalysis] = useState(null);
  const {
    selectedPreset, setSelectedPreset,
    reviewMode, setReviewMode,
    projectSession, setProjectSession,
    savedProjects,
    resetProjectSession, applyDemoPreset, saveDemoPresetAsProject,
    saveProjectSnapshot, loadSavedProjectSnapshot, deleteSavedProject,
    clearSavedProjects, importSavedProjectsBackup,
  } = useProjectSessions({ demoPresets, onPresetApplied: () => setActiveStep(0) });
  const selectedReport = reviewMode === "compare" ? beforeAfterReport : draftReports[selectedPreset];
  const testsPassed = runSoulFrameTests();

  useEffect(() => {
    if (activeStep <= 0 || activeStep >= analysisSteps.length) return undefined;
    const timer = window.setTimeout(() => setActiveStep((current) => Math.min(current + 1, analysisSteps.length)), 450);
    return () => window.clearTimeout(timer);
  }, [activeStep]);

  useEffect(() => () => { if (draftAudioUrl) URL.revokeObjectURL(draftAudioUrl); if (humanizedAudioUrl) URL.revokeObjectURL(humanizedAudioUrl); }, [draftAudioUrl, humanizedAudioUrl]);

  function handleRunAnalysis() { setActiveStep(1); }

  function handleDraftFileChange(event) {
    const file = event.target.files && event.target.files[0];
    const nextUrl = file ? URL.createObjectURL(file) : "";
    setDraftFile(file ? file.name : "");
    setDraftAudioMetadata(file ? buildInitialAudioMetadata(file) : null);
    setDraftAudioAnalysis(file ? { status: "Queued" } : null);
    setDraftAudioUrl((currentUrl) => { if (currentUrl) URL.revokeObjectURL(currentUrl); return nextUrl; });
    if (file && nextUrl) { loadAudioDuration(nextUrl, setDraftAudioMetadata); loadAudioHealthCheck(nextUrl, setDraftAudioAnalysis); }
  }

  function handleHumanizedFileChange(event) {
    const file = event.target.files && event.target.files[0];
    const nextUrl = file ? URL.createObjectURL(file) : "";
    setHumanizedFile(file ? file.name : "");
    setHumanizedAudioMetadata(file ? buildInitialAudioMetadata(file) : null);
    setHumanizedAudioAnalysis(file ? { status: "Queued" } : null);
    setHumanizedAudioUrl((currentUrl) => { if (currentUrl) URL.revokeObjectURL(currentUrl); return nextUrl; });
    if (file && nextUrl) { loadAudioDuration(nextUrl, setHumanizedAudioMetadata); loadAudioHealthCheck(nextUrl, setHumanizedAudioAnalysis); }
  }

  const productView = (
    <V51ProductWorkspace
      shell={buildV51DashboardShellState(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
      hero={buildV52PresentationHeroState(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
      valueStrip={buildV52PublicBetaValueStrip(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
      workflowPreview={buildV52PublicBetaWorkflowPreview(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
      getHeaderState={(activeTab) => buildV51WorkspaceHeaderState(activeTab, projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
      getProgressRailState={(activeTab) => buildV51WorkspaceProgressRailState(activeTab, projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
      PanelComponent={Panel}
      dashboardContent={({ setActiveTab }) => (
        <div className="space-y-6">
          <V51DashboardActionCardsPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} setActiveTab={setActiveTab} />
          <V52PublicDemoScenarioCards applyDemoPreset={applyDemoPreset} setActiveTab={setActiveTab} />
          <QuickStartGuide applyDemoPreset={applyDemoPreset} setView={setView} />
        </div>
      )}
      analyzeContent={({ setActiveTab }) => (
        <div className="space-y-6">
          <V51FocusedAnalyzeWorkspacePanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} setActiveTab={setActiveTab} />
          <ProjectIntake projectSession={projectSession} setProjectSession={setProjectSession} selectedReport={selectedReport} resetProjectSession={resetProjectSession} saveProjectSnapshot={saveProjectSnapshot} savedProjectsCount={savedProjects.length} applyDemoPreset={applyDemoPreset} saveDemoPresetAsProject={saveDemoPresetAsProject} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <ReviewSetupPanel reviewMode={reviewMode} setReviewMode={setReviewMode} draftFile={draftFile} humanizedFile={humanizedFile} draftAudioUrl={draftAudioUrl} humanizedAudioUrl={humanizedAudioUrl} draftAudioMetadata={draftAudioMetadata} humanizedAudioMetadata={humanizedAudioMetadata} draftAudioAnalysis={draftAudioAnalysis} humanizedAudioAnalysis={humanizedAudioAnalysis} handleDraftFileChange={handleDraftFileChange} handleHumanizedFileChange={handleHumanizedFileChange} selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} handleRunAnalysis={handleRunAnalysis} testsPassed={testsPassed} />
            {activeStep > 0 && activeStep < analysisSteps.length ? <AnalysisProgress activeStep={activeStep} /> : <ReportView report={selectedReport} reviewMode={reviewMode} projectSession={projectSession} draftAudioMetadata={draftAudioMetadata} humanizedAudioMetadata={humanizedAudioMetadata} draftAudioAnalysis={draftAudioAnalysis} humanizedAudioAnalysis={humanizedAudioAnalysis} selectedPreset={selectedPreset} />}
          </div>
        </div>
      )}
      reportContent={({ setActiveTab }) => (
        <V54ReportWorkspaceCleanup
          summary={buildV54ReportWorkspaceCleanup(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
          setActiveTab={setActiveTab}
          primaryContent={
            <V53CleanReportPreview
              report={buildV53CleanReportPreview(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
              producerText={buildV53CleanReportPreviewText(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis, "producer")}
              clientText={buildV53CleanReportPreviewText(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis, "client")}
              exportPack={buildV53DownloadableReportExport(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
              sharePack={buildV53ShareableReportDirection(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
            />
          }
          comparisonContent={
            <V53BeforeAfterCaseStudy
              caseStudy={buildV53BeforeAfterCaseStudy(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
              caseStudyText={buildV53BeforeAfterCaseStudyText(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
            />
          }
          detailsContent={
            <>
              <V42ReportControlCenterPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
              <V42SmartReportComposerPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
              <V42ReportQualityGatePanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
              {reviewMode === "compare" ? <V42BeforeAfterExplanationPanel draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} /> : null}
              <ProjectWorkflow reviewMode={reviewMode} selectedReport={selectedReport} />
              <RevisionPlan selectedReport={selectedReport} reviewMode={reviewMode} />
            </>
          }
        />
      )}
      outputContent={({ setActiveTab }) => (
        <V54OutputWorkspaceCleanup
          evidence={getV54OutputEvidenceStatus(reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
          setActiveTab={setActiveTab}
          deliveryContent={
            <V53ClientDeliveryExperience
              delivery={buildV53ClientDeliveryExperience(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
              deliveryText={buildV53ClientDeliveryExperienceText(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
              setActiveTab={setActiveTab}
            />
          }
          supportingContent={
            <div className="space-y-6">
              <V42ReportOutputPackPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
              <V42FinalReportHandoffPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
              <V42ReportExportManifestPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
            </div>
          }
          sessionsContent={
            <SavedProjectHistory savedProjects={savedProjects} loadSavedProjectSnapshot={loadSavedProjectSnapshot} deleteSavedProject={deleteSavedProject} clearSavedProjects={clearSavedProjects} importSavedProjectsBackup={importSavedProjectsBackup} />
          }
        />
      )}
      advancedContent={({ setActiveTab }) => (
        <V54AdvancedWorkspaceCleanup
          setActiveTab={setActiveTab}
          technicalContent={
            <div className="space-y-6">
              <V51FocusedAdvancedWorkspacePanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} setActiveTab={setActiveTab} />
              <V41BackendScaffoldPanel />
              <V41AnalysisEngineSeparationPanel />
              <V41MockApiResponsePanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
              <V41FrontendApiAdapterPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
            </div>
          }
          uxContent={
            <div className="space-y-6">
              <V52DashboardClarityCleanupPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
              <V50ProductNavigationBlueprintPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
              <V50ProgressiveDisclosurePanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
              <V50TabbedWorkflowShellPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
              <V50AdvancedPanelCollapseStrategyPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
            </div>
          }
          betaContent={
            <div className="space-y-6">
              <PublicDemoNotice />
              <V52PublicBetaScreenshotGuidePanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} setActiveTab={setActiveTab} />
              <V52PublicBetaPresentationHandoffPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
            </div>
          }
          historyContent={
            <div className="space-y-6">
              <V53ReportSharingExportHandoff
                handoff={buildV53ReportSharingExportHandoff(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
                handoffText={buildV53ReportSharingExportHandoffText(projectSession, reviewMode, draftAudioAnalysis, humanizedAudioAnalysis)}
                setActiveTab={setActiveTab}
              />
              <V51LayoutRefactorHandoffPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
            </div>
          }
        />
      )}
    />
  );

  

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">SoulFrame</p>
                <span className="rounded-full border border-zinc-800 bg-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">V5.4.9 Integration QA</span>
              </div>
              <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">AI Music Humanization Review Tool</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">Upload an AI draft, preview the audio, map the humanization priorities, and generate a clean client update from the review.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className={view === "product" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("product")}>Product</Button>
              <Button className={view === "demo" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("demo")}>Classic Demo</Button>
              <Button className={view === "database" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("database")}>Artifact Database</Button>
              <Button className={view === "about" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("about")}>About</Button>
              <Button className={view === "walkthrough" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("walkthrough")}>Walkthrough</Button>
              <Button className={view === "how" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("how")}>How It Works</Button>
              <Button className={view === "share" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("share")}>Share</Button>
            </div>
          </div>
        </header>
        <ErrorBoundary>
          {view === "product" ? productView : view === "demo" ? (
            <React.Suspense fallback={<Panel title="Loading Classic Demo" subtitle="Opening the legacy review experience..." />}>
              <ClassicDemo
                Panel={Panel}
                shared={{
                AnalysisProgress,
                ProjectIntake,
                ProjectWorkflow,
                PublicDemoNotice,
                QuickStartGuide,
                ReportView,
                ReviewSetupPanel,
                RevisionPlan,
                SavedProjectHistory,
                V41AnalysisEngineSeparationPanel,
                V41BackendScaffoldPanel,
                V41FrontendApiAdapterPanel,
                V41MockApiResponsePanel,
                V42BeforeAfterExplanationPanel,
                V42ClientToneDraftPanel,
                V42FinalReportHandoffPanel,
                V42GenreRecommendationPanel,
                V42PathSpecificReportPanel,
                V42ReportControlCenterPanel,
                V42ReportExportManifestPanel,
                V42ReportOutputPackPanel,
                V42ReportQualityGatePanel,
                V42SmartReportComposerPanel,
                V42SmarterReportRouterPanel,
                V50AdvancedPanelCollapseStrategyPanel,
                V50CleanDashboardPriorityPanel,
                V50ProductDashboardPreviewPanel,
                V50ProductNavigationBlueprintPanel,
                V50ProgressiveDisclosurePanel,
                V50PublicBetaUxHandoffPanel,
                V50TabbedWorkflowShellPanel
                }}
                state={{
                applyDemoPreset,
                setView,
                projectSession,
                reviewMode,
                draftAudioAnalysis,
                humanizedAudioAnalysis,
                savedProjects,
                setProjectSession,
                selectedReport,
                resetProjectSession,
                saveProjectSnapshot,
                saveDemoPresetAsProject,
                draftAudioMetadata,
                humanizedAudioMetadata,
                loadSavedProjectSnapshot,
                deleteSavedProject,
                clearSavedProjects,
                importSavedProjectsBackup,
                setReviewMode,
                draftFile,
                humanizedFile,
                draftAudioUrl,
                humanizedAudioUrl,
                handleDraftFileChange,
                handleHumanizedFileChange,
                selectedPreset,
                setSelectedPreset,
                handleRunAnalysis,
                testsPassed,
                activeStep,
                analysisSteps
                }}
                helpers={{ getSessionValue, getDeliveryReadiness, formatDuration, formatFileSize, buildRevisionTimeline }}
                demoStats={{ presets: Object.keys(demoPresets).length, artifacts: artifactDatabase.length, steps: demoWalkthroughSteps.length }}
              />
            </React.Suspense>
          ) : (
            <React.Suspense fallback={<Panel title="Loading" subtitle="Opening the requested SoulFrame page..." />}>
              <SecondaryViews
                page={view}
                Panel={Panel}
                Button={Button}
                publicShareLinks={publicShareLinks}
                buildShareLinksText={buildShareLinksText}
                downloadTextFile={downloadTextFile}
                buildProductSummaryText={buildProductSummaryText}
                demoWalkthroughSteps={demoWalkthroughSteps}
                artifactDatabase={artifactDatabase}
              />
            </React.Suspense>
          )}
        </ErrorBoundary>
        <SoulFrameFooter setView={setView} />
      </div>
    </main>
  );
}