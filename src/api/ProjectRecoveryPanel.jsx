import { useState } from "react";
import {
  listRecoverySnapshots,
  readRecoverySnapshot,
  restoreRecoverySnapshot,
  exportLocalApiBackup,
  previewLocalApiBackup,
  confirmLocalApiBackupImport,
} from "./projectClient";

const button = "rounded-2xl border border-zinc-800 bg-black px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-40";
const primary = "rounded-2xl border border-zinc-700 bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40";

function formatDate(date) {
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? "Unknown date" : parsed.toLocaleString();
}

export function ProjectRecoveryPanel({ enabled = false, onRecoveryChanged }) {
  const [history, setHistory] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [preview, setPreview] = useState(null);
  const [pending, setPending] = useState(false);
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importAcknowledged, setImportAcknowledged] = useState(false);

  async function refreshHistory() {
    if (!enabled) return;
    setBusy("refresh");
    setFeedback(null);
    setPending(false);
    setPreview(null);
    try {
      const result = await listRecoverySnapshots();
      if (!Array.isArray(result.entries)) throw new Error("Invalid recovery history");
      setHistory(result.entries);
      setLoaded(true);
    } catch (error) {
      setFeedback({ error: true, message: error.message || "Could not load recovery history" });
    } finally {
      setBusy("");
    }
  }

  async function previewSnapshot(entry) {
    setBusy("preview");
    setFeedback(null);
    setPending(false);
    try {
      const result = await readRecoverySnapshot(entry.id);
      if (!result.snapshot?.record?.projectSession) throw new Error("Recovery snapshot is invalid");
      setPreview({ entry, snapshot: result.snapshot });
    } catch (error) {
      setFeedback({ error: true, message: error.message || "Could not preview recovery snapshot" });
    } finally {
      setBusy("");
    }
  }

  async function confirmRestore() {
    if (!enabled || !preview || !pending) return;
    setBusy("restore");
    setFeedback(null);
    try {
      // Active records require the revision observed in the history list.
      // Deleted records require that the project is still absent.
      const options = preview.entry.activeRevision === null
        ? { requireAbsent: true }
        : { expectedRevision: preview.entry.activeRevision };
      const result = await restoreRecoverySnapshot(preview.entry.id, options);
      setFeedback({ error: false, message: `Restored ${result.project.projectSession.projectName} at revision ${result.project.revision}. Load the project separately to use it in the workspace.` });
      setPending(false);
      setPreview(null);
      const latest = await listRecoverySnapshots();
      setHistory(latest.entries);
      setLoaded(true);
      if (typeof onRecoveryChanged === "function") await onRecoveryChanged();
    } catch (error) {
      setPending(false); // Never automatically retry stale restores.
      setPreview(null);
      if (error.status === 412 || error.status === 428) {
        setFeedback({ error: true, message: "Recovery conflict: the project changed. Restoration was cancelled. Refresh history and review the latest version." });
      } else {
        setFeedback({ error: true, message: error.message || "Restore failed" });
      }
    } finally {
      setBusy("");
    }
  }

  async function downloadBackup() {
    if (!enabled) return;
    setBusy("backup");
    setFeedback(null);
    try {
      const result = await exportLocalApiBackup();
      if (result.backup?.type !== "soulframe-local-api-metadata-backup") {
        throw new Error("Unsupported local metadata backup");
      }
      const blob = new Blob([JSON.stringify(result.backup, null, 2) + "\n"], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      try {
        const link = document.createElement("a");
        link.href = url;
        link.download = `soulframe-local-api-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } finally {
        URL.revokeObjectURL(url);
      }
      setFeedback({ error: false, message: "Metadata backup prepared for download. Keep it somewhere private: it contains project and client details." });
    } catch (error) {
      setFeedback({ error: true, message: error.message || "Backup download failed" });
    } finally {
      setBusy("");
    }
  }

  async function previewBackupFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!enabled || !file) return;
    setImportPreview(null);
    setImportAcknowledged(false);
    setFeedback(null);
    setBusy("import-preview");
    try {
      if (file.size > 3 * 1024 * 1024) throw new Error("Backup is too large (maximum 3 MB)");
      const backup = JSON.parse(await file.text());
      const result = await previewLocalApiBackup(backup);
      if (!result.preview?.token) throw new Error("Invalid import preview response");
      setImportPreview(result.preview);
    } catch (error) {
      setFeedback({ error: true, message: error.message || "Could not preview backup" });
    } finally {
      setBusy("");
    }
  }

  async function confirmImport() {
    if (!enabled || !importPreview?.token || !importAcknowledged) return;
    const token = importPreview.token;
    setBusy("import");
    setFeedback(null);
    setImportPreview(null); // Never retry a committed or conflicted preview automatically.
    setImportAcknowledged(false);
    try {
      const result = await confirmLocalApiBackupImport(token);
      const summary = result.summary;
      setFeedback({ error: false, message: `Imported ${summary.importedProjects} new projects and ${summary.importedSnapshots} recovery snapshots. ${summary.skippedProjects} existing projects were kept unchanged.` });
      if (typeof onRecoveryChanged === "function") await onRecoveryChanged();
      const historyResult = await listRecoverySnapshots();
      setHistory(historyResult.entries);
      setLoaded(true);
    } catch (error) {
      setFeedback({ error: true, message: error.status === 412 || error.status === 410
        ? "Backup preview is stale or expired. No changes made. Refresh the project list and preview again."
        : error.message || "Import failed" });
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="mt-6 rounded-3xl border border-zinc-800 bg-black p-5" aria-label="Local project recovery and backup">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">V6.0.6 - Recovery and backup import</p>
      <h3 className="mt-2 text-xl font-semibold text-zinc-100">Recover earlier project metadata</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Earlier project versions are saved locally when you overwrite, delete or restore an API project.
        Review a snapshot before restoring it. Restores never happen automatically and cannot overwrite a newer revision silently.
      </p>
      <p className="mt-2 text-xs leading-6 text-zinc-500">
        Recovery keeps up to 10 prior versions per project. Changes from before V6.0.5 were not captured retroactively.
        The manual JSON backup contains project names, client names and notes, but never audio. Use Preview backup import to inspect a backup before manually merging it. Existing API projects are never overwritten.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={button} disabled={!enabled || Boolean(busy)} onClick={refreshHistory}>Refresh recovery history</button>
        <button type="button" className={primary} disabled={!enabled || Boolean(busy)} onClick={downloadBackup}>Download metadata backup</button>
      </div>
      <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-4" aria-label="Import metadata backup">
        <h4 className="font-semibold text-zinc-100">Import metadata backup</h4>
        <p className="mt-2 text-xs leading-6 text-zinc-400">Choose a SoulFrame local API JSON backup. Preview first; the import will add missing project IDs and eligible history only. Existing projects are never replaced. The preview expires after five minutes and becomes invalid if the database changes. No audio is imported.</p>
        <label className="mt-4 block text-sm font-semibold text-zinc-200" htmlFor="soulframe-backup-import">Preview backup import</label>
        <input id="soulframe-backup-import" type="file" accept=".json,application/json" disabled={!enabled || Boolean(busy)} onChange={previewBackupFile} className="mt-2 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-zinc-100 disabled:opacity-40" />
        {importPreview && (
          <div role="group" aria-label="Confirm backup import" className="mt-4 rounded-2xl border border-amber-900 bg-amber-950/20 p-4">
            <p className="font-semibold text-zinc-100">Review import plan</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{importPreview.newProjects} new projects, {importPreview.recoverableSnapshots} recovery snapshots to import. {importPreview.skippedProjects} existing projects and {importPreview.skippedSnapshots} snapshots will be skipped.</p>
            <p className="mt-1 text-xs text-zinc-400">Preview expires: {formatDate(importPreview.expiresAt)}. Existing server records cannot be overwritten by this operation.</p>
            <label className="mt-4 flex items-start gap-2 text-sm text-zinc-300">
              <input type="checkbox" checked={importAcknowledged} onChange={(event) => setImportAcknowledged(event.target.checked)} className="mt-1" />
              I have reviewed the import plan and understand this adds metadata only.
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" className={primary} disabled={Boolean(busy) || !importAcknowledged} onClick={confirmImport}>Confirm backup import</button>
              <button type="button" className={button} disabled={Boolean(busy)} onClick={() => { setImportPreview(null); setImportAcknowledged(false); }}>Cancel import</button>
            </div>
          </div>
        )}
      </div>
      {!enabled && <p className="mt-3 text-sm text-zinc-500">Start the V6.0.6 local API to use recovery and backup.</p>}
      {feedback && <p role="status" aria-live="polite" className={`mt-4 rounded-2xl border p-4 text-sm ${feedback.error ? "border-red-900 bg-red-950/30 text-red-200" : "border-zinc-700 bg-zinc-950 text-zinc-200"}`}>{feedback.message}</p>}
      {loaded && (
        <div className="mt-4 space-y-2">
          {history.length === 0 ? <p className="text-sm text-zinc-500">No recovery snapshots yet. Overwrite or delete a test project to create one.</p> :
            history.map((entry) => (
              <div key={entry.id} className="flex flex-col justify-between gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 sm:flex-row sm:items-center">
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{entry.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">Revision {entry.revision} - {entry.reason} - {formatDate(entry.capturedAt)} - {entry.activeRevision === null ? "Deleted" : `Active at revision ${entry.activeRevision}`}</p>
                </div>
                <button type="button" className={button} disabled={Boolean(busy)} onClick={() => previewSnapshot(entry)}>Review version</button>
              </div>
            ))}
        </div>
      )}
      {preview && (
        <div className="mt-5 rounded-2xl border border-amber-900 bg-amber-950/20 p-4" role="group" aria-label="Review recovery snapshot">
          <p className="font-semibold text-zinc-100">Restore preview: {preview.snapshot.record.projectSession.projectName}</p>
          <p className="mt-2 text-sm text-zinc-300">Client: {preview.snapshot.record.projectSession.clientName || "Not specified"}</p>
          <p className="mt-1 text-sm text-zinc-300">Saved review mode: {preview.snapshot.record.reviewMode}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Restoring will {preview.entry.activeRevision === null ? "recreate the deleted API project" : "replace the currently saved API metadata"} with this snapshot.
            The current project in your browser will not be replaced. The server checks the latest revision before changing anything.
          </p>
          {!pending ? (
            <div className="mt-4 flex gap-3">
              <button type="button" className={primary} disabled={Boolean(busy)} onClick={() => setPending(true)}>Review restore confirmation</button>
              <button type="button" className={button} disabled={Boolean(busy)} onClick={() => setPreview(null)}>Cancel</button>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-semibold text-amber-200">Confirm restoring this earlier version? This changes saved API metadata.</p>
              <div className="flex gap-3">
                <button type="button" className={primary} disabled={Boolean(busy)} onClick={confirmRestore}>Confirm restore</button>
                <button type="button" className={button} disabled={Boolean(busy)} onClick={() => setPending(false)}>Keep current version</button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
