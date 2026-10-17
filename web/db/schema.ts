import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core';
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(), name: text('name').notNull(),
  readHash: text('read_hash').notNull(), writeHash: text('write_hash').notNull(),
  creatorHash: text('creator_hash').notNull(), createdAt: integer('created_at').notNull(), expiresAt: integer('expires_at').notNull(),
}, t => [index('sessions_creator_time').on(t.creatorHash, t.createdAt)]);
export const samples = sqliteTable('samples', {
  seq: integer('seq').primaryKey({ autoIncrement: true }),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  deviceId: text('device_id').notNull(), sampleId: text('sample_id').notNull(),
  timestamp: integer('timestamp').notNull(), payload: text('payload').notNull(),
}, t => [uniqueIndex('samples_dedup').on(t.sessionId, t.deviceId, t.sampleId), index('samples_session_seq').on(t.sessionId, t.seq)]);
export const devices = sqliteTable('devices', {
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  deviceId: text('device_id').notNull(), name: text('name').notNull(), source: text('source').notNull(),
  roomNumber: integer('room_number'), roomAt: integer('room_at').notNull().default(0),
  position: text('position'), positionAt: integer('position_at').notNull().default(0),
  imu: text('imu'), imuAt: integer('imu_at').notNull().default(0), lastSeen: integer('last_seen').notNull(),
}, t => [primaryKey({ columns: [t.sessionId, t.deviceId] })]);
