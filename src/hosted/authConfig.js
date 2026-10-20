// V6.1.1: optional identity configuration. Never accept browser-side secret keys.
// The browser may use a PUBLIC publishable key, not sb_secret_ / service-role credentials.
export function resolveHostedIdentityConfig(env = {}) {
  const rawUrl = typeof env.VITE_SUPABASE_URL === 'string' ? env.VITE_SUPABASE_URL.trim() : '';
  const key = typeof env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string' ? env.VITE_SUPABASE_PUBLISHABLE_KEY.trim() : '';
  if (!rawUrl && !key) return { enabled: false, reason: 'not-configured' };
  if (!rawUrl || !key || !/^sb_publishable_[A-Za-z0-9_-]{8,}$/.test(key)) {
    return { enabled: false, reason: 'invalid-config' };
  }
  try {
    const url = new URL(rawUrl);
    const localHost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (!(url.protocol === 'https:' || (url.protocol === 'http:' && localHost)) ||
        url.username || url.password || url.search || url.hash || url.pathname !== '/' ||
        (url.port && (!Number.isSafeInteger(Number(url.port)) || Number(url.port) < 1 || Number(url.port) > 65535))) {
      return { enabled: false, reason: 'invalid-config' };
    }
    return { enabled: true, url: url.origin, publishableKey: key };
  } catch {
    return { enabled: false, reason: 'invalid-config' };
  }
}
