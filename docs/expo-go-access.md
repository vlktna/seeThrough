# Expo Go access

Expo Go runs SeeThrough inside the Expo Go app. It does not install a separate SeeThrough icon. We use SDK 57 and no TestFlight or native build in this starter.

| Workflow | Requirements |
| --- | --- |
| Local development QR | Running Metro server, reachable LAN or tunnel; on physical iPhones, the same Expo account in Expo CLI and Expo Go |
| Published `demo` QR | Compatible published update and Expo Go version; signed-in project owner or member of the organization owning the project |

The current iPhone development login requirement is documented in [Expo's SDK 57 announcement](https://expo.dev/changelog/expo-go-57-login). Published-project access restrictions are documented in [Expo's May 2026 announcement](https://expo.dev/changelog/expo-go-loading-changes-may-2026).

## For guests

If `vlktna` personally owns the project, arbitrary guest accounts cannot open its published update. Organization ownership and individual memberships need to be arranged separately before promising access on guests' phones. Public GitHub access and QR possession are insufficient.

Guests install compatible Expo Go, sign into their own authorized account, and scan the demo QR after a successful publish. Test the exact QR and account access on a real phone before the event. Until guest access is arranged, use already authorized team demo phones. Do not distribute personal account passwords.

The generated QR points to:

```text
exp://u.expo.dev/03969556-b796-4fb5-aa87-936b1dd792ff?runtime-version=exposdk%3A57.0.0&channel-name=demo
```

The channel is mapped to branch `demo`. The app uses `runtimeVersion: { "policy": "sdkVersion" }`; SDK 57 resolves to `exposdk:57.0.0`. Keep QR, runtime, installed Expo Go version, and native dependencies compatible when upgrading.

## Troubleshooting

- **Login error on iPhone:** sign into the same account in local Expo CLI and Expo Go.
- **Published QR refuses to open:** verify project owner/organization access and that the update finished publishing.
- **Incompatible project:** verify the installed Expo Go supports SDK 57; store versions change.
- **Network timeout:** use common Wi-Fi or `npm run start:tunnel`; keep Metro running. A tunnel does not remove account checks.
- **Missing native module:** check “Included in Expo Go” in the [SDK 57 docs](https://docs.expo.dev/versions/v57.0.0/). Installing a JavaScript package cannot add custom native code to Expo Go.
- **Old code still visible:** wait for the GitHub publish job, then reopen the demo update. Published updates do not force a running session to refresh.
- **Publish fails:** inspect the Actions log and approved `EXPO_TOKEN` access. Never copy tokens into logs or chat.

This starter does not implement indoor positioning. Expo Go does not supply ARKit position tracking or iPhone Wi-Fi fingerprints; sensor algorithms and route accuracy still require physical-device testing.
