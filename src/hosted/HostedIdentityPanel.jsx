import { useEffect, useMemo, useState } from 'react';
import { resolveHostedIdentityConfig } from './authConfig';
import { requestIdentityCode, verifyIdentityCode, readVerifiedIdentity, signOutIdentity } from './hostedIdentity';

const field = 'w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-400';
const button = 'rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-semibold text-zinc-100 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40';

export function HostedIdentityPanel() {
  const config = useMemo(() => resolveHostedIdentityConfig(import.meta.env), []);
  const [client, setClient] = useState(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [identity, setIdentity] = useState(null);
  const [phase, setPhase] = useState(config.enabled ? 'loading' : 'disabled');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!config.enabled) return;
    let active = true;
    import('./supabaseIdentityClient.js').then(async ({ getSupabaseIdentityClient }) => {
      const sdk = getSupabaseIdentityClient(config);
      if (!active) return;
      setClient(sdk);
      try {
        const user = await readVerifiedIdentity(sdk);
        if (active) { setIdentity(user); setPhase('signed-in'); }
      } catch {
        if (active) setPhase('signed-out');
      }
    }).catch(() => {
      if (active) { setMessage('Unable to load the hosted identity provider. Check the installed SDK.'); setPhase('error'); }
    });
    return () => { active = false; };
  }, [config]);

  async function sendCode(event) {
    event.preventDefault();
    if (!client || busy) return;
    setBusy(true); setMessage('');
    try {
      const address = await requestIdentityCode(client, email);
      setSentTo(address); setCode(''); setPhase('code-sent');
      setMessage('If this email belongs to an enabled test account, check the inbox for a one-time code.');
    } catch (err) { setMessage(err.message || 'Unable to send a code'); }
    finally { setBusy(false); }
  }

  async function verifyCode(event) {
    event.preventDefault();
    if (!client || busy) return;
    setBusy(true); setMessage('');
    try {
      const user = await verifyIdentityCode(client, sentTo, code);
      setIdentity(user); setPhase('signed-in'); setCode('');
      setMessage('Identity verified. Cloud project syncing is not enabled.');
    } catch (err) { setMessage(err.message || 'Unable to verify the code'); }
    finally { setBusy(false); }
  }

  async function signOut() {
    if (!client || busy) return;
    setBusy(true); setMessage('');
    try {
      await signOutIdentity(client);
      setIdentity(null); setSentTo(''); setCode(''); setPhase('signed-out');
      setMessage('Signed out of hosted identity. Browser and local projects were not affected.');
    } catch (err) { setMessage(err.message || 'Unable to sign out'); }
    finally { setBusy(false); }
  }

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/60 p-5 text-zinc-200" aria-label="Hosted identity (optional)">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-white">Hosted identity (optional beta)</h3>
        <span className="text-xs font-semibold text-zinc-500">V6.1.1</span>
      </div>
      <p className="mt-2 text-sm text-zinc-400">This is email-code authentication only. No projects, reports or audio are uploaded to Supabase.</p>
      {phase === 'disabled' && <p className="mt-3 text-sm text-zinc-400">{config.reason === 'not-configured' ? 'Not configured. Browser and local API projects continue to work normally.' : 'Invalid Supabase environment configuration. Check the documented publishable key and URL.'}</p>}
      {phase === 'loading' && <p className="mt-3 text-sm text-zinc-400">Checking hosted identity provider...</p>}
      {phase === 'error' && <p className="mt-3 text-sm text-amber-300">Hosted sign-in unavailable. Local projects still work.</p>}
      {phase === 'signed-in' && identity && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm">Verified as <span className="font-semibold text-white">{identity.email || 'an account'}</span></p>
          <button type="button" className={button} disabled={busy} onClick={signOut}>Sign out</button>
        </div>
      )}
      {phase === 'signed-out' && (
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={sendCode}>
          <label className="flex min-w-[200px] flex-1 flex-col gap-2 text-xs font-semibold text-zinc-300">
            Test account email
            <input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className={field} placeholder="you@example.com" disabled={busy}/>
          </label>
          <button className={button} disabled={busy}>Send sign-in code</button>
        </form>
      )}
      {phase === 'code-sent' && (
        <form className="mt-4 flex flex-wrap items-end gap-3" onSubmit={verifyCode}>
          <label className="flex min-w-[200px] flex-1 flex-col gap-2 text-xs font-semibold text-zinc-300">
            Code sent to {sentTo}
            <input inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={event => setCode(event.target.value)} className={field} placeholder="6-digit email code" disabled={busy}/>
          </label>
          <button className={button} disabled={busy}>Verify code</button>
          <button type="button" className={button} disabled={busy} onClick={() => { setPhase('signed-out'); setCode(''); setMessage(''); }}>Change email</button>
        </form>
      )}
      {message && <p role="status" className="mt-3 text-sm text-amber-200">{message}</p>}
      <p className="mt-4 text-xs text-zinc-500">Identity sessions are memory-only and can require signing in again after a refresh. The public Vercel deployment stays browser-only until you explicitly add valid Supabase configuration.</p>
    </section>
  );
}
