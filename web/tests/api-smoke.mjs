// End-to-end smoke test against a running deployment. Creates a 24-hour test session.
// Credentials stay in process memory and are never printed.
import assert from 'node:assert/strict';
const base = process.env.BASE_URL || 'http://127.0.0.1:5173';
async function call(path, { token, body, method = body ? 'POST' : 'GET' } = {}) {
  const response = await fetch(base + path, { method, headers: { ...(body && { 'Content-Type': 'application/json' }), ...(token && { Authorization: `Bearer ${token}` }) }, ...(body && {body:JSON.stringify(body)}) });
  const data = await response.json(); return {status:response.status,data};
}
const health = await call('/api/health'); assert.equal(health.status,200);
const created = await call('/api/sessions',{body:{name:'API verification'}}); assert.equal(created.status,201,JSON.stringify(created.data));
const {session,readToken,writeToken}=created.data;
const path=`/api/sessions/${session.id}`, upload=`${path}/samples`;
const sample={id:'sample-1',timestamp:Date.now(),roomNumber:2,position:{x:1,y:2,floor:0}};
const batch={deviceId:'test-phone',name:'Test phone',source:'demo',samples:[sample]};
assert.equal((await call(path)).status,401);
assert.equal((await call(upload,{token:readToken,body:batch})).status,403);
const inserted=await call(upload,{token:writeToken,body:batch}); assert.equal(inserted.status,200,JSON.stringify(inserted.data));assert.equal(inserted.data.accepted,1);
const duplicate=await call(upload,{token:writeToken,body:{...batch,samples:[{...sample,roomNumber:5}]}});assert.equal(duplicate.data.accepted,0);assert.deepEqual(duplicate.data.storedIds,['sample-1']);
const imu={id:'imu-1',timestamp:sample.timestamp+1,imu:{acceleration:{x:0,y:0,z:1}}};
assert.equal((await call(upload,{token:writeToken,body:{...batch,samples:[imu]}})).data.accepted,1);
const older={id:'old-room',timestamp:sample.timestamp-1000,roomNumber:1};
await call(upload,{token:writeToken,body:{...batch,samples:[older]}});
const snapshot=await call(path,{token:readToken});assert.equal(snapshot.status,200);assert.equal(snapshot.data.total,3);assert.equal(snapshot.data.devices[0].roomNumber,2);assert.deepEqual(snapshot.data.devices[0].position,{x:1,y:2,floor:0});
assert.equal(snapshot.data.samples.find(s=>s.id==='imu-1').position,undefined);
const empty=await call(`${path}?after=${snapshot.data.cursor}`,{token:readToken});assert.equal(empty.data.samples.length,0);
assert.equal((await call(upload,{token:writeToken,body:{...batch,samples:[{id:'bad',timestamp:Date.now(),roomNumber:7}]}})).status,400);
await call(upload,{token:writeToken,body:{...batch,samples:[{id:'clear-room',timestamp:Date.now()+2,roomNumber:null}]}});
assert.equal((await call(path,{token:readToken})).data.devices[0].roomNumber,null);
console.log('PASS: public health, session creation, read/write authorization, persistence, idempotency, out-of-order updates, IMU isolation, cursor pagination, validation, room clearing.');
