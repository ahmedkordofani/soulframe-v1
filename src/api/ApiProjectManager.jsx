import { ProjectRecoveryPanel } from "./ProjectRecoveryPanel";
import { setLocalAccessToken, clearLocalAccessToken } from "./localAccessToken";
import { useEffect, useState } from "react";
import { checkSoulFrameApi } from "./apiClient";
import { buildLocalApiProjectPayload } from "./projectMetadata";
import { listApiProjects, createApiProject, readApiProject, updateApiProject, deleteApiProject } from "./projectClient";

const button = "rounded-2xl border border-zinc-800 bg-black px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40";
const primaryButton = "rounded-2xl border border-zinc-700 bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40";

function displayDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString();
}

export function ApiProjectManager({ projectSession, reviewMode, selectedPreset, onLoadProject }) {
  const [connection, setConnection] = useState({ status: "checking" });
  const [records, setRecords] = useState([]);
  const [hasListed, setHasListed] = useState(false);
  const [busy, setBusy] = useState("");
  const [pending, setPending] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [tokenDraft, setTokenDraft] = useState("");
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    checkSoulFrameApi(fetch, controller.signal).then((result) => {
      if (!controller.signal.aborted) setConnection(result);
    });
    return () => controller.abort();
  }, []);

  const connected = connection.status === "connected" && connection.capabilities?.projectPersistence === true && connection.capabilities?.projectRevisions === true && connection.capabilities?.localTokenRequired === true && connection.capabilities?.localOwnerAccess === true;
  const requiresToken = connection.capabilities?.localTokenRequired === true;
  const canUseProjects = connected && (!requiresToken || unlocked);

  function lockProjects() {
    clearLocalAccessToken();
    setTokenDraft("");
    setUnlocked(false);
    setRecords([]);
    setHasListed(false);
    setPending(null);
    setFeedback({ kind: "success", text: "Local project access locked. Browser-saved projects remain available." });
  }

  async function unlockProjects(event) {
    event.preventDefault();
    if (!connected || !requiresToken || busy) return;
    setBusy("unlock");
    setFeedback(null);
    try {
      setLocalAccessToken(tokenDraft);
      const listed = await listApiProjects(); // Validate token with the real API.
      if (!Array.isArray(listed.projects)) throw new Error("Invalid local project list");
      setRecords(listed.projects);
      setHasListed(true);
      setUnlocked(true);
      setTokenDraft("");
      setFeedback({ kind: "success", text: "Local project storage unlocked for this browser tab. The token is held only in memory." });
    } catch (error) {
      clearLocalAccessToken();
      setUnlocked(false);
      setFeedback({ kind: "error", text: error.status === 401 ? "Incorrect or expired access token. Restarting the backend generates a new one." : (error.message || "Could not unlock local projects") });
    } finally {
      setBusy("");
    }
  }

  async function refreshProjects() {
    if (!canUseProjects) return;
    setBusy("refresh");
    setFeedback(null);
    try {
      const result = await listApiProjects();
      if (!Array.isArray(result.projects)) throw new Error("Invalid local project list");
      setRecords(result.projects);
      setHasListed(true);
    } catch (error) {
      if (error.status === 401) lockProjects();
      setFeedback({ kind: "error", text: error.message || "Could not list projects" });
    } finally {
      setBusy("");
    }
  }

  async function retryConnection() {
    setBusy("connect");
    const status = await checkSoulFrameApi();
    setConnection(status);
    setBusy("");
    if (status.status !== "connected" || (!status.capabilities?.projectPersistence || !status.capabilities?.projectRevisions || !status.capabilities?.localTokenRequired || !status.capabilities?.localOwnerAccess)) {
      setFeedback({ kind: "error", text: "Start the V6.0.8 local API with npm run dev:api and retry. An older server cannot safely process revision-protected actions." });
    } else {
      setFeedback({ kind: "success", text: "Local API available. Refresh the project list when ready." });
    }
  }

  async function saveNewProject() {
    if (!canUseProjects) return;
    setBusy("create");
    setFeedback(null);
    try {
      const payload = buildLocalApiProjectPayload(projectSession, reviewMode, selectedPreset);
      const saved = await createApiProject(payload);
      const listed = await listApiProjects();
      setRecords(listed.projects);
      setHasListed(true);
      setFeedback({ kind: "success", text: `Saved ${saved.project.projectSession.projectName} as a new local API project.` });
    } catch (error) {
      if (error.status === 401) lockProjects();
      setFeedback({ kind: "error", text: error.message || "Could not save the project" });
    } finally {
      setBusy("");
    }
  }

  async function confirmAction() {
    if (!pending || !canUseProjects) return;
    const { kind, id } = pending;
    const currentRecord = records.find((record) => record.id === id);
    const label = currentRecord?.title || "Project";
    if (!currentRecord || !Number.isSafeInteger(currentRecord.revision) || currentRecord.revision < 1) {
      setPending(null);
      setFeedback({ kind: "error", text: "Project revision is missing. Refresh the list before changing this record." });
      return;
    }
    setBusy(kind);
    setFeedback(null);
    try {
      if (kind === "load") {
        const result = await readApiProject(id);
        if (!result.project?.projectSession) throw new Error("Invalid saved project data");
        onLoadProject(result.project);
        setFeedback({ kind: "success", text: `Loaded ${label}. Attached audio and previous analysis were cleared; upload audio again to review this project.` });
      } else if (kind === "overwrite") {
        const payload = buildLocalApiProjectPayload(projectSession, reviewMode, selectedPreset);
        await updateApiProject(id, payload, { expectedRevision: currentRecord.revision });
        const listed = await listApiProjects();
        setRecords(listed.projects);
        setFeedback({ kind: "success", text: `Updated ${label} with the current project metadata.` });
      } else if (kind === "delete") {
        await deleteApiProject(id, { expectedRevision: currentRecord.revision });
        setRecords((current) => current.filter((record) => record.id !== id));
        setFeedback({ kind: "success", text: `Deleted ${label} from the local API. Browser-saved projects were not changed.` });
      }
      setPending(null);
    } catch (error) {
      if (error.status === 401) {
        lockProjects();
        setFeedback({ kind: "error", text: "Local API token expired or changed. Unlock with the current token in the API terminal." });
      } else if (error.status === 412) {
        // Never automatically retry a destructive action with the new revision.
        setPending(null);
        try {
          const latest = await listApiProjects();
          if (Array.isArray(latest.projects)) {
            setRecords(latest.projects);
            setHasListed(true);
          }
        } catch {
          // A failed refresh still leaves the attempted overwrite/delete cancelled.
        }
        setFeedback({
          kind: "error",
          text: "Project conflict: another change was saved since your last refresh. The action was cancelled. Review the latest project before trying again.",
        });
      } else {
        setFeedback({ kind: "error", text: error.message || "The action failed" });
      }
    } finally {
      setBusy("");
    }
  }

  const pendingRecord = records.find((record) => record.id === pending?.id);
  const pendingAction = pending?.kind === "load"
    ? "Load this API project into the current workspace? Your current project fields and review mode will be replaced, and attached audio and analysis will be cleared. Save any unsaved work first."
    : pending?.kind === "overwrite"
      ? "Replace this saved API project with the CURRENT project's metadata? The API will block the action if someone changed the saved project since you refreshed. Browser backups remain unchanged."
      : "Permanently delete this project from the local API? The API will block deletion if the record has changed since you refreshed. Keep a separate backup.";

  return (
    <section className="rounded-[2rem] border border-zinc-800 bg-zinc-950 p-5 md:p-6" aria-label="Local API projects">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">V6.0.8 - Local Owner Access</p>
          <h2 className="mt-2 text-xl font-semibold text-zinc-100">Server project metadata</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-400">
            Explicitly save project details to your own local Node API, or retrieve them later. These records are separate from SoulFrame's browser-saved projects.
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            Only project metadata, including client name and producer notes, is sent when you click Save or Overwrite. No audio files or analysis results are sent. The API uses a temporary local-owner token, not real user accounts. Do not expose it publicly or use sensitive client data. Overwrites and deletes require the latest revision, preventing stale changes.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-black px-4 py-3 text-xs font-semibold text-zinc-300" role="status">
          {connection.status === "checking" ? "Checking local API..." : connected ? `Connected (${connection.version})` : connection.status === "connected" ? "Update API to v6.0.8 before saving projects" : "Offline - browser saves still work"}
        </div>
      </div>

      {requiresToken && connected ? (
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-black p-4">
          <p className="text-sm font-semibold text-zinc-100">{unlocked ? "Local projects unlocked" : "Unlock local project storage"}</p>
          <p className="mt-2 text-xs leading-6 text-zinc-400">{unlocked
            ? "Your temporary token is held in memory for this tab. Lock access whenever you finish working."
            : "Start npm run dev:api, copy the access token printed in that terminal, then enter it here. A new token is generated whenever the API restarts."}</p>
          {unlocked ? (
            <button type="button" className={`${button} mt-3`} onClick={lockProjects} disabled={Boolean(busy)}>Lock projects</button>
          ) : (
            <form className="mt-3 flex flex-col gap-3 sm:flex-row" onSubmit={unlockProjects}>
              <input type="password" autoComplete="off" name="local-access-token" value={tokenDraft}
                onChange={(event) => setTokenDraft(event.target.value)}
                placeholder="Paste temporary API access token" aria-label="Local API access token"
                className="min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 p-3 text-sm text-white" />
              <button className={primaryButton} type="submit" disabled={Boolean(busy) || !tokenDraft.trim()}>Unlock projects</button>
            </form>
          )}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" className={button} disabled={Boolean(busy)} onClick={retryConnection}>Retry connection</button>
        <button type="button" className={button} disabled={!canUseProjects || Boolean(busy)} onClick={refreshProjects}>Refresh API projects</button>
        <button type="button" className={primaryButton} disabled={!canUseProjects || Boolean(busy)} onClick={saveNewProject}>Save current project to local API</button>
      </div>

      {feedback ? (
        <p role="status" aria-live="polite" className={`mt-4 rounded-2xl border p-4 text-sm ${feedback.kind === "error" ? "border-red-900 bg-red-950/30 text-red-200" : "border-zinc-700 bg-black text-zinc-200"}`}>
          {feedback.text}
        </p>
      ) : null}

      {pending && (
        <div className="mt-5 rounded-2xl border border-amber-900 bg-amber-950/20 p-4" role="group" aria-label="Confirm project action">
          <p className="font-semibold text-zinc-100">Confirm {pending.kind} - {pendingRecord?.title || "project"}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">{pendingAction}</p>
          <div className="mt-4 flex gap-3">
            <button type="button" className={primaryButton} disabled={Boolean(busy)} onClick={confirmAction}>Confirm {pending.kind}</button>
            <button type="button" className={button} disabled={Boolean(busy)} onClick={() => setPending(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        {!canUseProjects && requiresToken ? (
          <p className="rounded-2xl border border-zinc-800 bg-black p-4 text-sm text-zinc-500">Unlock the local API before listing or changing server projects.</p>
        ) : !hasListed ? (
          <p className="rounded-2xl border border-zinc-800 bg-black p-4 text-sm text-zinc-500">Choose Refresh API projects to list locally stored projects. No browser projects are uploaded automatically.</p>
        ) : records.length === 0 ? (
          <p className="rounded-2xl border border-zinc-800 bg-black p-4 text-sm text-zinc-500">No projects saved to the local API yet.</p>
        ) : records.map((record) => (
          <div key={record.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-zinc-800 bg-black p-4 lg:flex-row lg:items-center">
            <div>
              <p className="font-semibold text-zinc-100">{record.title}</p>
              <p className="mt-1 text-xs text-zinc-500">{record.reviewMode === "compare" ? "Before / After" : "Draft Review"} - Revision {record.revision ?? "?"} - Updated {displayDate(record.updatedAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} disabled={Boolean(busy)} onClick={() => setPending({ kind: "load", id: record.id })}>Load</button>
              <button type="button" className={button} disabled={Boolean(busy)} onClick={() => setPending({ kind: "overwrite", id: record.id })}>Overwrite</button>
              <button type="button" className={button} disabled={Boolean(busy)} onClick={() => setPending({ kind: "delete", id: record.id })}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      <ProjectRecoveryPanel
        enabled={canUseProjects && connection.capabilities?.projectRecovery === true && connection.capabilities?.metadataBackupExport === true && connection.capabilities?.metadataBackupImport === true}
        onRecoveryChanged={refreshProjects}
      />
    </section>
  );
}
