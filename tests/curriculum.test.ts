import { describe, expect, it } from 'vitest';
import { scenarios } from '../src/lib/scenarios/seeds';
import { scenarioSchema } from '../src/lib/scenarios/schema';
import { MockProvider } from '../src/lib/ai/mock-provider';
import { skills } from '../src/data/market-skill-matrix';

describe('Scenario curriculum', () => {
  it('provides five valid, distinct cases at each difficulty level', () => {
    expect(new Set(scenarios.map((scenario) => scenario.id)).size).toBe(25);
    for (let level = 1; level <= 5; level++) {
      expect(scenarios.filter((scenario) => scenario.level === level)).toHaveLength(5);
    }
    for (const scenario of scenarios) {
      const result = scenarioSchema.safeParse(scenario);
      expect(result.success, `${scenario.id}: ${JSON.stringify(result.error?.issues)}`).toBe(true);
      expect(scenario.skillTags.every((tag) => skills.some((skill) => skill.id === tag))).toBe(
        true,
      );
    }
  });

  it('generates valid disclosed variants even for a two-person company', async () => {
    const provider = new MockProvider();
    for (const companySize of [2, 80, 600]) {
      const scenario = await provider.generateScenario({
        level: 5,
        industry: 'Research',
        companySize,
        primarySkill: 'ai-infrastructure',
        secondarySkill: 'security',
      });
      expect(scenarioSchema.safeParse(scenario).success).toBe(true);
      expect(scenario.engineeringTeamSize).toBeLessThanOrEqual(companySize);
      expect(scenario.businessBrief).toContain('curated scenario variant');
    }
  });
});
