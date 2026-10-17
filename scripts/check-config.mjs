import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const projectId = '03969556-b796-4fb5-aa87-936b1dd792ff';
const sdkMajor = 57;

export function checkConfig() {
  const { expo } = JSON.parse(readFileSync(resolve(root, 'app.json'), 'utf8'));
  const pkg = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'));
  const installedExpo = JSON.parse(
    readFileSync(resolve(root, 'node_modules/expo/package.json'), 'utf8'),
  );

  assert.equal(expo?.owner, 'vlktna', 'Keep the authorized Expo owner: vlktna.');
  assert.equal(expo?.slug, 'seethrough', 'Keep the linked Expo slug: seethrough.');
  assert.equal(expo?.extra?.eas?.projectId, projectId, 'Unexpected EAS project ID.');
  assert.equal(expo?.updates?.url, `https://u.expo.dev/${projectId}`, 'Unexpected update URL.');
  assert.notEqual(expo?.updates?.enabled, false, 'Updates must not be disabled.');
  assert.deepEqual(
    expo?.runtimeVersion,
    { policy: 'sdkVersion' },
    'Keep the shared sdkVersion runtime policy used by this demo QR.',
  );
  assert.match(pkg.dependencies?.expo ?? '', /^~57\./, 'Keep this demo on Expo SDK 57.');
  assert.equal(Number(installedExpo.version.split('.')[0]), sdkMajor, 'Run npm ci for SDK 57.');
  assert.equal(pkg.main, 'expo-router/entry', 'Use the Expo Router entry point.');

  for (const platform of ['ios', 'android']) {
    assert.equal(
      expo[platform]?.runtimeVersion,
      undefined,
      `Remove ${platform}.runtimeVersion overrides so both platforms use the shared Go runtime.`,
    );
  }

  const runtime = `exposdk:${sdkMajor}.0.0`;
  const demoLink = `exp://u.expo.dev/${projectId}?runtime-version=${encodeURIComponent(runtime)}&channel-name=demo`;
  return { projectId, runtime, demoLink, root };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const config = checkConfig();
    console.log(`Expo config OK: @vlktna/seethrough · ${config.runtime} · ${config.projectId}`);
  } catch (error) {
    console.error(`Expo config check failed: ${error.message}`);
    process.exitCode = 1;
  }
}
