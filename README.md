# SeeThrough

**Indoor understanding for robots, contributed by people.**

SeeThrough is an indoor mapping prototype designed to help robots navigate buildings and work alongside people. People contribute confirmed room locations, coordinates, and motion data through their phones. A live dashboard brings these inputs together, providing the foundation for robot navigation and human–robot coordination.

[Open the live demo](https://seethrough-live.v-volokitinaa.chatgpt.site) · [API guide](https://seethrough-live.v-volokitinaa.chatgpt.site/api-guide)

## Hackathon submission

### Team name

SeeThrough

### All team members — full names and emails

| Full name | Email |
| --- | --- |
| Veronika Volokitina | v.volokitinaa@gmail.com |
| William Tobin Edward | williamteboyd@gmail.com |
| Nick Wright | Nickwright263@gmail.com |

### Short project description

SeeThrough is an indoor mapping prototype designed to help robots navigate buildings and work alongside people. People contribute confirmed room locations, coordinates, and motion data through their phones. A live dashboard brings these inputs together, providing the foundation for robot navigation and human–robot coordination.

Try the [SeeThrough live demo](https://seethrough-live.v-volokitinaa.chatgpt.site/).

### Public repository URL

https://github.com/vlktna/seeThrough

### Publicly accessible 1-minute demo video URL

**Pending — add the public one-minute video URL before submitting the form.**

The interactive demo is available at https://seethrough-live.v-volokitinaa.chatgpt.site. This is a website, not the requested video.

### Short description of the technology used

React Native with Expo for the mobile UI; React and TypeScript with Vinext/Vite for the web dashboard; Cloudflare Workers for the JSON API; and Cloudflare D1 (SQLite) with Drizzle migrations for persistence. The browser sender uses DeviceMotion for accelerometer and gyroscope data. Session-scoped tokens, batched uploads, and one-second polling connect phones to the dashboard.

## Try the demo

1. Open [SeeThrough Live](https://seethrough-live.v-volokitinaa.chatgpt.site) and select **Create session**.
2. Open the session's phone connection link on a phone and enter a name.
3. Select a room; the participant appears on the shared floor plan.
4. Optionally allow motion capture to stream raw readings. Use the Sensors and JSON tabs to inspect them.
5. Share the separate viewer link with spectators. Native clients can send room updates, relative coordinates, and IMU batches through the [documented API](https://seethrough-live.v-volokitinaa.chatgpt.site/api-guide).

The browser demo requires no Expo installation. Sensor availability depends on the phone, browser, and permissions. Room confirmation works without sensor access.

## Implementation status

The deployed MVP provides session creation, confirmed room sharing, sensor ingestion, persistent storage, coordinate visualization, and JSON export. Automatic indoor position estimation, architectural scanning, AR navigation, and Wi-Fi fingerprinting are future work. Motion readings alone are not treated as proof of walking.

- [`frontend/`](frontend/) contains the team's React Native / Expo floorplan interface.
- The deployed web frontend and backend source is available in [`web/` on the web branch](https://github.com/vlktna/seeThrough/tree/codex/live-telemetry-web/web), with integration tracked in [PR #2](https://github.com/vlktna/seeThrough/pull/2).
- [Web development instructions](https://github.com/vlktna/seeThrough/blob/codex/live-telemetry-web/web/README.md) and [API contract](https://github.com/vlktna/seeThrough/blob/codex/live-telemetry-web/web/docs/API.md) are in English.

The native interface still needs to send data to the API. No standalone APK release is currently available. Demo sessions expire after 24 hours; export data before expiry if needed.
