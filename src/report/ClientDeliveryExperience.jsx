import React, { useState } from "react";

export function V53ClientDeliveryExperience({ delivery, deliveryText, setActiveTab }) {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleCopy = async () => {
    if (!navigator?.clipboard?.writeText || !deliveryText) return;

    try {
      await navigator.clipboard.writeText(deliveryText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    if (!deliveryText || !delivery.fileName) return;

    const blob = new Blob([deliveryText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = delivery.fileName;
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
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Client Delivery Experience</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-100">{delivery.title}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">{delivery.subtitle}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
            >
              {copied ? "Copied" : "Copy Delivery Note"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-2xl border border-zinc-800 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              {downloaded ? "Downloaded" : "Download Delivery Note"}
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-6 p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          <article className="rounded-3xl border border-zinc-800 bg-black p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Delivery Summary</p>
            <p className="mt-4 text-base leading-8 text-zinc-300">{delivery.deliverySummary}</p>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-600">Recommended Output</p>
                <p className="mt-2 text-sm font-semibold text-zinc-100">{delivery.recommendedOutput}</p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-xs text-zinc-600">Delivery Status</p>
                <p className="mt-2 text-sm font-semibold text-zinc-100">{delivery.deliveryStatus}</p>
              </div>
            </div>
          </article>

          <aside className="rounded-3xl border border-zinc-800 bg-black p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Readiness</p>
            <p className="mt-4 text-4xl font-semibold text-zinc-100">{delivery.readinessScore}/100</p>
            <p className="mt-2 text-sm font-semibold text-zinc-300">{delivery.readinessLabel}</p>
            <p className="mt-3 text-xs leading-6 text-zinc-500">{delivery.readinessNote}</p>
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {delivery.deliverables.map((item) => (
            <article key={item.label} className="rounded-3xl border border-zinc-800 bg-black p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">{item.label}</p>
              <h3 className="mt-3 text-lg font-semibold text-zinc-100">{item.status}</h3>
              <p className="mt-3 text-xs leading-5 text-zinc-500">{item.detail}</p>
            </article>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-zinc-800 bg-black p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Final Human Check</p>
            <div className="mt-4 space-y-3">
              {delivery.humanChecks.map((item, index) => (
                <div key={item} className="flex gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <span className="text-xs font-semibold text-zinc-600">0{index + 1}</span>
                  <p className="text-sm leading-6 text-zinc-300">{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-zinc-800 bg-black p-6">
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Client Message Preview</p>
            <p className="mt-4 text-sm leading-7 text-zinc-300">{delivery.clientMessage}</p>

            <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">Next Move</p>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{delivery.nextMove}</p>
            </div>
          </article>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
          >
            Back to Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("advanced")}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-zinc-900"
          >
            Review Advanced Details
          </button>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-black p-5">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-600">V5.3.6 · Client Delivery Experience</p>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{delivery.deliveryPrinciple}</p>
        </div>
      </div>
    </section>
  );
}
