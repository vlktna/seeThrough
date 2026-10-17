import { safe, createSession, options } from '@/lib/api';
export const OPTIONS = options;
export function POST(request: Request) { return safe(() => createSession(request)); }
