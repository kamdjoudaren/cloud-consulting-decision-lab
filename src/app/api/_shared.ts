import { ZodError } from 'zod';
import { DomainError } from '@/lib/validation';

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}
export async function readBody(request: Request): Promise<unknown> {
  const target = new URL(request.url);
  // Next may reconstruct request.url using its internal hostname. The validated
  // Host header preserves the exact browser origin, including the listening port.
  const host = request.headers.get('host') || target.host;
  let external: URL;
  try {
    external = new URL(`${target.protocol}//${host}`);
  } catch {
    throw new DomainError('Invalid request host.', 403);
  }
  if (external.host !== host || !['127.0.0.1', 'localhost', '[::1]'].includes(external.hostname))
    throw new DomainError('This single-user workspace accepts local requests only.', 403);
  const origin = request.headers.get('origin');
  if (origin && origin !== external.origin)
    throw new DomainError('Cross-origin writes are not allowed.', 403);
  const content = await request.text();
  if (content.length > 1_000_000) throw new DomainError('Request is too large.', 413);
  try {
    return JSON.parse(content);
  } catch {
    throw new DomainError('Request body must be valid JSON.', 400);
  }
}
export function failure(error: unknown): Response {
  if (error instanceof DomainError) return json({ error: error.message }, error.status);
  if (error instanceof ZodError)
    return json(
      {
        error: 'Invalid request. Check the highlighted fields.',
        issues: error.issues.map((item) => ({ path: item.path.join('.'), message: item.message })),
      },
      422,
    );
  console.error('[decision-lab]', error instanceof Error ? error.message : 'Unexpected error');
  return json(
    {
      error:
        'The action could not complete. Reload your saved case and retry. Your accepted records remain preserved.',
    },
    500,
  );
}
