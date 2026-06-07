import React, { useEffect, useMemo, useRef, useState } from "react";

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
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "Reading...";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function buildInitialAudioMetadata(file) {
  return { name: file.name, type: file.type || "Unknown audio type", size: file.size, duration: null };
}

function loadAudioDuration(audioUrl, setMetadata) {
  const audio = document.createElement("audio");
  audio.preload = "metadata";
  audio.onloadedmetadata = () => setMetadata((current) => (current ? { ...current, duration: audio.duration } : current));
  audio.onerror = () => setMetadata((current) => (current ? { ...current, duration: Number.NaN } : current));
  audio.src = audioUrl;
}

function amplitudeToDb(amplitude) {
  if (!amplitude || amplitude <= 0) return "-∞ dB";
  return `${(20 * Math.log10(amplitude)).toFixed(1)} dB`;
}

function getClippingRisk(peak) {
  if (peak >= 0.999) return "High";
  if (peak >= 0.97) return "Medium";
  return "Low";
}

function getDynamicsLabel(dynamicRange) {
  if (dynamicRange >= 0.22) return "Wide";
  if (dynamicRange >= 0.12) return "Moderate";
  return "Compressed";
}

function getBrightnessLabel(brightnessScore) {
  if (!Number.isFinite(brightnessScore)) return "Unknown";
  if (brightnessScore >= 0.42) return "Bright / Potentially Harsh";
  if (brightnessScore >= 0.25) return "Balanced";
  return "Dark / Warm";
}

function getTextureStabilityLabel(textureMovement) {
  if (!Number.isFinite(textureMovement)) return "Unknown";
  if (textureMovement >= 0.38) return "Unstable / Busy";
  if (textureMovement >= 0.18) return "Moderate Movement";
  return "Stable";
}

async function loadAudioHealthCheck(audioUrl, setAnalysis) {
  try {
    setAnalysis({ status: "Analyzing audio..." });
    const response = await fetch(audioUrl);
    const arrayBuffer = await response.arrayBuffer();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContextClass();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    const channelData = audioBuffer.getChannelData(0);

    let peak = 0;
    let sumSquares = 0;
    let sumAbsolute = 0;
    let sumDelta = 0;
    let zeroCrossings = 0;
    const blockSize = Math.max(1, Math.floor(channelData.length / 120));
    const blockRmsValues = [];

    for (let i = 0; i < channelData.length; i += 1) {
      const currentSample = channelData[i];
      const previousSample = i > 0 ? channelData[i - 1] : currentSample;
      const absoluteValue = Math.abs(currentSample);
      peak = Math.max(peak, absoluteValue);
      sumSquares += currentSample * currentSample;
      sumAbsolute += absoluteValue;
      sumDelta += Math.abs(currentSample - previousSample);
      if (i > 0 && Math.sign(currentSample) !== Math.sign(previousSample)) zeroCrossings += 1;
    }

    for (let start = 0; start < channelData.length; start += blockSize) {
      let blockSum = 0;
      let count = 0;
      for (let index = start; index < Math.min(start + blockSize, channelData.length); index += 1) {
        blockSum += channelData[index] * channelData[index];
        count += 1;
      }
      blockRmsValues.push(Math.sqrt(blockSum / Math.max(1, count)));
    }

    const rms = Math.sqrt(sumSquares / Math.max(1, channelData.length));
    const loudestBlock = Math.max(...blockRmsValues);
    const quietBlocks = blockRmsValues.filter((value) => value > 0.0001);
    const quietestBlock = quietBlocks.length ? Math.min(...quietBlocks) : 0;
    const dynamicRange = loudestBlock - quietestBlock;
    const averageAbs = sumAbsolute / Math.max(1, channelData.length);
    const averageDelta = sumDelta / Math.max(1, channelData.length);
    const brightnessScore = averageAbs > 0 ? Math.min(1, averageDelta / Math.max(averageAbs * 4, 0.0001)) : 0;
    const zeroCrossingRate = zeroCrossings / Math.max(1, channelData.length);
    const textureMovement = Math.min(1, zeroCrossingRate * 20 + dynamicRange);

    setAnalysis({
      status: "Ready",
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      peak,
      peakDb: amplitudeToDb(peak),
      rms,
      averageEnergyDb: amplitudeToDb(rms),
      clippingRisk: getClippingRisk(peak),
      dynamics: getDynamicsLabel(dynamicRange),
      dynamicRange,
      brightnessScore,
      brightness: getBrightnessLabel(brightnessScore),
      zeroCrossingRate,
      textureMovement,
      textureStability: getTextureStabilityLabel(textureMovement),
    });
    audioContext.close();
  } catch (error) {
    setAnalysis({ status: "Unavailable" });
  }
}

function getAudioHealthRecommendation(analysis) {
  if (!analysis || analysis.status !== "Ready") return "Upload an audio file to generate real audio health notes.";
  if (analysis.clippingRisk === "High") return "The file is very close to clipping. Leave more headroom before the next humanization or mastering pass.";
  if (analysis.clippingRisk === "Medium") return "The file has limited headroom. Check loud sections before exporting the client version.";
  if (analysis.brightness === "Bright / Potentially Harsh") return "The file has a bright texture profile. Check for harsh AI shimmer, metallic vocal edges, or brittle top-end.";
  if (analysis.textureStability === "Unstable / Busy") return "The texture movement is busy. Check whether the track feels emotionally intentional or overly generated.";
  if (analysis.dynamics === "Compressed") return "The file may be dynamically tight. Check whether the track still breathes emotionally.";
  if (analysis.dynamics === "Wide") return "The file has strong dynamic movement. Preserve this while cleaning AI artifacts.";
  return "The file looks technically stable. Focus the next pass on realism, emotion, and arrangement polish.";
}

function buildArtifactClues(analysis) {
  if (!analysis || analysis.status !== "Ready") {
    return [{ title: "Waiting for audio", level: "Waiting", note: "Upload audio to generate early artifact clues." }];
  }

  const clues = [];

  if (analysis.brightness === "Bright / Potentially Harsh") {
    clues.push({
      title: "Possible harsh AI shimmer",
      level: "Review",
      note: "The brightness profile suggests the top-end may need checking for metallic vocal edges, brittle cymbals, or synthetic gloss.",
    });
  }

  if (analysis.textureStability === "Unstable / Busy") {
    clues.push({
      title: "Possible generated texture movement",
      level: "Review",
      note: "The texture movement is busy, so check whether the track feels emotionally intentional or artificially restless.",
    });
  }

  if (analysis.dynamics === "Compressed") {
    clues.push({
      title: "Possible flat emotional movement",
      level: "Review",
      note: "The dynamics look tight. Listen for sections that feel loud but emotionally static.",
    });
  }

  if (analysis.clippingRisk === "High" || analysis.clippingRisk === "Medium") {
    clues.push({
      title: "Headroom may affect perception",
      level: "Technical",
      note: "Limited headroom can make AI harshness feel worse. Check gain staging before deeper humanization work.",
    });
  }

  if (!clues.length) {
    clues.push({
      title: "No obvious technical artifact clue",
      level: "Stable",
      note: "The basic proxy scan looks stable. Focus the next listen on performance, arrangement, and emotional delivery.",
    });
  }

  return clues;
}

