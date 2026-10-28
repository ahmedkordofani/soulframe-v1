// SoulFrame V6.1.4 Step 3.20 — deliberate, owner-scoped Cloud Restore interface.
// Deleted records are requested only on click. NO cloud deletion is enabled here.
import { useEffect, useRef, useState } from 'react';
import { readVerifiedIdentity } from './hostedIdentity.js';
import { listDeletedCloudProjects, restoreCloudProject } from './cloudRecovery.js';
import { buildCloudRestoreIntent } from './cloudRestoreFlow.js';

const button = 'rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40';
const primary = 'rounded-xl border border-zinc-600 bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40';

function readableDate(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
}

export function CloudRecoveryPanel({ client, identity, onRestored }) {
  const [deleted, setDeleted] = useState([]);
  const [hasListed, setHasListed] = useState(false);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const mounted = useRef(false);
  const ready = Boolean(client && identity?.id);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function verifyAccount() {
    // The identity prop is just display state; independently verify the SDK user.
    const verified = await readVerifiedIdentity(client);
    if (verified.id !== identity.id) throw new Error('Account changed');
  }

  async function refreshDeleted() {
    if (!ready || busy || pending) return;
    setBusy(true); setFeedback(null);
    try {
      await verifyAccount();
      const projects = await listDeletedCloudProjects(client);
      await verifyAccount();
      if (!mounted.current) return;
      setDeleted(projects);
      setHasListed(true);
    } catch {
      if (!mounted.current) return;
      setDeleted([]);
      setHasListed(false);
      setFeedback({ kind: 'error', text: 'Unable to list deleted cloud projects. Check your account and connection.' });
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  function requestRestore(record) {
    if (!ready || busy || pending) return;
    try {
      // Capture EXACT revision from the last explicit deleted-project listing.
      setPending(buildCloudRestoreIntent(record));
      setFeedback(null);
    } catch {
      setDeleted([]);
      setHasListed(false);
      setFeedback({ kind: 'error', text: 'The deleted-project list needs to be refreshed.' });
    }
  }

  async function confirmRestore() {
    if (!ready || busy || pending?.kind !== 'restore') return;
    const intent = pending;
    setBusy(true); setFeedback(null);
    try {
      await verifyAccount();
      const outcome = await restoreCloudProject(client, intent.id, intent.expectedRevision);
      if (!mounted.current) return;
      setPending(null);
      if (outcome.status === 'ok') {
        setDeleted(current => current.filter(record => record.id !== intent.id));
        setFeedback({ kind: 'success', text: `Restored “${intent.name}” at Revision ${outcome.revision}. Refresh cloud projects above to load it. Audio is not restored.` });
        // Invalidate the ordinary cloud list; the user must explicitly refresh it.
        if (typeof onRestored === 'function') onRestored();
      } else {
        // On conflicts and not-found, never retry or leave a stale tombstone actionable.
        setDeleted([]);
        setHasListed(false);
        setFeedback({ kind: 'error', text: outcome.status === 'conflict'
          ? 'Restore cancelled: this deleted project has changed. Refresh deleted projects before attempting another restore.'
          : 'Restore cancelled: this deleted project is no longer accessible. Refresh deleted projects.' });
      }
    } catch {
      if (!mounted.current) return;
      setPending(null);
      setDeleted([]);
      setHasListed(false);
      setFeedback({ kind: 'error', text: 'Cloud Restore could not complete. Refresh deleted projects before trying again. No audio or local projects were changed.' });
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  return (
    <section className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4" aria-label="Deleted cloud projects">
      <h5 className="text-sm font-semibold text-zinc-100">Deleted cloud projects (development beta)</h5>
      <p className="mt-2 text-xs leading-5 text-zinc-400">
        List deleted metadata only when you choose Refresh deleted projects. Restore requires confirmation and the listed revision.
        It makes the cloud project active again, without restoring audio. No permanent deletion or automatic restore is available.
      </p>
      <div className="mt-3">
        <button type="button" className={button} disabled={!ready || busy || Boolean(pending)} onClick={refreshDeleted}>Refresh deleted projects</button>
      </div>

      {pending?.kind === 'restore' && (
        <div role="group" aria-label="Confirm cloud restore" className="mt-4 rounded-xl border border-amber-800 bg-amber-950/20 p-4">
          <p className="text-sm font-semibold text-zinc-100">Confirm cloud restore</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            {`Restore deleted cloud project “${pending.name}” at Revision ${pending.expectedRevision}? This returns its metadata to the active cloud list, advances the revision, and does not restore audio. Only proceed if you recognise this project.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={primary} disabled={busy || !ready} onClick={confirmRestore}>Confirm cloud restore</button>
            <button type="button" className={button} disabled={busy} onClick={() => setPending(null)}>Cancel</button>
          </div>
        </div>
      )}

      {feedback && (
        <p role="status" aria-live="polite" className={`mt-3 text-sm ${feedback.kind === 'error' ? 'text-red-300' : 'text-emerald-200'}`}>{feedback.text}</p>
      )}

      <div className="mt-4 space-y-2">
        {!hasListed ? (
          <p className="text-xs text-zinc-500">Choose Refresh deleted projects to view deleted records. Nothing is fetched automatically.</p>
        ) : deleted.length === 0 ? (
          <p className="text-xs text-zinc-500">No deleted cloud projects found for this signed-in account.</p>
        ) : deleted.map(record => (
          <div key={record.id} className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-800 bg-black/50 p-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-zinc-100">{record.project_name}</p>
              <p className="mt-1 text-xs text-zinc-500">Deleted {readableDate(record.deleted_at)} · Revision {record.revision}</p>
            </div>
            <button type="button" className={button} disabled={!ready || busy || Boolean(pending)} onClick={() => requestRestore(record)}>Restore</button>
          </div>
        ))}
      </div>
    </section>
  );
}
