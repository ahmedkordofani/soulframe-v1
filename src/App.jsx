import React, { useEffect, useMemo, useRef, useState } from "react";

const analysisSteps = [
  "Uploading audio files",
  "Scanning vocal realism and synthetic artifacts",
  "Checking instrumental texture and audio stability",
  "Reviewing arrangement flow and emotional movement",
  "Generating SoulFrame report",
];

const makeIssue = (id, time, title, severity, category, note, fix) => ({
  id,
  time,
  title,
  severity,
  category,
  note,
  fix,
});

const draftReports = {
  vocal: {
    name: "AI Vocal Draft Review",
    project: "Synthetic Vocal Draft",
    verdict: "Needs Vocal Humanization",
    score: 62,
    summary:
      "The instrumental has a usable foundation, but the vocal is carrying the strongest AI signature. The main priorities are metallic resonance, cracking during higher phrases, and static emotional delivery.",
    priorities: [
      "Repair vocal cracking in high transitions",
      "Reduce metallic upper-mid resonance",
      "Add phrase-level dynamics and subtle breath texture",
      "Check final chorus for emotional lift",
    ],
    clientRisk:
      "High. A client is likely to notice the vocal realism issues before anything else, especially the cracking and metallic sustain.",
    scores: [
      { label: "Overall Humanization", value: 62, status: "Moderate AI Presence" },
      { label: "Vocal Realism", value: 48, status: "Needs Work" },
      { label: "Instrument Realism", value: 78, status: "Usable" },
      { label: "Arrangement Logic", value: 69, status: "Moderate" },
      { label: "Audio Stability", value: 58, status: "Unstable" },
    ],
    issues: [
      makeIssue(
        "metallic-vocal-sustain",
        "0:38-0:55",
        "Metallic vocal sustain",
        "High",
        "Vocal Realism",
        "The vocal has a bright metallic coating during sustained vowels, making it feel AI-generated.",
        "Smooth harsh upper mids, add subtle saturation, and automate phrase-level warmth."
      ),
      makeIssue(
        "vocal-cracking-highs",
        "1:21-1:34",
        "Cracking on higher notes",
        "High",
        "Vocal Stability",
        "The vocal fractures slightly when reaching the upper register.",
        "Repair the phrase manually, replace the cracked syllable, or layer a cleaner vocal pass."
      ),
      makeIssue(
        "static-emotion",
        "2:02-2:19",
        "Static emotional delivery",
        "Moderate",
        "Emotional Authenticity",
        "The phrase intensity stays too even and does not build naturally across the section.",
        "Use volume automation, subtle timing offsets, and breath or texture layers to create a more human performance arc."
      ),
    ],
  },
  instrumental: {
    name: "Instrumental Draft Review",
    project: "AI Instrumental Draft",
    verdict: "Strong Base, Needs Texture Cleanup",
    score: 74,
    summary:
      "The draft has a strong musical base, but the instrumental texture still contains artificial shimmer, low-level buzzing, and repeated phrase movement that could make the track feel AI-generated.",
    priorities: [
      "Soften artificial shimmer in the upper harmonics",
      "Clean buzzing residue in the midrange",
      "Add variation to repeated phrases",
      "Check low-end stability before mastering",
    ],
    clientRisk:
      "Medium. The track is usable, but repeated phrases and synthetic brightness may stand out after repeated listening.",
    scores: [
      { label: "Overall Humanization", value: 74, status: "Good Foundation" },
      { label: "Vocal Realism", value: 0, status: "No Vocal Detected" },
      { label: "Instrument Realism", value: 68, status: "Needs Polish" },
      { label: "Arrangement Logic", value: 71, status: "Moderate" },
      { label: "Audio Stability", value: 70, status: "Moderate" },
    ],
    issues: [
      makeIssue(
        "artificial-shimmer",
        "0:16-0:44",
        "Artificial shimmer",
        "Moderate",
        "Instrument Realism",
        "The top-end sparkle feels overly glossy and digitally generated.",
        "Soften upper harmonics, add analog-style coloration, and rebalance the brightness."
      ),
      makeIssue(
        "buzzing-residue",
        "1:08-1:25",
        "Buzzing residue",
        "Moderate",
        "Audio Stability",
        "A low-level buzz is embedded beneath the instrumental layer.",
        "Use spectral cleanup, denoising, or replace the affected layer with a cleaner sound."
      ),
      makeIssue(
        "loop-repetition",
        "2:10-2:46",
        "Repetition syndrome",
        "Low",
        "Arrangement Logic",
        "The phrase repeats too consistently without enough human variation.",
        "Add articulation changes, small fills, tonal movement, or a counter-layer."
      ),
    ],
  },
  marcel: {
    name: "Marcel-Style Draft Review",
    project: "Commercial AI Track Draft",
    verdict: "Close, Needs Targeted Humanization",
    score: 79,
    summary:
      "The draft has strong commercial potential. The main improvements should focus on reducing AI artifacts, improving chorus impact, and tightening vocal delay so the track translates more naturally across playback systems.",
    priorities: [
      "Clean harsh AI-related vocal and mix artifacts",
      "Strengthen chorus entry impact after pauses",
      "Tighten vocal delay so it feels like depth, not echo",
      "Balance the track for real-world playback translation",
    ],
    clientRisk:
      "Medium. The track is close, but the chorus entries and vocal delay are likely to be noticed by a careful client on different playback systems.",
    scores: [
      { label: "Overall Humanization", value: 79, status: "Mostly Human" },
      { label: "Vocal Realism", value: 73, status: "Good, Needs Polish" },
      { label: "Instrument Realism", value: 84, status: "Strong" },
      { label: "Arrangement Logic", value: 76, status: "Good" },
      { label: "Audio Stability", value: 74, status: "Good" },
    ],
    issues: [
      makeIssue(
        "ai-resonance",
        "0:42-0:58",
        "AI-related harsh resonance",
        "Moderate",
        "Vocal Realism",
        "The vocal or mix contains harsh resonant energy that makes the track feel slightly synthetic.",
        "Use artifact cleanup, resonance control, tonal balancing, and subtle saturation."
      ),
      makeIssue(
        "chorus-impact",
        "0:34, 1:19, 2:07",
        "Chorus entries need more impact",
        "Moderate",
        "Arrangement Logic",
        "The first hits into the choruses could land with more intention after the pauses.",
        "Add subtle punch reinforcement through transient shaping, micro-automation, or supportive low-end impact layers."
      ),
      makeIssue(
        "delay-prominence",
        "General vocal space",
        "Vocal delay slightly prominent",
        "Low",
        "Spatial Translation",
        "The delay supports depth, but the repeat could become too noticeable on some systems.",
        "Lower feedback, reduce wet level slightly, filter the delay, and keep stereo depth if the image remains stable."
      ),
    ],
  },
};

