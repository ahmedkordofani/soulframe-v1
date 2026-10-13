/**
 * SoulFrame V5.4.7 - Pure report builders.
 * The report output contracts and thresholds are unchanged from V5.4.6.
 * Audio metrics are listening aids, not validated AI-artifact detection.
 */
import {
  getHumanizationPriorityScore,
  getHumanizationPriorityLabel,
  buildArtifactClueSentence,
} from "../analysis/audioAnalysis.js";
import { defaultProjectSession } from "../core/projectDefaults.js";

export function normalizeV42Text(value) {
  return String(value || "").toLowerCase();
}

export function detectV42GenreFocus(projectSession = {}) {
  const context = [
    projectSession.projectName,
    projectSession.trackType,
    projectSession.clientGoal,
    projectSession.mainConcern,
    projectSession.producerNotes,
  ].map(normalizeV42Text).join(" ");

  if (context.includes("hip hop") || context.includes("hip-hop") || context.includes("trap") || context.includes("rap")) return "Hip-Hop / Rap";
  if (context.includes("r&b") || context.includes("rnb") || context.includes("soul")) return "R&B / Soul";
  if (context.includes("edm") || context.includes("dubstep") || context.includes("dance") || context.includes("electronic")) return "Electronic / EDM";
  if (context.includes("rock") || context.includes("guitar") || context.includes("band")) return "Rock / Guitar-led";
  if (context.includes("cinematic") || context.includes("score") || context.includes("film")) return "Cinematic / Score";
  if (context.includes("lofi") || context.includes("lo-fi") || context.includes("ambient")) return "Lo-Fi / Ambient";
  if (context.includes("pop")) return "Pop";
  return "General music";
}

export function detectV42ReportPath(projectSession = {}, reviewMode = "draft") {
  const context = [
    projectSession.projectName,
    projectSession.trackType,
    projectSession.clientGoal,
    projectSession.mainConcern,
    projectSession.producerNotes,
  ].map(normalizeV42Text).join(" ");

  if (reviewMode === "compare") return "Before / After Humanization Report";
  if (context.includes("vocal") || context.includes("voice") || context.includes("singer") || context.includes("lyrics")) return "Vocal Humanization Report";
  if (context.includes("instrumental") || context.includes("beat") || context.includes("score") || context.includes("loop")) return "Instrumental Humanization Report";
  return "General AI Draft Humanization Report";
}

export function buildV42SuggestedEditOrder(analysis) {
  if (!analysis || analysis.status !== "Ready") {
    return [
      "Upload or load a demo track so SoulFrame can route the report around the active analysis.",
      "Confirm the project type and main concern in Project Intake.",
      "Generate the client update only after the analysis has a clear direction.",
    ];
  }

  const moves = [];

  if (analysis.clippingRisk === "Medium" || analysis.clippingRisk === "High") {
    moves.push("Fix headroom and clipping risk first so every later decision is easier to judge.");
  }

  if (analysis.brightness === "Bright / Potentially Harsh") {
    moves.push("Control brittle top-end and harsh shimmer before making emotional or mix-balance decisions.");
  }

  if (analysis.textureStability === "Unstable / Busy") {
    moves.push("Smooth generated texture movement so the track feels less synthetic and more intentional.");
  }

  if (analysis.dynamics === "Compressed") {
    moves.push("Restore movement and contrast so the performance feels less flat.");
  }

  moves.push("Check section transitions and add human variation where the arrangement feels too looped.");
  moves.push("Convert the technical findings into a short client-safe revision note.");

  return moves.slice(0, 5);
}

export function estimateV42RevisionDifficulty(analysis) {
  if (!analysis || analysis.status !== "Ready") {
    return {
      label: "Waiting for analysis",
      note: "Difficulty will be estimated once an audio file or demo preset has active analysis data.",
    };
  }

  const priorityScore = getHumanizationPriorityScore(analysis);

  if (priorityScore >= 75) {
    return {
      label: "High difficulty",
      note: "This needs a focused humanization pass before it should be presented as final.",
    };
  }

  if (priorityScore >= 45) {
    return {
      label: "Medium difficulty",
      note: "The draft is workable, but the report should guide one clear revision pass.",
    };
  }

  return {
    label: "Low difficulty",
    note: "The draft is close enough for polish, client language, and final delivery checks.",
  };
}

export function buildV42ToneOptions(reportPath) {
  return [
    {
      label: "Professional",
      use: `Best for formal client updates connected to a ${reportPath.toLowerCase()}.`,
    },
    {
      label: "Encouraging",
      use: "Best when the client needs reassurance that the draft is moving in the right direction.",
    },
    {
      label: "Direct",
      use: "Best when the revision needs clear technical priorities without over-explaining.",
    },
  ];
}

export function buildV42ReportContext(projectSession = defaultProjectSession, reviewMode = "draft", analysis = null) {
  const reportPath = detectV42ReportPath(projectSession, reviewMode);
  const genreFocus = detectV42GenreFocus(projectSession);
  const difficulty = estimateV42RevisionDifficulty(analysis);
  const suggestedEditOrder = buildV42SuggestedEditOrder(analysis);
  const priorityScore = analysis && analysis.status === "Ready" ? getHumanizationPriorityScore(analysis) : null;

  return {
    version: "v4.2",
    feature: "Smarter Humanization Report Router",
    reportPath,
    genreFocus,
    difficulty,
    suggestedEditOrder,
    toneOptions: buildV42ToneOptions(reportPath),
    priorityScore,
    clientSummaryFocus: suggestedEditOrder[suggestedEditOrder.length - 1],
  };
}

