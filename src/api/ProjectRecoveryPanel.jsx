import { useState } from "react";
import {
  listRecoverySnapshots,
  readRecoverySnapshot,
  restoreRecoverySnapshot,
  exportLocalApiBackup,
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

  return (
    <section className="mt-6 rounded-3xl border border-zinc-800 bg-black p-5" aria-label="Local project recovery and backup">
      <p className="text-xs uppercase tracking-[0.25em] text-zinc-500">V6.0.5 - Local recovery and backup</p>
      <h3 className="mt-2 text-xl font-semibold text-zinc-100">Recover earlier project metadata</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Earlier project versions are saved locally when you overwrite, delete or restore an API project.
        Review a snapshot before restoring it. Restores never happen automatically and cannot overwrite a newer revision silently.
      </p>
      <p className="mt-2 text-xs leading-6 text-zinc-500">
        Recovery keeps up to 10 prior versions per project. Changes from before V6.0.5 were not captured retroactively.
        The manual JSON backup contains project names, client names and notes, but never audio. It is an export, not a cloud backup or automatic import service.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={button} disabled={!enabled || Boolean(busy)} onClick={refreshHistory}>Refresh recovery history</button>
        <button type="button" className={primary} disabled={!enabled || Boolean(busy)} onClick={downloadBackup}>Download metadata backup</button>
      </div>
      {!enabled && <p className="mt-3 text-sm text-zinc-500">Start the V6.0.5 local API to use recovery and backup.</p>}
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
