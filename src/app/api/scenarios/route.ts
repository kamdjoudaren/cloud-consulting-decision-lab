import { getProvider } from '@/lib/ai/provider';
import { getPublicScenarios, saveGeneratedScenario } from '@/lib/cases/store';
import { generatorSchema } from '@/lib/validation';
import { scenarioSchema } from '@/lib/scenarios/schema';
import { failure, json, readBody } from '../_shared';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    return json({ scenarios: getPublicScenarios(), provider: getProvider().name });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    const input = generatorSchema.parse(await readBody(request));
    const scenario = scenarioSchema.parse(await getProvider().generateScenario(input));
    return json({ scenario: saveGeneratedScenario(scenario) }, 201);
  } catch (error) {
    return failure(error);
  }
}