export function buildV42SmarterReportText(projectSession = defaultProjectSession, reviewMode = "draft", analysis = null) {
  const newline = String.fromCharCode(10);
  const context = buildV42ReportContext(projectSession, reviewMode, analysis);

  return [
    "SOULFRAME V4.2 SMARTER HUMANIZATION REPORT ROUTER",
    "",
    `Version: ${context.version}`,
    `Report path: ${context.reportPath}`,
    `Genre focus: ${context.genreFocus}`,
    `Revision difficulty: ${context.difficulty.label}`,
    `Humanization priority: ${context.priorityScore === null ? "Waiting" : `${context.priorityScore}/100`}`,
    "",
    "SUGGESTED EDIT ORDER",
    ...context.suggestedEditOrder.map((item, index) => `${index + 1}. ${item}`),
    "",
    "CLIENT TONE OPTIONS",
    ...context.toneOptions.map((item) => `- ${item.label}: ${item.use}`),
  ].join(newline);
}

export function buildV42GenreRecommendationProfile(genreFocus = "General music", reportPath = "General AI Draft Humanization Report", analysis = null) {
  const normalizedGenre = normalizeV42Text(genreFocus);
  const normalizedPath = normalizeV42Text(reportPath);
  const isReady = analysis && analysis.status === "Ready";

  const shared = {
    emotionalTarget: "Keep the track intentional, less synthetic, and easier for a listener to trust.",
    priority: isReady ? getHumanizationPriorityLabel(getHumanizationPriorityScore(analysis)) : "Waiting for analysis",
  };

  if (normalizedPath.includes("vocal")) {
    return {
      title: "Vocal Humanization Focus",
      listeningLens: "Lead emotion, vocal texture, breath, phrasing, and how naturally the vocal sits in the track.",
      musicalMoves: [
        "Check whether the vocal feels emotionally present rather than pasted on top of the beat.",
        "Soften harsh generated sibilance, metallic air, or brittle vocal edges before widening or brightening.",
        "Add subtle automation so phrases breathe and important lines feel intentionally supported.",
      ],
      clientAngle: "Frame the revision around improving emotional delivery, vocal realism, and listener connection.",
      ...shared,
    };
  }

  if (normalizedPath.includes("instrumental")) {
    return {
      title: "Instrumental Humanization Focus",
      listeningLens: "Arrangement movement, groove variation, texture depth, and whether the instrumental feels looped or performed.",
      musicalMoves: [
        "Look for repeated patterns that need small human variations across sections.",
        "Shape transitions so the arrangement feels guided rather than generated in blocks.",
        "Use texture cleanup only after the groove and section movement feel intentional.",
      ],
      clientAngle: "Frame the revision around making the instrumental feel more arranged, dynamic, and emotionally directed.",
      ...shared,
    };
  }

  if (normalizedPath.includes("before / after")) {
    return {
      title: "Before / After Humanization Focus",
      listeningLens: "Whether the humanized edit improves emotion, clarity, movement, and client-readiness compared with the original draft.",
      musicalMoves: [
        "Compare the most obvious artificial texture in the original against the humanized version.",
        "Check whether the edit improved feel without over-processing the track.",
        "Use the report to explain what changed in simple client-safe language.",
      ],
      clientAngle: "Frame the revision around clear improvement from draft to humanized edit.",
      ...shared,
    };
  }

  if (normalizedGenre.includes("hip-hop") || normalizedGenre.includes("rap")) {
    return {
      title: "Hip-Hop / Rap Focus",
      listeningLens: "Drum weight, vocal pocket, low-end confidence, space around the lead, and whether the beat feels alive.",
      musicalMoves: [
        "Prioritize the pocket between drums, bass, and vocal before polishing decorative textures.",
        "Keep the low end controlled but not over-cleaned, because weight is part of the emotional impact.",
        "Remove brittle AI shimmer that distracts from the groove or vocal presence.",
      ],
      clientAngle: "Frame the revision around stronger pocket, cleaner impact, and more natural energy.",
      ...shared,
    };
  }

  if (normalizedGenre.includes("r&b") || normalizedGenre.includes("soul")) {
    return {
      title: "R&B / Soul Focus",
      listeningLens: "Warmth, vocal intimacy, groove softness, chord movement, and emotional smoothness.",
      musicalMoves: [
        "Protect warmth and intimacy before chasing brightness.",
        "Smooth any plastic top-end that makes the vocal or keys feel less human.",
        "Use subtle dynamic movement so the track breathes instead of feeling grid-locked.",
      ],
      clientAngle: "Frame the revision around warmth, emotion, and a more natural human feel.",
      ...shared,
    };
  }

  if (normalizedGenre.includes("electronic") || normalizedGenre.includes("edm")) {
    return {
      title: "Electronic / EDM Focus",
      listeningLens: "Impact, controlled brightness, drop energy, transition design, and synthetic texture that still feels intentional.",
      musicalMoves: [
        "Keep bright energy exciting without letting harshness become fatiguing.",
        "Make transitions, risers, and drops feel designed rather than randomly generated.",
        "Tighten low-end impact after harshness and texture movement are under control.",
      ],
      clientAngle: "Frame the revision around energy, impact, and cleaner controlled intensity.",
      ...shared,
    };
  }

  if (normalizedGenre.includes("rock") || normalizedGenre.includes("guitar")) {
    return {
      title: "Rock / Guitar-led Focus",
      listeningLens: "Performance feel, guitar realism, drum movement, section energy, and believable dynamics.",
      musicalMoves: [
        "Protect performance imperfections that make the track feel played rather than generated.",
        "Check guitar tails, transitions, and drum fills for natural movement.",
        "Avoid over-polishing if the genre needs grit, body, and human edge.",
      ],
      clientAngle: "Frame the revision around performance realism, energy, and natural dynamics.",
      ...shared,
    };
  }

  if (normalizedGenre.includes("cinematic") || normalizedGenre.includes("score")) {
    return {
      title: "Cinematic / Score Focus",
      listeningLens: "Emotional arc, space, build, contrast, and whether sections support the intended scene or mood.",
      musicalMoves: [
        "Shape dynamics around emotional storytelling before detailed mix polish.",
        "Check whether swells, impacts, and transitions feel placed with intention.",
        "Clean artificial textures only where they distract from the scene or mood.",
      ],
      clientAngle: "Frame the revision around emotional arc, scene support, and controlled atmosphere.",
      ...shared,
    };
  }

  return {
    title: "General Music Focus",
    listeningLens: "Overall emotion, clarity, movement, texture realism, and whether the track feels intentionally produced.",
    musicalMoves: [
      "Start with the issue that most affects listener trust.",
      "Balance technical cleanup with musical feel instead of treating the report like a checklist.",
      "Use the final client note to explain the next pass in simple language.",
    ],
    clientAngle: "Frame the revision around making the track feel more natural, intentional, and ready for feedback.",
    ...shared,
  };
}

