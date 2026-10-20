// V6.0.8 - In-memory only; never persist this development access token.
let token = '';

export function getLocalAccessToken() { return token; }
export function setLocalAccessToken(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value.trim())) {
    throw new TypeError('Enter the complete local API access token from your API terminal.');
  }
  token = value.trim();
}
export function clearLocalAccessToken() { token = ''; }
