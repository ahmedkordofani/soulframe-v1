# SoulFrame V6.0.1 - Local API Foundation

This is the first **real**, but **local-development-only**, Node HTTP backend for SoulFrame.

## Start locally

Open two PowerShell windows in the repository root:

```powershell
# Terminal 1
npm run dev:api
```

```powershell
# Terminal 2
npm run dev
```

Open http://localhost:5173. The header status should show **Local API connected (v6.0.1)**.
The API also responds directly at http://127.0.0.1:8787/api/health.

If you do not start the API, SoulFrame should show **Browser-only mode** and its existing V5.4 features should continue working.

## API contract

- `GET /api/health` - returns HTTP 200 JSON when local API is running.
- `HEAD /api/health` - returns headers only.
- Other methods on `/api/health` return 405.
- Unimplemented paths return 404 JSON. There are **no project, report, or audio write endpoints** in V6.0.1.

The API listens only on `127.0.0.1:8787`. Vite proxies browser `/api` requests to that address during local development. It has no CORS policy permitting external origins.

## Privacy and production

- Health checks contain no audio, project metadata or personal information.
- No database, authentication, accounts, uploaded files, server-side reports, PDF generation or cloud sharing yet.
- **Vercel does not run the local Node server.** The deployed site remains browser-only until an API is explicitly deployed and configured.
- The status label is a connection check, not proof of secure hosted services or AI-artifact detection.
- Never expose the development server publicly or commit secrets.

## Verification

```powershell
npm run verify
```

The Node test suite checks real loopback HTTP responses, strict client validation, offline behaviour, read-only methods and privacy boundaries. Full browser behaviour and Vite production build still require local verification.

## Next

V6.0.2 should choose a narrowly scoped persistence model and privacy controls before storing project metadata. User accounts, hosted reports and server-side audio handling must be designed and reviewed separately.
