import type { Sample } from './types';
import { env } from 'cloudflare:workers';
import { ApiError, LIMITS, identifier, label, validateBatch, pageCursor } from './validation.mjs';
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
export const options = () => new Response(null, { status: 204, headers });
export const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
export async function safe(run: () => Promise<Response>) {
  try { return await run(); } catch (e) {
    if (e instanceof ApiError) return json({ error: e.message }, e.status);
    console.error('Telemetry API failure', e instanceof Error ? e.message : 'unknown');
    return json({ error: 'The telemetry service is temporarily unavailable. Please retry.' }, 503);
  }
}
export function database(): D1Database {
  if (!env.DB) throw new Error('Database binding unavailable');
  return env.DB;
}
export async function readJson(request: Request) {
  if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new ApiError(415, 'Use Content-Type: application/json.');
  if (Number(request.headers.get('content-length')) > LIMITS.bodyBytes) throw new ApiError(413, 'Request body exceeds 128 KiB.');
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'A JSON body is required.');
  const decoder = new TextDecoder(); let text = ''; let bytes = 0;
  for (;;) {
    const { done, value } = await reader.read(); if (done) break;
    bytes += value.byteLength;
    if (bytes > LIMITS.bodyBytes) { await reader.cancel(); throw new ApiError(413, 'Request body exceeds 128 KiB.'); }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  try { return JSON.parse(text); } catch { throw new ApiError(400, 'Invalid JSON.'); }
}
const token = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
async function digest(value: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
type Session = { id: string; name: string; read_hash: string; write_hash: string; created_at: number; expires_at: number };
export async function authorize(request: Request, id: string, write = false) {
  identifier(id, 'sessionId');
  const bearer = request.headers.get('authorization')?.match(/^Bearer ([a-f0-9]{64})$/i)?.[1];
  if (!bearer) throw new ApiError(401, 'A session Bearer token is required.');
  const row = await database().prepare('SELECT * FROM sessions WHERE id = ?').bind(id).first<Session>();
  const hash = await digest(bearer);
  if (!row || (hash !== row.write_hash && (write || hash !== row.read_hash))) throw new ApiError(403, 'Invalid session or token.');
  if (row.expires_at <= Date.now()) throw new ApiError(410, 'This demo session has expired. Create a new session.');
  return row;
}
export async function createSession(request: Request) {
  const body = await readJson(request); const name = label(body?.name, 'name');
  const db = database(); const now = Date.now();
  const creator = await digest(`seethrough:${request.headers.get('cf-connecting-ip') ?? 'local'}`);
  await db.prepare('DELETE FROM sessions WHERE expires_at <= ?').bind(now).run();
  const readToken = token(); const writeToken = token(); const id = crypto.randomUUID();
  const result = await db.prepare(`INSERT INTO sessions (id,name,read_hash,write_hash,creator_hash,created_at,expires_at)
    SELECT ?,?,?,?,?,?,? WHERE (SELECT COUNT(*) FROM sessions WHERE creator_hash=? AND created_at>?)<10 AND (SELECT COUNT(*) FROM sessions)<500`)
    .bind(id, name, await digest(readToken), await digest(writeToken), creator, now, now + LIMITS.ttl, creator, now - 3600000).run();
  if (!result.meta.changes) throw new ApiError(429, 'Session creation limit reached. Reuse an existing session or try later.');
  return json({ session: { id, name, createdAt: now, expiresAt: now + LIMITS.ttl }, readToken, writeToken, limits: LIMITS }, 201);
}
export async function ingest(request: Request, id: string) {
  await authorize(request, id, true);
  const batch = validateBatch(await readJson(request)) as {deviceId: string; name: string; source: string; samples: Sample[]}; const db = database();
  await db.prepare(`INSERT OR IGNORE INTO devices (session_id,device_id,name,source,room_at,position_at,imu_at,last_seen)
    SELECT ?,?,?,?,0,0,0,? WHERE (SELECT COUNT(*) FROM devices WHERE session_id=?) < ?`)
    .bind(id, batch.deviceId, batch.name, batch.source, Date.now(), id, LIMITS.devices).run();
  const known = await db.prepare('SELECT 1 AS found FROM devices WHERE session_id=? AND device_id=?').bind(id, batch.deviceId).first();
  if (!known) throw new ApiError(429, 'This session already has 32 devices.');
  const statements = batch.samples.map(sample => db.prepare(`INSERT OR IGNORE INTO samples (session_id,device_id,sample_id,timestamp,payload)
    SELECT ?,?,?,?,? WHERE (SELECT COUNT(*) FROM samples WHERE session_id=?) < ?`)
    .bind(id, batch.deviceId, sample.id, sample.timestamp, JSON.stringify(sample), id, LIMITS.samples));
  const results = await db.batch(statements);
  const accepted = results.reduce((sum, r) => sum + Number(r.meta.changes || 0), 0);
  // Re-read canonical stored payloads, including retries. This also repairs a snapshot
  // if an earlier request stored samples but lost its connection before the upsert.
  const persisted = await db.prepare(`SELECT sample_id,payload FROM samples WHERE session_id=? AND device_id=?
    AND sample_id IN (SELECT value FROM json_each(?))`)
    .bind(id, batch.deviceId, JSON.stringify(batch.samples.map(s => s.id))).all<{ sample_id: string; payload: string }>();
  const stored = persisted.results.map(r => JSON.parse(r.payload) as import('./types').Sample);
  if (stored.length) {
    const ordered = [...stored].sort((a, b) => b.timestamp - a.timestamp);
    const room = ordered.find(s => 'roomNumber' in s); const position = ordered.find(s => s.position); const imu = ordered.find(s => s.imu);
    await db.prepare(`INSERT INTO devices (session_id,device_id,name,source,room_number,room_at,position,position_at,imu,imu_at,last_seen)
      VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(session_id,device_id) DO UPDATE SET
      name=excluded.name, source=excluded.source,
      room_number=CASE WHEN excluded.room_at>=devices.room_at AND excluded.room_at>0 THEN excluded.room_number ELSE devices.room_number END,
      room_at=MAX(devices.room_at,excluded.room_at),
      position=CASE WHEN excluded.position_at>=devices.position_at AND excluded.position_at>0 THEN excluded.position ELSE devices.position END,
      position_at=MAX(devices.position_at,excluded.position_at),
      imu=CASE WHEN excluded.imu_at>=devices.imu_at AND excluded.imu_at>0 THEN excluded.imu ELSE devices.imu END,
      imu_at=MAX(devices.imu_at,excluded.imu_at),last_seen=excluded.last_seen`)
      .bind(id, batch.deviceId, batch.name, batch.source, room?.roomNumber ?? null, room?.timestamp ?? 0, position ? JSON.stringify(position.position) : null, position?.timestamp ?? 0, imu ? JSON.stringify(imu.imu) : null, imu?.timestamp ?? 0, Date.now()).run();
  }
  const count = await db.prepare('SELECT COUNT(*) AS count, MAX(seq) AS cursor FROM samples WHERE session_id=?').bind(id).first<{ count: number; cursor: number }>();
  return json({ accepted, storedIds: persisted.results.map(r => r.sample_id), limitReached: (count?.count ?? 0) >= LIMITS.samples, ignored: batch.samples.length - accepted, cursor: count?.cursor ?? 0, total: count?.count ?? 0, remaining: LIMITS.samples - (count?.count ?? 0) });
}
export async function readSession(request: Request, id: string) {
  const row = await authorize(request, id); const db = database();
  const after = pageCursor(new URL(request.url).searchParams.get('after'));
  const [records, people, totals] = await Promise.all([
    db.prepare('SELECT seq,device_id,payload FROM samples WHERE session_id=? AND seq>? ORDER BY seq LIMIT 501').bind(id, after).all<{ seq: number; device_id: string; payload: string }>(),
    db.prepare('SELECT device_id,name,source,room_number,position,imu,last_seen FROM devices WHERE session_id=? ORDER BY device_id').bind(id).all<{ device_id: string; name: string; source: string; room_number: number | null; position: string | null; imu: string | null; last_seen: number }>(),
    db.prepare('SELECT COUNT(*) AS count FROM samples WHERE session_id=?').bind(id).first<{ count: number }>(),
  ]);
  const data = records.results.slice(0, 500).map(r => ({ ...JSON.parse(r.payload), deviceId: r.device_id, seq: r.seq }));
  return json({ session: { id: row.id, name: row.name, createdAt: row.created_at, expiresAt: row.expires_at },
    devices: people.results.map(d => ({ deviceId: d.device_id, name: d.name, source: d.source, roomNumber: d.room_number, position: d.position ? JSON.parse(d.position) : null, imu: d.imu ? JSON.parse(d.imu) : null, lastSeen: d.last_seen })),
    samples: data, cursor: data.at(-1)?.seq ?? after, hasMore: records.results.length > 500, total: totals?.count ?? 0, serverTime: Date.now() });
}
