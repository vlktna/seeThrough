export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const LIMITS = Object.freeze({ bodyBytes: 131072, batch: 100, samples: 10000, devices: 32, ttl: 86400000 });
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const fail = message => { throw new ApiError(400, message); };
export function identifier(value, field = 'id') {
  if (typeof value !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(value)) fail(`${field} must contain 1–64 letters, numbers, underscores or hyphens.`);
  return value;
}
export function label(value, field = 'name') {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 64) fail(`${field} must be 1–64 characters.`);
  return value.trim();
}
function number(value, field, bound) {
  if (typeof value !== 'number' || !Number.isFinite(value) || Math.abs(value) > bound) fail(`${field} must be a finite number within ±${bound}.`);
  return value;
}
function vector(value, field, bound) {
  if (!object(value)) fail(`${field} must contain x, y, z.`);
  return Object.fromEntries(['x', 'y', 'z'].map(axis => [axis, number(value[axis], `${field}.${axis}`, bound)]));
}
export function validateBatch(body, now = Date.now()) {
  if (!object(body)) fail('Expected a JSON object.');
  const deviceId = identifier(body.deviceId, 'deviceId'); const name = label(body.name);
  const source = body.source ?? 'native';
  if (!['native', 'browser', 'demo', 'manual'].includes(source)) fail('source must be native, browser, demo or manual.');
  if (!Array.isArray(body.samples) || body.samples.length < 1 || body.samples.length > LIMITS.batch) fail(`Send 1–${LIMITS.batch} samples per request.`);
  const ids = new Set();
  const samples = body.samples.map(input => {
    if (!object(input)) fail('Each sample must be an object.');
    const id = identifier(input.id, 'sample.id');
    if (ids.has(id)) fail('Sample IDs must be unique within a batch.');
    ids.add(id);
    const timestamp = number(input.timestamp, 'timestamp', Number.MAX_SAFE_INTEGER);
    if (!Number.isInteger(timestamp) || timestamp < now - LIMITS.ttl || timestamp > now + 60000) fail('timestamp must be Unix milliseconds within the last 24 hours (up to 60 seconds clock skew).');
    const sample = { id, timestamp };
    if ('roomNumber' in input) {
      if (input.roomNumber !== null && (!Number.isInteger(input.roomNumber) || input.roomNumber < 1 || input.roomNumber > 5)) fail('roomNumber must be 1–5, or null for unknown.');
      sample.roomNumber = input.roomNumber;
    }
    if (input.position !== undefined) {
      if (!object(input.position)) fail('position must be an object.');
      const floor = input.position.floor ?? 0;
      if (!Number.isInteger(floor) || floor < -10 || floor > 200) fail('position.floor must be an integer between -10 and 200.');
      sample.position = { x: number(input.position.x, 'position.x', 10000), y: number(input.position.y, 'position.y', 10000), floor };
    }
    if (input.imu !== undefined) {
      if (!object(input.imu)) fail('imu must be an object.');
      sample.imu = {};
      for (const key of ['acceleration', 'accelerationIncludingGravity', 'gyroscope']) {
        if (input.imu[key] !== undefined) sample.imu[key] = vector(input.imu[key], `imu.${key}`, key === 'gyroscope' ? 1000 : 2000);
      }
      if (Object.keys(sample.imu).length === 0) fail('imu must contain acceleration, accelerationIncludingGravity, or gyroscope.');
    }
    if (!('roomNumber' in sample) && !sample.position && !sample.imu) fail('Each sample needs roomNumber, position or imu.');
    return sample;
  });
  return { deviceId, name, source, samples };
}
export function pageCursor(value) {
  if (value === null || value === '') return 0;
  if (!/^\d{1,15}$/.test(value)) fail('after must be a non-negative integer cursor.');
  return Number(value);
}
