import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import QRCode from 'qrcode';
import { checkConfig } from './check-config.mjs';

const { demoLink, root } = checkConfig();
const output = resolve(root, 'docs');
await mkdir(output, { recursive: true });

const options = { errorCorrectionLevel: 'M', margin: 4, width: 720 };
await QRCode.toFile(resolve(output, 'demo-qr.png'), demoLink, { ...options, type: 'png' });
await QRCode.toFile(resolve(output, 'demo-qr.svg'), demoLink, { ...options, type: 'svg' });
await writeFile(resolve(output, 'demo-link.txt'), `${demoLink}\n`, 'utf8');

console.log('Created docs/demo-qr.png, docs/demo-qr.svg, and docs/demo-link.txt.');
console.log('Requires a published SDK 57 update, demo channel → demo branch, and Expo account access.');
console.log(demoLink);
