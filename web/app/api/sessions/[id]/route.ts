import { safe, readSession, options } from '@/lib/api';
export const OPTIONS = options;
export function GET(request: Request, context: { params: Promise<{ id: string }> }) { return safe(async () => readSession(request, (await context.params).id)); }