function buildListeningFocusItems(analysis) {
  if (!analysis || analysis.status !== "Ready") {
    return ["Upload audio to unlock a producer listening focus." ];
  }

  const focusItems = [];

  if (analysis.brightness === "Bright / Potentially Harsh") {
    focusItems.push("Listen closely to vocal sibilance, cymbal splash, and bright synth layers for metallic AI edges.");
  }

  if (analysis.textureStability === "Unstable / Busy") {
    focusItems.push("Check whether the texture movement supports the song emotionally or feels randomly generated.");
  }

  if (analysis.dynamics === "Compressed") {
    focusItems.push("Look for places where the track needs more breath, contrast, or natural rise and fall.");
  }

  if (analysis.clippingRisk === "High" || analysis.clippingRisk === "Medium") {
    focusItems.push("Lower the gain or create more headroom before judging harshness or mastering loudness.");
  }

  if (!focusItems.length) {
    focusItems.push("Focus on performance realism, emotional transitions, arrangement intention, and whether the track feels alive.");
  }

  return focusItems.slice(0, 4);
}

function getHumanizationPriorityScore(analysis) {
  if (!analysis || analysis.status !== "Ready") return 0;

  let score = 25;

  if (analysis.brightness === "Bright / Potentially Harsh") score += 22;
  if (analysis.textureStability === "Unstable / Busy") score += 22;
  if (analysis.textureStability === "Moderate Movement") score += 10;
  if (analysis.dynamics === "Compressed") score += 18;
  if (analysis.clippingRisk === "High") score += 18;
  if (analysis.clippingRisk === "Medium") score += 10;

  const readinessScore = getTechnicalReadinessScore(analysis);
  if (readinessScore < 70) score += 12;
  if (readinessScore >= 90) score -= 8;

  return clampScore(score);
}

function getHumanizationPriorityLabel(score) {
  if (score >= 75) return "High Priority";
  if (score >= 50) return "Medium Priority";
  if (score > 0) return "Low Priority";
  return "Waiting for Audio";
}

function getHumanizationPriorityNote(analysis) {
  const score = getHumanizationPriorityScore(analysis);
  const label = getHumanizationPriorityLabel(score);

  if (label === "High Priority") {
    return "This file should receive a focused humanization pass before client delivery. Prioritize realism, headroom, harshness control, and emotional movement.";
  }

  if (label === "Medium Priority") {
    return "This file has some areas worth checking by ear. Focus on the sections that feel synthetic, overly bright, or emotionally flat.";
  }

  if (label === "Low Priority") {
    return "This file looks technically stable from the current proxy scan. The next pass can focus more on taste, emotion, and final polish.";
  }

  return "Upload audio to generate a humanization priority score.";
}

function buildSectionReviewNotes(analysis) {
  if (!analysis || analysis.status !== "Ready") {
    return [
      { section: "Intro", note: "Upload audio to generate section-by-section review notes." },
      { section: "Verse", note: "Waiting for audio analysis." },
      { section: "Chorus", note: "Waiting for audio analysis." },
      { section: "Bridge", note: "Waiting for audio analysis." },
      { section: "Outro", note: "Waiting for audio analysis." },
    ];
  }

  const bright = analysis.brightness === "Bright / Potentially Harsh";
  const busy = analysis.textureStability === "Unstable / Busy";
  const compressed = analysis.dynamics === "Compressed";
  const headroomRisk = analysis.clippingRisk === "High" || analysis.clippingRisk === "Medium";

  return [
    {
      section: "Intro",
      note: busy
        ? "Check whether the opening texture feels intentional or immediately too busy/generated. Simplify the first impression if needed."
        : "Check whether the intro creates a clear emotional doorway into the track rather than simply starting the loop.",
    },
    {
      section: "Verse",
      note: bright
        ? "Listen for metallic vocal edges, sharp sibilance, or brittle upper harmonics in the main storytelling section."
        : "Focus on vocal realism, phrasing, groove pocket, and whether the verse feels performed rather than generated.",
    },
    {
      section: "Chorus",
      note: compressed
        ? "Check whether the chorus lifts emotionally or stays flat because the dynamics are too tight. Add contrast if needed."
        : "Make sure the chorus has a natural lift, emotional arrival, and enough width without losing the song's core feeling.",
    },
    {
      section: "Bridge / Breakdown",
      note: busy
        ? "Use this section to reset the ear. Reduce unnecessary movement if the texture feels artificially restless."
        : "Check whether the bridge gives the listener a meaningful change in emotion, space, or arrangement tension.",
    },
    {
      section: "Outro",
      note: headroomRisk
        ? "Check the final loud moments for clipping, harshness, or over-limited decay before export."
        : "Make sure the ending feels intentional, musical, and emotionally resolved rather than abruptly generated.",
    },
  ];
}

function buildHumanizationActionPlan(analysis) {
  if (!analysis || analysis.status !== "Ready") {
    return [{ priority: "Waiting", action: "Upload audio", detail: "Upload an audio file to generate a humanization action plan." }];
  }

  const actions = [];

  if (analysis.brightness === "Bright / Potentially Harsh") {
    actions.push({
      priority: "High",
      action: "Smooth harsh top-end",
      detail: "Check sibilance, cymbal splash, brittle synth highs, and metallic vocal edges. Use gentle EQ smoothing, de-essing, or subtle saturation rather than simply making the track darker.",
    });
  }

  if (analysis.textureStability === "Unstable / Busy") {
    actions.push({
      priority: "High",
      action: "Stabilize generated texture",
      detail: "Identify layers that move too randomly. Simplify busy background parts, reduce competing motion, and make the arrangement feel more intentional.",
    });
  }

  if (analysis.dynamics === "Compressed") {
    actions.push({
      priority: "Medium",
      action: "Restore emotional movement",
      detail: "Create more contrast between sections. Let verses breathe, allow choruses to lift naturally, and avoid over-limiting before the final export.",
    });
  }

  if (analysis.clippingRisk === "High" || analysis.clippingRisk === "Medium") {
    actions.push({
      priority: analysis.clippingRisk === "High" ? "High" : "Medium",
      action: "Create safer headroom",
      detail: "Lower the gain, rebalance loud sections, and leave space before judging harshness or applying mastering polish.",
    });
  }

  if (!actions.length) {
    actions.push({
      priority: "Low",
      action: "Focus on musical realism",
      detail: "The proxy scan looks stable. Focus on phrasing, arrangement intention, emotional transitions, groove, and whether the track feels performed rather than generated.",
    });
  }

  return actions.slice(0, 5);
}

