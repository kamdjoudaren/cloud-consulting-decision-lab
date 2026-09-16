import { getCase, updateDraft } from '@/lib/cases/store';
import { patchSchema } from '@/lib/validation';
import { failure, json, readBody } from '../../_shared';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) {
  try {
    return json(getCase((await context.params).id));
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: Request, context: Context) {
  try {
    const { draft, version } = patchSchema.parse(await readBody(request));
    return json(updateDraft((await context.params).id, version, draft));
  } catch (error) {
    return failure(error);
  }
}
