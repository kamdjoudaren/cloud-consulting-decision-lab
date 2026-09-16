import { performAction } from '@/lib/cases/actions';
import { actionSchema } from '@/lib/validation';
import { failure, json, readBody } from '../../../_shared';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    return json(
      await performAction((await context.params).id, actionSchema.parse(await readBody(request))),
    );
  } catch (error) {
    return failure(error);
  }
}
