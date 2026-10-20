# SoulFrame V6.0.7 - Local Backend Security and Privacy Hardening

## Scope

This update hardens the **local development API** against common browser-origin misuse and accidental request floods. It deliberately does not introduce user authentication, cloud hosting, shared-user accounts, or stored audio.

## Protections

- Accepts requests only addressed to loopback hosts (`localhost` or `127.0.0.1`) from a loopback network connection.
- Restricts browser Origin and Fetch Metadata to same-origin local development requests. Optional `SOULFRAME_ALLOWED_ORIGIN` must itself be a localhost HTTP origin with an explicit port.
- Adds `nosniff`, `DENY` framing, restrictive CSP, no-referrer, same-origin resource policy and `no-store` headers. Never enables CORS.
- Validates declared JSON body size before reading and retains the existing streaming-size limit (16 KiB by default, 3 MiB for backup preview).
- Adds bounded process-local request limiting for metadata writes and sensitive exports, responding with HTTP 429 and `Retry-After`.
- Applies Node HTTP header and request timeouts.
- Continues to preserve existing project and backup storage formats.

## Limitations

- No authentication or user isolation. Any local process able to send HTTP requests to the API can access project metadata.
- Security headers and Origin checks protect browser contexts, not malicious programs already running on your machine.
- Rate limiting is in memory, per local API process. It is not a distributed quota or DDoS protection.
- Local project metadata is stored on disk in `.soulframe-local/`. Restrictive file permissions are requested on supported platforms, but the database is **not encrypted**.
- Never expose port 8787 via a public proxy, tunnel, container port publish or internet-facing binding.
- CORS is intentionally disabled. Do not add permissive access-control headers.
- Backup files may include client names and notes. Keep them private and delete obsolete downloads securely.

## Verification

After installation:

```powershell
node scripts/apply-v607.mjs
npm run verify
npm run dev:api
```

From a separate terminal, verify `http://127.0.0.1:8787/api/health` advertises `v6.0.7`, open SoulFrame and test Saved Projects and backup import with demo data only. Rejected external origins should yield HTTP 403; repeated write requests may yield HTTP 429.