function getHumanizationDelta(draftAnalysis, humanizedAnalysis) {
  if (!draftAnalysis || !humanizedAnalysis || draftAnalysis.status !== "Ready" || humanizedAnalysis.status !== "Ready") {
    return [{ label: "Waiting for comparison", status: "Waiting", note: "Upload both the draft and humanized edit to generate a before/after humanization delta." }];
  }

  const draftPriority = getHumanizationPriorityScore(draftAnalysis);
  const humanizedPriority = getHumanizationPriorityScore(humanizedAnalysis);
  const draftReadiness = getTechnicalReadinessScore(draftAnalysis);
  const humanizedReadiness = getTechnicalReadinessScore(humanizedAnalysis);
  const deltaItems = [];

  deltaItems.push({
    label: "Humanization Priority",
    status: humanizedPriority < draftPriority ? "Improved" : humanizedPriority > draftPriority ? "Needs Review" : "Unchanged",
    note: `Priority moved from ${draftPriority}/100 to ${humanizedPriority}/100. Lower is better here because it means fewer urgent humanization flags.`,
  });

  deltaItems.push({
    label: "Technical Readiness",
    status: humanizedReadiness > draftReadiness ? "Improved" : humanizedReadiness < draftReadiness ? "Needs Review" : "Unchanged",
    note: `Readiness moved from ${draftReadiness}/100 to ${humanizedReadiness}/100. Higher suggests a cleaner delivery state.`,
  });

  if (draftAnalysis.brightness !== humanizedAnalysis.brightness) {
    deltaItems.push({
      label: "Brightness Profile",
      status: humanizedAnalysis.brightness === "Bright / Potentially Harsh" ? "Needs Review" : "Changed",
      note: `Brightness changed from ${draftAnalysis.brightness || "Unknown"} to ${humanizedAnalysis.brightness || "Unknown"}. Check whether the edit feels smoother without becoming dull.`,
    });
  }

  if (draftAnalysis.textureStability !== humanizedAnalysis.textureStability) {
    deltaItems.push({
      label: "Texture Stability",
      status: humanizedAnalysis.textureStability === "Unstable / Busy" ? "Needs Review" : "Changed",
      note: `Texture stability changed from ${draftAnalysis.textureStability || "Unknown"} to ${humanizedAnalysis.textureStability || "Unknown"}. Listen for whether movement now feels more intentional.`,
    });
  }

  if (draftAnalysis.clippingRisk !== humanizedAnalysis.clippingRisk) {
    deltaItems.push({
      label: "Headroom / Clipping Risk",
      status: humanizedAnalysis.clippingRisk === "Low" ? "Improved" : "Needs Review",
      note: `Clipping risk changed from ${draftAnalysis.clippingRisk} to ${humanizedAnalysis.clippingRisk}. This affects how harsh or controlled the edit feels.`,
    });
  }

  if (draftAnalysis.dynamics !== humanizedAnalysis.dynamics) {
    deltaItems.push({
      label: "Dynamic Feel",
      status: humanizedAnalysis.dynamics === "Compressed" ? "Needs Review" : "Changed",
      note: `Dynamics changed from ${draftAnalysis.dynamics} to ${humanizedAnalysis.dynamics}. Check whether the edit breathes more naturally.`,
    });
  }

  return deltaItems.slice(0, 6);
}

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

function getTechnicalFormatNotes(analysis) {
  if (!analysis || analysis.status !== "Ready") return [];

  const notes = [];

  if (analysis.channels === 1) {
    notes.push("Mono file detected. Check stereo width before final delivery if the track is meant to feel wide.");
  }

  if (analysis.channels && analysis.channels >= 2) {
    notes.push("Stereo file detected. Check that the width feels intentional and does not smear the vocal or low end.");
  }

  if (analysis.sampleRate && analysis.sampleRate < 44100) {
    notes.push("Sample rate is below 44.1 kHz. Consider exporting at 44.1 kHz or 48 kHz for cleaner delivery.");
  }

  if (analysis.sampleRate && analysis.sampleRate >= 44100) {
    notes.push("Sample rate is suitable for normal music delivery workflows.");
  }

  if (analysis.clippingRisk === "High" || analysis.clippingRisk === "Medium") {
    notes.push("Headroom should be checked before sending this to a client or mastering stage.");
  }

  return notes;
}

function getTechnicalReadinessScore(analysis) {
  if (!analysis || analysis.status !== "Ready") return null;

  let score = 75;

  if (analysis.clippingRisk === "High") score -= 30;
  if (analysis.clippingRisk === "Medium") score -= 15;
  if (analysis.clippingRisk === "Low") score += 5;

  if (analysis.dynamics === "Compressed") score -= 12;
  if (analysis.dynamics === "Moderate") score += 5;
  if (analysis.dynamics === "Wide") score += 8;

  if (analysis.sampleRate && analysis.sampleRate < 44100) score -= 10;
  if (analysis.sampleRate && analysis.sampleRate >= 44100) score += 5;

  if (analysis.channels === 1) score -= 5;
  if (analysis.channels && analysis.channels >= 2) score += 5;

  return clampScore(score);
}

