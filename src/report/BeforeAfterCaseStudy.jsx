import React, { useState } from "react";

function MetricCard({ label, before, after }) {
  return (
    <article className="rounded-3xl border border-zinc-800 bg-black p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">{label}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
          <p className="text-xs text-zinc-600">Before</p>
          <p className="mt-2 text-sm font-semibold text-zinc-200">{before}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
          <p className="text-xs text-zinc-600">After</p>
          <p className="mt-2 text-sm font-semibold text-zinc-200">{after}</p>
        </div>
      </div>
    </article>
  );
}

export function V53BeforeAfterCaseStudy({ caseStudy, caseStudyText }) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = async () => {
    if (!navigator?.clipboard?.writeText || !caseStudyText) return;

    try {
      await navigator.clipboard.writeText(caseStudyText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    if (!caseStudyText || !caseStudy.fileName) return;

    const blob = new Blob([caseStudyText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = caseStudy.fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 1600);
  };

  return (
    <section className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 bg-black p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Before / After Case Study</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-100">{caseStudy.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">{caseStudy.subtitle}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!caseStudy.comparisonReady}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copied ? "Copied" : "Copy Case Study"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!caseStudy.comparisonReady}
              className="rounded-2xl border border-zinc-800 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloaded ? "Downloaded" : "Download Case Study"}
            </button>
          </div>
        </div>
      </div>

      {!caseStudy.comparisonReady ? (
        <div className="p-6">
          <div className="rounded-3xl border border-zinc-800 bg-black p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Comparison Needed</p>
            <h3 className="mt-3 text-xl font-semibold text-zinc-100">{caseStudy.status}</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-400">{caseStudy.emptyState}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6 p-6 lg:p-8">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
            <article className="rounded-3xl border border-zinc-800 bg-black p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Case Study Narrative</p>
              <p className="mt-4 text-base leading-8 text-zinc-300">{caseStudy.publicNarrative}</p>
            </article>

            <aside className="rounded-3xl border border-zinc-800 bg-black p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Outcome</p>
              <p className="mt-4 text-2xl font-semibold text-zinc-100">{caseStudy.improvementLabel}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-500">{caseStudy.priorityChange}</p>
              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-600">Humanization Priority</p>
                <p className="mt-2 text-lg font-semibold text-zinc-100">
                  {caseStudy.beforePriority}/100 → {caseStudy.afterPriority}/100
                </p>
              </div>
            </aside>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {caseStudy.metrics.map((metric) => (
              <MetricCard key={metric.label} label={metric.label} before={metric.before} after={metric.after} />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <article className="rounded-3xl border border-zinc-800 bg-black p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">What Changed</p>
              <div className="mt-4 space-y-3">
                {caseStudy.improvements.map((item, index) => (
                  <div key={`${item}-${index}`} className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                    <span className="text-xs font-semibold text-zinc-600">0{index + 1}</span>
                    <p className="text-sm leading-6 text-zinc-300">{item}</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-zinc-800 bg-black p-6">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Client-Safe Explanation</p>
              <p className="mt-4 text-sm leading-7 text-zinc-300">{caseStudy.clientSafeLine}</p>
              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">Human Check</p>
                <p className="mt-2 text-xs leading-6 text-zinc-500">{caseStudy.humanCheck}</p>
              </div>
            </article>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-black p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">V5.3.5 · Before / After Case Study</p>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{caseStudy.caseStudyPurpose}</p>
          </div>
        </div>
      )}
    </section>
  );
}
