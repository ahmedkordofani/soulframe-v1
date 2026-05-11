import React, { useEffect, useMemo, useState } from "react";

const analysisSteps = [
  "Uploading audio files",
  "Scanning vocal realism and synthetic artifacts",
  "Checking instrumental texture and audio stability",
  "Reviewing arrangement flow and emotional movement",
  "Generating SoulFrame report",
];

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
      { id: "metallic-vocal-sustain", time: "0:38-0:55", title: "Metallic vocal sustain", severity: "High", category: "Vocal Realism", note: "The vocal has a bright metallic coating during sustained vowels, making it feel AI-generated.", fix: "Smooth harsh upper mids, add subtle saturation, and automate phrase-level warmth." },
      { id: "vocal-cracking-highs", time: "1:21-1:34", title: "Cracking on higher notes", severity: "High", category: "Vocal Stability", note: "The vocal fractures slightly when reaching the upper register.", fix: "Repair the phrase manually, replace the cracked syllable, or layer a cleaner vocal pass." },
      { id: "static-emotion", time: "2:02-2:19", title: "Static emotional delivery", severity: "Moderate", category: "Emotional Authenticity", note: "The phrase intensity stays too even and does not build naturally across the section.", fix: "Use volume automation, subtle timing offsets, and breath or texture layers to create a more human performance arc." },
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
      { id: "artificial-shimmer", time: "0:16-0:44", title: "Artificial shimmer", severity: "Moderate", category: "Instrument Realism", note: "The top-end sparkle feels overly glossy and digitally generated.", fix: "Soften upper harmonics, add analog-style coloration, and rebalance the brightness." },
      { id: "buzzing-residue", time: "1:08-1:25", title: "Buzzing residue", severity: "Moderate", category: "Audio Stability", note: "A low-level buzz is embedded beneath the instrumental layer.", fix: "Use spectral cleanup, denoising, or replace the affected layer with a cleaner sound." },
      { id: "loop-repetition", time: "2:10-2:46", title: "Repetition syndrome", severity: "Low", category: "Arrangement Logic", note: "The phrase repeats too consistently without enough human variation.", fix: "Add articulation changes, small fills, tonal movement, or a counter-layer." },
    ],
  },
  marcel: {
    name: "Marcel-Style Draft Review",
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
      { id: "ai-resonance", time: "0:42-0:58", title: "AI-related harsh resonance", severity: "Moderate", category: "Vocal Realism", note: "The vocal or mix contains harsh resonant energy that makes the track feel slightly synthetic.", fix: "Use artifact cleanup, resonance control, tonal balancing, and subtle saturation." },
      { id: "chorus-impact", time: "0:34, 1:19, 2:07", title: "Chorus entries need more impact", severity: "Moderate", category: "Arrangement Logic", note: "The first hits into the choruses could land with more intention after the pauses.", fix: "Add subtle punch reinforcement through transient shaping, micro-automation, or supportive low-end impact layers." },
      { id: "delay-prominence", time: "General vocal space", title: "Vocal delay slightly prominent", severity: "Low", category: "Spatial Translation", note: "The delay supports depth, but the repeat could become too noticeable on some systems.", fix: "Lower feedback, reduce wet level slightly, filter the delay, and keep stereo depth if the image remains stable." },
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
    { id: "improved-impact", time: "0:34, 1:19, 2:07", title: "Chorus impact improved", severity: "Positive", category: "Before / After Change", note: "The edit gives the chorus entries more intention and makes the track feel less flat compared with the original AI draft.", fix: "Keep the added impact, but check that it does not overpower the vocal or change the client's intended direction." },
    { id: "remaining-vocal-edge", time: "0:42-0:58", title: "Remaining synthetic vocal edge", severity: "Moderate", category: "Remaining Issue", note: "The vocal is improved, but a slight AI-like edge may still be present during sustained phrases.", fix: "Apply a final resonance check, automate warmth, and compare against the raw AI draft to make sure the change is genuinely more human." },
    { id: "preserve-emotion", time: "Full track", title: "Preserve emotional direction", severity: "Low", category: "Creative Risk", note: "The edit sounds cleaner, but humanization should not remove too much of the original raw character.", fix: "Avoid overprocessing. Keep the parts that already feel emotionally convincing and only repair what clearly sounds synthetic." },
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

const scoreTests = [
  { input: 79, expected: 79 },
  { input: -12, expected: 0 },
  { input: 140, expected: 100 },
  { input: "62", expected: 62 },
  { input: undefined, expected: 0 },
  { input: null, expected: 0 },
  { input: Number.NaN, expected: 0 },
];

const labelTests = [
  { input: 90, expected: "Highly Humanized" },
  { input: 75, expected: "Mostly Human" },
  { input: 60, expected: "Moderate AI Presence" },
  { input: 40, expected: "Strong Synthetic Presence" },
  { input: 39, expected: "Heavy AI Artifacting" },
];

function clampScore(value) {
  return Math.min(100, Math.max(0, Number(value) || 0));
}

function getScoreLabel(score) {
  const value = clampScore(score);
  if (value >= 90) return "Highly Humanized";
  if (value >= 75) return "Mostly Human";
  if (value >= 60) return "Moderate AI Presence";
  if (value >= 40) return "Strong Synthetic Presence";
  return "Heavy AI Artifacting";
}

function getClientRiskLevel(clientRisk) {
  if (clientRisk.startsWith("High")) return "High";
  if (clientRisk.startsWith("Low")) return "Low-Medium";
  return "Medium";
}

function getDeliveryReadiness(score) {
  if (score >= 85) return "Nearly Ready";
  if (score >= 75) return "Close";
  return "Needs Work";
}

function buildRevisionTimeline(reviewMode, report) {
  const isCompareMode = reviewMode === "compare";

  return [
    {
      title: "Original AI Draft",
      status: "Complete",
      description: "Raw AI-generated version scanned for synthetic artifacts, arrangement issues, and emotional realism gaps.",
      focus: "Identify what sounds artificial",
    },
    {
      title: "Edit 1 Humanization",
      status: isCompareMode ? "Complete" : "Next",
      description: isCompareMode ? "The first humanized edit has been compared against the original AI draft." : "Use the current report to guide the first focused humanization pass.",
      focus: report.priorities[0],
    },
    {
      title: "Edit 2 Refinement",
      status: isCompareMode ? "Recommended" : "Pending",
      description: "Tighten the remaining issues after the first pass without changing the core direction of the track.",
      focus: report.priorities[1] || "Refine remaining synthetic details",
    },
    {
      title: "Final Polish",
      status: getDeliveryReadiness(report.score),
      description: "Prepare the track for client delivery with final realism, balance, and translation checks.",
      focus: report.priorities[2] || "Confirm client-ready delivery",
    },
  ];
}

function buildClientUpdate(report, mode = "balanced") {
  const score = clampScore(report.score);
  const topIssues = report.issues.slice(0, 3).map((issue) => `${issue.time}: ${issue.title}`).join("; ");
  const topPriorities = report.priorities.slice(0, 3).join(", ").toLowerCase();

  if (mode === "short") {
    return `Quick update - I reviewed the track and found the main areas that need attention. The biggest priorities are ${report.priorities.slice(0, 2).join(" and ").toLowerCase()}. The track is currently scoring ${score}/100 for humanization, so the next pass will focus on targeted improvements rather than changing the whole direction.`;
  }

  if (mode === "detailed") {
    return `I went through the track in detail and identified the specific areas affecting realism and translation. The main issues are: ${topIssues}. The next pass should focus on ${report.priorities.join(", ").toLowerCase()}. This should help the track feel more natural and emotionally convincing while keeping the original creative direction intact.`;
  }

  return `I've reviewed the track and mapped out the main areas affecting realism. The current SoulFrame humanization score is ${score}/100, with the main focus now being ${topPriorities}. The key areas identified were ${topIssues}. I'll use these points to guide the next pass so the track feels more natural, more polished, and closer to client-ready without changing the original direction too much.`;
}

export function runSoulFrameTests() {
  const scoreTestsPassed = scoreTests.every((testCase) => clampScore(testCase.input) === testCase.expected);
  const labelTestsPassed = labelTests.every((testCase) => getScoreLabel(testCase.input) === testCase.expected);
  const reportTestsPassed = Object.values(draftReports).every((report) => report.issues.length > 0 && report.priorities.length > 0 && report.scores.length > 0);
  const beforeAfterTestsPassed = beforeAfterReport.issues.length === 3 && beforeAfterReport.scores.length === 5;
  const workflowTestsPassed = getClientRiskLevel("High. Test") === "High" && getClientRiskLevel("Low to medium. Test") === "Low-Medium" && getDeliveryReadiness(85) === "Nearly Ready" && getDeliveryReadiness(75) === "Close" && getDeliveryReadiness(74) === "Needs Work";
  const clientUpdateTestsPassed = buildClientUpdate(draftReports.marcel).includes("79/100") && buildClientUpdate(draftReports.marcel, "short").startsWith("Quick update") && buildClientUpdate(beforeAfterReport, "detailed").includes("main issues");
  const revisionTimelineTestsPassed = buildRevisionTimeline("draft", draftReports.marcel).length === 4 && buildRevisionTimeline("compare", beforeAfterReport)[1].status === "Complete" && buildRevisionTimeline("draft", draftReports.vocal)[3].title === "Final Polish";
  return scoreTestsPassed && labelTestsPassed && reportTestsPassed && beforeAfterTestsPassed && workflowTestsPassed && clientUpdateTestsPassed && revisionTimelineTestsPassed;
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
      <div className="h-2 overflow-hidden rounded-full bg-zinc-800"><div className="h-full rounded-full bg-zinc-100 transition-all duration-700 ease-out" style={{ width: `${scoreValue}%` }} /></div>
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

function AnalysisProgress({ activeStep }) {
  return (
    <Card className="lg:col-span-2">
      <CardContent className="p-6">
        <div className="mb-6"><h2 className="text-2xl font-semibold">SoulFrame is listening</h2><p className="mt-1 text-sm text-zinc-400">Demo analysis sequence for the Draft Review V1 workflow.</p></div>
        <div className="space-y-4">
          {analysisSteps.map((step, index) => {
            const isComplete = index < activeStep;
            const isActive = index === activeStep;
            return (
              <div key={step} className={`rounded-2xl border p-4 ${isActive ? "border-white bg-zinc-900" : "border-zinc-800 bg-black"}`}>
                <div className="flex items-center gap-3">
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${isComplete ? "bg-white text-black" : "bg-zinc-800 text-zinc-300"}`}>{isComplete ? "✓" : index + 1}</span>
                  <div><p className="font-semibold text-zinc-100">{step}</p><p className="text-xs text-zinc-500">{isActive ? "In progress..." : isComplete ? "Complete" : "Waiting"}</p></div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectSnapshot({ reviewMode, selectedReport }) {
  const snapshotItems = [
    { label: "Current Stage", value: reviewMode === "compare" ? "Edit Comparison" : "AI Draft Scan", note: reviewMode === "compare" ? "Checking your humanized pass before client delivery." : "Finding what needs to be fixed before Edit 1." },
    { label: "Main Priority", value: selectedReport.priorities[0], note: "This should guide the next focused production pass." },
    { label: "Client Risk", value: getClientRiskLevel(selectedReport.clientRisk), note: "How likely the client is to notice the remaining issues." },
    { label: "Delivery Readiness", value: getDeliveryReadiness(selectedReport.score), note: "Based on the current simulated SoulFrame score." },
  ];
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6"><h2 className="text-2xl font-semibold">Project Snapshot</h2><p className="mt-1 text-sm text-zinc-400">A quick overview of where the track stands right now.</p></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {snapshotItems.map((item) => <article key={item.label} className="rounded-3xl border border-zinc-800 bg-black p-5"><p className="text-xs uppercase tracking-wide text-zinc-500">{item.label}</p><h3 className="mt-3 text-lg font-semibold text-zinc-100">{item.value}</h3><p className="mt-2 text-sm text-zinc-400">{item.note}</p></article>)}
        </div>
      </CardContent>
    </Card>
  );
}

function ProjectWorkflow({ reviewMode, selectedReport }) {
  const workflowSteps = [
    { title: "Original AI Draft", status: reviewMode === "draft" ? "Active" : "Completed", description: "Scan the raw AI-generated song and identify what needs to be humanized first.", output: "Synthetic issues mapped" },
    { title: "Edit 1 / Humanized Pass", status: reviewMode === "compare" ? "Active" : "Next", description: "Compare your first humanized edit against the original AI draft.", output: "Improvements and remaining issues detected" },
    { title: "Client Update", status: "Ready", description: "Turn the SoulFrame review into a clear message to send with the edit.", output: "Progress note ready" },
    { title: "Next Pass Plan", status: "Generated", description: "Use the top priorities to decide what the next revision should focus on.", output: selectedReport.priorities[0] },
  ];
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><h2 className="text-2xl font-semibold">Project Workflow</h2><p className="mt-1 text-sm text-zinc-400">The full SoulFrame loop from AI draft to client-ready update.</p></div><div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">Current mode: <span className="font-semibold text-zinc-100">{reviewMode === "compare" ? "Before / After" : "Draft Scan"}</span></div></div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {workflowSteps.map((step, index) => <article key={step.title} className="rounded-3xl border border-zinc-800 bg-black p-5"><div className="mb-4 flex items-start justify-between gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span><span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{step.status}</span></div><h3 className="font-semibold text-zinc-100">{step.title}</h3><p className="mt-2 text-sm text-zinc-400">{step.description}</p><div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-3"><p className="text-xs uppercase tracking-wide text-zinc-500">Output</p><p className="mt-1 text-sm text-zinc-200">{step.output}</p></div></article>)}
        </div>
      </CardContent>
    </Card>
  );
}

function RevisionPlan({ selectedReport, reviewMode }) {
  const revisionTasks = selectedReport.priorities.map((priority, index) => ({ task: priority, stage: index === 0 ? "Do first" : index === 1 ? "Do second" : "Polish pass", reason: index === 0 ? "Highest impact on perceived human realism." : index === 1 ? "Supports the main improvement area." : "Final refinement before client delivery." }));
  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between"><div><h2 className="text-2xl font-semibold">Next Revision Plan</h2><p className="mt-1 text-sm text-zinc-400">A focused production checklist generated from the SoulFrame report.</p></div><div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">Target: <span className="font-semibold text-zinc-100">{reviewMode === "compare" ? "Final polish" : "Edit 1"}</span></div></div>
        <div className="space-y-3">
          {revisionTasks.map((item, index) => <article key={item.task} className="rounded-3xl border border-zinc-800 bg-black p-5"><div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div className="flex gap-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span><div><h3 className="font-semibold text-zinc-100">{item.task}</h3><p className="mt-1 text-sm text-zinc-400">{item.reason}</p></div></div><span className="w-fit rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{item.stage}</span></div></article>)}
        </div>
      </CardContent>
    </Card>
  );
}

function RevisionTimeline({ reviewMode, selectedReport }) {
  const timeline = buildRevisionTimeline(reviewMode, selectedReport);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Revision History</h2>
            <p className="mt-1 text-sm text-zinc-400">A simple project timeline from raw AI draft to client-ready final polish.</p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
            Workflow: <span className="font-semibold text-zinc-100">{reviewMode === "compare" ? "Comparison" : "Draft to Edit 1"}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {timeline.map((step, index) => (
            <article key={step.title} className="rounded-3xl border border-zinc-800 bg-black p-5">
              <div className="mb-4 flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span>
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{step.status}</span>
              </div>
              <h3 className="font-semibold text-zinc-100">{step.title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{step.description}</p>
              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-3">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Focus</p>
                <p className="mt-1 text-sm text-zinc-200">{step.focus}</p>
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ReportView({ report, reviewMode }) {
  const scoreLabel = useMemo(() => getScoreLabel(report.score), [report.score]);
  const [clientUpdate, setClientUpdate] = useState(() => buildClientUpdate(report));

  useEffect(() => {
    setClientUpdate(buildClientUpdate(report));
  }, [report]);

  return (
    <section className="space-y-6 lg:col-span-2">
      <Card><CardContent className="p-6"><div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><h2 className="text-2xl font-semibold">{reviewMode === "compare" ? "Before / After Report" : "Draft Review Report"}</h2><p className="mt-1 text-zinc-400">{report.project}</p><p className="mt-3 max-w-3xl text-sm text-zinc-400">{report.summary}</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm"><p className="text-zinc-400">Client-ready verdict</p><p className="mt-1 flex items-center gap-2 font-semibold text-zinc-100"><Icon>✓</Icon>{report.verdict}</p></div></div><div className="mb-6 rounded-3xl border border-zinc-800 bg-black p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><p className="text-sm text-zinc-400">{reviewMode === "compare" ? "Improvement Score" : "Humanization Score"}</p><p className="mt-1 text-4xl font-bold text-zinc-100">{clampScore(report.score)}/100</p></div><div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-200">{scoreLabel}</div></div></div><div className="grid grid-cols-1 gap-5 md:grid-cols-2">{report.scores.map((score) => <ScoreBar key={score.label} label={score.label} value={score.value} status={score.status} />)}</div></CardContent></Card>

      <Card><CardContent className="p-6"><div className="mb-6"><h2 className="text-2xl font-semibold">{reviewMode === "compare" ? "Next Pass Priorities" : "Fix Priorities"}</h2><p className="mt-1 text-sm text-zinc-400">The recommended order of work for a more human result.</p></div><div className="space-y-3">{report.priorities.map((priority, index) => <div key={priority} className="flex gap-3 rounded-2xl border border-zinc-800 bg-black p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span><p className="text-sm text-zinc-200">{priority}</p></div>)}</div></CardContent></Card>

      <Card><CardContent className="p-6"><div className="mb-6 flex items-center justify-between gap-4"><div><h2 className="text-2xl font-semibold">{reviewMode === "compare" ? "Comparison Findings" : "Detected Issues"}</h2><p className="mt-1 text-sm text-zinc-400">Timestamped notes showing what improved and what still needs work.</p></div><Icon>☰</Icon></div><div className="space-y-4">{report.issues.map((issue) => <article key={issue.id} className="rounded-3xl border border-zinc-800 bg-black p-5"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div><div className="mb-2 flex items-center gap-2 text-sm text-zinc-400"><Icon>◷</Icon><span>{issue.time} - {issue.category}</span></div><h3 className="flex items-center gap-2 text-lg font-semibold"><Icon>{issue.severity === "Positive" ? "✓" : "⚠"}</Icon>{issue.title}</h3><p className="mt-2 text-zinc-400">{issue.note}</p></div><span className="w-fit rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{issue.severity}</span></div><div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Suggested Humanization</p><p className="text-sm text-zinc-200">{issue.fix}</p></div></article>)}</div></CardContent></Card>

      <Card><CardContent className="p-6"><h2 className="text-2xl font-semibold">Client-Risk Summary</h2><p className="mt-3 text-sm text-zinc-300">{report.clientRisk}</p></CardContent></Card>

      <Card><CardContent className="p-6"><div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-semibold">Generate Client Update</h2><p className="mt-1 text-sm text-zinc-400">Turn the technical review into a clean message you can send to a client.</p></div><Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={() => setClientUpdate(buildClientUpdate(report))}>Generate Update</Button></div><div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3"><button type="button" className="rounded-2xl border border-zinc-800 bg-black p-4 text-left text-sm text-zinc-300 hover:bg-zinc-900" onClick={() => setClientUpdate(buildClientUpdate(report, "balanced"))}><span className="block font-semibold text-zinc-100">Balanced</span><span className="mt-1 block text-xs text-zinc-500">Clear, professional, detailed.</span></button><button type="button" className="rounded-2xl border border-zinc-800 bg-black p-4 text-left text-sm text-zinc-300 hover:bg-zinc-900" onClick={() => setClientUpdate(buildClientUpdate(report, "short"))}><span className="block font-semibold text-zinc-100">Short Update</span><span className="mt-1 block text-xs text-zinc-500">Useful for quick client check-ins.</span></button><button type="button" className="rounded-2xl border border-zinc-800 bg-black p-4 text-left text-sm text-zinc-300 hover:bg-zinc-900" onClick={() => setClientUpdate(buildClientUpdate(report, "detailed"))}><span className="block font-semibold text-zinc-100">Detailed</span><span className="mt-1 block text-xs text-zinc-500">Best for technical progress updates.</span></button></div><textarea className="min-h-40 w-full resize-none rounded-2xl border border-zinc-800 bg-black p-5 text-sm leading-6 text-zinc-300 outline-none focus:ring-2 focus:ring-zinc-500" value={clientUpdate} onChange={(event) => setClientUpdate(event.target.value)} /></CardContent></Card>
    </section>
  );
}

function ArtifactDatabase() {
  return <Card><CardContent className="p-6"><div className="mb-6"><h2 className="text-2xl font-semibold">Artifact Database</h2><p className="mt-1 text-sm text-zinc-400">The early SoulFrame knowledge base of common AI music artifacts.</p></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{artifactDatabase.map((artifact) => <article key={artifact.name} className="rounded-3xl border border-zinc-800 bg-black p-5"><div className="mb-3 flex items-start justify-between gap-3"><div><h3 className="font-semibold text-zinc-100">{artifact.name}</h3><p className="mt-1 text-xs text-zinc-500">{artifact.category}</p></div><span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{artifact.severity}</span></div><p className="text-sm text-zinc-400">{artifact.description}</p><div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Common Fix</p><p className="text-sm text-zinc-200">{artifact.fix}</p></div></article>)}</div></CardContent></Card>;
}

function ReviewSetupPanel({ reviewMode, setReviewMode, draftFile, humanizedFile, handleDraftFileChange, handleHumanizedFileChange, selectedPreset, setSelectedPreset, handleRunAnalysis, testsPassed }) {
  return <Card className="lg:col-span-1"><CardContent className="space-y-6 p-6"><div><h2 className="flex items-center gap-2 text-xl font-semibold"><Icon>〰</Icon>{reviewMode === "compare" ? "Before / After Review" : "New Draft Review"}</h2><p className="mt-2 text-sm text-zinc-400">{reviewMode === "compare" ? "Compare the original AI draft against your humanized edit." : "Start with one AI-generated draft and identify what needs to be humanized first."}</p></div><div className="grid grid-cols-2 gap-3"><button type="button" className={`rounded-2xl border p-4 text-left text-sm ${reviewMode === "draft" ? "border-white bg-zinc-900 text-white" : "border-zinc-800 bg-black text-zinc-400"}`} onClick={() => setReviewMode("draft")}>Draft Review</button><button type="button" className={`rounded-2xl border p-4 text-left text-sm ${reviewMode === "compare" ? "border-white bg-zinc-900 text-white" : "border-zinc-800 bg-black text-zinc-400"}`} onClick={() => setReviewMode("compare")}>Before / After</button></div><UploadBox fileName={draftFile} onFileChange={handleDraftFileChange} title="Upload Original AI Draft" description="Upload the raw AI-generated track before humanization." />{reviewMode === "compare" ? <UploadBox fileName={humanizedFile} onFileChange={handleHumanizedFileChange} title="Upload Humanized Edit" description="Upload your edited version so SoulFrame can compare what improved and what still needs work." /> : null}{reviewMode === "draft" ? <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><label htmlFor="preset-select" className="block text-sm font-semibold text-zinc-100">Sample Report Type</label><select id="preset-select" value={selectedPreset} onChange={(event) => setSelectedPreset(event.target.value)} className="mt-3 w-full rounded-xl border border-zinc-800 bg-black p-3 text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-zinc-500">{Object.entries(draftReports).map(([key, report]) => <option key={key} value={key}>{report.name}</option>)}</select></div> : <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300"><span className="block font-semibold text-zinc-100">Comparison Mode</span><span className="mt-2 block text-zinc-400">SoulFrame will compare the AI draft against the humanized edit and summarize what improved, what still sounds synthetic, and what the next pass should focus on.</span></div>}<div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><label htmlFor="producer-notes" className="flex items-center gap-2 text-sm font-semibold"><Icon>□</Icon>Optional Producer Notes</label><textarea id="producer-notes" className="mt-3 h-28 w-full resize-none rounded-xl border border-zinc-800 bg-black p-3 text-sm text-zinc-300 outline-none placeholder:text-zinc-500 focus:ring-2 focus:ring-zinc-500" placeholder="Example: Vocal sounds synthetic, ending feels disconnected, client wants it more radio-ready..." /></div><Button className="w-full bg-white py-6 text-black hover:bg-zinc-200" onClick={handleRunAnalysis}>{reviewMode === "compare" ? "Run Before / After Review" : "Run Draft Review"}</Button><div className="rounded-2xl border border-zinc-800 bg-black p-3 text-xs text-zinc-400">Prototype mode: simulated analysis, structured report output. Self-tests: <span className={testsPassed ? "text-zinc-100" : "text-red-300"}>{testsPassed ? "passed" : "failed"}</span>.</div></CardContent></Card>;
}

export default function SoulFrameDraftReviewV1() {
  const [view, setView] = useState("demo");
  const [selectedPreset, setSelectedPreset] = useState("marcel");
  const [activeStep, setActiveStep] = useState(0);
  const [draftFile, setDraftFile] = useState("");
  const [humanizedFile, setHumanizedFile] = useState("");
  const [reviewMode, setReviewMode] = useState("draft");
  const selectedReport = reviewMode === "compare" ? beforeAfterReport : draftReports[selectedPreset];
  const testsPassed = runSoulFrameTests();

  function handleRunAnalysis() {
    setView("analyzing");
    setActiveStep(0);
    analysisSteps.forEach((_, index) => {
      window.setTimeout(() => {
        setActiveStep(index + 1);
        if (index === analysisSteps.length - 1) window.setTimeout(() => setView("report"), 600);
      }, 650 * (index + 1));
    });
  }

  function handleDraftFileChange(event) {
    const file = event.target.files && event.target.files[0];
    setDraftFile(file ? file.name : "");
  }

  function handleHumanizedFileChange(event) {
    const file = event.target.files && event.target.files[0];
    setHumanizedFile(file ? file.name : "");
  }

  const mainContent = view === "database" ? <ArtifactDatabase /> : <><ProjectSnapshot reviewMode={reviewMode} selectedReport={selectedReport} /><ProjectWorkflow reviewMode={reviewMode} selectedReport={selectedReport} /><RevisionPlan selectedReport={selectedReport} reviewMode={reviewMode} /><RevisionTimeline reviewMode={reviewMode} selectedReport={selectedReport} /><div className="grid grid-cols-1 gap-6 lg:grid-cols-3"><ReviewSetupPanel reviewMode={reviewMode} setReviewMode={setReviewMode} draftFile={draftFile} humanizedFile={humanizedFile} handleDraftFileChange={handleDraftFileChange} handleHumanizedFileChange={handleHumanizedFileChange} selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} handleRunAnalysis={handleRunAnalysis} testsPassed={testsPassed} />{view === "analyzing" ? <AnalysisProgress activeStep={activeStep} /> : <ReportView report={selectedReport} reviewMode={reviewMode} />}</div></>;

  return (
    <main className="min-h-screen bg-black p-6 text-white md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-zinc-800 px-4 py-2 text-sm text-zinc-300"><Icon>🎧</Icon><span>Draft Review V1 • Stable Prototype</span></div><h1 className="text-4xl font-bold tracking-tight md:text-6xl">SoulFrame</h1><p className="mt-3 max-w-2xl text-lg text-zinc-400">Upload an AI-generated draft, or compare it with your humanized edit, and get a structured review of what still sounds synthetic, what improved, and what to fix next.</p></div>
          <div className="flex flex-wrap gap-3"><Button className="border border-zinc-800 bg-zinc-950 text-zinc-100 hover:bg-zinc-900" onClick={() => setView("demo")}>Draft Review</Button><Button className="border border-zinc-800 bg-zinc-950 text-zinc-100 hover:bg-zinc-900" onClick={() => setView("database")}>Artifact Database</Button><Button className="bg-white text-black hover:bg-zinc-200" onClick={handleRunAnalysis}><Icon>✦</Icon><span className="ml-2">Analyze</span></Button></div>
        </header>
        {mainContent}
      </div>
    </main>
  );
}