function getTechnicalReadinessLabel(score) {
  if (score === null) return "Waiting for audio";
  if (score >= 85) return "Client-Ready Technically";
  if (score >= 70) return "Mostly Stable";
  if (score >= 55) return "Needs Technical Check";
  return "Needs Repair Before Delivery";
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

function buildAudioFactRows(metadata, analysis, label) {
  const rows = [];
  if (metadata) {
    rows.push({ label: `${label} Duration`, value: formatDuration(metadata.duration) });
    rows.push({ label: `${label} Size`, value: formatFileSize(metadata.size) });
  }
  if (analysis && analysis.status === "Ready") {
    rows.push({ label: `${label} Peak`, value: analysis.peakDb });
    rows.push({ label: `${label} Clipping Risk`, value: analysis.clippingRisk });
    rows.push({ label: `${label} Dynamics`, value: analysis.dynamics });
    if (analysis.sampleRate) rows.push({ label: `${label} Sample Rate`, value: `${analysis.sampleRate} Hz` });
    if (analysis.channels) rows.push({ label: `${label} Channels`, value: `${analysis.channels}` });
    rows.push({ label: `${label} Technical Readiness`, value: `${getTechnicalReadinessScore(analysis)}/100` });
    if (analysis.brightness) rows.push({ label: `${label} Brightness`, value: analysis.brightness });
    if (analysis.textureStability) rows.push({ label: `${label} Texture Stability`, value: analysis.textureStability });
  } else if (analysis) {
    rows.push({ label: `${label} Analysis`, value: analysis.status });
  }
  return rows;
}

function buildAudioFactsSentence(metadata, analysis, label = "uploaded file") {
  const facts = [];
  if (metadata) {
    facts.push(`duration is ${formatDuration(metadata.duration)}`);
    facts.push(`file size is ${formatFileSize(metadata.size)}`);
  }
  if (analysis && analysis.status === "Ready") {
    facts.push(`peak level is ${analysis.peakDb}`);
    facts.push(`clipping risk is ${analysis.clippingRisk.toLowerCase()}`);
    facts.push(`dynamics are ${analysis.dynamics.toLowerCase()}`);
    if (analysis.sampleRate) facts.push(`sample rate is ${analysis.sampleRate} Hz`);
    if (analysis.channels) facts.push(`channels detected: ${analysis.channels}`);
    facts.push(`technical readiness is ${getTechnicalReadinessScore(analysis)}/100`);
    if (analysis.brightness) facts.push(`brightness profile is ${analysis.brightness.toLowerCase()}`);
    if (analysis.textureStability) facts.push(`texture stability is ${analysis.textureStability.toLowerCase()}`);
  }
  if (!facts.length) return "";
  return `I also checked the real audio file. The ${label} ${facts.join(", ")}.`;
}

function buildArtifactClueSentence(analysis) {
  if (!analysis || analysis.status !== "Ready") return "";
  const clues = buildArtifactClues(analysis).filter((clue) => clue.level !== "Stable" && clue.level !== "Waiting");
  if (!clues.length) return "The early artifact clue scan did not flag any obvious technical warning signs.";
  const clueTitles = clues.slice(0, 3).map((clue) => clue.title.toLowerCase()).join(", ");
  return `The early artifact clue scan suggests checking for ${clueTitles}.`;
}

function parseDbValue(dbValue) {
  if (typeof dbValue !== "string" || dbValue.includes("∞")) return null;
  const parsed = Number.parseFloat(dbValue.replace("dB", ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function getRiskRank(risk) {
  if (risk === "High") return 3;
  if (risk === "Medium") return 2;
  if (risk === "Low") return 1;
  return 0;
}

function getDynamicsRank(dynamics) {
  if (dynamics === "Wide") return 3;
  if (dynamics === "Moderate") return 2;
  if (dynamics === "Compressed") return 1;
  return 0;
}

function getComparisonLabel(beforeValue, afterValue, lowerIsBetter = false) {
  if (beforeValue === null || afterValue === null) return "Needs both files";
  if (beforeValue === afterValue) return "No major change";
  const improved = lowerIsBetter ? afterValue < beforeValue : afterValue > beforeValue;
  return improved ? "Improved" : "Changed";
}

function buildBeforeAfterComparison(draftMetadata, humanizedMetadata, draftAnalysis, humanizedAnalysis) {
  if (!draftMetadata || !humanizedMetadata || !draftAnalysis || !humanizedAnalysis) return [];
  if (draftAnalysis.status !== "Ready" || humanizedAnalysis.status !== "Ready") return [];

  const draftDuration = Number.isFinite(draftMetadata.duration) ? draftMetadata.duration : null;
  const editDuration = Number.isFinite(humanizedMetadata.duration) ? humanizedMetadata.duration : null;
  const durationChange = draftDuration !== null && editDuration !== null ? editDuration - draftDuration : null;
  const draftPeak = parseDbValue(draftAnalysis.peakDb);
  const editPeak = parseDbValue(humanizedAnalysis.peakDb);
  const headroomChange = draftPeak !== null && editPeak !== null ? editPeak - draftPeak : null;

  return [
    { label: "Duration Change", before: draftDuration !== null ? formatDuration(draftDuration) : "Unknown", after: editDuration !== null ? formatDuration(editDuration) : "Unknown", change: durationChange !== null ? `${durationChange >= 0 ? "+" : ""}${durationChange.toFixed(1)} sec` : "Unknown", verdict: Math.abs(durationChange || 0) <= 2 ? "Nearly matched" : "Changed" },
    { label: "Peak / Headroom", before: draftAnalysis.peakDb, after: humanizedAnalysis.peakDb, change: headroomChange !== null ? `${headroomChange >= 0 ? "+" : ""}${headroomChange.toFixed(1)} dB` : "Unknown", verdict: getComparisonLabel(draftPeak, editPeak, true) },
    { label: "Clipping Risk", before: draftAnalysis.clippingRisk, after: humanizedAnalysis.clippingRisk, change: `${draftAnalysis.clippingRisk} → ${humanizedAnalysis.clippingRisk}`, verdict: getComparisonLabel(getRiskRank(draftAnalysis.clippingRisk), getRiskRank(humanizedAnalysis.clippingRisk), true) },
    { label: "Dynamics", before: draftAnalysis.dynamics, after: humanizedAnalysis.dynamics, change: `${draftAnalysis.dynamics} → ${humanizedAnalysis.dynamics}`, verdict: getComparisonLabel(getDynamicsRank(draftAnalysis.dynamics), getDynamicsRank(humanizedAnalysis.dynamics), false) },
  ];
}

function getBeforeAfterImprovementScore(draftAnalysis, humanizedAnalysis) {
  if (!draftAnalysis || !humanizedAnalysis) return null;
  if (draftAnalysis.status !== "Ready" || humanizedAnalysis.status !== "Ready") return null;

  let score = 50;
  const draftPeak = parseDbValue(draftAnalysis.peakDb);
  const editPeak = parseDbValue(humanizedAnalysis.peakDb);
  const clippingChange = getRiskRank(draftAnalysis.clippingRisk) - getRiskRank(humanizedAnalysis.clippingRisk);
  const dynamicsChange = getDynamicsRank(humanizedAnalysis.dynamics) - getDynamicsRank(draftAnalysis.dynamics);

  score += clippingChange * 15;
  score += dynamicsChange * 12;

  if (draftPeak !== null && editPeak !== null) {
    const extraHeadroom = draftPeak - editPeak;
    if (extraHeadroom >= 1) score += 12;
    else if (extraHeadroom >= 0.3) score += 6;
    else if (extraHeadroom <= -1) score -= 10;
  }

  return clampScore(score);
}

function getBeforeAfterImprovementLabel(score) {
  if (score === null) return "Waiting for both files";
  if (score >= 80) return "Strong Technical Improvement";
  if (score >= 65) return "Clear Technical Improvement";
  if (score >= 50) return "Subtle Technical Improvement";
  return "Needs Another Pass";
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

function loadSavedSession() {
  if (typeof window === "undefined") return defaultProjectSession;
  try {
    const saved = window.localStorage.getItem("soulframe-project-session");
    return saved ? { ...defaultProjectSession, ...JSON.parse(saved) } : defaultProjectSession;
  } catch (error) {
    return defaultProjectSession;
  }
}

function loadSavedSetting(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    return window.localStorage.getItem(key) || fallback;
  } catch (error) {
    return fallback;
  }
}

function saveSetting(key, value) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // Ignore local storage failures so the app keeps working.
  }
}

function loadSavedProjects() {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.localStorage.getItem("soulframe-saved-projects");
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveSavedProjects(projects) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("soulframe-saved-projects", JSON.stringify(projects));
  } catch (error) {
    // Ignore local storage failures so the app keeps working.
  }
}

function buildSavedProjectRecord(projectSession, reviewMode, selectedPreset) {
  const now = new Date().toISOString();
  return {
    id: `soulframe-${Date.now()}`,
    projectSession,
    reviewMode,
    selectedPreset,
    savedAt: now,
    title: getSessionValue(projectSession, "projectName"),
    client: getSessionValue(projectSession, "clientName"),
    stage: getSessionValue(projectSession, "currentStage"),
  };
}

function buildSavedProjectsBackup(savedProjects) {
  return JSON.stringify(
    {
      app: "SoulFrame",
      type: "saved-projects-backup",
      version: "3.5",
      exportedAt: new Date().toISOString(),
      projects: savedProjects,
    },
    null,
    2
  );
}

function parseSavedProjectsBackup(text) {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || parsed.type !== "saved-projects-backup" || !Array.isArray(parsed.projects)) {
      return [];
    }
    return parsed.projects;
  } catch (error) {
    return [];
  }
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
    typeof HowSoulFrameWorksPanel === "function" &&
    buildProductSummaryText().includes("SOULFRAME PRODUCT SUMMARY") &&
    buildProductSummaryText().includes("V3.5 public demo polish") &&
    typeof DemoWalkthroughPanel === "function" &&
    buildSavedProjectRecord(demoPresets.vocalDraft.projectSession, demoPresets.vocalDraft.reviewMode, demoPresets.vocalDraft.selectedPreset).title === "AI Vocal Humanization Demo" &&
    typeof QuickStartGuide === "function" &&
    typeof SoulFrameFooter === "function" &&
    typeof DemoReadinessBanner === "function" &&
    typeof PublicDemoNotice === "function" &&
    typeof DemoUseCasesPanel === "function" &&
    typeof PublicLaunchChecklist === "function" &&
    typeof PublicDemoStats === "function" &&
    typeof ReleaseNotesPanel === "function" &&
    typeof PublicRoadmapPreview === "function" &&
    typeof ShareSoulFramePanel === "function" &&
    typeof V41BackendScaffoldPanel === "function" &&
    typeof V41AnalysisEngineSeparationPanel === "function" &&
    typeof V41MockApiResponsePanel === "function" &&
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

