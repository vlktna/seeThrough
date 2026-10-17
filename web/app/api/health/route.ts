import { json } from '@/lib/api';
export function GET() { return json({ ok: true, service: 'seethrough-live', version: 1 }); }