const beforeAfterReport = {
  name: "Before / After Review",
  project: "AI Draft vs Humanized Edit",
  verdict: "Improved, Still Needs Final Humanization Pass",
  score: 84,
  summary:
    "The humanized edit improves the realism, impact, and client-readiness of the original AI draft. The next pass should focus on the remaining synthetic traces rather than rebuilding the full track.",
  priorities: [
    "Check whether the vocal now feels natural across the full song",
    "Confirm that chorus impact improved compared with the AI draft",
    "Clean any remaining harsh or metallic resonance",
    "Make sure the edit preserves the original emotional direction",
  ],
  clientRisk:
    "Low to medium. The edit is closer to delivery, but a final pass should confirm that no AI artifacts still stand out on repeated listening.",
  scores: [
    { label: "Humanization Improvement", value: 84, status: "Clear Improvement" },
    { label: "Vocal Realism", value: 78, status: "Improved" },
    { label: "Instrument Realism", value: 86, status: "Strong" },
    { label: "Arrangement Logic", value: 82, status: "Improved Flow" },
    { label: "Audio Stability", value: 80, status: "Mostly Stable" },
  ],
  issues: [
    makeIssue(
      "improved-impact",
      "0:34, 1:19, 2:07",
      "Chorus impact improved",
      "Positive",
      "Before / After Change",
      "The edit gives the chorus entries more intention and makes the track feel less flat compared with the original AI draft.",
      "Keep the added impact, but check that it does not overpower the vocal or change the client's intended direction."
    ),
    makeIssue(
      "remaining-vocal-edge",
      "0:42-0:58",
      "Remaining synthetic vocal edge",
      "Moderate",
      "Remaining Issue",
      "The vocal is improved, but a slight AI-like edge may still be present during sustained phrases.",
      "Apply a final resonance check, automate warmth, and compare against the raw AI draft."
    ),
    makeIssue(
      "preserve-emotion",
      "Full track",
      "Preserve emotional direction",
      "Low",
      "Creative Risk",
      "The edit sounds cleaner, but humanization should not remove too much of the original raw character.",
      "Avoid overprocessing. Keep the parts that already feel emotionally convincing."
    ),
  ],
};

