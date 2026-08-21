import React, { useState } from "react";

export function V53ReportSharingExportHandoff({ handoff, handoffText, setActiveTab }) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = async () => {
    if (!navigator?.clipboard?.writeText || !handoffText) return;

    try {
      await navigator.clipboard.writeText(handoffText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    if (!handoffText || !handoff.fileName) return;

    const blob = new Blob([handoffText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = handoff.fileName;
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
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">V5.3 Release Handoff</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-100">{handoff.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">{handoff.subtitle}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
            >
              {copied ? "Copied" : "Copy Handoff"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-2xl border border-zinc-800 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              {downloaded ? "Downloaded" : "Download Handoff"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          <article className="rounded-3xl border border-zinc-800 bg-black p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">V5.3 Outcome</p>
            <p className="mt-4 text-base leading-8 text-zinc-300">{handoff.outcome}</p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-600">Release</p>
                <p className="mt-2 text-sm font-semibold text-zinc-100">{handoff.releaseLabel}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-600">Next Chapter</p>
                <p className="mt-2 text-sm font-semibold text-zinc-100">{handoff.nextChapter}</p>
              </div>
            </div>
          </article>

          <aside className="rounded-3xl border border-zinc-800 bg-black p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Release Readiness</p>
            <p className="mt-4 text-4xl font-semibold text-zinc-100">{handoff.readinessScore}/100</p>
            <p className="mt-2 text-sm font-semibold text-zinc-300">{handoff.readinessLabel}</p>
            <p className="mt-3 text-xs leading-6 text-zinc-500">{handoff.readinessNote}</p>
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {handoff.features.map((feature) => (
            <article key={feature.version} className="rounded-3xl border border-zinc-800 bg-black p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">{feature.version}</p>
              <h3 className="mt-3 text-lg font-semibold text-zinc-100">{feature.title}</h3>
              <p className="mt-3 text-xs leading-5 text-zinc-500">{feature.detail}</p>
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">{feature.status}</p>
            </article>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-zinc-800 bg-black p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Release Checks</p>
            <div className="mt-4 space-y-3">
              {handoff.releaseChecks.map((item, index) => (
                <div key={item} className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <span className="text-xs font-semibold text-zinc-600">0{index + 1}</span>
                  <p className="text-sm leading-6 text-zinc-300">{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-zinc-800 bg-black p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Architecture Boundary</p>
            <p className="mt-4 text-sm leading-7 text-zinc-300">{handoff.architectureBoundary}</p>

            <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">Important</p>
              <p className="mt-2 text-xs leading-6 text-zinc-500">{handoff.backendNote}</p>
            </div>
          </article>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
          >
            Review Report Experience
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("output")}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900"
          >
            Review Client Delivery
          </button>
        </div>
      </div>
    </section>
  );
}
