import React, { useState } from "react";

export function V52PublicBetaPresentationHero({ hero, setActiveTab }) {
  return (
    <section className="rounded-[2rem] border border-zinc-800 bg-black p-6 shadow-2xl shadow-black/30">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-stretch">
        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">{hero.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight text-zinc-100 md:text-5xl">{hero.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-400">{hero.description}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {hero.heroActions.map((action, index) => (
              <button
                key={action.label}
                type="button"
                onClick={() => setActiveTab(action.targetTab)}
                className={`rounded-2xl border px-5 py-3 text-sm font-semibold transition ${index === 0 ? "border-white bg-white text-black hover:bg-zinc-200" : "border-zinc-800 bg-black text-zinc-200 hover:bg-zinc-900"}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Public Beta Snapshot</p>
          <h2 className="mt-4 text-2xl font-semibold text-zinc-100">{hero.projectLine}</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-500">{hero.presentationShift}</p>

          <div className="mt-5 rounded-2xl border border-zinc-800 bg-black p-4">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">Layout Readiness</p>
            <p className="mt-2 text-lg font-semibold text-zinc-100">{hero.readinessLine}</p>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-2">
            {hero.proofPoints.map((point) => (
              <div key={point} className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">
                {point}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function V52PublicBetaValueStrip({ strip }) {
  return (
    <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Why SoulFrame</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-100">{strip.headline}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{strip.description}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-400">
          V5.2.3: <span className="font-semibold text-zinc-100">Value Strip</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        {strip.valueCards.map((card) => (
          <article key={card.label} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">{card.label}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{card.value}</h3>
            <p className="mt-3 text-xs leading-5 text-zinc-500">{card.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function V52PublicBetaWorkflowPreview({ preview, setActiveTab }) {
  return (
    <section className="rounded-[2rem] border border-zinc-800 bg-black p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">How It Works</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-100">{preview.headline}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{preview.description}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
          V5.2.4: <span className="font-semibold text-zinc-100">Workflow Preview</span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
        {preview.workflowSteps.map((step) => (
          <article key={step.number} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">{step.number} · {step.label}</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{step.title}</h3>
            <p className="mt-3 min-h-24 text-xs leading-5 text-zinc-500">{step.description}</p>
            <button
              type="button"
              onClick={() => setActiveTab(step.targetTab)}
              className="mt-4 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
            >
              Open {step.label}
            </button>
          </article>
        ))}
      </div>

      <div className="mt-4 rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">Optional: {preview.optionalArea}</p>
        <p className="mt-3 text-sm leading-6 text-zinc-400">{preview.optionalNote}</p>
        <p className="mt-2 text-xs leading-5 text-zinc-600">{preview.presentationShift}</p>
      </div>
    </section>
  );
}

export function V51FocusedWorkspaceHeader({ header }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-black p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{header.eyebrow}</p>
          <h2 className="mt-3 text-2xl font-semibold text-zinc-100">{header.title}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-zinc-400">{header.description}</p>
          <p className="mt-2 text-xs leading-5 text-zinc-600">{header.helperLine}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
          Focus: <span className="font-semibold text-zinc-100">{header.primaryAction}</span>
        </div>
      </div>
    </div>
  );
}

export function V51WorkspaceProgressRail({ rail, setActiveTab }) {
  return (
    <div className="mt-4 rounded-3xl border border-zinc-800 bg-black p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Workspace Progress</p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-100">{rail.routeLabel}</h3>
          <p className="mt-2 text-xs leading-5 text-zinc-500">{rail.advancedNote}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => rail.previousTab && setActiveTab(rail.previousTab.id)}
            disabled={!rail.previousTab}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => rail.nextTab && setActiveTab(rail.nextTab.id)}
            disabled={!rail.nextTab}
            className="rounded-2xl border border-zinc-800 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
        {rail.orderedTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-2xl border p-4 text-left transition ${tab.isCurrent ? "border-white bg-white text-black" : tab.completed ? "border-zinc-700 bg-zinc-900 text-zinc-100" : "border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900"}`}
          >
            <p className={`text-xs uppercase tracking-[0.22em] ${tab.isCurrent ? "text-zinc-700" : "text-zinc-600"}`}>{tab.status}</p>
            <h4 className="mt-2 text-sm font-semibold">{tab.label}</h4>
            <p className={`mt-2 text-xs leading-5 ${tab.isCurrent ? "text-zinc-700" : "text-zinc-500"}`}>{tab.purpose}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function V51ProductWorkspace({
  shell,
  hero,
  valueStrip,
  workflowPreview,
  getHeaderState,
  getProgressRailState,
  PanelComponent,
  dashboardContent,
  analyzeContent,
  reportContent,
  outputContent,
  advancedContent,
}) {
  const [activeTab, setActiveTab] = useState(shell.defaultTab);

  const contentMap = {
    dashboard: typeof dashboardContent === "function" ? dashboardContent({ setActiveTab }) : dashboardContent,
    analyze: typeof analyzeContent === "function" ? analyzeContent({ setActiveTab }) : analyzeContent,
    report: typeof reportContent === "function" ? reportContent({ setActiveTab }) : reportContent,
    output: typeof outputContent === "function" ? outputContent({ setActiveTab }) : outputContent,
    advanced: typeof advancedContent === "function" ? advancedContent({ setActiveTab }) : advancedContent,
  };

  const header = getHeaderState(activeTab);
  const rail = getProgressRailState(activeTab);
  const ShellPanel = PanelComponent;

  return (
    <div className="space-y-6">
      <V52PublicBetaPresentationHero hero={hero} setActiveTab={setActiveTab} />
      <V52PublicBetaValueStrip strip={valueStrip} />
      <V52PublicBetaWorkflowPreview preview={workflowPreview} setActiveTab={setActiveTab} />

      <ShellPanel
        title="V5.1 Dashboard Layout Shell"
        subtitle="A real dashboard-first workspace, now modularized for the V5.3 report-sharing phase."
        action={<div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm text-zinc-300">V5.3.1: <span className="font-semibold text-zinc-100">Modular Workspace</span></div>}
      >
        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Product Shift</p>
          <h3 className="mt-3 text-2xl font-semibold text-zinc-100">{shell.productShift}</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{shell.layoutRule}</p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          {shell.tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-3xl border p-4 text-left transition ${activeTab === tab.id ? "border-white bg-white text-black" : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900"}`}
            >
              <p className="text-xs uppercase tracking-[0.22em] opacity-70">{tab.ready ? "Ready" : "Waiting"}</p>
              <h3 className="mt-2 font-semibold">{tab.label}</h3>
              <p className={`mt-2 text-xs leading-5 ${activeTab === tab.id ? "text-zinc-700" : "text-zinc-500"}`}>{tab.purpose}</p>
            </button>
          ))}
        </div>

        <V51WorkspaceProgressRail rail={rail} setActiveTab={setActiveTab} />
      </ShellPanel>

      <div className="space-y-6">
        <V51FocusedWorkspaceHeader header={header} />
        {contentMap[activeTab] || contentMap.dashboard}
      </div>
    </div>
  );
}