const artifactDatabase = [
  {
    name: "Metallic Resonance",
    category: "Vocal Realism",
    severity: "High",
    description: "A robotic upper-mid or high-frequency sheen that makes the vocal sound synthetic.",
    fix: "Resonance reduction, warmth layering, subtle saturation, and phrase automation.",
  },
  {
    name: "Vocal Cracking",
    category: "Vocal Stability",
    severity: "High",
    description: "Broken transitions, fractured sustains, or glitch-like movement in AI vocals.",
    fix: "Manual repair, phrase replacement, spectral smoothing, or cleaner vocal layering.",
  },
  {
    name: "Artificial Shimmer",
    category: "Instrument Realism",
    severity: "Moderate",
    description: "Overly glossy digital brightness in instrumental stems.",
    fix: "Harmonic softening, analog coloration, EQ rebalancing, and transient reshaping.",
  },
  {
    name: "Buzzing Residue",
    category: "Audio Stability",
    severity: "Moderate",
    description: "Low-level digital distortion or AI residue embedded in stems.",
    fix: "Spectral cleanup, denoising, stem replacement, or selective masking.",
  },
  {
    name: "Repetition Syndrome",
    category: "Arrangement Logic",
    severity: "Moderate",
    description: "Phrases repeat too mechanically without enough human variation or development.",
    fix: "Add fills, articulation changes, timing variation, or new counter-melodies.",
  },
  {
    name: "Waveform Instability",
    category: "Audio Stability",
    severity: "Moderate",
    description: "Unnatural energy spikes, unstable density, or inconsistent waveform behavior.",
    fix: "Gain riding, compression balancing, transient repair, and stem cleanup.",
  },
];

const defaultProjectSession = {
  projectName: "Untitled AI Draft",
  clientName: "Client",
  trackType: "AI-generated song",
  aiTool: "Not specified",
  currentStage: "Raw AI Draft",
  mainConcern: "Needs humanization review",
  clientGoal: "Make the track feel more natural, emotional, and release-ready.",
  producerNotes: "",
};

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

function getSessionValue(projectSession, key) {
  const value = projectSession && projectSession[key];
  if (typeof value === "string" && value.trim()) return value.trim();
  return defaultProjectSession[key];
}

