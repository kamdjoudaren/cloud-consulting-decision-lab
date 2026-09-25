import { afterEach, beforeEach, expect, it } from 'vitest';
import { closeDatabase } from '../src/lib/db';
import { activeScenarios, reservedScenarios } from '../src/lib/scenarios/seeds';
import {
  getPublicScenarios,
  getScenario,
  createCase,
  getCase,
  saveGeneratedScenario,
} from '../src/lib/cases/store';
import { MockProvider, relevantFacts } from '../src/lib/ai/mock-provider';
import { learningPath } from '../src/data/cloud-learning-guide';

beforeEach(() => {
  closeDatabase();
  process.env.DATABASE_PATH = ':memory:';
});
afterEach(() => {
  closeDatabase();
  delete process.env.DATABASE_PATH;
});

it('lists only the 48 active architecture cases while retaining reserved content and historical cases', () => {
  const historical = createCase('dd-growth-claim');
  const visible = getPublicScenarios();
  expect(visible).toHaveLength(48);
  expect(new Set(visible.map((s) => s.id))).toEqual(new Set(activeScenarios.map((s) => s.id)));
  expect(visible.every((s) => !s.lab)).toBe(true);
  expect(reservedScenarios).toHaveLength(158);
  expect(getScenario('dd-growth-claim').lab?.family).toBe('Buy-Side DD');
  expect(getCase(historical.session.id).session).toEqual(historical.session);
  expect(learningPath.every(([, , id]) => visible.some((s) => s.id === id))).toBe(true);
});

it('reveals a decision-changing host constraint through discovery without giving a recommendation', async () => {
  const scenario = getScenario('cloud-ecs-or-ec2');
  const session = createCase(scenario.id).session;
  expect(JSON.stringify(getPublicScenarios())).not.toContain(
    scenario.hiddenFacts.find((f) => f.topic === 'requirements')!.text,
  );
  const provider = new MockProvider();
  const answer = await provider.respondAsClient(
    scenario,
    session,
    'Quelles contraintes ECS EC2 et acces host devons-nous comprendre ?',
    'Sam Chen',
  );
  expect(answer.revealedFactIds.length).toBeGreaterThan(0);
  expect(answer.text).toContain('host access');
  expect(relevantFacts(scenario, 'Give me the solution')).toEqual([]);
});

it('generates new architecture variants without returning reserved PE templates', async () => {
  const generated = await new MockProvider().generateScenario({
    level: 1,
    industry: 'Retail',
    companySize: 24,
    primarySkill: 'compute',
    secondarySkill: 'containers',
  });
  expect(generated.lab).toBeUndefined();
  expect(activeScenarios.some((s) => generated.title.startsWith(s.title))).toBe(true);
  const saved = saveGeneratedScenario(generated);
  expect(getPublicScenarios().some((s) => s.id === saved.id)).toBe(true);
});
