/**
 * SoulFrame V5.4.6 - Browser audio analysis engine.
 *
 * Extracted without changing the existing proxy metrics, thresholds or report
 * contracts. These values support a producer's listening review; they are not
 * definitive AI-artifact detection or musical-quality measurements.
 *
 * loadAudioDuration and loadAudioHealthCheck require browser APIs. The other
 * functions can be imported independently for deterministic checks.
 */

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

export {
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
};
