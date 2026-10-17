# Contributing to SeeThrough

We use Expo SDK 57, Node.js 24, npm, Expo Router, and Expo Go. The repository contains the foundation for our hackathon demo. Keep changes small enough to test on a physical phone.

## Access and setup

Ask the repository owner to invite your GitHub account as a collaborator. Clone `https://github.com/vlktna/seeThrough.git`, run `npm ci`, and follow the phone setup in [README.md](README.md). GitHub access does not grant access to published Expo projects. Use your own Expo login; do not share passwords or the CI publishing token.

Read `AGENTS.md`. It explains how to consult the current, versioned Expo documentation instead of relying on older APIs.

## Make a change

```bash
git switch main
git pull --ff-only
git switch -c feature/your-feature
npm ci
npm start -- --go
```

Routes belong in `src/app/`; reusable components, sensor code, networking, and utilities belong outside the route directory. Agree with the team on file ownership when working in parallel.

Install Expo-compatible dependencies with:

```bash
npx expo install package-name
```

Before adding a package with native code, verify that its native implementation is bundled in Expo Go for SDK 57. Arbitrary native libraries, ARKit integrations, and Bluetooth modules are not automatically available. Keep the demo in Expo Go unless the team explicitly changes that requirement.

Do not regenerate this project with `create-expo-app` or initialize another EAS project. Preserve `owner`, `slug`, the EAS project ID, update URL, and SDK-compatible runtime configuration. Changes to those settings require an intentional team decision and a fresh phone smoke test.

## Validate and push

```bash
npm run typecheck
npm run lint
npm run check:config
git add path/to/changed-file
git commit -m "Describe the change"
git push -u origin feature/your-feature
```

Open a pull request into `main`. Explain what changed and what you tested on a phone. Wait for the **Check** job to pass, then merge. A successful `main` push starts the **Publish demo update** job automatically. Direct pushes also trigger checks and publishing, so use them only when agreed with the team.

Native sensor behavior cannot be verified just by TypeScript or a desktop web preview. For changes to recording, permissions, or navigation, test on a physical device and report the phone model, OS, Expo Go version, and whether the app was foregrounded. Use explicit permission and unavailable-sensor states. Do not present an estimated path as a measured floor plan.

## Review the deployed update

1. Wait for the [GitHub Actions run](https://github.com/vlktna/seeThrough/actions) to succeed.
2. Open the linked Expo Updates page and select the latest `demo` update.
3. Open it in a compatible Expo Go installation with the required owner/organization access.
4. Verify the new behavior before showing it to guests. Updates do not force a live app session to refresh.

For a broken demo, revert the offending source commit through a new commit or pull request and let the normal workflow publish the corrected state. Do not force-push `main` or republish an unrelated runtime to work around compatibility errors.

## Configuration and secrets

Never commit tokens, passwords, recordings containing private information, or backend service-role keys. `.env.local` is local-only; `.env.example` documents optional variable names. Client-side `EXPO_PUBLIC_*` values are public, including values supplied by CI. Keep provider credentials on a backend, and use database access controls for client-accessible services.

The owner stores `EXPO_TOKEN` only in GitHub Actions repository secrets. The CI job uses the EAS `preview` environment for exported app configuration. Keep local and preview public settings aligned when adding a new integration.
