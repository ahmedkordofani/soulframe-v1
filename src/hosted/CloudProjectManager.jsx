// SoulFrame V6.1.3 - opt-in cloud metadata controls.
// The verified Supabase client comes from HostedIdentityPanel; no local API tokens,
// audio files, automatic syncing, UPDATE, DELETE or UPSERT paths exist here.
import { useEffect, useRef, useState } from 'react';
import { saveCloudProject, listCloudProjects, loadCloudProject } from './cloudProjects';

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
      }
      if (mounted.current) setPending(null);
    } catch {
      if (mounted.current) setFeedback({ kind: 'error', text: 'Cloud action could not complete. Check sign-in, project metadata and connection. No local project was deleted.' });
    } finally {
      if (mounted.current) setBusy('');
    }
  }

  const recordPending = pending?.kind === 'load' ? records.find(project => project.id === pending.id) : null;

  return (
    <section className="mt-5 rounded-2xl border border-zinc-800 bg-black/50 p-4" aria-label="Cloud projects">
      <h4 className="text-base font-semibold text-zinc-100">Cloud projects (development beta)</h4>
      <p className="mt-2 text-xs leading-5 text-zinc-400">
        Use only synthetic project details in your disposable Supabase test project. Cloud Save sends project metadata,
        including client name and producer notes, to your authenticated account. Audio, stems and analysis remain in the browser.
        Cloud saving creates a new project; editing and deleting cloud projects are disabled until V6.1.4.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className={primary} disabled={!ready || Boolean(busy) || Boolean(pending)} onClick={requestSave}>Save current project to cloud</button>
        <button type="button" className={button} disabled={!ready || Boolean(busy) || Boolean(pending)} onClick={refreshCloudProjects}>Refresh cloud projects</button>
      </div>

      {pending && (
        <div className="mt-4 rounded-xl border border-amber-800 bg-amber-950/20 p-4" role="group" aria-label="Confirm cloud project action">
          <p className="text-sm font-semibold text-zinc-100">{pending.kind === 'save' ? 'Confirm cloud save' : 'Confirm cloud load'}</p>
          <p className="mt-2 text-sm leading-6 text-zinc-300">
            {pending.kind === 'save'
              ? `Save “${pending.snapshot.projectSession.projectName || 'Untitled'}” as a NEW cloud record? Project fields, client name and producer notes will be sent to Supabase. No audio is uploaded.`
              : `Load “${recordPending?.projectSession.projectName || 'selected project'}” into the workspace? This replaces your current project fields, review mode and preset, and clears attached audio and previous analysis. Save unsaved work first.`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className={primary} disabled={Boolean(busy)} onClick={confirmAction}>{pending.kind === 'save' ? 'Confirm cloud save' : 'Confirm cloud load'}</button>
            <button type="button" className={button} disabled={Boolean(busy)} onClick={() => setPending(null)}>Cancel</button>
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
            <button type="button" className={button} disabled={!ready || Boolean(busy) || Boolean(pending)} onClick={() => { setFeedback(null); setPending({ kind: 'load', id: record.id }); }}>Load</button>
          </div>
        ))}
      </div>
    </section>
  );
}
