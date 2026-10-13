import React, { useState } from "react";

// V5.4.4: These secondary pages are loaded on demand.
// Shared UI and data are passed in as props to avoid importing App.jsx back into this module.
function ShareSoulFramePanel({ Panel, Button, publicShareLinks, buildShareLinksText, downloadTextFile }) {
  const [copyStatus, setCopyStatus] = useState("Copy Links");
  const [downloadStatus, setDownloadStatus] = useState("Download Links");

  async function handleCopyLinks() {
    try {
      await navigator.clipboard.writeText(buildShareLinksText());
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy Links"), 1500);
    } catch (error) {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus("Copy Links"), 1500);
    }
  }

  function handleDownloadLinks() {
    const downloaded = downloadTextFile("SoulFrame_Public_Links.txt", buildShareLinksText());
    setDownloadStatus(downloaded ? "Downloaded" : "Download failed");
    window.setTimeout(() => setDownloadStatus("Download Links"), 1500);
  }

  return (
    <Panel
      title="Share SoulFrame"
      subtitle="A clean public link kit for sharing the live demo, repository, and ChordOfAnnie home base."
      action={
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={handleCopyLinks}>{copyStatus}</Button>
          <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={handleDownloadLinks}>{downloadStatus}</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {publicShareLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-3xl border border-zinc-800 bg-black p-5 transition hover:bg-zinc-900"
          >
            <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Public Link</p>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">{link.label}</h3>
            <p className="mt-3 break-words text-sm leading-6 text-zinc-400">{link.href}</p>
          </a>
        ))}
      </div>
      <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Share line</p>
        <p className="mt-3 text-sm leading-7 text-zinc-300">
          SoulFrame is a browser-based AI music humanization review tool built to help producers inspect AI-generated drafts, identify artifact clues, and turn analysis into clearer revision plans and client-ready updates.
        </p>
      </div>
    </Panel>
  );
}

