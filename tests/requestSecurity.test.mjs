import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedLocalRequest, setLocalSecurityHeaders, checkDeclaredContentLength, createLocalRateLimiter } from '../server/requestSecurity.mjs';

const req = (headers = {}, remoteAddress = '127.0.0.1') => ({
  headers: { host: '127.0.0.1:8787', ...headers },
  socket: { remoteAddress },
});
test('allows loopback CLI and approved frontend Origin', () => {
  assert.equal(isAllowedLocalRequest(req()), true);
  assert.equal(isAllowedLocalRequest(req({ origin: 'http://localhost:5173', 'sec-fetch-site': 'same-origin' })), true);
});
test('blocks remote Host, network peers, and DNS rebinding-like hosts', () => {
  assert.equal(isAllowedLocalRequest(req({ host: 'attacker.example' })), false);
  assert.equal(isAllowedLocalRequest(req({}, '192.168.1.10')), false);
  assert.equal(isAllowedLocalRequest(req({ host: '127.0.0.1:99999' })), false);
});
test('blocks hostile browser Origin and Fetch Metadata', () => {
  assert.equal(isAllowedLocalRequest(req({ origin: 'https://attacker.example' })), false);
  assert.equal(isAllowedLocalRequest(req({ origin: 'null' })), false);
  assert.equal(isAllowedLocalRequest(req({ 'sec-fetch-site': 'cross-site' })), false);
});
test('custom Origin must remain a local HTTP origin', () => {
  assert.equal(isAllowedLocalRequest(req({ origin: 'http://localhost:4999' }), { allowedOrigin: 'http://localhost:4999' }), true);
  assert.equal(isAllowedLocalRequest(req({ origin: 'https://attacker.example' }), { allowedOrigin: 'https://attacker.example' }), false);
});
test('defensive headers never enable CORS', () => {
  const headers = {};
  setLocalSecurityHeaders({ setHeader: (key, value) => { headers[key.toLowerCase()] = value; } });
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.equal(headers['cache-control'], 'no-store');
  assert.equal(headers['content-security-policy'], "default-src 'none'; frame-ancestors 'none'");
  assert.equal('access-control-allow-origin' in headers, false);
});
test('announced oversize requests are rejected with 413', () => {
  assert.throws(() => checkDeclaredContentLength(req({ 'content-length': '17000' }), 16384), (e) => e.status === 413);
  assert.doesNotThrow(() => checkDeclaredContentLength(req({ 'content-length': '400' }), 16384));
});
test('invalid length metadata fails safely', () => {
  assert.throws(() => checkDeclaredContentLength(req({ 'content-length': 'not-a-number' }), 16384), (e) => e.status === 400);
});
test('rate limiter rejects floods and resets after its time window', () => {
  let now = 10;
  const limiter = createLocalRateLimiter({ clock: () => now, windowMs: 1000, maxWrites: 2, maxSensitiveReads: 1 });
  assert.equal(limiter.allow('GET', '/api/health'), true);
  assert.equal(limiter.allow('POST', '/api/projects'), true);
  assert.equal(limiter.allow('POST', '/api/projects'), true);
  assert.equal(limiter.allow('POST', '/api/projects'), false);
  assert.equal(limiter.allow('GET', '/api/backup'), true);
  assert.equal(limiter.allow('GET', '/api/backup'), false);
  now = 1100;
  assert.equal(limiter.allow('POST', '/api/projects'), true);
  assert.equal(limiter.allow('GET', '/api/backup'), true);
});
