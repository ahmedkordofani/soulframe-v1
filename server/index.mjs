// SoulFrame V6.0.1 - local API foundation.
// Zero third-party dependencies. No incoming audio, report, or project data.
import { createServer } from "node:http";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const API_VERSION = "v6.0.1";
export const API_CAPABILITIES = Object.freeze({
  healthCheck: true,
  audioUpload: false,
  projectPersistence: false,
  hostedReports: false,
  authentication: false,
});

function writeJson(response, statusCode, payload, requestMethod = "GET", extraHeaders = {}) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...extraHeaders,
  });
  response.end(requestMethod === "HEAD" ? undefined : body);
}

export function handleApiRequest(request, response) {
  let url;
  try {
    url = new URL(request.url || "/", "http://127.0.0.1");
  } catch {
    writeJson(response, 400, { ok: false, error: "Invalid request URL" }, request.method);
    return;
  }

  const method = request.method || "GET";
  if (url.pathname === "/api/health") {
    if (method !== "GET" && method !== "HEAD") {
      writeJson(response, 405, { ok: false, error: "Method not allowed" }, method, { Allow: "GET, HEAD" });
      return;
    }
    writeJson(response, 200, {
      ok: true,
      service: "soulframe-api",
      version: API_VERSION,
      mode: "local-development",
      capabilities: API_CAPABILITIES,
    }, method);
    return;
  }

  writeJson(response, 404, { ok: false, error: "Endpoint not found" }, method);
}

export function createSoulFrameApiServer() {
  return createServer(handleApiRequest);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const host = "127.0.0.1"; // Never expose the local development API to the network.
  const requestedPort = Number(process.env.SOULFRAME_API_PORT || 8787);
  if (!Number.isSafeInteger(requestedPort) || requestedPort < 1 || requestedPort > 65535) {
    console.error("SOULFRAME_API_PORT must be an integer between 1 and 65535.");
    process.exitCode = 1;
  } else {
    const server = createSoulFrameApiServer();
    server.on("error", (error) => {
      console.error("Could not start SoulFrame API:", error.message);
      process.exitCode = 1;
    });
    server.listen(requestedPort, host, () => {
      console.log(`SoulFrame local API: http://${host}:${requestedPort}/api/health`);
      console.log("Health check only. No audio or project data leaves the browser.");
    });
  }
}