function AboutSoulFramePanel({ Panel, Button, buildProductSummaryText, downloadTextFile }) {
  const [copyStatus, setCopyStatus] = useState("Copy Product Summary");
  const [downloadStatus, setDownloadStatus] = useState("Download Product Summary");
  const pillars = [
    {
      title: "Listen",
      note: "Upload AI-generated drafts and inspect real audio facts like waveform, duration, headroom, dynamics, brightness, and texture movement.",
    },
    {
      title: "Detect",
      note: "Use lightweight browser-based analysis to surface early artifact clues, humanization priority, and section-by-section review prompts.",
    },
    {
      title: "Guide",
      note: "Turn review results into producer-focused action plans, client-safe notes, revision checklists, and next-pass priorities.",
    },
    {
      title: "Export",
      note: "Copy or download producer reports, client reports, client action plans, summaries, checklists, and saved project sessions.",
    },
  ];

  async function handleCopyProductSummary() {
    try {
      await navigator.clipboard.writeText(buildProductSummaryText());
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy Product Summary"), 1500);
    } catch (error) {
      setCopyStatus("Copy failed");
      window.setTimeout(() => setCopyStatus("Copy Product Summary"), 1500);
    }
  }

  function handleDownloadProductSummary() {
    const downloaded = downloadTextFile("SoulFrame_Product_Summary.txt", buildProductSummaryText());
    setDownloadStatus(downloaded ? "Downloaded" : "Download failed");
    window.setTimeout(() => setDownloadStatus("Download Product Summary"), 1500);
  }

  return (
    <Panel
      title="About SoulFrame"
      subtitle="A second set of ears for humanizing AI-generated music."
      action={
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button className="border border-zinc-800 bg-black text-zinc-100 hover:bg-zinc-900" onClick={handleCopyProductSummary}>{copyStatus}</Button>
          <Button className="border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800" onClick={handleDownloadProductSummary}>{downloadStatus}</Button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded-3xl border border-zinc-800 bg-black p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Mission</p>
          <h3 className="mt-3 text-2xl font-semibold text-zinc-100">Humanize sound. Bring soul back into music.</h3>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            SoulFrame is built to support producers working with AI-generated music. It does not replace taste, emotion, or human judgement. It helps organize the listening process so synthetic drafts can be shaped into something more intentional, musical, and alive.
          </p>
        </article>
        <article className="rounded-3xl border border-zinc-800 bg-black p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Current Stage</p>
          <h3 className="mt-3 text-2xl font-semibold text-zinc-100">V5.4 product workspace cleanup</h3>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            SoulFrame now opens into a dashboard-first Product workspace. Report, Output and Advanced have clearer focused views; technical tools and the Classic Demo remain available. The underlying audio review is still browser-based, with no production backend yet.
          </p>
        </article>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {pillars.map((pillar) => (
          <article key={pillar.title} className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <h3 className="text-lg font-semibold text-zinc-100">{pillar.title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{pillar.note}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 rounded-3xl border border-zinc-800 bg-black p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Product Arc</p>
        <p className="mt-3 text-2xl font-semibold text-zinc-100">Dashboard → Analyze → Report → Output → Advanced</p>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          This is now the V5.3 product arc: give the producer a calm dashboard first, guide analysis in one workspace, turn the review into a cleaner producer/client report, prepare downloadable and share-ready outputs, finish with a human-led delivery check, and keep deeper technical systems available only when needed.
        </p>
      </div>
    </Panel>
  );
}

function DemoWalkthroughPanel({ Panel, demoWalkthroughSteps }) {
  return (
    <Panel title="Demo Walkthrough" subtitle="A guided product story for screenshots, live demos, and explaining SoulFrame quickly.">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {demoWalkthroughSteps.map((step, index) => (
          <article key={step.title} className="rounded-3xl border border-zinc-800 bg-black p-5">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-100">{index + 1}</span>
            <h3 className="mt-4 font-semibold text-zinc-100">{step.title}</h3>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{step.note}</p>
          </article>
        ))}
      </div>
      <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Suggested demo line</p>
        <p className="mt-3 text-lg leading-8 text-zinc-200">
          SoulFrame helps a producer move from an AI-generated draft to a clearer humanization plan, then export the right notes for their own workflow or for client communication.
        </p>
      </div>
    </Panel>
  );
}

function HowSoulFrameWorksPanel({ Panel }) {
  const workflow = [
    {
      title: "1. Intake the project",
      note: "Capture the project name, client, track type, AI tool, current stage, main concern, client goal, and private producer notes.",
    },
    {
      title: "2. Inspect the audio",
      note: "Upload the draft and optionally the humanized edit. SoulFrame reads browser-based audio facts such as duration, waveform, peak, clipping risk, dynamics, brightness, and texture movement.",
    },
    {
      title: "3. Surface humanization clues",
      note: "The app converts measurable audio proxies into early artifact clues, listening focus points, priority scores, section notes, and before/after deltas.",
    },
    {
      title: "4. Turn clues into actions",
      note: "SoulFrame generates producer action plans, client-safe wording, revision checklists, delivery checks, and session summaries.",
    },
    {
      title: "5. Export and communicate",
      note: "Copy or download reports, client action plans, client-safe summaries, revision checklists, delivery checklists, saved projects, and product summaries.",
    },
  ];

  return (
    <Panel title="How SoulFrame Works" subtitle="The full product logic from AI draft to client-ready revision planning.">
      <div className="space-y-4">
        {workflow.map((step) => (
          <article key={step.title} className="rounded-3xl border border-zinc-800 bg-black p-6">
            <h3 className="text-xl font-semibold text-zinc-100">{step.title}</h3>
            <p className="mt-3 text-sm leading-7 text-zinc-400">{step.note}</p>
          </article>
        ))}
      </div>
      <div className="mt-5 rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
        <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">Important note</p>
        <p className="mt-3 text-sm leading-7 text-zinc-400">
          SoulFrame does not claim to replace the producer's ear. The current version uses browser-based audio analysis and producer-guided logic to support decisions, structure the review, and make the client workflow clearer.
        </p>
      </div>
    </Panel>
  );
}

function ArtifactDatabase({ Panel, artifactDatabase }) {
  return <Panel title="Artifact Database" subtitle="The early SoulFrame knowledge base of common AI music artifacts."><div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">{artifactDatabase.map((artifact) => <article key={artifact.name} className="rounded-3xl border border-zinc-800 bg-black p-5"><div className="mb-3 flex items-start justify-between gap-3"><div><h3 className="font-semibold text-zinc-100">{artifact.name}</h3><p className="mt-1 text-xs text-zinc-500">{artifact.category}</p></div><span className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">{artifact.severity}</span></div><p className="text-sm text-zinc-400">{artifact.description}</p><div className="mt-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-4"><p className="mb-1 text-xs uppercase tracking-wide text-zinc-500">Common Fix</p><p className="text-sm text-zinc-200">{artifact.fix}</p></div></article>)}</div></Panel>;
}

export default function SecondaryViews({ page, Panel, Button, publicShareLinks, buildShareLinksText, downloadTextFile, buildProductSummaryText, demoWalkthroughSteps, artifactDatabase }) {
  if (page === "database") return <ArtifactDatabase Panel={Panel} artifactDatabase={artifactDatabase} />;
  if (page === "about") return <AboutSoulFramePanel Panel={Panel} Button={Button} buildProductSummaryText={buildProductSummaryText} downloadTextFile={downloadTextFile} />;
  if (page === "walkthrough") return <DemoWalkthroughPanel Panel={Panel} demoWalkthroughSteps={demoWalkthroughSteps} />;
  if (page === "how") return <HowSoulFrameWorksPanel Panel={Panel} />;
  if (page === "share") return <ShareSoulFramePanel Panel={Panel} Button={Button} publicShareLinks={publicShareLinks} buildShareLinksText={buildShareLinksText} downloadTextFile={downloadTextFile} />;
  return null;
}