export function buildV42GenreRecommendationText(projectSession = defaultProjectSession, reviewMode = "draft", analysis = null) {
  const newline = String.fromCharCode(10);
  const context = buildV42ReportContext(projectSession, reviewMode, analysis);
  const profile = buildV42GenreRecommendationProfile(context.genreFocus, context.reportPath, analysis);

  return [
    "SOULFRAME V4.2 GENRE-AWARE RECOMMENDATION LAYER",
    "",
    `Report path: ${context.reportPath}`,
    `Genre focus: ${context.genreFocus}`,
    `Recommendation profile: ${profile.title}`,
    `Priority: ${profile.priority}`,
    "",
    "LISTENING LENS",
    profile.listeningLens,
    "",
    "MUSICAL MOVES",
    ...profile.musicalMoves.map((move, index) => `${index + 1}. ${move}`),
    "",
    "CLIENT ANGLE",
    profile.clientAngle,
  ].join(newline);
}

export function buildV42PathSpecificReportSections(reportPath = "General AI Draft Humanization Report", genreFocus = "General music", analysis = null) {
  const normalizedPath = normalizeV42Text(reportPath);
  const isReady = analysis && analysis.status === "Ready";
  const priorityLabel = isReady ? getHumanizationPriorityLabel(getHumanizationPriorityScore(analysis)) : "Waiting for analysis";
  const artifactSentence = isReady ? buildArtifactClueSentence(analysis) : "SoulFrame is waiting for active analysis before writing path-specific artifact guidance.";

  if (normalizedPath.includes("vocal")) {
    return [
      {
        title: "Vocal Realism",
        purpose: "Check whether the vocal feels emotionally present, believable, and connected to the track.",
        reportFocus: "Mention vocal tone, phrase support, generated edges, breath, sibilance, and how naturally the vocal sits in the mix.",
      },
      {
        title: "Emotional Delivery",
        purpose: "Judge whether the performance feels like a human delivery rather than a rendered vocal layer.",
        reportFocus: "Explain how the next pass should improve intimacy, expression, dynamic movement, and listener connection.",
      },
      {
        title: "Technical Risk",
        purpose: priorityLabel,
        reportFocus: artifactSentence,
      },
    ];
  }

  if (normalizedPath.includes("instrumental")) {
    return [
      {
        title: "Arrangement Movement",
        purpose: "Check whether sections evolve naturally instead of feeling like repeated generated blocks.",
        reportFocus: "Mention intro, verse, hook, breakdown, transitions, fills, automation, and musical variation.",
      },
      {
        title: "Texture Depth",
        purpose: "Judge whether the instrumental has enough depth, contrast, and believable production intention.",
        reportFocus: "Explain how the next pass should shape groove, space, warmth, energy, and section contrast.",
      },
      {
        title: "Technical Risk",
        purpose: priorityLabel,
        reportFocus: artifactSentence,
      },
    ];
  }

  if (normalizedPath.includes("before / after")) {
    return [
      {
        title: "Improvement Check",
        purpose: "Compare whether the humanized version clearly improves the original draft.",
        reportFocus: "Mention what changed in feel, texture, clarity, movement, and client-readiness.",
      },
      {
        title: "Remaining Gap",
        purpose: "Identify what still needs attention after the humanized edit.",
        reportFocus: "Explain whether the next pass should focus on polish, emotional movement, harshness control, or arrangement clarity.",
      },
      {
        title: "Client Explanation",
        purpose: priorityLabel,
        reportFocus: "Use simple before/after language so the client understands the value of the humanized revision.",
      },
    ];
  }

  return [
    {
      title: "Overall Human Feel",
      purpose: "Check whether the draft feels intentional, emotional, and trustworthy.",
      reportFocus: `Use the ${genreFocus} context to explain the strongest humanization opportunity.`,
    },
    {
      title: "Main Revision Direction",
      purpose: "Turn the analysis into one clear next-pass direction.",
      reportFocus: "Avoid overwhelming the client with every technical detail. Lead with the main fix.",
    },
    {
      title: "Technical Risk",
      purpose: priorityLabel,
      reportFocus: artifactSentence,
    },
  ];
}

