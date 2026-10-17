import { safe, ingest, options } from '@/lib/api';
export const OPTIONS = options;
export function POST(request: Request, context: { params: Promise<{ id: string }> }) { return safe(async () => ingest(request, (await context.params).id)); }
