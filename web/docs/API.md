# SeeThrough telemetry API

Public app: https://seethrough-live.v-volokitinaa.chatgpt.site
Interactive contract: https://seethrough-live.v-volokitinaa.chatgpt.site/api-guide

## Connect a phone

1. Open the dashboard and click **Create session**.
2. Copy **Open on your phone** and open that link in Safari/Chrome on the phone.
3. Enter a device name and tap its room. The marker appears in the dashboard within about one second.
4. Optionally tap **Allow sensors & start** to stream real browser motion readings. Keep the phone unlocked and the page visible. Stop capture and wait for the queue to reach zero before leaving.

No Expo installation is needed for this browser sender. The native app can use the same API below. Browser sensor support and permissions vary; room confirmation works even without motion access.

## Create a session

`POST /api/sessions`, Content-Type `application/json`, body `{"name":"Hackathon venue"}`.

Response 201: `{session:{id,name,createdAt,expiresAt},readToken,writeToken,limits}`.

Keys are random and scoped to one session. Store them locally; never commit keys. Share read-only links with viewers and phone links only with participants who may send data. Sessions expire in 24 hours; expired database records are cleaned up on subsequent session creation. Creation is limited to 10 sessions per IP/hour and 500 active sessions globally.

## Send samples

`POST /api/sessions/{sessionId}/samples`

Headers: `Authorization: Bearer {writeToken}`, `Content-Type: application/json`.

```js
const body = {
  deviceId: 'mapping-device-01', // stable for this device
  name: 'Mapping device 01',
  source: 'native', // native | browser | manual | demo
  samples: [{
    id: crypto.randomUUID(), // keep this ID on retries
    timestamp: Date.now(), // Unix milliseconds
    roomNumber: 2, // optional: 1–5, or null to clear
    position: { x: 1.2, y: 3.4, floor: 0 }, // optional: metres from shared origin
    imu: { // optional: device-frame axes
      acceleration: { x: 0.1, y: 0.2, z: -0.1 }, // m/s², gravity excluded
      accelerationIncludingGravity: { x: 0.1, y: 0.2, z: 9.7 }, // m/s²
      gyroscope: { x: 0, y: 0, z: 0.05 } // radians/s
    }
  }]
};
await fetch(`${baseUrl}/api/sessions/${sessionId}/samples`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${writeToken}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});
```

Send at least one of roomNumber, position, or imu per sample. Do not invent unknown fields. IMU-only updates preserve room and position; phone movement is never automatically counted as walking. Coordinates are plotted separately from the room image because they are not calibrated to its pixels.

- Up to 100 samples per request, 128 KiB JSON body, 32 devices and 10,000 samples per session.
- Approximately 10 Hz, batched once per second, is sufficient for the demo.
- IDs: 1–64 letters, digits, `_` or `-`. Names: 1–64 characters.
- Timestamp: previous 24 hours, at most 60 seconds in the future.
- x/y: ±10,000 m; floor: integer −10 to 200 (default 0).
- Acceleration axes: ±2,000 m/s²; gyro axes: ±1,000 rad/s.
- Browser rotationRate units are degrees/s: beta → X, gamma → Y, alpha → Z. Multiply by π/180. Normalize native sensor units before uploading.

Response 200:

```json
{"accepted":1,"storedIds":["sample-id"],"ignored":0,"cursor":42,"total":1,"remaining":9999,"limitReached":false}
```

Remove only acknowledged `storedIds` from the upload queue. These include existing IDs on retries; `accepted` counts new records only. A duplicate cannot overwrite its original payload. At the sample limit, a batch may be partially accepted: stop capture and start another session when `limitReached` is true. The phone sender keeps a bounded queue in memory only, retries failed uploads, stops if the queue is full, and pauses capture when hidden. Leaving/reloading the tab can lose unsent readings.

## Read

`GET /api/sessions/{sessionId}?after=0` with `Authorization: Bearer {readToken}` (write token also works).

Response: `{session,devices,samples,cursor,hasMore,total,serverTime}`. Each sample includes `deviceId` and server sequence `seq`. Each device includes its latest room, position, IMU, source and lastSeen. Out-of-order messages do not replace newer room/position values. Fetch subsequent pages using the returned cursor; up to 500 samples per page. Poll every second after catching up.

`GET /api/health` is public.

Errors: 400 invalid data; 401 missing token; 403 wrong token; 410 expired; 413 oversized body; 415 wrong content type; 429 device/session-creation limit; 503 storage unavailable. Retry network errors and 503 with backoff. Resolve other errors rather than retrying indefinitely.

## Limits of this MVP

This service is ingestion and visualization, not indoor positioning. The native team must calculate coordinates or supply confirmed room assignments. All phones need a shared coordinate origin to compare paths. The floorplan is the five-room image from `frontend/assets/floorplan.png`; change room geometry in `lib/rooms.js` when replacing it. No camera, audio, video, Wi-Fi fingerprinting, or automatic floor detection is implemented here.