export function buildV42PathSpecificReportText(projectSession = defaultProjectSession, reviewMode = "draft", analysis = null) {
  const newline = String.fromCharCode(10);
  const context = buildV42ReportContext(projectSession, reviewMode, analysis);
  const sections = buildV42PathSpecificReportSections(context.reportPath, context.genreFocus, analysis);

  return [
    "SOULFRAME V4.2 PATH-SPECIFIC REPORT BUILDER",
    "",
    `Report path: ${context.reportPath}`,
    `Genre focus: ${context.genreFocus}`,
    "",
    "REPORT SECTIONS",
    ...sections.flatMap((section, index) => [
      `${index + 1}. ${section.title}`,
      `Purpose: ${section.purpose}`,
      `Report focus: ${section.reportFocus}`,
      "",
    ]),
  ].join(newline);
}

export function buildV42ClientToneDrafts(projectSession = defaultProjectSession, reviewMode = "draft", analysis = null) {
  const context = buildV42ReportContext(projectSession, reviewMode, analysis);
  const genreProfile = buildV42GenreRecommendationProfile(context.genreFocus, context.reportPath, analysis);
  const reportSections = buildV42PathSpecificReportSections(context.reportPath, context.genreFocus, analysis);
  const mainMove = context.suggestedEditOrder[0] || "Shape the next pass around the clearest humanization priority.";
  const sectionFocus = reportSections[0]?.title || "Humanization Focus";
  const clientAngle = genreProfile.clientAngle;
  const difficulty = context.difficulty.label;
  const priority = context.priorityScore === null ? "not scored yet" : `${context.priorityScore}/100`;

  return [
    {
      tone: "Professional",
      bestFor: "Formal client updates, project records, and polished delivery notes.",
      draft: `I reviewed the track through SoulFrame's ${context.reportPath.toLowerCase()} path. The current focus is ${sectionFocus.toLowerCase()}, with a ${difficulty.toLowerCase()} revision profile and a humanization priority of ${priority}. The next pass should focus on this first: ${mainMove} ${clientAngle}`,
    },
    {
      tone: "Encouraging",
      bestFor: "Clients who need reassurance that the track is moving in the right direction.",
      draft: `The track has a clear direction, and the next revision can make it feel more natural and intentional. SoulFrame is routing this as a ${context.reportPath.toLowerCase()}, so the focus is on ${sectionFocus.toLowerCase()}. The main move now is: ${mainMove} ${clientAngle}`,
    },
    {
      tone: "Direct",
      bestFor: "Fast revision notes when the client mainly needs the next action.",
      draft: `SoulFrame route: ${context.reportPath}. Main focus: ${sectionFocus}. Difficulty: ${difficulty}. Priority: ${priority}. Next move: ${mainMove}`,
    },
  ];
}

export function buildV42ClientToneDraftText(projectSession = defaultProjectSession, reviewMode = "draft", analysis = null) {
  const newline = String.fromCharCode(10);
  const context = buildV42ReportContext(projectSession, reviewMode, analysis);
  const drafts = buildV42ClientToneDrafts(projectSession, reviewMode, analysis);

  return [
    "SOULFRAME V4.2 CLIENT TONE DRAFT LAYER",
    "",
    `Report path: ${context.reportPath}`,
    `Genre focus: ${context.genreFocus}`,
    "",
    "TONE DRAFTS",
    ...drafts.flatMap((item) => [
      `${item.tone}`,
      `Best for: ${item.bestFor}`,
      item.draft,
      "",
    ]),
  ].join(newline);
}

