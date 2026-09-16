import { z } from 'zod';
import { createCase, listCases } from '@/lib/cases/store';
import { failure, json, readBody } from '../_shared';
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
      .object({ scenarioId: z.string().min(1).max(150) })
      .strict()
      .parse(await readBody(request));
    return json(createCase(input.scenarioId), 201);
  } catch (error) {
    return failure(error);
  }
}
