import React, { useState } from "react";

/**
 * V5.4.3: Historical planning panels are retained, but only the selected
 * section is displayed. The overview stays short and useful by default.
 */
export const ADVANCED_SECTIONS = [
  {
    id: "technical",
    label: "Technical architecture",
    description: "Mock API contracts, analysis boundaries and integration planning",
    note: "These are prototype designs, not a live backend or production API.",
  },
  {
    id: "ux",
    label: "UX decisions",
    description: "Earlier navigation, layout and progressive-disclosure blueprints",
    note: "Reference materials kept for product development, not required for daily reviews.",
  },
  {
    id: "beta",
    label: "Beta materials",
    description: "Public-demo notes, screenshots and presentation references",
    note: "Supporting presentation materials rather than part of the music-review workflow.",
  },
  {
    id: "history",
    label: "Release archive",
    description: "The V5.3 handoff and earlier layout-refactor documentation",
    note: "Historical milestones remain accessible without crowding the current product.",
  },
];

export function V54AdvancedWorkspaceCleanup({
  technicalContent,
  uxContent,
  betaContent,
  historyContent,
  setActiveTab,
}) {
  const [sectionId, setSectionId] = useState("overview");
  const activeSection = ADVANCED_SECTIONS.find((section) => section.id === sectionId);
  const sectionContent = {
    technical: technicalContent,
    ux: uxContent,
    beta: betaContent,
    history: historyContent,
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-zinc-800 bg-black p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">Advanced</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-100">
              Deeper tools. Less noise.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
              Architecture references, earlier product decisions and release materials are grouped here.
              You do not need any of these to complete a normal review or prepare a client delivery.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-xs font-semibold text-zinc-300">
            V5.4.3 - Advanced Cleanup
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveTab("report")}
            className="rounded-2xl border border-zinc-800 bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
          >
            Return to Report
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("output")}
            className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
          >
            Return to Output
          </button>
        </div>

        <nav className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2" aria-label="Advanced sections">
          {ADVANCED_SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              aria-pressed={sectionId === section.id}
              onClick={() => setSectionId(section.id === sectionId ? "overview" : section.id)}
              className={`rounded-3xl border p-5 text-left transition ${sectionId === section.id
                ? "border-white bg-white text-black"
                : "border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-zinc-600 hover:bg-zinc-900"}`}
            >
              <span className="block text-base font-semibold">{section.label}</span>
              <span className={`mt-2 block text-xs leading-6 ${sectionId === section.id ? "text-zinc-700" : "text-zinc-500"}`}>
                {section.description}
              </span>
              <span className={`mt-4 block text-xs font-semibold ${sectionId === section.id ? "text-zinc-700" : "text-zinc-400"}`}>
                {sectionId === section.id ? "Close section" : "Open section"}
              </span>
            </button>
          ))}
        </nav>
      </section>

      {activeSection ? (
        <section className="space-y-5" aria-label={activeSection.label}>
          <div className="flex flex-col gap-3 rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Selected section</p>
              <h3 className="mt-2 text-xl font-semibold text-zinc-100">{activeSection.label}</h3>
              <p className="mt-2 text-xs leading-6 text-zinc-500">{activeSection.note}</p>
            </div>
            <button
              type="button"
              onClick={() => setSectionId("overview")}
              className="shrink-0 rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900"
            >
              Back to Overview
            </button>
          </div>
          <div className="space-y-6">{sectionContent[sectionId]}</div>
        </section>
      ) : (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5" aria-label="Advanced overview">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Workspace overview</p>
          <p className="mt-3 text-sm leading-7 text-zinc-400">
            Choose a section above only when you need the extra context. All existing Advanced
            reference panels are preserved in their respective categories.
          </p>
        </section>
      )}
    </div>
  );
}
