import React, { useState } from "react";

/**
 * Evidence status reflects loaded browser analysis, not permission to send
 * materials to a client. Approval and final listening remain human decisions.
 */
export function getV54OutputEvidenceStatus(reviewMode, draftAnalysis, humanizedAnalysis) {
  const draftReady = draftAnalysis?.status === "Ready";
  const editReady = humanizedAnalysis?.status === "Ready";
  const isComparison = reviewMode === "compare";

  if (!draftReady) {
    return {
      label: "Preview only",
      description: "Analyze an original draft before treating any delivery material as review-backed.",
      needsAnalysis: true,
    };
  }

  if (isComparison && !editReady) {
    return {
      label: "Comparison incomplete",
      description: "The original draft has been analyzed. Add the humanized edit to finish the before/after review.",
      needsAnalysis: true,
    };
  }

  return {
    label: isComparison ? "Both versions analyzed" : "Draft analyzed",
    description: "Analysis is available. Listen through and approve the final files yourself before sharing anything with a client.",
    needsAnalysis: false,
  };
}

const sections = [
  {
    id: "delivery",
    label: "Delivery",
    description: "Client note, final checks and handoff",
  },
  {
    id: "supporting",
    label: "Supporting outputs",
    description: "Briefs, handoff checks and export manifest",
  },
  {
    id: "sessions",
    label: "Saved projects",
    description: "Return to an earlier local project",
  },
];

/**
 * A focused Output surface: only the chosen section is mounted.
 * The deeper V4.2 tools and saved-project controls are preserved.
 */
export function V54OutputWorkspaceCleanup({
  evidence,
  deliveryContent,
  supportingContent,
  sessionsContent,
  setActiveTab,
}) {
  const [activeSection, setActiveSection] = useState("delivery");
  const active = sections.find((section) => section.id === activeSection) || sections[0];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-800 bg-black p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Output</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-100">
              Prepare the handoff.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
              Finish the client delivery, inspect supporting reports, or return to a saved project.
              Nothing is sent to a client automatically.
            </p>
          </div>
          <div className="max-w-sm rounded-2xl border border-zinc-800 bg-zinc-950 p-4" aria-live="polite">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">Review evidence</p>
            <p className="mt-2 text-base font-semibold text-zinc-100">{evidence.label}</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{evidence.description}</p>
            {evidence.needsAnalysis ? (
              <button
                type="button"
                onClick={() => setActiveTab("analyze")}
                className="mt-3 rounded-xl border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-900"
              >
                Go to Analyze
              </button>
            ) : null}
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Output sections">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              aria-pressed={activeSection === section.id}
              onClick={() => setActiveSection(section.id)}
              className={`rounded-2xl border p-4 text-left transition ${activeSection === section.id
                ? "border-white bg-white text-black"
                : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900"}`}
            >
              <span className="block text-sm font-semibold">{section.label}</span>
              <span className={`mt-2 block text-xs leading-5 ${activeSection === section.id ? "text-zinc-700" : "text-zinc-500"}`}>
                {section.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section aria-label={active.label}>
        {activeSection === "delivery"
          ? deliveryContent
          : activeSection === "supporting"
            ? supportingContent
            : sessionsContent}
      </section>
    </div>
  );
}
