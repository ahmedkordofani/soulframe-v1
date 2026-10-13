import React from "react";

// V5.4.5 - Classic Demo is an optional view, loaded only when selected.
// Shared analysis functionality remains in App.jsx while legacy-only
// presentation panels are kept out of the initial Product chunk.
export default function ClassicDemo({ shared, state, helpers, demoStats, Panel }) {
  const {
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
  } = shared;
  const {
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
  } = state;
  const {
    getSessionValue,
    getDeliveryReadiness,
    formatDuration,
    formatFileSize,
    buildRevisionTimeline
  } = helpers;

  function DemoReadinessBanner() {
    const items = [
      { label: "Prototype", value: "V4.2 smarter reports" },
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
      { label: "Demo Presets", value: demoStats.presets },
      { label: "Artifact Types", value: demoStats.artifacts },
      { label: "Walkthrough Steps", value: demoStats.steps },
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

  function RevisionTimeline({ reviewMode, selectedReport }) {
    const timeline = buildRevisionTimeline(reviewMode, selectedReport);
    return <Panel title="Revision History" subtitle="A simple project timeline from raw AI draft to client-ready final polish."><div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">{timeline.map((step, index) => <article key={step.title} className="rounded-3xl border border-zinc-800 bg-black p-5"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span><h3 className="mt-4 font-semibold text-zinc-100">{step.title}</h3><p className="mt-2 text-sm text-zinc-400">{step.status}</p><p className="mt-3 text-sm text-zinc-200">{step.focus}</p></article>)}</div></Panel>;
  }

  return (
    <div className="space-y-6">
      <QuickStartGuide applyDemoPreset={applyDemoPreset} setView={setView} />
      <DemoReadinessBanner />
      <PublicDemoNotice />
      <V50ProductDashboardPreviewPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V50ProductNavigationBlueprintPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V50ProgressiveDisclosurePanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V50TabbedWorkflowShellPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V50CleanDashboardPriorityPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V50AdvancedPanelCollapseStrategyPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V50PublicBetaUxHandoffPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V41BackendScaffoldPanel />
      <V41AnalysisEngineSeparationPanel />
      <V41MockApiResponsePanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V41FrontendApiAdapterPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V42SmarterReportRouterPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V42GenreRecommendationPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V42PathSpecificReportPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V42ClientToneDraftPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V42BeforeAfterExplanationPanel draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V42SmartReportComposerPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V42ReportQualityGatePanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V42ReportOutputPackPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V42FinalReportHandoffPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V42ReportExportManifestPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
      <V42ReportControlCenterPanel projectSession={projectSession} reviewMode={reviewMode} draftAnalysis={draftAudioAnalysis} humanizedAnalysis={humanizedAudioAnalysis} />
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
}
