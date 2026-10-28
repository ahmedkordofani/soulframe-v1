// SoulFrame V6.1.4 Step 3.27 — explicit revision-safe cloud metadata actions.
// No direct table writes, hard deletes, audio uploads, local API coupling or automatic sync.
import { useEffect, useRef, useState } from 'react';
import { saveCloudProject, listCloudProjects, loadCloudProject } from './cloudProjects';
import { updateCloudProject, softDeleteCloudProject } from './cloudMutations';
import { readVerifiedIdentity } from './hostedIdentity';
import { buildCloudDeleteIntent } from './cloudDeleteFlow';
import { buildCloudUpdateIntent } from './cloudEditFlow';
import { CloudRecoveryPanel } from './CloudRecoveryPanel';

const button = 'rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40';
const primary = 'rounded-xl border border-zinc-600 bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-40';

function readableDate(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not available' : date.toLocaleString();
}

export function CloudProjectManager({ client, identity, projectSession, reviewMode, selectedPreset, onLoadProject }) {
  const [records, setRecords] = useState([]);
  const [hasListed, setHasListed] = useState(false);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [deleteAcknowledgement, setDeleteAcknowledgement] = useState('');
  const [recoveryEpoch, setRecoveryEpoch] = useState(0);
  const mounted = useRef(false);

  // Prevent a delayed cloud load from replacing the workspace after sign-out.
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const ready = Boolean(client && identity?.id && typeof onLoadProject === 'function');

  async function refreshCloudProjects() {
    if (!ready || busy) return;
    setBusy('refresh');
    setFeedback(null);
    try {
      const projects = await listCloudProjects(client);
      if (!mounted.current) return;
      setRecords(projects);
      setHasListed(true);
    } catch {
      if (!mounted.current) return;
      // Never keep displaying old account data when a new verification fails.
      setRecords([]);
      setHasListed(false);
      setFeedback({ kind: 'error', text: 'Unable to list cloud projects. Check your connection and sign-in.' });
    } finally {
      if (mounted.current) setBusy('');
    }
  }

  function requestSave() {
    if (!ready || busy) return;
    // Freeze only metadata at the moment Save is requested, not an audio object.
    setPending({
      kind: 'save',
      snapshot: {
        projectSession: { ...projectSession },
        reviewMode,
        selectedPreset,
      },
    });
    setFeedback(null);
  }

  async function verifyAccount() {
    // The displayed identity alone does not authorize deletion.
    const verified = await readVerifiedIdentity(client);
    if (verified.id !== identity.id) throw new Error('Cloud account changed');
  }

  function requestDelete(record) {
    if (!ready || busy || pending || !hasListed) return;
    try {
      // Snapshot ONLY the owner-listed ID, revision, and name. No audio or notes.
      setPending(buildCloudDeleteIntent(record));
      setDeleteAcknowledgement('');
      setFeedback(null);
    } catch {
      setPending(null);
      setRecords([]);
      setHasListed(false);
      setFeedback({ kind: 'error', text: 'Delete unavailable: refresh cloud projects before attempting deletion.' });
    }
  }

  function requestUpdate(record) {
    if (!ready || busy || pending) return;
    try {
      // Use the cloud list's revision, not a locally invented/current revision.
      setPending(buildCloudUpdateIntent(record, projectSession, reviewMode, selectedPreset));
      setFeedback(null);
    } catch {
      setFeedback({ kind: 'error', text: 'Unable to prepare cloud update. Check the project fields and refresh your cloud list.' });
    }
  }

  async function confirmAction() {
    if (!ready || busy || !pending) return;
    const action = pending;
    setBusy(action.kind);
    setFeedback(null);
    try {
      if (action.kind === 'save') {
        // A new cloud row; never overwrite an existing cloud project.
        const saved = await saveCloudProject(client, action.snapshot);
        if (!mounted.current) return;
        setRecords(current => [saved, ...current.filter(project => project.id !== saved.id)].slice(0, 24));
        setHasListed(true);
        setFeedback({ kind: 'success', text: `Saved “${saved.projectSession.projectName}” as a new cloud project.` });
      } else if (action.kind === 'load') {
        const loaded = await loadCloudProject(client, action.id);
        if (!mounted.current) return;
        onLoadProject(loaded); // App's shared handler clears attached audio and analysis.
        setFeedback({ kind: 'success', text: `Loaded “${loaded.projectSession.projectName}”. Attach audio again if needed.` });
      } else if (action.kind === 'delete') {
        // A second deliberate step, not just opening the confirmation panel.
        if (deleteAcknowledgement !== 'DELETE') return;
        await verifyAccount();
        const outcome = await softDeleteCloudProject(client, action.id, action.expectedRevision);
        if (!mounted.current) return;
        if (outcome.status === 'ok') {
          setRecords(current => current.filter(record => record.id !== action.id));
          // A previously fetched deleted list is now stale. Do not refetch automatically.
          setRecoveryEpoch(current => current + 1);
          setFeedback({ kind: 'success', text: `Moved “${action.name}” to Deleted cloud projects at Revision ${outcome.revision}. Choose Refresh deleted projects below to restore its metadata. Browser and local API projects were not changed.` });
        } else {
          setRecords([]);
          setHasListed(false);
          setFeedback({ kind: 'error', text: outcome.status === 'conflict'
            ? 'Delete cancelled: this cloud project changed since the list was refreshed. Refresh cloud projects before attempting another delete.'
            : 'Delete cancelled: this cloud project is no longer accessible. Refresh cloud projects before attempting another delete.' });
        }
        setDeleteAcknowledgement('');
      } else if (action.kind === 'update') {
        // No automatic retries or silent last-write-wins. The database checks the listed revision atomically.
        const outcome = await updateCloudProject(client, action.id, action.expectedRevision, action.snapshot);
        if (!mounted.current) return;
        if (outcome.status === 'ok') {
          setRecords(current => current.map(record => record.id === action.id ? outcome.project : record));
          setFeedback({ kind: 'success', text: `Updated “${outcome.project.projectSession.projectName}” to Revision ${outcome.project.revision}. Browser and local API projects were not changed.` });
        } else {
          // Fail closed: do not leave the old revision available as though it were current.
          setRecords([]);
          setHasListed(false);
          setFeedback({ kind: 'error', text: outcome.status === 'conflict'
            ? 'Update cancelled: this cloud project changed since the list was refreshed. Refresh cloud projects before attempting another edit.'
            : 'Update cancelled: this cloud project is no longer accessible. Refresh cloud projects before attempting another edit.' });
        }
      }
      if (mounted.current) setPending(null);
    } catch {
      if (mounted.current) {
        if (action.kind === 'update' || action.kind === 'delete') {
          // A network failure after an RPC may be ambiguous; force a fresh owner list.
          setRecords([]);
          setHasListed(false);
          setPending(null);
          if (action.kind === 'delete') {
            setDeleteAcknowledgement('');
            setFeedback({ kind: 'error', text: 'Cloud Delete could not be confirmed. Refresh cloud projects AND deleted projects before trying again. No local projects were changed.' });
          } else {
            setFeedback({ kind: 'error', text: 'Cloud action could not complete. Check sign-in, project metadata and connection. No local project was deleted.' });
          }
        } else {
          setFeedback({ kind: 'error', text: 'Cloud action could not complete. Check sign-in, project metadata and connection. No local project was deleted.' });
        }
      }
    } finally {
      if (mounted.current) setBusy('');
    }
  }

  const recordPending = ['load', 'update', 'delete'].includes(pending?.kind) ? records.find(project => project.id === pending.id) : null;

  return (
    <section className="mt-5 rounded-2xl border border-zinc-800 bg-black/50 p-4" aria-label="Cloud projects">
      <h4 className="text-base font-semibold text-zinc-100">Cloud projects (development beta)</h4>
      <p className="mt-2 text-xs leading-5 text-zinc-400">
        Use only synthetic project details in your disposable Supabase test project. Cloud Save sends project metadata,
        including client name and producer notes, to your authenticated account. Audio, stems and analysis remain in the browser.
        Cloud Save creates a new project. Cloud Update replaces selected metadata only after confirmation, using the listed revision. Cloud Delete soft-deletes confirmed metadata only; restore it manually from Deleted cloud projects below. No permanent deletion is provided.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={primary} disabled={!ready || Boolean(busy) || Boolean(pending)} onClick={requestSave}>Save current project to cloud</button>
        <button type="button" className={button} disabled={!ready || Boolean(busy) || Boolean(pending)} onClick={refreshCloudProjects}>Refresh cloud projects</button>
      </div>

      {pending && (
        <div className="mt-4 rounded-xl border border-amber-800 bg-amber-950/20 p-4" role="group" aria-label="Confirm cloud project action">
          <p className="text-sm font-semibold text-zinc-100">{pending.kind === 'save' ? 'Confirm cloud save' : pending.kind === 'load' ? 'Confirm cloud load' : pending.kind === 'delete' ? 'Confirm cloud delete' : 'Confirm cloud update'}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            {pending.kind === 'save'
              ? `Save “${pending.snapshot.projectSession.projectName || 'Untitled'}” as a NEW cloud record? Project fields, client name and producer notes will be sent to Supabase. No audio is uploaded.`
              : pending.kind === 'load'
                ? `Load “${recordPending?.projectSession.projectName || 'selected project'}” into the workspace? This replaces your current project fields, review mode and preset, and clears attached audio and previous analysis. Save unsaved work first.`
                : pending.kind === 'delete'
                  ? `SOFT-DELETE cloud project “${pending.name}” at Revision ${pending.expectedRevision}? This removes only its cloud metadata from the active list. To get it back, choose Refresh deleted projects below and explicitly Restore (revision will advance). Audio is never saved to cloud and cannot be recovered through Restore. Browser and local API projects are not deleted. No automatic backup or automatic recovery is performed.`
                  : `UPDATE cloud project “${pending.targetName}” at Revision ${pending.expectedRevision} with CURRENT workspace “${pending.sourceName}”? This replaces stored project metadata and notes, but does not upload audio. It does not create a backup, and a later update may be impossible to undo. Save a separate backup first if needed.`}
          </p>
          {pending.kind === 'delete' && (
            <label className="mt-3 flex max-w-xs flex-col gap-2 text-xs font-semibold text-amber-200">
              Type DELETE to confirm
              <input type="text" value={deleteAcknowledgement} autoComplete="off" spellCheck={false}
                onChange={event => setDeleteAcknowledgement(event.target.value)}
                disabled={Boolean(busy)} className="rounded-lg border border-amber-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
                aria-label="Type DELETE to confirm cloud deletion" />
            </label>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={pending.kind === 'delete' ? button : primary}
              disabled={Boolean(busy) || (pending.kind === 'delete' && deleteAcknowledgement !== 'DELETE')}
              onClick={confirmAction}>{pending.kind === 'save' ? 'Confirm cloud save' : pending.kind === 'load' ? 'Confirm cloud load' : pending.kind === 'delete' ? 'Confirm cloud delete' : 'Confirm cloud update'}</button>
            <button type="button" className={button} disabled={Boolean(busy)} onClick={() => { setPending(null); setDeleteAcknowledgement(''); }}>Cancel</button>
          </div>
        </div>
      )}

      {feedback && (
        <p role="status" aria-live="polite" className={`mt-3 text-sm ${feedback.kind === 'error' ? 'text-red-300' : 'text-emerald-200'}`}>{feedback.text}</p>
      )}

      <div className="mt-4 space-y-2">
        {!hasListed ? (
          <p className="text-xs text-zinc-500">Select Refresh cloud projects to see saved records. No project list is requested automatically.</p>
        ) : records.length === 0 ? (
          <p className="text-xs text-zinc-500">No cloud projects found for this signed-in account.</p>
        ) : records.map(record => (
          <div key={record.id} className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-800 bg-zinc-950 p-3 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-zinc-100">{record.projectSession.projectName}</p>
              <p className="mt-1 text-xs text-zinc-500">{record.reviewMode === 'compare' ? 'Before / After' : 'Draft review'} · Revision {record.revision} · {readableDate(record.updatedAt)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={button} disabled={!ready || Boolean(busy) || Boolean(pending)} onClick={() => { setFeedback(null); setPending({ kind: 'load', id: record.id }); }}>Load</button>
              <button type="button" className={button} disabled={!ready || Boolean(busy) || Boolean(pending)} onClick={() => requestUpdate(record)}>Update from workspace</button>
              <button type="button" className={button} disabled={!ready || Boolean(busy) || Boolean(pending)} onClick={() => requestDelete(record)}>Delete from cloud</button>
            </div>
          </div>
        ))}
      </div>
      <CloudRecoveryPanel
        key={recoveryEpoch}
        client={client}
        identity={identity}
        onRestored={() => {
          // Newly restored projects must not appear through a stale normal list.
          setRecords([]);
          setHasListed(false);
        }}
      />
    </section>
  );
}