export function buildV42BeforeAfterExplanation(draftAnalysis = null, humanizedAnalysis = null) {
  const draftReady = draftAnalysis && draftAnalysis.status === "Ready";
  const humanizedReady = humanizedAnalysis && humanizedAnalysis.status === "Ready";

  if (!draftReady && !humanizedReady) {
    return {
      mode: "Waiting for comparison",
      headline: "SoulFrame needs an original draft and a humanized edit before it can explain the before/after difference.",
      improvementLabel: "Waiting",
      priorityChange: "Not available yet",
      mainExplanation: "Use Before / After Review mode when both versions are ready.",
      producerFocus: [
        "Upload or load the original AI draft.",
        "Upload or load the humanized edit.",
        "Use the comparison to explain what changed in simple client-safe language.",
      ],
      clientSafeLine: "I will compare the original draft with the humanized version once both versions are available.",
    };
  }

  if (draftReady && !humanizedReady) {
    const draftScore = getHumanizationPriorityScore(draftAnalysis);

    return {
      mode: "Draft-only explanation",
      headline: "SoulFrame has the original draft, but it still needs the humanized edit for a true comparison.",
      improvementLabel: "Comparison incomplete",
      priorityChange: `Original draft humanization priority: ${draftScore}/100`,
      mainExplanation: "The current report can explain what needs work, but it cannot yet prove what improved.",
      producerFocus: buildV42SuggestedEditOrder(draftAnalysis).slice(0, 3),
      clientSafeLine: "The draft has been reviewed, and the next step is to compare it against the humanized edit once that version is ready.",
    };
  }

  if (!draftReady && humanizedReady) {
    const humanizedScore = getHumanizationPriorityScore(humanizedAnalysis);

    return {
      mode: "Humanized-only explanation",
      headline: "SoulFrame has the humanized version, but it still needs the original draft to explain the improvement clearly.",
      improvementLabel: "Comparison incomplete",
      priorityChange: `Humanized edit humanization priority: ${humanizedScore}/100`,
      mainExplanation: "The current report can describe the edited version, but it cannot show what changed from the original.",
      producerFocus: buildV42SuggestedEditOrder(humanizedAnalysis).slice(0, 3),
      clientSafeLine: "The humanized version is ready for review, and the original draft can be added if a clearer before/after explanation is needed.",
    };
  }

  const draftScore = getHumanizationPriorityScore(draftAnalysis);
  const humanizedScore = getHumanizationPriorityScore(humanizedAnalysis);
  const scoreChange = draftScore - humanizedScore;
  const improved = scoreChange > 0;
  const unchanged = scoreChange === 0;

  const brightnessImproved = draftAnalysis.brightness === "Bright / Potentially Harsh" && humanizedAnalysis.brightness !== "Bright / Potentially Harsh";
  const textureImproved = draftAnalysis.textureStability === "Unstable / Busy" && humanizedAnalysis.textureStability !== "Unstable / Busy";
  const dynamicsImproved = draftAnalysis.dynamics === "Compressed" && humanizedAnalysis.dynamics !== "Compressed";
  const clippingImproved = (draftAnalysis.clippingRisk === "Medium" || draftAnalysis.clippingRisk === "High") && humanizedAnalysis.clippingRisk === "Low";

  const improvements = [
    brightnessImproved ? "Top-end harshness appears more controlled in the humanized edit." : null,
    textureImproved ? "Generated texture movement appears more stable and intentional." : null,
    dynamicsImproved ? "Dynamic movement appears less compressed and more natural." : null,
    clippingImproved ? "Headroom and clipping risk appear cleaner in the humanized edit." : null,
  ].filter(Boolean);

  if (improvements.length === 0) {
    improvements.push(
      improved
        ? "The humanized edit shows a better overall priority score, but the producer should still confirm the musical feel by ear."
        : "The difference is subtle, so the report should focus on what still needs attention rather than overstating the improvement."
    );
  }

  return {
    mode: "Before / After explanation",
    headline: improved
      ? "The humanized edit appears to reduce the main humanization risk."
      : unchanged
        ? "The humanized edit appears close to the original in measured humanization priority."
        : "The humanized edit may still need another pass before it clearly improves the original draft.",
    improvementLabel: improved ? "Improved" : unchanged ? "Similar" : "Needs another pass",
    priorityChange: `Original: ${draftScore}/100 → Humanized: ${humanizedScore}/100`,
    mainExplanation: improvements[0],
    producerFocus: improvements,
    clientSafeLine: improved
      ? "The humanized version improves the main listening risks while keeping the explanation client-safe and easy to understand."
      : "The comparison shows that another focused pass may be needed before presenting the edit as a clear improvement.",
  };
}

export function buildV42BeforeAfterExplanationText(draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const explanation = buildV42BeforeAfterExplanation(draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V4.2 BEFORE/AFTER EXPLANATION LAYER",
    "",
    `Mode: ${explanation.mode}`,
    `Result: ${explanation.improvementLabel}`,
    `Priority change: ${explanation.priorityChange}`,
    "",
    "HEADLINE",
    explanation.headline,
    "",
    "MAIN EXPLANATION",
    explanation.mainExplanation,
    "",
    "PRODUCER FOCUS",
    ...explanation.producerFocus.map((item, index) => `${index + 1}. ${item}`),
    "",
    "CLIENT-SAFE LINE",
    explanation.clientSafeLine,
  ].join(newline);
}

export function buildV42SmartReportComposer(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const context = buildV42ReportContext(projectSession, reviewMode, activeAnalysis);
  const genreProfile = buildV42GenreRecommendationProfile(context.genreFocus, context.reportPath, activeAnalysis);
  const reportSections = buildV42PathSpecificReportSections(context.reportPath, context.genreFocus, activeAnalysis);
  const toneDrafts = buildV42ClientToneDrafts(projectSession, reviewMode, activeAnalysis);
  const beforeAfter = buildV42BeforeAfterExplanation(draftAnalysis, humanizedAnalysis);
  const selectedTone = toneDrafts.find((item) => item.tone === "Professional") || toneDrafts[0];

  const reportTitle = `${context.reportPath} — ${context.genreFocus}`;
  const confidenceLine = context.priorityScore === null
    ? "SoulFrame is waiting for active analysis before giving a final humanization priority."
    : `Humanization priority is ${context.priorityScore}/100, with a ${context.difficulty.label.toLowerCase()} revision profile.`;

  return {
    version: "v4.2",
    feature: "Smart Report Composer",
    reportTitle,
    reportPath: context.reportPath,
    genreFocus: context.genreFocus,
    confidenceLine,
    executiveSummary: `${genreProfile.title}: ${genreProfile.listeningLens}`,
    producerPlan: context.suggestedEditOrder.slice(0, 4),
    reportSections,
    clientReadySummary: selectedTone.draft,
    beforeAfterLine: beforeAfter.clientSafeLine,
    exportReadiness: [
      activeAnalysis && activeAnalysis.status === "Ready" ? "Audio analysis available" : "Waiting for audio analysis",
      context.reportPath ? "Report path selected" : "Report path waiting",
      context.genreFocus ? "Genre focus selected" : "Genre focus waiting",
      reportSections.length >= 3 ? "Path-specific sections ready" : "Report sections incomplete",
      selectedTone?.draft ? "Client tone draft ready" : "Client tone draft waiting",
    ],
  };
}

