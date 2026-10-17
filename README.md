# SeeThrough

Shared Expo Go starter for our indoor-navigation hackathon. Use **Node.js 24**, npm, and **Expo SDK 57**.

- [GitHub repository](https://github.com/vlktna/seeThrough)
- [Expo project: @vlktna/seethrough](https://expo.dev/accounts/vlktna/projects/seethrough)
- EAS project: `03969556-b796-4fb5-aa87-936b1dd792ff`
- EAS channel `demo` is linked to branch `demo`; publishing uses environment `preview`.

Project linking, the demo channel, and GitHub publishing credentials are configured.

## Start developing

Install Node.js 24 and a version of [Expo Go](https://expo.dev/go) compatible with SDK 57 on your phone. If you use nvm, run `nvm install` and `nvm use` in the cloned folder; `.nvmrc` selects Node 24.

```bash
git clone https://github.com/vlktna/seeThrough.git
cd seeThrough
npm ci
npx expo login
npm start -- --go
```

Use your **own Expo account**. On a physical iPhone, sign into that same account in Expo CLI and Expo Go. Keep the phone and computer on the same Wi-Fi, then scan the terminal QR with the iPhone Camera app. Each teammate can run their own checkout.

If the network blocks local connections, run `npm run start:tunnel`. Keep the terminal running and computer awake. A tunnel does not bypass Expo login requirements.

## Work together

Get a GitHub collaborator invitation from the owner, then work on a feature branch and open a pull request into `main`. Routes live in `src/app/`; put reusable logic outside that directory.

Before pushing:

```bash
npm run typecheck
npm run lint
npm run check:config
```

Read [CONTRIBUTING.md](CONTRIBUTING.md) and `AGENTS.md`. Install compatible dependencies with `npx expo install package-name`; keep native features within SDK 57's Expo Go modules.

## Updates and demo QR

A passing `main` push follows this flow:

**Push / merge → GitHub checks → EAS Update `demo` → reopen in Expo Go.**

[GitHub Actions](https://github.com/vlktna/seeThrough/actions) runs type checking, linting, and configuration checks before publishing JavaScript and assets. It does not create a native build or instantly reload an already open app. Check the workflow result, then reopen the latest demo update. Local development uses Metro Fast Refresh separately.

Run `npm run qr` to generate [the PNG QR](docs/demo-qr.png), [the SVG QR](docs/demo-qr.svg), and [the demo link](docs/demo-link.txt). The stable QR uses channel `demo` and runtime `exposdk:57.0.0`; it becomes useful after a compatible update is published. Update details are on [Expo's Updates page](https://expo.dev/accounts/vlktna/projects/seethrough/updates).

**Expo access matters:** published projects in Expo Go are available to their owner or members of the owning organization. A public GitHub repository does not grant that access. Guests need compatible Expo Go plus their own authorized account; do not share personal passwords. See [Expo Go access and troubleshooting](docs/expo-go-access.md).

## One-time maintainer setup

The owner-approved `seethrough-github-actions` robot is configured as GitHub secret `EXPO_TOKEN`. The steps below are only needed to replace or rotate it.

1. Obtain an approved token with permission to publish this Expo project through [Expo access tokens](https://expo.dev/settings/access-tokens).
2. Add it as repository secret **`EXPO_TOKEN`** in [GitHub Actions secrets](https://github.com/vlktna/seeThrough/settings/secrets/actions).
3. Allow the workflow's GitHub Actions, then push to `main`. Checks work without a token; publishing deliberately fails if the token is missing.

Add teammates through [GitHub repository access](https://github.com/vlktna/seeThrough/settings/access). GitHub write access and Expo update access are separate. Teammates do not need the publishing token to push code.

An authorized maintainer can also publish manually after signing into EAS CLI:

```bash
npm run update:demo -- --message "Describe this update"
```

No environment variables are required by the starter. For future integrations, copy `.env.example` to `.env.local` and configure matching public variables in EAS environment `preview`. `EXPO_PUBLIC_*` values are visible in the app; keep provider secrets on a backend and never commit `EXPO_TOKEN`.
