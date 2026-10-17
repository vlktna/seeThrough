export type Vector = { x: number; y: number; z: number };
export type Sample = { id: string; timestamp: number; deviceId?: string; seq?: number; roomNumber?: number | null; position?: { x: number; y: number; floor: number }; imu?: { acceleration?: Vector; accelerationIncludingGravity?: Vector; gyroscope?: Vector } };
export type Device = { deviceId: string; name: string; roomNumber: number | null; source: string; position?: Sample['position']; imu?: Sample['imu']; lastSeen: number };
export type Connection = { id: string; readToken: string; writeToken?: string; name?: string };
export const COLORS = ['#447C70', '#9E6E55', '#677AA1', '#966A8C', '#8B814D', '#5b8d9e'];
export type SessionInfo = { id: string; name: string; createdAt: number; expiresAt: number };
export type CreatedSession = { session: SessionInfo; readToken: string; writeToken: string };
export type SessionData = { session: SessionInfo; devices: Device[]; samples: Sample[]; cursor: number; total: number; hasMore: boolean };
export type IngestResult = { accepted: number; storedIds: string[]; limitReached: boolean };
export async function api<T>(path: string, init?: RequestInit) {
  const response = await fetch(path, init);
  let data;
  try { data = await response.json(); } catch { throw new Error('The server returned an unreadable response. Please retry.'); }
  if (!response.ok) throw new Error((data as { error?: string })?.error || `Request failed (${response.status}).`);
  return data as T;
}
export function auth(token: string) { return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }; }
