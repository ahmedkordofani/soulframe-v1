// Only imported when valid browser configuration exists. Supabase Auth SDK owns token handling.
// Install the official SDK using npm install @supabase/supabase-js before building V6.1.1.
import { createClient } from '@supabase/supabase-js';
let cached;
let previousUrl;

export function getSupabaseIdentityClient(config) {
  if (!config?.enabled) throw new Error('Hosted identity is not configured');
  if (cached && previousUrl === config.url) return cached;
  // OTP code verification, not magic links: no callback URL or PKCE redirect needed.
  cached = createClient(config.url, config.publishableKey, {
    auth: {
      flowType: 'implicit',
      persistSession: false,         // Tokens exist in memory only, not localStorage.
      detectSessionInUrl: false,      // Don't parse URL tokens into a session.
      autoRefreshToken: true,
    },
  });
  previousUrl = config.url;
  return cached;
}
