import { useEffect, useState } from "react";
import { checkSoulFrameApi } from "./apiClient";

export function BackendStatus() {
  const [api, setApi] = useState({ status: "checking" });

  useEffect(() => {
    const controller = new AbortController();
    checkSoulFrameApi(fetch, controller.signal).then((result) => {
      if (!controller.signal.aborted) setApi(result);
    });
    return () => controller.abort();
  }, []);

  const connected = api.status === "connected";
  const label = api.status === "checking"
    ? "Checking local API"
    : connected
      ? `Local API connected (${api.version})`
      : "Browser-only mode";

  return (
    <div role="status" aria-live="polite" className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
      <span className={`inline-block h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-zinc-600"}`} aria-hidden="true" />
      <span className="font-medium text-zinc-400">{label}</span>
      <span className="text-zinc-600">· No audio is uploaded. Project metadata saves are explicit; overwrites require a matching revision; project recovery is explicit.</span>
    </div>
  );
}
