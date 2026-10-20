import test from "node:test";
import assert from "node:assert/strict";
import { createSoulFrameApiServer } from "../server/index.mjs";
import { checkSoulFrameApi, isSoulFrameApiHealth } from "../src/api/apiClient.js";

async function withApi(callback) {
  const server = createSoulFrameApiServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  try {
    const port = server.address().port;
    return await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

test("real local health endpoint responds with honest capabilities", async () => {
  await withApi(async (origin) => {
    const response = await fetch(`${origin}/api/health`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type"), /application\/json/);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const health = await response.json();
    assert.equal(isSoulFrameApiHealth(health), true);
    assert.equal(health.version, "v6.0.5");
    assert.equal(health.capabilities.audioUpload, false);
    assert.equal(health.capabilities.projectPersistence, true);
    assert.equal(health.capabilities.hostedReports, false);
    assert.equal(health.capabilities.authentication, false);
  });
});

test("browser client recognizes only a real SoulFrame health response", async () => {
  await withApi(async (origin) => {
    const api = await checkSoulFrameApi((path, options) => fetch(`${origin}${path}`, options));
    assert.equal(api.status, "connected");
    assert.equal(api.version, "v6.0.5");
  });
});

test("a production HTML fallback cannot masquerade as a backend", async () => {
  assert.equal(isSoulFrameApiHealth({ ok: true, service: "fake" }), false);
  const result = await checkSoulFrameApi(async () => ({ ok: true, json: async () => ({ ok: true, service: "fake" }) }));
  assert.equal(result.status, "offline");
});

test("frontend fails safely when the API is unavailable", async () => {
  const result = await checkSoulFrameApi(async () => { throw new TypeError("connection refused"); });
  assert.deepEqual(result, { status: "offline" });
});

test("unknown endpoints return JSON 404 without leaking files", async () => {
  await withApi(async (origin) => {
    const response = await fetch(`${origin}/api/not-an-endpoint`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).ok, false);
  });
});

test("the health endpoint is read-only", async () => {
  await withApi(async (origin) => {
    const response = await fetch(`${origin}/api/health`, { method: "POST", body: "anything" });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "GET, HEAD");
  });
});

test("health calls send no project or audio payload", async () => {
  const calls = [];
  await checkSoulFrameApi(async (path, options) => {
    calls.push({ path, options });
    return { ok: true, json: async () => ({ ok: true, service: "soulframe-api", version: "v6.0.5", mode: "local-development", capabilities: {healthCheck:true} }) };
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, "/api/health");
  assert.equal(calls[0].options.method, "GET");
  assert.equal(calls[0].options.body, undefined);
});
