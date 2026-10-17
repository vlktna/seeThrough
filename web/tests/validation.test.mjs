import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBatch, pageCursor, LIMITS } from '../lib/validation.mjs';
const now = 1800000000000;
const body = sample => ({ deviceId: 'phone-1', name: ' Alex ', samples: [{ id: 'sample-1', timestamp: now, ...sample }] });
test('normalizes a room-only update without inventing coordinates', () => {
  const result = validateBatch(body({roomNumber:2}), now);
  assert.equal(result.name,'Alex'); assert.equal(result.source,'native');
  assert.deepEqual(result.samples[0],{id:'sample-1',timestamp:now,roomNumber:2});
});
test('raw IMU does not create a position or room', () => {
  const sample=validateBatch(body({imu:{acceleration:{x:1,y:2,z:3}}}),now).samples[0];
  assert.equal(sample.position,undefined); assert.equal(sample.roomNumber,undefined);
});
test('null explicitly clears room and floor defaults to zero', () => {
  const sample=validateBatch(body({roomNumber:null,position:{x:-2,y:3}}),now).samples[0];
  assert.equal(sample.roomNumber,null); assert.equal(sample.position.floor,0);
});
test('rejects malformed or out of range sensor and position values', () => {
  for(const sample of [{roomNumber:6},{position:{x:NaN,y:2}},{position:{x:0,y:0,floor:1.5}},{imu:{gyroscope:{x:0,y:0,z:Infinity}}},{imu:{}},{}]) assert.throws(()=>validateBatch(body(sample),now));
});
test('requires unique IDs, valid timestamps and bounded batches', () => {
  const input=body({roomNumber:1});
  assert.throws(()=>validateBatch({...input,samples:[input.samples[0],input.samples[0]]},now));
  assert.throws(()=>validateBatch({...input,samples:Array(LIMITS.batch+1).fill(input.samples[0])},now));
  assert.throws(()=>validateBatch({...input,samples:[{...input.samples[0],timestamp:now+60001}]},now));
  assert.throws(()=>validateBatch({...input,samples:[{...input.samples[0],timestamp:now-LIMITS.ttl-1}]},now));
  assert.throws(()=>validateBatch({...input,deviceId:'../../bad'},now));
});
test('cursors reject unsafe values',()=>{
  assert.equal(pageCursor(null),0);assert.equal(pageCursor('123'),123);
  for(const input of ['-1','1e10','1.5','99999999999999999']) assert.throws(()=>pageCursor(input));
});