export function buildV42SmartReportComposerText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const report = buildV42SmartReportComposer(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V4.2 SMART REPORT COMPOSER",
    "",
    `Title: ${report.reportTitle}`,
    `Version: ${report.version}`,
    `Path: ${report.reportPath}`,
    `Genre: ${report.genreFocus}`,
    "",
    "EXECUTIVE SUMMARY",
    report.executiveSummary,
    "",
    "CONFIDENCE LINE",
    report.confidenceLine,
    "",
    "PRODUCER PLAN",
    ...report.producerPlan.map((item, index) => `${index + 1}. ${item}`),
    "",
    "CLIENT-READY SUMMARY",
    report.clientReadySummary,
    "",
    "BEFORE/AFTER LINE",
    report.beforeAfterLine,
    "",
    "EXPORT READINESS",
    ...report.exportReadiness.map((item) => `- ${item}`),
  ].join(newline);
}

export function buildV42ReportQualityGate(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const composedReport = buildV42SmartReportComposer(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const beforeAfter = buildV42BeforeAfterExplanation(draftAnalysis, humanizedAnalysis);
  const context = buildV42ReportContext(projectSession, reviewMode, activeAnalysis);

  const checks = [
    {
      label: "Analysis available",
      passed: !!activeAnalysis && activeAnalysis.status === "Ready",
      guidance: "Load a real audio file or demo preset before treating the report as final.",
    },
    {
      label: "Report path selected",
      passed: !!context.reportPath && context.reportPath !== "General AI Draft Humanization Report",
      guidance: "Add clearer project intake details if the report path is still too general.",
    },
    {
      label: "Genre focus detected",
      passed: !!context.genreFocus && context.genreFocus !== "General music",
      guidance: "Add genre language in Project Intake if the report needs more musical context.",
    },
    {
      label: "Producer plan is focused",
      passed: composedReport.producerPlan.length >= 3,
      guidance: "The producer plan should include at least three usable revision priorities.",
    },
    {
      label: "Client summary is ready",
      passed: composedReport.clientReadySummary && composedReport.clientReadySummary.length > 120,
      guidance: "The client summary should be clear enough to send without heavy rewriting.",
    },
    {
      label: "Before/after explanation handled",
      passed: reviewMode !== "compare" || beforeAfter.improvementLabel !== "Waiting",
      guidance: "For comparison reports, make sure both original and humanized versions are available.",
    },
  ];

  const passedCount = checks.filter((check) => check.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  let label = "Needs setup";
  let recommendation = "Complete the missing setup steps before presenting this as a finished SoulFrame report.";

  if (score >= 85) {
    label = "Client-ready";
    recommendation = "The report is structured enough to share after a final producer read-through.";
  } else if (score >= 60) {
    label = "Producer-ready";
    recommendation = "The report is useful internally, but one focused pass would make the client-facing version stronger.";
  } else if (score >= 35) {
    label = "Draft report";
    recommendation = "The report has a direction, but it still needs better intake, analysis, or client wording.";
  }

  return {
    version: "v4.2",
    feature: "Report Quality Gate",
    score,
    label,
    recommendation,
    passedCount,
    totalChecks: checks.length,
    checks,
    missingItems: checks.filter((check) => !check.passed).map((check) => check.guidance),
  };
}

export function buildV42ReportQualityGateText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const gate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V4.2 REPORT QUALITY GATE",
    "",
    `Score: ${gate.score}/100`,
    `Status: ${gate.label}`,
    `Passed: ${gate.passedCount}/${gate.totalChecks}`,
    "",
    "RECOMMENDATION",
    gate.recommendation,
    "",
    "CHECKS",
    ...gate.checks.map((check) => `- ${check.passed ? "PASS" : "REVIEW"}: ${check.label}`),
    "",
    "MISSING / REVIEW ITEMS",
    ...(gate.missingItems.length ? gate.missingItems.map((item) => `- ${item}`) : ["- No major missing items detected."]),
  ].join(newline);
}

export function buildV42ReportOutputPack(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const composedReport = buildV42SmartReportComposer(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const qualityGate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const context = buildV42ReportContext(projectSession, reviewMode, activeAnalysis);
  const toneDrafts = buildV42ClientToneDrafts(projectSession, reviewMode, activeAnalysis);
  const beforeAfter = buildV42BeforeAfterExplanation(draftAnalysis, humanizedAnalysis);

  const producerBrief = [
    `Report: ${composedReport.reportTitle}`,
    composedReport.confidenceLine,
    "",
    "Producer plan:",
    ...composedReport.producerPlan.map((item, index) => `${index + 1}. ${item}`),
    "",
    `Quality gate: ${qualityGate.label} (${qualityGate.score}/100)`,
    `Next action: ${qualityGate.recommendation}`,
  ].join(String.fromCharCode(10));

  const clientUpdate = toneDrafts.find((item) => item.tone === "Professional")?.draft || composedReport.clientReadySummary;

  const revisionChecklist = [
    "Revision Checklist",
    ...context.suggestedEditOrder.map((item, index) => `${index + 1}. ${item}`),
    "",
    "Before/After note:",
    beforeAfter.clientSafeLine,
    "",
    "Quality checks:",
    ...qualityGate.checks.map((check) => `${check.passed ? "[x]" : "[ ]"} ${check.label}`),
  ].join(String.fromCharCode(10));

  return {
    version: "v4.2",
    feature: "Report Output Pack",
    producerBrief,
    clientUpdate,
    revisionChecklist,
    outputTypes: [
      {
        label: "Producer Brief",
        use: "Internal production direction before making the next edit.",
        content: producerBrief,
      },
      {
        label: "Client Update",
        use: "Client-safe message for explaining the next revision direction.",
        content: clientUpdate,
      },
      {
        label: "Revision Checklist",
        use: "Practical task list before final polish or delivery.",
        content: revisionChecklist,
      },
    ],
  };
}

export function buildV42ReportOutputPackText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const pack = buildV42ReportOutputPack(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V4.2 REPORT OUTPUT PACK",
    "",
    "PRODUCER BRIEF",
    pack.producerBrief,
    "",
    "CLIENT UPDATE",
    pack.clientUpdate,
    "",
    "REVISION CHECKLIST",
    pack.revisionChecklist,
  ].join(newline);
}

