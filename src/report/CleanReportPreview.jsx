import React, { useState } from "react";

function PreviewSection({ label, children }) {
  return (
    <section className="border-t border-zinc-800 pt-5">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">{label}</p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function V53CleanReportPreview({
  report,
  producerText,
  clientText,
  exportPack,
  sharePack,
}) {
  const [audience, setAudience] = useState("producer");
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [shared, setShared] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const isClient = audience === "client";
  const currentText = isClient ? clientText : producerText;
  const currentFileName = isClient ? exportPack?.clientFileName : exportPack?.producerFileName;

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentText);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    if (!currentText || !currentFileName) return;

    const blob = new Blob([currentText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = currentFileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    URL.revokeObjectURL(url);
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 1600);
  };

  const handleShare = async () => {
    if (!sharePack?.shareSummary) return;

    try {
      if (navigator?.share) {
        await navigator.share({
          title: sharePack.shareTitle,
          text: sharePack.shareSummary,
        });
        setShared(true);
        window.setTimeout(() => setShared(false), 1600);
        return;
      }

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(sharePack.shareSummary);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 1600);
      }
    } catch {
      setShared(false);
    }
  };

  const handleCopyShareSummary = async () => {
    if (!sharePack?.shareSummary || !navigator?.clipboard?.writeText) return;

    try {
      await navigator.clipboard.writeText(sharePack.shareSummary);
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 1600);
    } catch {
      setShareCopied(false);
    }
  };

  return (
    <section className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 bg-black p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">SoulFrame Report Preview</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-100">{report.reportTitle}</h2>
            <p className="mt-2 text-sm text-zinc-500">
              {report.projectName} · {report.genreFocus} · {report.generatedStatus}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
              <button
                type="button"
                onClick={() => setAudience("producer")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${!isClient ? "bg-white text-black" : "text-zinc-400 hover:text-zinc-100"}`}
              >
                Producer
              </button>
              <button
                type="button"
                onClick={() => setAudience("client")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${isClient ? "bg-white text-black" : "text-zinc-400 hover:text-zinc-100"}`}
              >
                Client
              </button>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
            >
              {copied ? "Copied" : "Copy Preview"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!currentFileName}
              className="rounded-2xl border border-zinc-800 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloaded ? "Downloaded" : "Download TXT"}
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={!sharePack?.shareSummary}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {shared ? "Shared" : shareCopied ? "Copied Share Text" : "Share Report"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[1fr_290px]">
        <article className="space-y-6 p-6 lg:p-8">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">
              {isClient ? "Client Summary" : "Executive Summary"}
            </p>
            <p className="mt-4 text-base leading-8 text-zinc-300">
              {isClient ? report.clientSummary : report.executiveSummary}
            </p>
          </div>

          {!isClient ? (
            <PreviewSection label="Producer Priorities">
              <ol className="space-y-3">
                {report.producerPriorities.map((priority, index) => (
                  <li key={`${priority}-${index}`} className="flex gap-4 rounded-2xl border border-zinc-800 bg-black p-4">
                    <span className="text-xs font-semibold text-zinc-600">0{index + 1}</span>
                    <span className="text-sm leading-6 text-zinc-300">{priority}</span>
                  </li>
                ))}
              </ol>
            </PreviewSection>
          ) : null}

          {report.showComparison ? (
            <PreviewSection label="Before / After">
              <p className="text-sm leading-7 text-zinc-300">{report.beforeAfterLine}</p>
            </PreviewSection>
          ) : null}

          <PreviewSection label={isClient ? "Next Step" : "Producer Next Move"}>
            <p className="text-sm leading-7 text-zinc-300">
              {isClient ? report.clientNextStep : report.nextMove}
            </p>
          </PreviewSection>

          <div className="rounded-2xl border border-zinc-800 bg-black p-4">
            <p className="text-xs leading-6 text-zinc-500">
              SoulFrame structures the review, but the producer remains responsible for the final musical judgement and client communication.
            </p>
          </div>
        </article>

        <aside className="border-t border-zinc-800 bg-black p-6 lg:border-l lg:border-t-0">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Report Details</p>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-xs text-zinc-600">Project</p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">{report.projectName}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-600">Client</p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">{report.clientName}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-600">Report Path</p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">{report.reportPath}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-600">Quality</p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">{report.qualityScore}/100 · {report.qualityLabel}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-600">Recommended Output</p>
              <p className="mt-1 text-sm font-semibold text-zinc-200">{report.recommendedOutput}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">V5.3.2</p>
            <p className="mt-2 text-sm font-semibold text-zinc-200">Clean Report Preview</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              A cleaner producer/client presentation layer before downloadable and shareable reports.
            </p>
          </div>
          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">V5.3.3</p>
            <p className="mt-2 text-sm font-semibold text-zinc-200">Downloadable Report Export</p>
            <p className="mt-2 break-all text-xs leading-5 text-zinc-500">
              {currentFileName || "Report filename pending"}
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-600">
              {exportPack?.exportNote}
            </p>
          </div>
          <div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">V5.3.4</p>
            <p className="mt-2 text-sm font-semibold text-zinc-200">Shareable Report Direction</p>
            <p className="mt-2 break-all text-xs leading-5 text-zinc-500">
              Future route: {sharePack?.routePreview || "/report/project"}
            </p>
            <p className="mt-3 text-xs leading-5 text-zinc-600">
              {sharePack?.privacyNote}
            </p>
            <button
              type="button"
              onClick={handleCopyShareSummary}
              disabled={!sharePack?.shareSummary}
              className="mt-4 w-full rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {shareCopied ? "Share Summary Copied" : "Copy Share Summary"}
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
