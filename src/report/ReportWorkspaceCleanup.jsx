import React, { useState } from "react";

export function V54ReportWorkspaceCleanup({
  summary,
  primaryContent,
  comparisonContent,
  detailsContent,
  setActiveTab,
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-800 bg-black p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Report Workspace</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-100">
              Decision first. Detail when you need it.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
              The main Report view now prioritizes the finished producer/client report. Older diagnostic and planning tools remain available below without dominating the workflow.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-400">
            V5.4.1: <span className="font-semibold text-zinc-100">Report Cleanup</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3">
          <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">Status</p>
            <p className="mt-3 text-lg font-semibold text-zinc-100">{summary.headline}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{summary.nextMove}</p>
          </article>

          <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">Report Quality</p>
            <p className="mt-3 text-lg font-semibold text-zinc-100">{summary.qualityScore}/100</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{summary.qualityLabel}</p>
          </article>

          <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-600">Recommended Output</p>
            <p className="mt-3 text-lg font-semibold text-zinc-100">{summary.recommendedOutput}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              {summary.showComparison ? "Before / After evidence is available in this report." : "Single-draft report path."}
            </p>
          </article>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setActiveTab("output")}
            disabled={!summary.canContinueToOutput}
            className="rounded-2xl border border-zinc-800 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to Output
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("analyze")}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
          >
            Back to Analyze
          </button>
        </div>
      </section>

      {primaryContent}

      {summary.showComparison ? comparisonContent : null}

      <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">Detailed Report Tools</p>
            <h3 className="mt-2 text-xl font-semibold text-zinc-100">
              {showDetails ? "Deeper report tools are open" : "Keep the deeper layer out of the way"}
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
              Composer diagnostics, quality checks, workflow context, and revision planning are preserved here for deeper review.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((current) => !current)}
            className="rounded-2xl border border-zinc-800 bg-black px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
          >
            {showDetails ? "Hide Detailed Tools" : "Show Detailed Tools"}
          </button>
        </div>

        {showDetails ? (
          <div className="mt-6 space-y-6 border-t border-zinc-800 pt-6">
            {detailsContent}
          </div>
        ) : null}
      </section>
    </div>
  );
}
