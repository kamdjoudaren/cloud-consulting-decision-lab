import { z } from 'zod';
import { createCase, listCases } from '@/lib/cases/store';
import { failure, json, readBody } from '../_shared';
import { assistanceModes } from '@/lib/lab/schema';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    return json({ cases: listCases() });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const input = z
      .object({ scenarioId: z.string().min(1).max(150), mode: z.enum(assistanceModes).optional() })
      .strict()
      .parse(await readBody(request));
    return json(createCase(input.scenarioId, false, input.mode), 201);
  } catch (error) {
    return failure(error);
  }
}
