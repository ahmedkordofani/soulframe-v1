// Browser-only, read-only API handshake. Does not send project or audio data.
export function isSoulFrameApiHealth(value) {
  return Boolean(value && typeof value === "object" &&
    value.ok === true && value.service === "soulframe-api" &&
    typeof value.version === "string" && value.version.startsWith("v6.") &&
    value.mode === "local-development" &&
    value.capabilities && value.capabilities.healthCheck === true);
}

export async function checkSoulFrameApi(fetcher = globalThis.fetch, signal) {
  if (typeof fetcher !== "function") return { status: "offline" };
  try {
    const response = await fetcher("/api/health", {
      method: "GET",
      cache: "no-store",
      signal,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return { status: "offline" };
    const payload = await response.json();
    if (!isSoulFrameApiHealth(payload)) return { status: "offline" };
    return { status: "connected", version: payload.version, capabilities: payload.capabilities };
  } catch {
    return { status: "offline" };
  }
}