function formatFileSize(bytes) {
  if (!bytes) return "Unknown";
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(2)} MB`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "Reading...";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function buildInitialAudioMetadata(file) {
  return {
    name: file.name,
    type: file.type || "Unknown audio type",
    size: file.size,
    duration: null,
  };
}

function loadAudioDuration(audioUrl, setMetadata) {
  const audio = document.createElement("audio");
  audio.preload = "metadata";
  audio.onloadedmetadata = () => {
    setMetadata((current) => (current ? { ...current, duration: audio.duration } : current));
  };
  audio.onerror = () => {
    setMetadata((current) => (current ? { ...current, duration: Number.NaN } : current));
  };
  audio.src = audioUrl;
}

function buildHumanizationBrief(projectSession, report) {
  const projectName = getSessionValue(projectSession, "projectName");
  const clientName = getSessionValue(projectSession, "clientName");
  const trackType = getSessionValue(projectSession, "trackType");
  const aiTool = getSessionValue(projectSession, "aiTool");
  const currentStage = getSessionValue(projectSession, "currentStage");
  const mainConcern = getSessionValue(projectSession, "mainConcern");
  const clientGoal = getSessionValue(projectSession, "clientGoal");

  return `${projectName} for ${clientName} is a ${trackType} at the ${currentStage} stage. AI tool: ${aiTool}. Main concern: ${mainConcern}. Client goal: ${clientGoal} Current SoulFrame focus: ${report.priorities[0]}.`;
}

function buildRevisionTimeline(reviewMode, report) {
  const isCompareMode = reviewMode === "compare";

  return [
    {
      title: "Original AI Draft",
      status: "Complete",
      focus: "Identify what sounds artificial",
    },
    {
      title: "Edit 1 Humanization",
      status: isCompareMode ? "Complete" : "Next",
      focus: report.priorities[0],
    },
    {
      title: "Edit 2 Refinement",
      status: isCompareMode ? "Recommended" : "Pending",
      focus: report.priorities[1] || "Refine remaining synthetic details",
    },
    {
      title: "Final Polish",
      status: getDeliveryReadiness(report.score),
      focus: report.priorities[2] || "Confirm client-ready delivery",
    },
  ];
}

function buildClientUpdate(report, mode = "balanced", projectSession = defaultProjectSession) {
  const score = clampScore(report.score);
  const projectName = getSessionValue(projectSession, "projectName");
  const clientName = getSessionValue(projectSession, "clientName");
  const mainConcern = getSessionValue(projectSession, "mainConcern");
  const topIssues = report.issues
    .slice(0, 3)
    .map((issue) => `${issue.time}: ${issue.title}`)
    .join("; ");
  const topPriorities = report.priorities.slice(0, 3).join(", ").toLowerCase();

  if (mode === "short") {
    const mainPriorities = report.priorities.slice(0, 2).join(" and ").toLowerCase();
    return `Quick update on ${projectName} for ${clientName} - I reviewed the AI draft and found the main areas that need attention. The biggest priorities are ${mainPriorities}. The track is currently scoring ${score}/100 for humanization, so the next pass will focus on targeted improvements rather than changing the whole direction.`;
  }

  if (mode === "detailed") {
    const allPriorities = report.priorities.join(", ").toLowerCase();
    return `I went through ${projectName} in detail and identified the specific areas affecting realism and translation. The main concern going into the review was: ${mainConcern}. The main issues are: ${topIssues}. The next pass should focus on ${allPriorities}. This should help the track feel more natural and emotionally convincing while keeping the original creative direction intact.`;
  }

  return `I've reviewed ${projectName} for ${clientName} and mapped out the main areas affecting realism. The current SoulFrame humanization score is ${score}/100, with the main focus now being ${topPriorities}. The key areas identified were ${topIssues}. I'll use these points to guide the next pass so the track feels more natural, more polished, and closer to client-ready without changing the original direction too much.`;
}

export function runSoulFrameTests() {
  const scoreTestsPassed =
    clampScore(79) === 79 &&
    clampScore(-12) === 0 &&
    clampScore(140) === 100 &&
    clampScore("62") === 62 &&
    clampScore(undefined) === 0;

  const labelTestsPassed =
    getScoreLabel(90) === "Highly Humanized" &&
    getScoreLabel(75) === "Mostly Human" &&
    getScoreLabel(60) === "Moderate AI Presence" &&
    getScoreLabel(40) === "Strong Synthetic Presence" &&
    getScoreLabel(39) === "Heavy AI Artifacting";

  const reportTestsPassed = Object.values(draftReports).every(
    (report) => report.issues.length > 0 && report.priorities.length > 0 && report.scores.length > 0
  );

  const workflowTestsPassed =
    getClientRiskLevel("High. Test") === "High" &&
    getClientRiskLevel("Low to medium. Test") === "Low-Medium" &&
    getDeliveryReadiness(85) === "Nearly Ready" &&
    getDeliveryReadiness(75) === "Close" &&
    getDeliveryReadiness(74) === "Needs Work";

  const clientUpdateTestsPassed =
    buildClientUpdate(draftReports.marcel).includes("79/100") &&
    buildClientUpdate(draftReports.marcel, "short").startsWith("Quick update") &&
    buildClientUpdate(beforeAfterReport, "detailed").includes("main issues");

  const audioPreviewTestsPassed = typeof URL.createObjectURL === "function" || typeof window === "undefined";
  const waveformTestsPassed = typeof WaveformPreview === "function";

  return (
    scoreTestsPassed &&
    labelTestsPassed &&
    reportTestsPassed &&
    workflowTestsPassed &&
    clientUpdateTestsPassed &&
    audioPreviewTestsPassed &&
    waveformTestsPassed
  );
}

function Icon({ children }) {
  return (
    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-base leading-none" aria-hidden="true">
      {children}
    </span>
  );
}

function Button({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center rounded-2xl px-5 py-3 font-semibold transition focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
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
        <span className="rounded-2xl bg-zinc-800 p-3">
          <Icon>⇧</Icon>
        </span>
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
        const blockSize = Math.floor(channelData.length / samples);
        const middle = height / 2;

        if (cancelled) return;

        context.clearRect(0, 0, width, height);
        context.beginPath();
        context.moveTo(0, middle);

        for (let i = 0; i < samples; i += 1) {
          const start = i * blockSize;
          let sum = 0;

          for (let j = 0; j < blockSize; j += 1) {
            sum += Math.abs(channelData[start + j] || 0);
          }

          const average = sum / blockSize;
          const x = (i / samples) * width;
          const y = middle - average * middle * 2.4;
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

    return () => {
      cancelled = true;
    };
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

function AudioMetadata({ metadata, label }) {
  if (!metadata) return null;

  const rows = [
    { label: "Name", value: metadata.name },
    { label: "Type", value: metadata.type },
    { label: "Size", value: formatFileSize(metadata.size) },
    { label: "Duration", value: formatDuration(metadata.duration) },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="mb-4 text-sm font-semibold text-zinc-100">{label}</p>
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

function ProjectIntake({ projectSession, setProjectSession, selectedReport }) {
  const fields = [
    { key: "projectName", label: "Project Name", placeholder: "Untitled AI Draft" },
    { key: "clientName", label: "Client Name", placeholder: "Client" },
    { key: "trackType", label: "Track Type", placeholder: "Vocal pop, rock, cinematic, instrumental..." },
    { key: "aiTool", label: "AI Tool Used", placeholder: "Suno, Udio, custom model, unknown..." },
    { key: "currentStage", label: "Current Stage", placeholder: "Raw AI Draft, Edit 1, final polish..." },
    { key: "mainConcern", label: "Main Concern", placeholder: "Metallic vocal, flat emotion, strange ending..." },
  ];

  const updateField = (key, value) => {
    setProjectSession((current) => ({ ...current, [key]: value }));
  };

  return (
    <Panel
      title="Project Intake"
      subtitle="Set up any client AI draft before reviewing it inside SoulFrame."
      action={
        <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
          V2: <span className="font-semibold text-zinc-100">Audio Preview</span>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {fields.map((field) => (
          <label key={field.key} className="block rounded-2xl border border-zinc-800 bg-black p-4">
            <span className="text-sm font-semibold text-zinc-100">{field.label}</span>
            <input
              className="mt-3 w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-zinc-500"
              value={projectSession[field.key]}
              onChange={(event) => updateField(field.key, event.target.value)}
              placeholder={field.placeholder}
            />
          </label>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <label className="block rounded-2xl border border-zinc-800 bg-black p-4">
          <span className="text-sm font-semibold text-zinc-100">Client Goal</span>
          <textarea
            className="mt-3 h-28 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-zinc-500"
            value={projectSession.clientGoal}
            onChange={(event) => updateField("clientGoal", event.target.value)}
            placeholder="What does the client want this track to become?"
          />
        </label>
        <label className="block rounded-2xl border border-zinc-800 bg-black p-4">
          <span className="text-sm font-semibold text-zinc-100">Producer Notes</span>
          <textarea
            className="mt-3 h-28 w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:ring-2 focus:ring-zinc-500"
            value={projectSession.producerNotes}
            onChange={(event) => updateField("producerNotes", event.target.value)}
            placeholder="Private notes, references, client comments, creative direction..."
          />
        </label>
      </div>

      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
        <p className="text-xs uppercase tracking-wide text-zinc-500">Humanization Brief</p>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{buildHumanizationBrief(projectSession, selectedReport)}</p>
      </div>
    </Panel>
  );
}

function ProjectSnapshot({ reviewMode, selectedReport, projectSession, draftAudioMetadata, humanizedAudioMetadata }) {
  const items = [
    {
      label: "Project",
      value: getSessionValue(projectSession, "projectName"),
      note: `Client: ${getSessionValue(projectSession, "clientName")}`,
    },
    {
      label: "Current Stage",
      value: getSessionValue(projectSession, "currentStage"),
      note: reviewMode === "compare" ? "Checking your humanized pass before client delivery." : "Finding what needs to be fixed before Edit 1.",
    },
    {
      label: "Main Concern",
      value: getSessionValue(projectSession, "mainConcern"),
      note: "The main issue brought into the review.",
    },
    {
      label: "Delivery Readiness",
      value: getDeliveryReadiness(selectedReport.score),
      note: "Based on the current simulated SoulFrame score.",
    },
  ];

  const audioItems = [];

  if (draftAudioMetadata) {
    audioItems.push({
      label: "Draft Duration",
      value: formatDuration(draftAudioMetadata.duration),
      note: `${formatFileSize(draftAudioMetadata.size)} - ${draftAudioMetadata.type}`,
    });
  }

  if (reviewMode === "compare" && humanizedAudioMetadata) {
    audioItems.push({
      label: "Edit Duration",
      value: formatDuration(humanizedAudioMetadata.duration),
      note: `${formatFileSize(humanizedAudioMetadata.size)} - ${humanizedAudioMetadata.type}`,
    });
  }

  const snapshotItems = [...items, ...audioItems];

  return (
    <Panel title="Project Snapshot" subtitle="A quick overview of this client session, now connected to the uploaded audio file.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {snapshotItems.map((item) => (
          <article key={item.label} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <p className="text-xs uppercase tracking-wide text-zinc-500">{item.label}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{item.value}</h3>
            <p className="mt-2 text-sm text-zinc-400">{item.note}</p>
          </article>
        ))}
      </div>
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
    <Panel
      title="Project Workflow"
      subtitle="The full SoulFrame loop from AI draft to client-ready update."
      action={
        <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
          Current mode: <span className="font-semibold text-zinc-100">{reviewMode === "compare" ? "Before / After" : "Draft Scan"}</span>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step, index) => (
          <article key={step.title} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <div className="mb-4 flex items-start justify-between gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span>
              <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{step.status}</span>
            </div>
            <h3 className="font-semibold text-zinc-100">{step.title}</h3>
            <p className="mt-4 text-sm text-zinc-200">{step.output}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function RevisionPlan({ selectedReport, reviewMode }) {
  return (
    <Panel
      title="Next Revision Plan"
      subtitle="A focused production checklist generated from the SoulFrame report."
      action={
        <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
          Target: <span className="font-semibold text-zinc-100">{reviewMode === "compare" ? "Final polish" : "Edit 1"}</span>
        </div>
      }
    >
      <div className="space-y-3">
        {selectedReport.priorities.map((priority, index) => (
          <article key={priority} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <div className="flex gap-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span>
              <div>
                <h3 className="font-semibold text-zinc-100">{priority}</h3>
                <p className="mt-1 text-sm text-zinc-400">{index === 0 ? "Highest impact on perceived human realism." : "Supports the next humanization pass."}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function RevisionTimeline({ reviewMode, selectedReport }) {
  const timeline = buildRevisionTimeline(reviewMode, selectedReport);

  return (
    <Panel title="Revision History" subtitle="A simple project timeline from raw AI draft to client-ready final polish.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {timeline.map((step, index) => (
          <article key={step.title} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span>
            <h3 className="mt-4 font-semibold text-zinc-100">{step.title}</h3>
            <p className="mt-2 text-sm text-zinc-400">{step.status}</p>
            <p className="mt-3 text-sm text-zinc-200">{step.focus}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function ReportView({ report, reviewMode, projectSession }) {
  const scoreLabel = useMemo(() => getScoreLabel(report.score), [report.score]);
  const [clientUpdate, setClientUpdate] = useState(() => buildClientUpdate(report, "balanced", projectSession));

  useEffect(() => {
    setClientUpdate(buildClientUpdate(report, "balanced", projectSession));
  }, [report, projectSession]);

  return (
    <section className="space-y-6 lg:col-span-2">
      <Card>
        <CardContent className="p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{reviewMode === "compare" ? "Before / After Report" : "Draft Review Report"}</h2>
              <p className="mt-1 text-zinc-400">{report.project}</p>
              <p className="mt-3 max-w-3xl text-sm text-zinc-400">{report.summary}</p>
            </div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm">
              <p className="text-zinc-400">Verdict</p>
              <p className="mt-1 font-semibold text-zinc-100">{report.verdict}</p>
            </div>
          </div>

          <div className="mb-6 rounded-3xl border border-zinc-800 bg-black p-5">
            <p className="text-sm text-zinc-400">{scoreLabel}</p>
            <p className="mt-1 text-4xl font-bold text-zinc-100">{clampScore(report.score)}/100</p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {report.scores.map((score) => (
              <ScoreBar key={score.label} label={score.label} value={score.value} status={score.status} />
            ))}
          </div>
        </CardContent>
      </Card>

      <Panel title={reviewMode === "compare" ? "Next Pass Priorities" : "Fix Priorities"} subtitle="The recommended order of work for a more human result.">
        <div className="space-y-3">
          {report.priorities.map((priority, index) => (
            <div key={priority} className="flex gap-3 rounded-2xl border border-zinc-800 bg-black p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span>
              <p className="text-sm text-zinc-200">{priority}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title={reviewMode === "compare" ? "Comparison Findings" : "Detected Issues"} subtitle="Timestamped notes showing what improved and what still needs work.">
        <div className="space-y-4">
          {report.issues.map((issue) => (
            <article key={issue.id} className="rounded-3xl border border-zinc-800 bg-black p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-zinc-400">
                    {issue.time} - {issue.category}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-zinc-100">{issue.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{issue.note}</p>
                </div>
                <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{issue.severity}</span>
              </div>
              <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Suggested Humanization</p>
                <p className="mt-1 text-sm text-zinc-200">{issue.fix}</p>
              </div>
            </article>
          ))}
        </div>
      </Panel>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold">Client-Risk Summary</h2>
          <p className="mt-3 text-sm text-zinc-300">{report.clientRisk}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Generate Client Update</h2>
              <p className="mt-1 text-sm text-zinc-400">Turn the technical review into a clean message you can send to a client.</p>
            </div>
            <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={() => setClientUpdate(buildClientUpdate(report, "balanced", projectSession))}>
              Generate Update
            </Button>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            <button type="button" className="rounded-2xl border border-zinc-800 bg-black p-4 text-left text-sm text-zinc-300 hover:bg-zinc-900" onClick={() => setClientUpdate(buildClientUpdate(report, "balanced", projectSession))}>
              <span className="block font-semibold text-zinc-100">Balanced</span>
              <span className="mt-1 block text-xs text-zinc-500">Clear, professional, detailed.</span>
            </button>
            <button type="button" className="rounded-2xl border border-zinc-800 bg-black p-4 text-left text-sm text-zinc-300 hover:bg-zinc-900" onClick={() => setClientUpdate(buildClientUpdate(report, "short", projectSession))}>
              <span className="block font-semibold text-zinc-100">Short Update</span>
              <span className="mt-1 block text-xs text-zinc-500">Useful for quick client check-ins.</span>
            </button>
            <button type="button" className="rounded-2xl border border-zinc-800 bg-black p-4 text-left text-sm text-zinc-300 hover:bg-zinc-900" onClick={() => setClientUpdate(buildClientUpdate(report, "detailed", projectSession))}>
              <span className="block font-semibold text-zinc-100">Detailed</span>
              <span className="mt-1 block text-xs text-zinc-500">Best for technical progress updates.</span>
            </button>
          </div>

          <textarea
            className="min-h-40 w-full resize-none rounded-2xl border border-zinc-800 bg-black p-5 text-sm leading-6 text-zinc-300 outline-none focus:ring-2 focus:ring-zinc-500"
            value={clientUpdate}
            onChange={(event) => setClientUpdate(event.target.value)}
          />
        </CardContent>
      </Card>
    </section>
  );
}

function ArtifactDatabase() {
  return (
    <Panel title="Artifact Database" subtitle="The early SoulFrame knowledge base of common AI music artifacts.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {artifactDatabase.map((artifact) => (
          <article key={artifact.name} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold text-zinc-100">{artifact.name}</h3>
                <p className="mt-1 text-xs text-zinc-500">{artifact.category}</p>
              </div>
              <span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{artifact.severity}</span>
            </div>
            <p className="text-sm text-zinc-400">{artifact.description}</p>
            <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
              <p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Common Fix</p>
              <p className="text-sm text-zinc-200">{artifact.fix}</p>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function AnalysisProgress({ activeStep }) {
  return (
    <Card className="lg:col-span-2">
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold">SoulFrame is listening</h2>
        <div className="mt-6 space-y-4">
          {analysisSteps.map((step, index) => {
            const marker = index < activeStep ? "✓" : String(index + 1);
            return (
              <div key={step} className="rounded-2xl border border-zinc-800 bg-black p-4">
                <p className="font-semibold text-zinc-100">
                  {marker}. {step}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewSetupPanel({
  reviewMode,
  setReviewMode,
  draftFile,
  humanizedFile,
  draftAudioUrl,
  humanizedAudioUrl,
  draftAudioMetadata,
  humanizedAudioMetadata,
  handleDraftFileChange,
  handleHumanizedFileChange,
  selectedPreset,
  setSelectedPreset,
  handleRunAnalysis,
  testsPassed,
}) {
  return (
    <Card className="lg:col-span-1">
      <CardContent className="space-y-6 p-6">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Icon>〰</Icon>
            {reviewMode === "compare" ? "Before / After Review" : "New Draft Review"}
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            {reviewMode === "compare" ? "Compare the original AI draft against your humanized edit." : "Start with one AI-generated draft and identify what needs to be humanized first."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className={`rounded-2xl border p-4 text-left text-sm ${reviewMode === "draft" ? "border-white bg-zinc-900 text-white" : "border-zinc-800 bg-black text-zinc-400"}`}
            onClick={() => setReviewMode("draft")}
          >
            Draft Review
          </button>
          <button
            type="button"
            className={`rounded-2xl border p-4 text-left text-sm ${reviewMode === "compare" ? "border-white bg-zinc-900 text-white" : "border-zinc-800 bg-black text-zinc-400"}`}
            onClick={() => setReviewMode("compare")}
          >
            Before / After
          </button>
        </div>

        <UploadBox fileName={draftFile} onFileChange={handleDraftFileChange} title="Upload Original AI Draft" description="Upload the raw AI-generated track before humanization." />
        <AudioPreview src={draftAudioUrl} label="Original AI Draft Preview" />
        <WaveformPreview src={draftAudioUrl} label="Original AI Draft Waveform" />
        <AudioMetadata metadata={draftAudioMetadata} label="Original AI Draft Metadata" />

        {reviewMode === "compare" ? (
          <>
            <UploadBox fileName={humanizedFile} onFileChange={handleHumanizedFileChange} title="Upload Humanized Edit" description="Upload your edited version so SoulFrame can compare what improved and what still needs work." />
            <AudioPreview src={humanizedAudioUrl} label="Humanized Edit Preview" />
            <WaveformPreview src={humanizedAudioUrl} label="Humanized Edit Waveform" />
            <AudioMetadata metadata={humanizedAudioMetadata} label="Humanized Edit Metadata" />
          </>
        ) : null}

        {reviewMode === "draft" ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
            <label htmlFor="preset-select" className="block text-sm font-semibold text-zinc-100">
              Sample Report Type
            </label>
            <select
              id="preset-select"
              value={selectedPreset}
              onChange={(event) => setSelectedPreset(event.target.value)}
              className="mt-3 w-full rounded-xl border border-zinc-800 bg-black p-3 text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-zinc-500"
            >
              {Object.entries(draftReports).map(([key, report]) => (
                <option key={key} value={key}>
                  {report.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
            <span className="block font-semibold text-zinc-100">Comparison Mode</span>
            <span className="mt-2 block text-zinc-400">SoulFrame will compare the AI draft against the humanized edit and summarize what improved.</span>
          </div>
        )}

        <Button className="w-full bg-white py-6 text-black hover:bg-zinc-200" onClick={handleRunAnalysis}>
          {reviewMode === "compare" ? "Run Before / After Review" : "Run Draft Review"}
        </Button>

        <div className="rounded-2xl border border-zinc-800 bg-black p-3 text-xs text-zinc-400">
          Prototype mode: simulated analysis. Audio preview, metadata, and waveform: <span className="text-zinc-100">enabled</span>. Self-tests: <span className={testsPassed ? "text-zinc-100" : "text-red-300"}>{testsPassed ? "passed" : "failed"}</span>.
        </div>
      </CardContent>
    </Card>
  );
}

export default function SoulFrameDraftReviewV2() {
  const [view, setView] = useState("demo");
  const [selectedPreset, setSelectedPreset] = useState("marcel");
  const [activeStep, setActiveStep] = useState(0);
  const [draftFile, setDraftFile] = useState("");
  const [humanizedFile, setHumanizedFile] = useState("");
  const [draftAudioUrl, setDraftAudioUrl] = useState("");
  const [humanizedAudioUrl, setHumanizedAudioUrl] = useState("");
  const [draftAudioMetadata, setDraftAudioMetadata] = useState(null);
  const [humanizedAudioMetadata, setHumanizedAudioMetadata] = useState(null);
  const [reviewMode, setReviewMode] = useState("draft");
  const [projectSession, setProjectSession] = useState(defaultProjectSession);

  const selectedReport = reviewMode === "compare" ? beforeAfterReport : draftReports[selectedPreset];
  const testsPassed = runSoulFrameTests();

  useEffect(() => {
    if (activeStep <= 0) return undefined;
    if (activeStep >= analysisSteps.length) return undefined;

    const timer = window.setTimeout(() => {
      setActiveStep((current) => Math.min(current + 1, analysisSteps.length));
    }, 450);

    return () => window.clearTimeout(timer);
  }, [activeStep]);

  useEffect(() => {
    return () => {
      if (draftAudioUrl) URL.revokeObjectURL(draftAudioUrl);
      if (humanizedAudioUrl) URL.revokeObjectURL(humanizedAudioUrl);
    };
  }, [draftAudioUrl, humanizedAudioUrl]);

  function handleRunAnalysis() {
    setActiveStep(1);
  }

  function handleDraftFileChange(event) {
    const file = event.target.files && event.target.files[0];
    const nextUrl = file ? URL.createObjectURL(file) : "";

    setDraftFile(file ? file.name : "");
    setDraftAudioMetadata(file ? buildInitialAudioMetadata(file) : null);

    setDraftAudioUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return nextUrl;
    });

    if (file && nextUrl) {
      loadAudioDuration(nextUrl, setDraftAudioMetadata);
    }
  }

  function handleHumanizedFileChange(event) {
    const file = event.target.files && event.target.files[0];
    const nextUrl = file ? URL.createObjectURL(file) : "";

    setHumanizedFile(file ? file.name : "");
    setHumanizedAudioMetadata(file ? buildInitialAudioMetadata(file) : null);

    setHumanizedAudioUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return nextUrl;
    });

    if (file && nextUrl) {
      loadAudioDuration(nextUrl, setHumanizedAudioMetadata);
    }
  }

  const demoView = (
    <div className="space-y-6">
      <ProjectIntake projectSession={projectSession} setProjectSession={setProjectSession} selectedReport={selectedReport} />
      <ProjectSnapshot
        reviewMode={reviewMode}
        selectedReport={selectedReport}
        projectSession={projectSession}
        draftAudioMetadata={draftAudioMetadata}
        humanizedAudioMetadata={humanizedAudioMetadata}
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ReviewSetupPanel
          reviewMode={reviewMode}
          setReviewMode={setReviewMode}
          draftFile={draftFile}
          humanizedFile={humanizedFile}
          draftAudioUrl={draftAudioUrl}
          humanizedAudioUrl={humanizedAudioUrl}
          draftAudioMetadata={draftAudioMetadata}
          humanizedAudioMetadata={humanizedAudioMetadata}
          handleDraftFileChange={handleDraftFileChange}
          handleHumanizedFileChange={handleHumanizedFileChange}
          selectedPreset={selectedPreset}
          setSelectedPreset={setSelectedPreset}
          handleRunAnalysis={handleRunAnalysis}
          testsPassed={testsPassed}
        />
        {activeStep > 0 && activeStep < analysisSteps.length ? (
          <AnalysisProgress activeStep={activeStep} />
        ) : (
          <ReportView report={selectedReport} reviewMode={reviewMode} projectSession={projectSession} />
        )}
      </div>
      <ProjectWorkflow reviewMode={reviewMode} selectedReport={selectedReport} />
      <RevisionPlan selectedReport={selectedReport} reviewMode={reviewMode} />
      <RevisionTimeline reviewMode={reviewMode} selectedReport={selectedReport} />
    </div>
  );

  const databaseView = <ArtifactDatabase />;

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">SoulFrame</p>
              <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">
                AI Music Humanization Review Tool
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">
                Upload an AI draft, preview the audio, map the humanization priorities, and generate a clean client update from the review.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className={view === "demo" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("demo")}>
                Review Demo
              </Button>
              <Button className={view === "database" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("database")}>
                Artifact Database
              </Button>
            </div>
          </div>
        </header>

        {view === "database" ? databaseView : demoView}
      </div>
    </main>
  );
}