function DemoReadinessBanner() {
  const items = [
    { label: "Prototype", value: "V3.5 public demo polish" },
    { label: "Analysis", value: "Browser-based audio review" },
    { label: "Demo", value: "Presets work without uploads" },
    { label: "Privacy", value: "Saved sessions stay local" },
  ];

  return (
    <div className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-2xl border border-zinc-800 bg-black p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{item.label}</p>
            <p className="mt-2 text-sm font-semibold text-zinc-100">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
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

function DemoUseCasesPanel() {
  const useCases = [
    {
      title: "Freelance producer workflow",
      note: "Use SoulFrame to organize review notes before sending a clearer update to a client.",
    },
    {
      title: "AI vocal humanization",
      note: "Check metallic tone, cracking, flat phrasing, and emotional delivery before the next vocal pass.",
    },
    {
      title: "Instrumental texture cleanup",
      note: "Review shimmer, buzzing residue, repetition, and generated movement in AI instrumental drafts.",
    },
    {
      title: "Before / after review",
      note: "Compare an AI draft against a humanized edit and identify what improved before final delivery.",
    },
  ];

  return (
    <Panel title="Demo Use Cases" subtitle="The main ways SoulFrame can be tested, explained, or shown as a public prototype.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {useCases.map((useCase) => (
          <article key={useCase.title} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <h3 className="font-semibold text-zinc-100">{useCase.title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{useCase.note}</p>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function PublicLaunchChecklist() {
  const checklist = [
    { label: "Live demo is accessible", status: "Ready" },
    { label: "README explains the current version", status: "Ready" },
    { label: "Demo presets work without uploads", status: "Ready" },
    { label: "Project links are easy to find", status: "Ready" },
    { label: "Client names are neutralized", status: "Ready" },
    { label: "Public prototype limitations are clear", status: "Ready" },
  ];

  return (
    <Panel title="Public Launch Checklist" subtitle="A lightweight readiness checklist for sharing SoulFrame as a public prototype.">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {checklist.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-black p-4">
            <p className="text-sm text-zinc-200">{item.label}</p>
            <span className="shrink-0 rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{item.status}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PublicDemoStats({ savedProjectsCount }) {
  const stats = [
    { label: "Demo Presets", value: Object.keys(demoPresets).length },
    { label: "Artifact Types", value: artifactDatabase.length },
    { label: "Walkthrough Steps", value: demoWalkthroughSteps.length },
    { label: "Saved Sessions", value: savedProjectsCount },
  ];

  return (
    <Panel title="Public Demo Stats" subtitle="A quick snapshot of what is currently available inside this SoulFrame prototype.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold text-zinc-100">{stat.value}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ReleaseNotesPanel() {
  const releaseNotes = [
    "Improved first-time visitor flow with Quick Start and demo launchers.",
    "Added public-facing context so visitors understand the prototype clearly.",
    "Added launch checklist, demo stats, use cases, share links, and public footer links.",
    "Improved saved project sessions with an empty state and backup import/export support.",
    "Neutralized demo naming for a cleaner public repository.",
  ];

  return (
    <Panel title="V3.5 Release Notes" subtitle="A concise summary of what changed in the current public demo polish release.">
      <div className="space-y-3">
        {releaseNotes.map((note, index) => (
          <div key={note} className="flex gap-3 rounded-2xl border border-zinc-800 bg-black p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span>
            <p className="text-sm leading-6 text-zinc-300">{note}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PublicRoadmapPreview() {
  const roadmap = [
    { version: "V4.0", title: "Deeper Audio Intelligence", note: "More detailed frequency, texture, harshness, and humanization scoring." },
    { version: "V4.1", title: "Backend/API Prototype", note: "Move beyond local-only analysis toward a more scalable product structure." },
    { version: "V4.2", title: "Smarter Reports", note: "Genre-aware recommendations, clearer client language, and better edit priorities." },
    { version: "V5.0", title: "Public Beta Direction", note: "Shareable reports, stronger branding, saved cloud sessions, and beta-ready polish." },
  ];

  return (
    <Panel title="Roadmap Preview" subtitle="A transparent look at where SoulFrame can grow after the current public demo release.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {roadmap.map((item) => (
          <article key={item.version} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{item.version}</p>
            <h3 className="mt-3 font-semibold text-zinc-100">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{item.note}</p>
          </article>
        ))}
      </div>
    </Panel>
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

function ProjectSnapshot({ reviewMode, selectedReport, projectSession, draftAudioMetadata, humanizedAudioMetadata }) {
  const items = [
    { label: "Project", value: getSessionValue(projectSession, "projectName"), note: `Client: ${getSessionValue(projectSession, "clientName")}` },
    { label: "Current Stage", value: getSessionValue(projectSession, "currentStage"), note: reviewMode === "compare" ? "Checking your humanized pass before client delivery." : "Finding what needs to be fixed before Edit 1." },
    { label: "Main Concern", value: getSessionValue(projectSession, "mainConcern"), note: "The main issue brought into the review." },
    { label: "Delivery Readiness", value: getDeliveryReadiness(selectedReport.score), note: "Based on the current simulated SoulFrame score." },
  ];
  if (draftAudioMetadata) items.push({ label: "Draft Duration", value: formatDuration(draftAudioMetadata.duration), note: `${formatFileSize(draftAudioMetadata.size)} - ${draftAudioMetadata.type}` });
  if (reviewMode === "compare" && humanizedAudioMetadata) items.push({ label: "Edit Duration", value: formatDuration(humanizedAudioMetadata.duration), note: `${formatFileSize(humanizedAudioMetadata.size)} - ${humanizedAudioMetadata.type}` });
  return (
    <Panel title="Project Snapshot" subtitle="A quick overview of this client session, now connected to the uploaded audio file.">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => <article key={item.label} className="rounded-3xl border border-zinc-800 bg-black p-5"><p className="text-xs uppercase tracking-wide text-zinc-500">{item.label}</p><h3 className="mt-3 text-lg font-semibold text-zinc-100">{item.value}</h3><p className="mt-2 text-sm text-zinc-400">{item.note}</p></article>)}
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

function RevisionTimeline({ reviewMode, selectedReport }) {
  const timeline = buildRevisionTimeline(reviewMode, selectedReport);
  return <Panel title="Revision History" subtitle="A simple project timeline from raw AI draft to client-ready final polish."><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{timeline.map((step, index) => <article key={step.title} className="rounded-3xl border border-zinc-800 bg-black p-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span><h3 className="mt-4 font-semibold text-zinc-100">{step.title}</h3><p className="mt-2 text-sm text-zinc-400">{step.status}</p><p className="mt-3 text-sm text-zinc-200">{step.focus}</p></article>)}</div></Panel>;
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
    "V3.5 public demo polish prototype with browser-based audio analysis, producer-guided review logic, demo onboarding, share links, and local project sessions.",
  ].join(newline);
}

function ShareSoulFramePanel() {
  const [copyStatus, setCopyStatus] = useState("Copy Links");
  const [downloadStatus, setDownloadStatus] = useState("Download Links");

  async function handleCopyLinks() {
    try {
      await navigator.clipboard.writeText(buildShareLinksText());
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy Links"), 1500);
    } catch (error) {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus("Copy Links"), 1500);
    }
  }

  function handleDownloadLinks() {
    const downloaded = downloadTextFile("SoulFrame_Public_Links.txt", buildShareLinksText());
    setDownloadStatus(downloaded ? "Downloaded" : "Download failed");
    window.setTimeout(() => setDownloadStatus("Download Links"), 1500);
  }

  return (
    <Panel
      title="Share SoulFrame"
      subtitle="A clean public link kit for sharing the live demo, repository, and ChordOfAnnie home base."
      action={
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={handleCopyLinks}>{copyStatus}</Button>
          <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={handleDownloadLinks}>{downloadStatus}</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {publicShareLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl border border-zinc-800 bg-black p-5 transition hover:bg-zinc-900"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Public Link</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{link.label}</h3>
            <p className="mt-3 break-words text-sm leading-6 text-zinc-400">{link.href}</p>
          </a>
        ))}
      </div>
      <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Share line</p>
        <p className="mt-3 text-sm leading-7 text-zinc-300">
          SoulFrame is a browser-based AI music humanization review tool built to help producers inspect AI-generated drafts, identify artifact clues, and turn analysis into clearer revision plans and client-ready updates.
        </p>
      </div>
    </Panel>
  );
}

function AboutSoulFramePanel() {
  const [copyStatus, setCopyStatus] = useState("Copy Product Summary");
  const [downloadStatus, setDownloadStatus] = useState("Download Product Summary");
  const pillars = [
    {
      title: "Listen",
      note: "Upload AI-generated drafts and inspect real audio facts like waveform, duration, headroom, dynamics, brightness, and texture movement.",
    },
    {
      title: "Detect",
      note: "Use lightweight browser-based analysis to surface early artifact clues, humanization priority, and section-by-section review prompts.",
    },
    {
      title: "Guide",
      note: "Turn review results into producer-focused action plans, client-safe notes, revision checklists, and next-pass priorities.",
    },
    {
      title: "Export",
      note: "Copy or download producer reports, client reports, client action plans, summaries, checklists, and saved project sessions.",
    },
  ];

  async function handleCopyProductSummary() {
    try {
      await navigator.clipboard.writeText(buildProductSummaryText());
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy Product Summary"), 1500);
    } catch (error) {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus("Copy Product Summary"), 1500);
    }
  }

  function handleDownloadProductSummary() {
    const downloaded = downloadTextFile("SoulFrame_Product_Summary.txt", buildProductSummaryText());
    setDownloadStatus(downloaded ? "Downloaded" : "Download failed");
    window.setTimeout(() => setDownloadStatus("Download Product Summary"), 1500);
  }

  return (
    <Panel
      title="About SoulFrame"
      subtitle="A second set of ears for humanizing AI-generated music."
      action={
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={handleCopyProductSummary}>{copyStatus}</Button>
          <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={handleDownloadProductSummary}>{downloadStatus}</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-zinc-800 bg-black p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Mission</p>
          <h3 className="mt-3 text-2xl font-semibold text-zinc-100">Humanize sound. Bring soul back into music.</h3>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            SoulFrame is built to support producers working with AI-generated music. It does not replace taste, emotion, or human judgement. It helps organize the listening process so synthetic drafts can be shaped into something more intentional, musical, and alive.
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-800 bg-black p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Current Stage</p>
          <h3 className="mt-3 text-2xl font-semibold text-zinc-100">V3.5 public demo prototype</h3>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            The app currently combines real browser-based audio inspection with producer-guided review logic, report exports, client-safe summaries, revision checklists, saved sessions, demo presets, walkthrough views, share links, and public demo readiness panels.
          </p>
        </article>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <h3 className="text-lg font-semibold text-zinc-100">{pillar.title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{pillar.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-zinc-800 bg-black p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Product Arc</p>
        <p className="mt-3 text-2xl font-semibold text-zinc-100">Review → Decide → Export → Send → Revise</p>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          This is the practical workflow SoulFrame is moving toward: help the producer review the draft, decide what matters, export the right version of the notes, communicate clearly with the client, and guide the next revision pass.
        </p>
      </div>
    </Panel>
  );
}

function DemoWalkthroughPanel() {
  return (
    <Panel title="Demo Walkthrough" subtitle="A guided product story for screenshots, live demos, and explaining SoulFrame quickly.">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {demoWalkthroughSteps.map((step, index) => (
          <article key={step.title} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span>
            <h3 className="mt-4 font-semibold text-zinc-100">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{step.note}</p>
          </article>
        ))}
      </div>
      <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Suggested demo line</p>
        <p className="mt-3 text-lg leading-8 text-zinc-200">
          SoulFrame helps a producer move from an AI-generated draft to a clearer humanization plan, then export the right notes for their own workflow or for client communication.
        </p>
      </div>
    </Panel>
  );
}

function HowSoulFrameWorksPanel() {
  const workflow = [
    {
      title: "1. Intake the project",
      note: "Capture the project name, client, track type, AI tool, current stage, main concern, client goal, and private producer notes.",
    },
    {
      title: "2. Inspect the audio",
      note: "Upload the draft and optionally the humanized edit. SoulFrame reads browser-based audio facts such as duration, waveform, peak, clipping risk, dynamics, brightness, and texture movement.",
    },
    {
      title: "3. Surface humanization clues",
      note: "The app converts measurable audio proxies into early artifact clues, listening focus points, priority scores, section notes, and before/after deltas.",
    },
    {
      title: "4. Turn clues into actions",
      note: "SoulFrame generates producer action plans, client-safe wording, revision checklists, delivery checks, and session summaries.",
    },
    {
      title: "5. Export and communicate",
      note: "Copy or download reports, client action plans, client-safe summaries, revision checklists, delivery checklists, saved projects, and product summaries.",
    },
  ];

  return (
    <Panel title="How SoulFrame Works" subtitle="The full product logic from AI draft to client-ready revision planning.">
      <div className="space-y-4">
        {workflow.map((step) => (
          <article key={step.title} className="rounded-3xl border border-zinc-800 bg-black p-6">
            <h3 className="text-xl font-semibold text-zinc-100">{step.title}</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-400">{step.note}</p>
          </article>
        ))}
      </div>
      <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Important note</p>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          SoulFrame does not claim to replace the producer's ear. The current version uses browser-based audio analysis and producer-guided logic to support decisions, structure the review, and make the client workflow clearer.
        </p>
      </div>
    </Panel>
  );
}

function ArtifactDatabase() {
  return <Panel title="Artifact Database" subtitle="The early SoulFrame knowledge base of common AI music artifacts."><div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{artifactDatabase.map((artifact) => <article key={artifact.name} className="rounded-3xl border border-zinc-800 bg-black p-5"><div className="mb-3 flex items-start justify-between gap-3"><div><h3 className="font-semibold text-zinc-100">{artifact.name}</h3><p className="mt-1 text-xs text-zinc-500">{artifact.category}</p></div><span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{artifact.severity}</span></div><p className="text-sm text-zinc-400">{artifact.description}</p><div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Common Fix</p><p className="text-sm text-zinc-200">{artifact.fix}</p></div></article>)}</div></Panel>;
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
  const [view, setView] = useState("demo");
  const [selectedPreset, setSelectedPreset] = useState(() => loadSavedSetting("soulframe-selected-preset", "marcel"));
  const [activeStep, setActiveStep] = useState(0);
  const [draftFile, setDraftFile] = useState("");
  const [humanizedFile, setHumanizedFile] = useState("");
  const [draftAudioUrl, setDraftAudioUrl] = useState("");
  const [humanizedAudioUrl, setHumanizedAudioUrl] = useState("");
  const [draftAudioMetadata, setDraftAudioMetadata] = useState(null);
  const [humanizedAudioMetadata, setHumanizedAudioMetadata] = useState(null);
  const [draftAudioAnalysis, setDraftAudioAnalysis] = useState(null);
  const [humanizedAudioAnalysis, setHumanizedAudioAnalysis] = useState(null);
  const [reviewMode, setReviewMode] = useState(() => loadSavedSetting("soulframe-review-mode", "draft"));
  const [projectSession, setProjectSession] = useState(() => loadSavedSession());
  const [savedProjects, setSavedProjects] = useState(() => loadSavedProjects());
  const selectedReport = reviewMode === "compare" ? beforeAfterReport : draftReports[selectedPreset];
  const testsPassed = runSoulFrameTests();

  useEffect(() => {
    if (activeStep <= 0 || activeStep >= analysisSteps.length) return undefined;
    const timer = window.setTimeout(() => setActiveStep((current) => Math.min(current + 1, analysisSteps.length)), 450);
    return () => window.clearTimeout(timer);
  }, [activeStep]);

  useEffect(() => () => { if (draftAudioUrl) URL.revokeObjectURL(draftAudioUrl); if (humanizedAudioUrl) URL.revokeObjectURL(humanizedAudioUrl); }, [draftAudioUrl, humanizedAudioUrl]);

  useEffect(() => {
    saveSetting("soulframe-project-session", JSON.stringify(projectSession));
  }, [projectSession]);

  useEffect(() => {
    saveSetting("soulframe-selected-preset", selectedPreset);
  }, [selectedPreset]);

  useEffect(() => {
    saveSetting("soulframe-review-mode", reviewMode);
  }, [reviewMode]);

  useEffect(() => {
    saveSavedProjects(savedProjects);
  }, [savedProjects]);

  function handleRunAnalysis() { setActiveStep(1); }

  function resetProjectSession() {
    setProjectSession(defaultProjectSession);
    setSelectedPreset("marcel");
    setReviewMode("draft");
  }

  function applyDemoPreset(presetKey) {
    const preset = demoPresets[presetKey];
    if (!preset) return;
    setProjectSession({ ...defaultProjectSession, ...preset.projectSession });
    setSelectedPreset(preset.selectedPreset || "marcel");
    setReviewMode(preset.reviewMode || "draft");
    setActiveStep(0);
  }

  function saveDemoPresetAsProject(presetKey) {
    const preset = demoPresets[presetKey];
    if (!preset) return;
    const presetSession = { ...defaultProjectSession, ...preset.projectSession };
    const record = buildSavedProjectRecord(presetSession, preset.reviewMode || "draft", preset.selectedPreset || "marcel");
    setSavedProjects((current) => [record, ...current].slice(0, 24));
  }

  function saveProjectSnapshot() {
    const record = buildSavedProjectRecord(projectSession, reviewMode, selectedPreset);
    setSavedProjects((current) => [record, ...current].slice(0, 12));
  }

  function loadSavedProjectSnapshot(projectId) {
    const savedProject = savedProjects.find((project) => project.id === projectId);
    if (!savedProject) return;
    setProjectSession({ ...defaultProjectSession, ...savedProject.projectSession });
    setReviewMode(savedProject.reviewMode || "draft");
    setSelectedPreset(savedProject.selectedPreset || "marcel");
  }

  function deleteSavedProject(projectId) {
    setSavedProjects((current) => current.filter((project) => project.id !== projectId));
  }

  function clearSavedProjects() {
    setSavedProjects([]);
  }

  function importSavedProjectsBackup(backupText) {
    const importedProjects = parseSavedProjectsBackup(backupText);
    if (!importedProjects.length) return;
    setSavedProjects((current) => {
      const existingIds = new Set(current.map((project) => project.id));
      const freshImports = importedProjects.filter((project) => project && project.id && !existingIds.has(project.id));
      return [...freshImports, ...current].slice(0, 24);
    });
  }

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

  const demoView = (
    <div className="space-y-6">
      <QuickStartGuide applyDemoPreset={applyDemoPreset} setView={setView} />
      <DemoReadinessBanner />
      <PublicDemoNotice />
      <V41BackendScaffoldPanel />
      <V41AnalysisEngineSeparationPanel />
      <V41MockApiResponsePanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <DemoUseCasesPanel />
      <PublicLaunchChecklist />
      <PublicDemoStats savedProjectsCount={savedProjects.length} />
      <ReleaseNotesPanel />
      <PublicRoadmapPreview />
      <ProjectIntake projectSession={projectSession} setProjectSession={setProjectSession} selectedReport={selectedReport} resetProjectSession={resetProjectSession} saveProjectSnapshot={saveProjectSnapshot} savedProjectsCount={savedProjects.length} applyDemoPreset={applyDemoPreset} saveDemoPresetAsProject={saveDemoPresetAsProject} />
      <ProjectSnapshot reviewMode={reviewMode} selectedReport={selectedReport} projectSession={projectSession} draftAudioMetadata={draftAudioMetadata} humanizedAudioMetadata={humanizedAudioMetadata} />
      <SavedProjectHistory savedProjects={savedProjects} loadSavedProjectSnapshot={loadSavedProjectSnapshot} deleteSavedProject={deleteSavedProject} clearSavedProjects={clearSavedProjects} importSavedProjectsBackup={importSavedProjectsBackup} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ReviewSetupPanel reviewMode={reviewMode} setReviewMode={setReviewMode} draftFile={draftFile} humanizedFile={humanizedFile} draftAudioUrl={draftAudioUrl} humanizedAudioUrl={humanizedAudioUrl} draftAudioMetadata={draftAudioMetadata} humanizedAudioMetadata={humanizedAudioMetadata} draftAudioAnalysis={draftAudioAnalysis} humanizedAudioAnalysis={humanizedAudioAnalysis} handleDraftFileChange={handleDraftFileChange} handleHumanizedFileChange={handleHumanizedFileChange} selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} handleRunAnalysis={handleRunAnalysis} testsPassed={testsPassed} />
        {activeStep > 0 && activeStep < analysisSteps.length ? <AnalysisProgress activeStep={activeStep} /> : <ReportView report={selectedReport} reviewMode={reviewMode} projectSession={projectSession} draftAudioMetadata={draftAudioMetadata} humanizedAudioMetadata={humanizedAudioMetadata} draftAudioAnalysis={draftAudioAnalysis} humanizedAudioAnalysis={humanizedAudioAnalysis} selectedPreset={selectedPreset} />}
      </div>
      <ProjectWorkflow reviewMode={reviewMode} selectedReport={selectedReport} />
      <RevisionPlan selectedReport={selectedReport} reviewMode={reviewMode} />
      <RevisionTimeline reviewMode={reviewMode} selectedReport={selectedReport} />
    </div>
  );

  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-6 shadow-2xl md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-500">SoulFrame</p>
                <span className="rounded-full border border-zinc-800 bg-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">V3.5.0 Public Demo</span>
              </div>
              <h1 className="mt-3 max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl">AI Music Humanization Review Tool</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">Upload an AI draft, preview the audio, map the humanization priorities, and generate a clean client update from the review.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className={view === "demo" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("demo")}>Review Demo</Button>
              <Button className={view === "database" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("database")}>Artifact Database</Button>
              <Button className={view === "about" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("about")}>About</Button>
              <Button className={view === "walkthrough" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("walkthrough")}>Walkthrough</Button>
              <Button className={view === "how" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("how")}>How It Works</Button>
              <Button className={view === "share" ? "bg-white text-black hover:bg-zinc-200" : "border border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"} onClick={() => setView("share")}>Share</Button>
            </div>
          </div>
        </header>
        <ErrorBoundary>
          {view === "database" ? <ArtifactDatabase /> : view === "about" ? <AboutSoulFramePanel /> : view === "walkthrough" ? <DemoWalkthroughPanel /> : view === "how" ? <HowSoulFrameWorksPanel /> : view === "share" ? <ShareSoulFramePanel /> : demoView}
        </ErrorBoundary>
        <SoulFrameFooter setView={setView} />
      </div>
    </main>
  );
}