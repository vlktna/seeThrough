'use client';
import { Icon } from './ui';
import type { Sample } from '@/lib/types';
export function PathChart({ samples, floor }: { samples: Sample[]; floor: number }) {
  const all = samples.filter(s => s.position).sort((a, b) => a.timestamp - b.timestamp);
  const points = all.filter(s => s.position!.floor === floor);
  if (!points.length) return <div className="empty chart-empty"><span className="empty-icon"><Icon name="path" /></span><h3>No coordinates yet</h3><p>Send position.x and position.y in metres from your app. Motion readings alone do not establish a path.</p></div>;
  const xs = points.map(s => s.position!.x), ys = points.map(s => s.position!.y);
  const minX = Math.min(...xs, 0), maxX = Math.max(...xs, 1), minY = Math.min(...ys, 0), maxY = Math.max(...ys, 1);
  const scale = Math.min(500 / Math.max(maxX - minX, 1), 300 / Math.max(maxY - minY, 1));
  const x = (v: number) => 50 + (v - minX) * scale;
  const y = (v: number) => 350 - (v - minY) * scale;
  const segments: Sample[][] = []; let previous: Sample | undefined;
  for (const sample of all) {
    if (sample.position!.floor === floor) {
      if (!previous || previous.position!.floor !== floor || sample.timestamp - previous.timestamp > 15000) segments.push([]);
      segments.at(-1)!.push(sample);
    }
    previous = sample;
  }
  const last = points.at(-1)!;
  return <><svg className="path-chart" viewBox="0 0 600 400" role="img" aria-label={`Received route coordinates on floor ${floor}`}>
    <defs><pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 L 0 0 0 25" fill="none" stroke="#e6ece7" strokeWidth="1" /></pattern></defs>
    <rect width="600" height="400" fill="url(#grid)" />
    {segments.map((segment, i) => <polyline key={i} points={segment.map(s => `${x(s.position!.x)},${y(s.position!.y)}`).join(' ')} fill="none" stroke="#447c70" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />)}
    <circle cx={x(points[0].position!.x)} cy={y(points[0].position!.y)} r="5" fill="#ffffff" stroke="#447c70" strokeWidth="3" />
    <circle cx={x(last.position!.x)} cy={y(last.position!.y)} r="8" fill="#b6e36d" stroke="#25473e" strokeWidth="3" />
    <text x="20" y="385" fontSize="12" fill="#6e7a72">X {minX.toFixed(1)}–{maxX.toFixed(1)} m · Y {minY.toFixed(1)}–{maxY.toFixed(1)} m</text>
  </svg><p className="caption">Coordinates supplied by the device · independent of the floorplan image · gaps over 15 seconds are not joined.</p></>;
}
export function SensorChart({ samples, kind }: { samples: Sample[]; kind: 'acceleration' | 'accelerationIncludingGravity' | 'gyroscope' }) {
  const points = samples.filter(s => s.imu?.[kind]).sort((a, b) => a.timestamp - b.timestamp).slice(-80);
  const title = kind === 'gyroscope' ? 'Gyroscope' : kind === 'accelerationIncludingGravity' ? 'Acceleration including gravity' : 'Linear acceleration';
  const unit = kind === 'gyroscope' ? 'rad/s' : 'm/s²';
  if (!points.length) return <div className="sensor-card"><h3>{title} <small>{unit}</small></h3><p className="muted">No readings received.</p></div>;
  const bound = Math.max(1, ...points.flatMap(s => Object.values(s.imu![kind]!)).map(Math.abs));
  const first = points[0].timestamp, span = Math.max(1, points.at(-1)!.timestamp - first);
  return <div className="sensor-card"><h3>{title} <small>{unit}</small></h3><svg viewBox="0 0 500 150" role="img" aria-label={`${title}, X Y Z axes`}>
    <line x1="0" y1="75" x2="500" y2="75" stroke="#dde5de" />
    {(['x', 'y', 'z'] as const).map((axis, i) => <polyline key={axis} points={points.map(s => `${5 + ((s.timestamp - first) / span) * 490},${75 - (s.imu![kind]![axis] / bound) * 60}`).join(' ')} stroke={['#447c70', '#bd8656', '#677aa1'][i]} strokeWidth="2" fill="none" />)}
  </svg><div className="axis-legend"><span>X {points.at(-1)!.imu![kind]!.x.toFixed(2)}</span><span>Y {points.at(-1)!.imu![kind]!.y.toFixed(2)}</span><span>Z {points.at(-1)!.imu![kind]!.z.toFixed(2)}</span></div></div>;
}
