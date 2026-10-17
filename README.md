# SeeThrough

SeeThrough is an Android app project for indoor navigation. The goal is to help people map walking routes through a building, find important places, and reach each other.

## How it will work

1. Scan a QR code at a known location to set your starting point.
2. Walk through the building and record an estimated route using the phone's motion sensors.
3. Add landmarks such as entrances, stairs, toilets, and coffee stations.
4. Follow directions to a destination or a friend's shared location.

Routes are estimates, not architectural floor plans. QR checkpoints and confirmed landmarks help correct positioning drift.

## Android app

The app will be distributed as a standalone **Android APK**, built locally and uploaded to **GitHub Releases**. Users will be able to download it through a link or QR code and install it on their Android phone. Expo Go will not be required.

## Current status

This repository currently contains the project description only. The Android app and a downloadable APK are not available yet.


## Public web dashboard and telemetry API

- [Open SeeThrough Live](https://seethrough-live.v-volokitinaa.chatgpt.site)
- [API contract](web/docs/API.md)
- [Web development and deployment instructions](web/README.md)

Create a session, open its phone link, and send room updates or raw motion readings. The native app can post coordinates and IMU batches to the same API. Frontend and persistent backend are deployed together. Source lives in `web/`; the Expo UI remains in `frontend/`.