export function buildV42FinalReportHandoff(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const outputPack = buildV42ReportOutputPack(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const qualityGate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const composedReport = buildV42SmartReportComposer(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const handoffSteps = [
    {
      label: "Confirm producer direction",
      done: qualityGate.score >= 60,
      note: qualityGate.score >= 60
        ? "The report direction is clear enough for producer review."
        : "Tighten the intake, analysis, or report path before using this as the main direction.",
    },
    {
      label: "Choose client tone",
      done: outputPack.clientUpdate && outputPack.clientUpdate.length > 100,
      note: "Use the client update if the wording matches the relationship and project context.",
    },
    {
      label: "Check revision task order",
      done: composedReport.producerPlan.length >= 3,
      note: "The revision checklist should guide the next edit pass without overwhelming the workflow.",
    },
    {
      label: "Review before/after clarity",
      done: reviewMode !== "compare" || composedReport.beforeAfterLine.length > 80,
      note: "Comparison projects should explain what improved without overselling the result.",
    },
    {
      label: "Final human read-through",
      done: false,
      note: "SoulFrame can structure the report, but the producer still makes the final judgement before sending.",
    },
  ];

  const readyCount = handoffSteps.filter((step) => step.done).length;
  const handoffScore = Math.round((readyCount / handoffSteps.length) * 100);

  let handoffStatus = "Needs producer review";
  let finalRecommendation = "Review the output pack carefully before using it in a client message.";

  if (handoffScore >= 80 && qualityGate.score >= 80) {
    handoffStatus = "Ready for final read-through";
    finalRecommendation = "The report is ready for a final human read-through before export or client sharing.";
  } else if (handoffScore >= 60) {
    handoffStatus = "Almost ready";
    finalRecommendation = "The report has a strong structure, but one pass on wording and context would help.";
  }

  return {
    version: "v4.2",
    feature: "Final Report Handoff",
    handoffScore,
    handoffStatus,
    finalRecommendation,
    reportTitle: composedReport.reportTitle,
    qualityGateLabel: qualityGate.label,
    qualityGateScore: qualityGate.score,
    handoffSteps,
    finalOutputs: [
      "Producer Brief",
      "Client Update",
      "Revision Checklist",
    ],
  };
}

export function buildV42FinalReportHandoffText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const handoff = buildV42FinalReportHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V4.2 FINAL REPORT HANDOFF",
    "",
    `Report: ${handoff.reportTitle}`,
    `Handoff score: ${handoff.handoffScore}/100`,
    `Status: ${handoff.handoffStatus}`,
    `Quality gate: ${handoff.qualityGateLabel} (${handoff.qualityGateScore}/100)`,
    "",
    "FINAL RECOMMENDATION",
    handoff.finalRecommendation,
    "",
    "HANDOFF STEPS",
    ...handoff.handoffSteps.map((step) => `- ${step.done ? "READY" : "REVIEW"}: ${step.label} — ${step.note}`),
    "",
    "FINAL OUTPUTS",
    ...handoff.finalOutputs.map((item) => `- ${item}`),
  ].join(newline);
}

