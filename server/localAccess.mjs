// V6.0.8: process-scoped local owner token. Not hosted user authentication.
import { randomBytes, timingSafeEqual } from 'node:crypto';

// Tokens are generated for every API start, printed in the local terminal, never stored in the project DB.
export function generateLocalAccessToken() {
  return randomBytes(32).toString('base64url');
}

export function isValidLocalAccessToken(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value);
}

export function isLocalRequestAuthorized(request, token) {
  if (!isValidLocalAccessToken(token)) return false;
  const header = request.headers?.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return false;
  const candidate = header.slice(7);
  if (!isValidLocalAccessToken(candidate)) return false;
  // Both values are fixed-size ASCII base64url strings.
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(token));
}
