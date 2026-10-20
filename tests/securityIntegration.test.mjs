import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoulFrameApiServer } from '../server/index.mjs';

async function withServer(callback) {
  const server = createSoulFrameApiServer({ authToken: null });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  try {
    await callback(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('API rejects a hostile Origin and includes hardened response headers', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/backup`, { headers: { Origin: 'https://attacker.example' } });
    assert.equal(res.status, 403);
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('cross-origin-resource-policy'), 'same-origin');
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(res.headers.get('access-control-allow-origin'), null);
  });
});

test('real API health advertises request hardening without claiming authentication', async () => {
  await withServer(async (base) => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.version, 'v6.0.8');
    assert.equal(json.capabilities.localSecurityHardening, true);
    assert.equal(json.capabilities.authentication, false);
    assert.equal(json.capabilities.audioUpload, false);
  });
});

test('repeated malformed writes eventually get HTTP 429 and Retry-After', async () => {
  await withServer(async (base) => {
    let limited = false;
    for (let i = 0; i < 184; i++) {
      const res = await fetch(`${base}/api/not-a-route`, { method: 'POST' });
      if (res.status === 429) {
        assert.equal(res.headers.get('retry-after'), '60');
        limited = true;
        break;
      }
    }
    assert.equal(limited, true);
  });
});