export function buildV42ReportExportManifest(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const outputPack = buildV42ReportOutputPack(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const handoff = buildV42FinalReportHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const qualityGate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const composedReport = buildV42SmartReportComposer(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  const safeProjectName = (projectSession.projectName || "SoulFrame Project").trim();
  const timestamp = new Date().toISOString();

  const manifestItems = [
    {
      fileLabel: "Producer Brief",
      suggestedFilename: `${safeProjectName.replace(/\s+/g, "_")}_producer_brief_v4_2.txt`,
      source: "V4.2 Report Output Pack",
      ready: outputPack.producerBrief.length > 120,
      purpose: "Internal production direction for the next humanization pass.",
    },
    {
      fileLabel: "Client Update",
      suggestedFilename: `${safeProjectName.replace(/\s+/g, "_")}_client_update_v4_2.txt`,
      source: "V4.2 Client Tone Drafts",
      ready: outputPack.clientUpdate.length > 100,
      purpose: "Client-safe communication explaining the revision direction.",
    },
    {
      fileLabel: "Revision Checklist",
      suggestedFilename: `${safeProjectName.replace(/\s+/g, "_")}_revision_checklist_v4_2.txt`,
      source: "V4.2 Suggested Edit Order",
      ready: outputPack.revisionChecklist.length > 100,
      purpose: "Practical task list before final polish or delivery.",
    },
    {
      fileLabel: "Full Smart Report",
      suggestedFilename: `${safeProjectName.replace(/\s+/g, "_")}_smart_report_v4_2.txt`,
      source: "V4.2 Smart Report Composer",
      ready: composedReport.exportReadiness.filter((item) => !item.toLowerCase().includes("waiting")).length >= 3,
      purpose: "Complete structured summary of the active SoulFrame report.",
    },
  ];

  const readyCount = manifestItems.filter((item) => item.ready).length;

  return {
    version: "v4.2",
    feature: "Report Export Manifest",
    projectName: safeProjectName,
    createdAt: timestamp,
    reportTitle: composedReport.reportTitle,
    qualityGate: `${qualityGate.label} (${qualityGate.score}/100)`,
    handoffStatus: `${handoff.handoffStatus} (${handoff.handoffScore}/100)`,
    readyCount,
    totalItems: manifestItems.length,
    manifestItems,
    exportRecommendation: readyCount === manifestItems.length
      ? "All V4.2 report outputs are structured and ready for a final human read-through before export."
      : "Some report outputs still need review before the export pack should be treated as complete.",
  };
}

export function buildV42ReportExportManifestText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const manifest = buildV42ReportExportManifest(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V4.2 REPORT EXPORT MANIFEST",
    "",
    `Project: ${manifest.projectName}`,
    `Report: ${manifest.reportTitle}`,
    `Created: ${manifest.createdAt}`,
    `Quality gate: ${manifest.qualityGate}`,
    `Handoff status: ${manifest.handoffStatus}`,
    `Ready outputs: ${manifest.readyCount}/${manifest.totalItems}`,
    "",
    "EXPORT RECOMMENDATION",
    manifest.exportRecommendation,
    "",
    "MANIFEST ITEMS",
    ...manifest.manifestItems.flatMap((item) => [
      `- ${item.ready ? "READY" : "REVIEW"}: ${item.fileLabel}`,
      `  Filename: ${item.suggestedFilename}`,
      `  Source: ${item.source}`,
      `  Purpose: ${item.purpose}`,
    ]),
  ].join(newline);
}

export function buildV42ReportControlCenter(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const activeAnalysis = reviewMode === "compare" ? humanizedAnalysis || draftAnalysis : draftAnalysis;
  const context = buildV42ReportContext(projectSession, reviewMode, activeAnalysis);
  const qualityGate = buildV42ReportQualityGate(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const handoff = buildV42FinalReportHandoff(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const manifest = buildV42ReportExportManifest(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);
  const outputPack = buildV42ReportOutputPack(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  let nextMove = "Load or analyze audio before using the report outputs.";
  if (qualityGate.score >= 85 && handoff.handoffScore >= 80) {
    nextMove = "Do a final human read-through, then use the client update or export pack.";
  } else if (qualityGate.score >= 60) {
    nextMove = "Use the producer brief internally, then tighten client wording before sharing.";
  } else if (activeAnalysis && activeAnalysis.status === "Ready") {
    nextMove = "Improve project intake details so SoulFrame can route the report more precisely.";
  }

  const recommendedOutput = qualityGate.score >= 80
    ? "Client Update"
    : qualityGate.score >= 60
      ? "Producer Brief"
      : "Revision Checklist";

  const controlCards = [
    {
      label: "Report Route",
      value: context.reportPath,
      note: `Genre focus: ${context.genreFocus}`,
    },
    {
      label: "Quality Gate",
      value: `${qualityGate.score}/100`,
      note: qualityGate.label,
    },
    {
      label: "Handoff",
      value: `${handoff.handoffScore}/100`,
      note: handoff.handoffStatus,
    },
    {
      label: "Exports Ready",
      value: `${manifest.readyCount}/${manifest.totalItems}`,
      note: manifest.exportRecommendation,
    },
  ];

  const warnings = [
    ...(qualityGate.missingItems || []),
    ...(manifest.manifestItems || []).filter((item) => !item.ready).map((item) => `${item.fileLabel} still needs review before export.`),
  ].slice(0, 4);

  return {
    version: "v4.2",
    feature: "Report Control Center",
    nextMove,
    recommendedOutput,
    reportPath: context.reportPath,
    genreFocus: context.genreFocus,
    controlCards,
    warnings,
    clientUpdatePreview: outputPack.clientUpdate,
    statusLabel: qualityGate.score >= 85 ? "Ready for final review" : qualityGate.score >= 60 ? "Usable with producer review" : "Needs setup",
  };
}

export function buildV42ReportControlCenterText(projectSession = defaultProjectSession, reviewMode = "draft", draftAnalysis = null, humanizedAnalysis = null) {
  const newline = String.fromCharCode(10);
  const center = buildV42ReportControlCenter(projectSession, reviewMode, draftAnalysis, humanizedAnalysis);

  return [
    "SOULFRAME V4.2 REPORT CONTROL CENTER",
    "",
    `Status: ${center.statusLabel}`,
    `Report path: ${center.reportPath}`,
    `Genre focus: ${center.genreFocus}`,
    `Recommended output: ${center.recommendedOutput}`,
    "",
    "NEXT MOVE",
    center.nextMove,
    "",
    "CONTROL CARDS",
    ...center.controlCards.map((card) => `- ${card.label}: ${card.value} — ${card.note}`),
    "",
    "WARNINGS",
    ...(center.warnings.length ? center.warnings.map((item) => `- ${item}`) : ["- No major warnings detected."]),
  ].join(newline);
}
