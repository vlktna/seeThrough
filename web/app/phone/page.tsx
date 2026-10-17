'use client';
import { useEffect, useRef, useState } from 'react';
import { api, auth, type Sample, type Vector, type IngestResult } from '@/lib/types';

type Pair = { session: string; write: string };
type MotionPermission = typeof DeviceMotionEvent & { requestPermission?: () => Promise<string> };
const vector = (v: { x: number | null; y: number | null; z: number | null } | null | undefined): Vector | undefined => v && [v.x, v.y, v.z].every(n => typeof n === 'number' && Number.isFinite(n)) ? { x: v.x!, y: v.y!, z: v.z! } : undefined;
export default function Phone() {
  const [pair, setPair] = useState<Pair | null>(null), [name, setName] = useState('My phone');
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [active, setActive] = useState(false);
  const [room, setRoom] = useState<number | null>(null), [sent, setSent] = useState(0), [pending, setPending] = useState(0);
  const [x, setX] = useState('0'), [y, setY] = useState('0');
  const config = useRef({ pair: null as Pair | null, name: 'My phone', deviceId: '' });
  const queue = useRef<Sample[]>([]), sending = useRef(false), recording = useRef(false), lastMotion = useRef(0), lastQueued = useRef(0);
  const alive = useRef(true), motionHandler = useRef<((event: DeviceMotionEvent) => void) | null>(null);
  const generation = useRef(0);
  config.current.name = name.trim() || 'My phone';
  function stop(message = 'Motion capture stopped.') {
    generation.current++; recording.current = false;
    if (motionHandler.current) window.removeEventListener('devicemotion', motionHandler.current);
    motionHandler.current = null;
    if (alive.current) { setActive(false); setNotice(message); }
  }
  async function flush() {
    if (sending.current || !queue.current.length || !config.current.pair) return;
    const batch = queue.current.slice(0, 50), settings = { ...config.current };
    sending.current = true;
    try {
      const result = await api<IngestResult>(`/api/sessions/${settings.pair!.session}/samples`, { method: 'POST', headers: auth(settings.pair!.write), body: JSON.stringify({ deviceId: settings.deviceId, name: settings.name, source: 'browser', samples: batch }), signal: AbortSignal.timeout(12000) });
      // Remove only acknowledged sample IDs; any new readings stay queued.
      const acceptedIds = new Set<string>(result.storedIds);
      queue.current = queue.current.filter(s => !acceptedIds.has(s.id));
      if (alive.current) { setSent(n => n + acceptedIds.size); setPending(queue.current.length); setError(''); }
      if (result.limitReached && queue.current.length) {
        stop('This session is full. Export its data from the dashboard and create another session.');
        queue.current = []; if (alive.current) setPending(0);
      }
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : 'Upload failed; queued readings will retry.');
    } finally { sending.current = false; }
  }
  function enqueue(sample: Omit<Sample, 'id' | 'timestamp'>) {
    if (queue.current.length >= 500) { stop('Upload queue is full. Capture stopped; keep this page open while pending readings retry.'); return; }
    queue.current.push({ id: crypto.randomUUID(), timestamp: Date.now(), ...sample });
    setPending(queue.current.length);
  }
  useEffect(() => {
    alive.current = true;
    const hash = new URLSearchParams(location.hash.slice(1));
    const session = hash.get('session'), write = hash.get('write');
    if (session && /^[a-f0-9]{64}$/i.test(write || '')) { const next = { session, write: write! }; setPair(next); config.current.pair = next; }
    else setError('Open the phone connection link from the dashboard to join a session.');
    let deviceId = crypto.randomUUID();
    try { const previous = localStorage.getItem('seethrough-device-id'); if (previous && /^[a-zA-Z0-9_-]{1,64}$/.test(previous)) deviceId = previous; else localStorage.setItem('seethrough-device-id', deviceId); } catch {}
    config.current.deviceId = deviceId;
    const interval = setInterval(() => {
      void flush();
      if (recording.current && Date.now() - lastMotion.current > 8000) stop('No motion readings received for 8 seconds. Try Safari or Chrome on your phone and allow Motion & Orientation access.');
    }, 1000);
    const visibility = () => { if (document.hidden && recording.current) stop('Capture paused because this page left the foreground. Tap Start to resume.'); };
    const unload = (event: BeforeUnloadEvent) => { if (queue.current.length || recording.current) { event.preventDefault(); event.returnValue = ''; } };
    document.addEventListener('visibilitychange', visibility); window.addEventListener('beforeunload', unload);
    return () => { alive.current = false; stop(); clearInterval(interval); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('beforeunload', unload); };
  }, []);
  async function start() {
    setError(''); setNotice('');
    if (!window.isSecureContext || !('DeviceMotionEvent' in window)) { setError('Motion sensors need a supported phone browser over HTTPS. Room confirmation still works.'); return; }
    const attempt = ++generation.current;
    try {
      const motion = DeviceMotionEvent as MotionPermission;
      if (motion.requestPermission && await motion.requestPermission() !== 'granted') throw new Error('Motion permission was not granted. Allow Motion & Orientation access in your browser.');
      if (!alive.current || attempt !== generation.current || document.hidden) return;
      if (motionHandler.current) window.removeEventListener('devicemotion', motionHandler.current);
      lastMotion.current = Date.now(); lastQueued.current = 0;
      motionHandler.current = event => {
        const acceleration = vector(event.acceleration), accelerationIncludingGravity = vector(event.accelerationIncludingGravity);
        const rate = event.rotationRate;
        // Browser rates: alpha around Z, beta around X, gamma around Y, degrees/s.
        const degrees = rate ? vector({ x: rate.beta, y: rate.gamma, z: rate.alpha }) : undefined;
        const gyroscope = degrees ? { x: degrees.x * Math.PI / 180, y: degrees.y * Math.PI / 180, z: degrees.z * Math.PI / 180 } : undefined;
        if (!acceleration && !accelerationIncludingGravity && !gyroscope) return;
        lastMotion.current = Date.now();
        if (Date.now() - lastQueued.current < 100) return;
        lastQueued.current = Date.now();
        enqueue({ imu: { ...(acceleration && { acceleration }), ...(accelerationIncludingGravity && { accelerationIncludingGravity }), ...(gyroscope && { gyroscope }) } });
      };
      window.addEventListener('devicemotion', motionHandler.current); recording.current = true; setActive(true); setNotice('Keep this page visible and the phone unlocked. Raw readings upload about once per second.');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not start motion capture.'); }
  }
  return <main className="shell phone-shell"><header className="topbar"><a className="wordmark" href="/">See<span>/</span>Through</a><span className={`status-pill ${active ? 'online' : ''}`}><i />{active ? 'Capturing motion' : pair ? 'Phone connected' : 'Not paired'}</span></header><div className="page-heading"><div><p className="eyebrow">PHONE SENDER</p><h1>You’re on the map.</h1><p className="muted">Send your room and motion data to the live view.</p></div></div>
    {error && <div className="error" role="alert">{error}</div>}
    <section className="phone-card"><label className="field">Your name<input value={name} maxLength={64} onChange={e => setName(e.target.value)} placeholder="Your name" /></label><h2>Which room are you in?</h2><p>Tap a room to confirm your location. Your marker updates on the shared floor plan.</p><div className="room-buttons">{[1,2,3,4,5].map(n => <button key={n} disabled={!pair} className={room === n ? 'picked' : ''} onClick={() => { setRoom(n); enqueue({ roomNumber: n }); setNotice(`Room ${n} queued for upload.`); void flush(); }}>{n}</button>)}</div><button className="link-button" disabled={!pair} onClick={() => { setRoom(null); enqueue({ roomNumber: null }); void flush(); }}>My room is unknown</button></section>
    <section className="phone-card"><div className="row-between"><h2>Motion stream</h2><span className="small-badge">OPTIONAL · ~10 Hz</span></div><p>Streams accelerometer and gyroscope readings when your browser provides them. This does not estimate your walking position.</p><button className="full-width" disabled={!pair} onClick={() => active ? stop() : void start()}>{active ? 'Stop motion capture' : 'Allow sensors & start'}</button><div className="phone-stats"><div><strong>{sent.toLocaleString()}</strong><span>samples acknowledged</span></div><div><strong>{pending}</strong><span>queued for upload</span></div></div><div className="success" role="status">{notice}</div><p>Keep this page open until the queue reaches zero. Readings waiting to upload are held only in this tab.</p></section>
    <details className="phone-card"><summary>Developer test: send a coordinate</summary><p>Manually supplied metres from a shared origin. These points appear in the Walked path tab; they are not sensor estimates.</p><div className="manual-coordinates"><label className="field">X (m)<input type="number" value={x} onChange={e => setX(e.target.value)} /></label><label className="field">Y (m)<input type="number" value={y} onChange={e => setY(e.target.value)} /></label></div><button className="secondary full-width" disabled={!pair} onClick={() => { const px = Number(x), py = Number(y); if (!x.trim() || !y.trim() || !Number.isFinite(px) || !Number.isFinite(py) || Math.abs(px) > 10000 || Math.abs(py) > 10000) { setError('Enter coordinates between −10,000 and 10,000 metres.'); return; } enqueue({ position: { x: px, y: py, floor: 0 } }); setNotice('Manual coordinate queued.'); void flush(); }}>Send coordinate</button></details>
    <footer><a href="/api-guide">API guide ↗</a><span>24-hour demo session · no audio or video</span></footer>
  </main>;
}
