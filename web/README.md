# SeeThrough Live

Public dashboard and phone telemetry backend for [vlktna/seeThrough](https://github.com/vlktna/seeThrough).

**Live:** https://seethrough-live.v-volokitinaa.chatgpt.site  
**API guide:** https://seethrough-live.v-volokitinaa.chatgpt.site/api-guide

## Try it

1. Open the dashboard and create a session.
2. Copy the phone connection link, open it on a phone, enter a name, and select a room.
3. Watch the marker update on the shared floorplan. Share the separate read-only view link with spectators.
4. Optionally enable browser motion capture. The Sensors and JSON tabs show raw readings; no installation is required.

The included browser sender works independently of Expo. The native app must be connected to the API using the session write token. See [docs/API.md](docs/API.md) for the complete contract.

## What this implements

- Original five-room floorplan and room placement logic from the team's Expo frontend.
- HTTP API for room assignments, relative x/y coordinates, and raw IMU batches.
- Persistent SQLite-compatible D1 storage, random per-session read/write tokens, input limits, immutable sample IDs, and cursor pagination.
- Browser sender with manual room confirmation, optional real DeviceMotion capture, bounded retry queue, and pause when backgrounded.
- Live dashboard refreshing every second, device list, coordinate paths, sensor charts, and JSON export.

It does not infer indoor position from acceleration, determine floors, or align coordinate paths to floorplan pixels. Coordinate estimation stays in the mobile app. Browser sensor availability varies; physical iPhone sensor behavior still needs an on-device test.

## Development

Requires Node.js 22.13 or newer.

```bash
npm ci
npm test
npm run typecheck
npm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_burly_dazzler.sql
npm run dev
```

Apply the initial local migration once per empty local database. The server prints its local URL, normally http://127.0.0.1:5173. With it running, verify the real HTTP/storage flow:

```bash
node tests/api-smoke.mjs
```

Use `BASE_URL=https://your-deployment.example node tests/api-smoke.mjs` to test a deployment. This creates an isolated 24-hour test session and never prints its keys.

## Project layout

- `app/` — dashboard, phone sender, API guide, and API routes.
- `lib/api.ts` — authenticated persistence and ingestion.
- `lib/validation.mjs` — shared API input rules.
- `lib/rooms.js` / `public/floorplan.png` — original room geometry and venue plan.
- `db/schema.ts` / `drizzle/` — schema and versioned migrations.
- `tests/` — validation/room tests and HTTP integration smoke test.

## Deployment

Frontend, API routes, and D1 database are deployed together through Sites. `.openai/hosting.json` binds `DB` and records the existing Site project ID. Do not create another Site when updating this deployment.

The Sites plugin's `build-site.mjs` creates the Worker bundle. Its `site-workflow.mjs` helper synchronizes the exact source commit and packages the built artifact; save and deploy that version through Sites. Hosting applies the checked-in SQL migrations. Source-repository credentials are short-lived and must stay in memory/stdin, never committed.

The GitHub copy lives in `web/` to keep it independent from the team's Expo `frontend/`. GitHub pushes alone do not republish this Sites deployment; use the Sites deployment workflow after changes. No mobile or Expo configuration is modified by this addition.

## Session lifecycle

Sessions expire after 24 hours; expired records are cleaned up during subsequent session creation. Limits: 32 devices, 10,000 samples/session, 100 samples/request, 128 KiB/request, and 10 sessions/IP/hour. Bearer tokens grant access to one session. The public homepage does not list sessions. Download data before expiry if needed.

At 10 Hz, one phone fills 10,000 samples in approximately 16 minutes. Use lower capture rates or create a fresh session for a longer demo. Browser upload queues are in memory and can be lost on tab close/reload.
