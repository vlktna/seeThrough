'use client';
import { useEffect, useRef, useState } from 'react';
import { placePeople } from '@/lib/rooms';
import { PEOPLE } from '@/lib/example-people';
import { api, auth, COLORS, type Connection, type Device, type Sample, type CreatedSession, type SessionData } from '@/lib/types';
import { PathChart, SensorChart } from './charts';
import { Footer, Icon, Navigation } from './ui';

const STORAGE = 'seethrough-live-session-v1';
const TAB_ICONS: Record<string, string> = { 'Floor plan': 'map-trifold', 'Walked path': 'path', Sensors: 'waveform', JSON: 'code' };
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
export default function Dashboard() {
  const [connection, setConnection] = useState<Connection | null>(null);
  const [devices, setDevices] = useState<Device[]>([]), [samples, setSamples] = useState<Sample[]>([]);
  const [name, setName] = useState('Hackathon venue'), [error, setError] = useState('');
  const [busy, setBusy] = useState(false), [example, setExample] = useState(false);
  const [tab, setTab] = useState('Floor plan'), [selected, setSelected] = useState(''), [floor, setFloor] = useState(0);
  const [status, setStatus] = useState('Not connected'), [total, setTotal] = useState(0), [origin, setOrigin] = useState('');
  const [copyStatus, setCopyStatus] = useState(''), [expiresAt, setExpiresAt] = useState(0);
  const cursor = useRef(0);
  useEffect(() => {
    setOrigin(location.origin);
    try {
      const hash = new URLSearchParams(location.hash.slice(1));
      const saved = JSON.parse(localStorage.getItem(STORAGE) || 'null');
      if (hash.get('session') && hash.get('read')) {
        const id = hash.get('session')!;
        setConnection({ id, readToken: hash.get('read')!, ...(saved?.id === id ? { writeToken: saved.writeToken } : {}) });
      } else if (saved?.id && saved?.readToken) setConnection(saved);
    } catch { /* Storage can be unavailable in private browsing. */ }
  }, []);
  useEffect(() => {
    if (!connection) return;
    cursor.current = 0; setStatus('Connecting'); setSamples([]); setDevices([]); setTotal(0); setExample(false);
    let stopped = false; let timer: ReturnType<typeof setTimeout>; const abort = new AbortController();
    const poll = async () => {
      let delay = 1000;
      try {
        const data = await api<SessionData>(`/api/sessions/${connection.id}?after=${cursor.current}`, { headers: auth(connection.readToken), signal: abort.signal });
        if (stopped) return;
        setDevices(data.devices); setName(data.session.name); setExpiresAt(data.session.expiresAt); setTotal(data.total);
        if (data.samples.length) setSamples(previous => [...previous, ...data.samples].slice(-10000));
        cursor.current = data.cursor; setStatus(data.hasMore ? 'Loading history' : 'Connected'); setError('');
        if (data.hasMore) delay = 10;
      } catch (e) {
        if (stopped) return;
        setStatus('Connection interrupted'); setError(e instanceof Error ? e.message : 'Could not connect.'); delay = 3000;
      }
      if (!stopped) timer = setTimeout(poll, delay);
    };
    poll();
    return () => { stopped = true; clearTimeout(timer); abort.abort(); };
  }, [connection]);
  async function create(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) { setError('Enter a session name to get started.'); return; }
    setBusy(true); setError('');
    try {
      const data = await api<CreatedSession>('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
      const next = { id: data.session.id, name: data.session.name, readToken: data.readToken, writeToken: data.writeToken };
      try { localStorage.setItem(STORAGE, JSON.stringify(next)); } catch { /* The URL still preserves viewer access. */ }
      location.hash = new URLSearchParams({ session: next.id, read: next.readToken }).toString();
      setConnection(next); setExample(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not create session.'); }
    finally { setBusy(false); }
  }
  async function copy(text: string, label: string) {
    try { await navigator.clipboard.writeText(text); setCopyStatus(`${label} copied`); }
    catch { setCopyStatus('Copy unavailable. Select the link below to copy it manually.'); }
  }
  function download() {
    const data = { sessionId: connection?.id, name, devices, samples, units: { position: 'metres', acceleration: 'm/s²', gyroscope: 'rad/s', timestamp: 'Unix milliseconds' } };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'seethrough-session.json'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const people: Device[] = example ? PEOPLE.map((p, i) => ({ ...p, deviceId: `example-${i}`, source: 'demo', lastSeen: 0 })) : devices;
  const placed = placePeople(people) as (Omit<Device, "position"> & { position: { x: number; y: number } | null })[];
  const deviceId = people.some(d => d.deviceId === selected) ? selected : people[0]?.deviceId;
  const filtered = samples.filter(s => s.deviceId === deviceId);
  const floors = [...new Set(filtered.flatMap(s => s.position ? [s.position.floor] : []))].sort((a, b) => a - b);
  const selectedFloor = floors.includes(floor) ? floor : (floors[0] ?? 0);
  const phoneLink = connection?.writeToken ? `${origin}/phone#${new URLSearchParams({ session: connection.id, write: connection.writeToken })}` : '';
  const viewLink = connection ? `${origin}/#${new URLSearchParams({ session: connection.id, read: connection.readToken })}` : '';
  return <div className="shell">
    <Navigation />
    <main id="main-content" tabIndex={-1}>
    <section className="page-heading" data-reveal><div><p className="eyebrow"><span className="live-dot" />Your space, connected</p><h1>Find your people.</h1><p className="muted">A shared view of who’s where. Connect a phone and bring your floor plan to life.</p></div><div className="heading-aside"><div className={`status-pill ${connection && status === 'Connected' ? 'online' : ''}`} role="status"><i />{example ? 'Example data' : status}</div><div className="heading-count"><strong>{people.length.toString().padStart(2, '0')}</strong><span>people<br />in this session</span></div></div></section>
    {!connection && <section className="start-card" data-reveal aria-busy={busy}><div><p className="eyebrow">Start here</p><h2>One session. Your whole team.</h2><p>Create a space, share a phone link, and see everyone on the map.</p></div><form onSubmit={create}><label htmlFor="session-name">Session name</label><input id="session-name" value={name} maxLength={64} onChange={e => setName(e.target.value)} placeholder="Session name" required /><button disabled={busy} className={busy ? 'loading-button' : ''}>{busy ? 'Creating session…' : 'Create session'} <Icon name="arrow-right" /></button></form><button className="link-button" onClick={() => setExample(!example)}>{example ? 'Hide example' : 'Explore an example'}</button></section>}
    {error && <div className="error" role="alert">{error}</div>}
    <div className="workspace" data-reveal><section className="map-card"><div className="card-heading"><div><h2>{connection ? name : 'Venue floor plan'}</h2><p>{example ? 'Sample roster from the repository · not live locations' : 'Room assignments received from connected phones'}</p></div><span className="small-badge"><Icon name="map-trifold" />5 rooms</span></div>
      <nav className="tabs" aria-label="Data views">{['Floor plan', 'Walked path', 'Sensors', 'JSON'].map(label => <button key={label} className={tab === label ? 'active' : ''} aria-pressed={tab === label} onClick={() => setTab(label)}><Icon name={TAB_ICONS[label]} />{label}</button>)}</nav>
      {tab !== 'Floor plan' && <div className="view-toolbar"><label>Device <select value={deviceId || ''} onChange={e => setSelected(e.target.value)}><option value="" disabled>Select device</option>{people.map(p => <option key={p.deviceId} value={p.deviceId}>{p.name}</option>)}</select></label>{tab === 'Walked path' && <label>Floor <select value={selectedFloor} onChange={e => setFloor(Number(e.target.value))}>{(floors.length ? floors : [0]).map(f => <option key={f} value={f}>{f}</option>)}</select></label>}</div>}
      {tab === 'Floor plan' && <><div className="map-stage"><span className="map-orientation" aria-label="Plan orientation"><Icon name="arrow-right" />Plan view</span><div className="floorplan"><img src="/floorplan.png" alt="Venue floor plan, rooms 1 to 5" width="600" height="540" />{placed.map((person, index) => person.position && <div key={person.deviceId} className="marker" style={{ left: `${person.position.x * 100}%`, top: `${person.position.y * 100}%` }} title={`${person.name}, Room ${person.roomNumber}`}><div className="head" style={{ borderColor: COLORS[index % COLORS.length] }}>{initials(person.name)}</div><span>{person.name.split(' ')[0]}</span></div>)}</div></div><div className="map-foot"><span><i className="legend-dot" /> {example ? 'Example people' : 'Confirmed room assignments'}</span><span>Source: team floorplan</span></div></>}
      {tab === 'Walked path' && <PathChart samples={filtered} floor={selectedFloor} />}
      {tab === 'Sensors' && <div className="sensor-stack"><p className="caption">Raw device readings. Moving the phone is not interpreted as walking.</p><SensorChart samples={filtered} kind="acceleration" /><SensorChart samples={filtered} kind="accelerationIncludingGravity" /><SensorChart samples={filtered} kind="gyroscope" /></div>}
      {tab === 'JSON' && <div className="json-view"><div className="row-between"><p className="caption">Latest 20 samples for this device</p><button className="secondary small" onClick={download} disabled={!samples.length}>Export session</button></div><pre>{JSON.stringify(filtered.slice(-20), null, 2)}</pre></div>}
    </section><aside className="people-card"><div className="card-heading"><h2><Icon name="users" />People</h2><span className="count-badge">{people.length}</span></div><div className="people-list" aria-busy={status === 'Connecting'}>{status === 'Connecting' && <div className="roster-skeleton" aria-label="Loading people"><span /><span /><span /></div>}{people.map((person, i) => <button className={`person-row ${deviceId === person.deviceId ? 'chosen' : ''}`} key={person.deviceId} onClick={() => setSelected(person.deviceId)}><span className="avatar" style={{ color: COLORS[i % COLORS.length], backgroundColor: `${COLORS[i % COLORS.length]}15` }}>{initials(person.name)}</span><span className="person-details"><strong>{person.name}</strong><small>{example ? 'Example person' : Date.now() - person.lastSeen < 10000 ? 'Receiving updates' : 'Last seen ' + new Date(person.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small></span><span className="room-label">{person.roomNumber ? `Room ${person.roomNumber}` : 'Unknown'}</span></button>)}{!people.length && status !== 'Connecting' && <div className="empty"><span className="empty-icon"><Icon name="users" /></span><h3>Your people belong here</h3><p>{connection ? 'Open the phone link below or send data using the API.' : 'Create your first session above, then invite someone to join.'}</p></div>}</div><div className="session-stats"><div><strong>{total.toLocaleString()}</strong><span>samples received</span></div><div><strong>1s</strong><span>refresh interval</span></div></div><p className="side-note">Room markers show the room reported by a phone. They do not represent an exact position inside that room.</p></aside></div>
    {connection && <section className="connection-card" data-reveal><div className="card-heading"><div><p className="eyebrow">Connect & share</p><h2>Bring a phone into the picture.</h2></div><span className="muted">Expires {expiresAt ? new Date(expiresAt).toLocaleString() : 'in 24 hours'}</span></div><div className="connection-grid">{phoneLink && <div><h3><span className="step-number">01</span>Connect a phone</h3><p>Share this link with a participant. It allows sending data to this session.</p><div className="copy-field"><input aria-label="Phone connection link" value={phoneLink} readOnly onFocus={e => e.target.select()} /><button className="secondary small" onClick={() => copy(phoneLink, 'Phone link')}><Icon name="copy" />Copy</button></div><a className="text-link" href={phoneLink} target="_blank" rel="noreferrer">Open phone sender <Icon name="arrow-up-right" /></a></div>}<div><h3><span className="step-number">{phoneLink ? '02' : '01'}</span>Share the live view</h3><p>This link can view the session, but cannot send data.</p><div className="copy-field"><input aria-label="View-only session link" value={viewLink} readOnly onFocus={e => e.target.select()} /><button className="secondary small" onClick={() => copy(viewLink, 'View link')}><Icon name="copy" />Copy</button></div></div></div><p className="copy-status" role="status">{copyStatus}</p>{connection.writeToken && <details className="api-details"><summary>Connect your native app</summary><p>POST JSON to <code>{origin}/api/sessions/{connection.id}/samples</code> using the session write token. See the <a href="/api-guide">API guide</a> for the exact format.</p><div className="copy-field"><input type="password" aria-label="Session write token" value={connection.writeToken} readOnly /><button className="secondary small" onClick={() => copy(connection.writeToken!, 'Write token')}>Copy token</button></div></details>}<button className="link-button" onClick={() => { setConnection(null); setDevices([]); setSamples([]); setTotal(0); setStatus('Not connected'); setError(''); history.replaceState(null, '', '/'); try { localStorage.removeItem(STORAGE); } catch {} }}>Leave this view and start another session</button></section>}
    </main>
    <Footer />
  </div>;
}
