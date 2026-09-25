import { describe, expect, it } from 'vitest';
import { scenarios, legacyScenarios } from '../src/lib/scenarios/seeds';
import { validateSimulation } from '../src/lib/lab/engine';
import { scenarioSchema } from '../src/lib/scenarios/schema';
import { MockProvider } from '../src/lib/ai/mock-provider';
import { skills } from '../src/data/market-skill-matrix';

describe('Scenario curriculum', () => {
  it('provides architecture-first cases across every level with conditional alternatives', () => {
    const cloud = scenarios.filter((s) => s.id.startsWith('cloud-') && !s.lab);
    expect(cloud).toHaveLength(48);
    expect(new Set(cloud.map((s) => s.level)).size).toBe(5);
    for (const scenario of cloud) {
      expect(scenario.lab).toBeUndefined();
      expect(
        new Set(scenario.acceptableArchitecturePatterns.map((p) => p.name)).size,
      ).toBeGreaterThanOrEqual(2);
      expect(scenario.evidenceAvailable.some((e) => e.status === 'measurement_required')).toBe(
        true,
      );
    }
  });
  it('provides five valid, distinct cases at each difficulty level', () => {
    expect(new Set(scenarios.map((scenario) => scenario.id)).size).toBe(206);
    expect(scenarios.filter((s) => s.lab)).toHaveLength(145);
    expect(
      Object.fromEntries(
        [
          'Cloud',
          'FinOps',
          'AI / MLOps',
          'Buy-Side DD',
          'Value Creation',
          'Sell-Side',
          'M&A / Carve-Out',
          'Mega-Case',
        ].map((family) => [family, scenarios.filter((s) => s.lab?.family === family).length]),
      ),
    ).toEqual({
      Cloud: 30,
      FinOps: 22,
      'AI / MLOps': 17,
      'Buy-Side DD': 25,
      'Value Creation': 21,
      'Sell-Side': 10,
      'M&A / Carve-Out': 10,
      'Mega-Case': 10,
    });
    for (let level = 1; level <= 5; level++) {
      expect(legacyScenarios.filter((scenario) => scenario.level === level)).toHaveLength(5);
    }
    for (const scenario of scenarios) {
      const result = scenarioSchema.safeParse(scenario);
      validateSimulation(scenario);
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

  it('keeps advanced scenarios economically and operationally differentiated', () => {
    const authored = scenarios.filter((s) => s.lab);
    expect(new Set(authored.map((s) => s.profile?.industry)).size).toBeGreaterThanOrEqual(8);
    expect(
      new Set(authored.flatMap((s) => s.stakeholders.map((p) => p.name))).size,
    ).toBeGreaterThanOrEqual(20);
    expect(new Set(authored.map((s) => s.financialArchetype)).size).toBeGreaterThanOrEqual(8);
    for (const scenario of authored.filter((s) => s.level >= 2)) {
      expect(scenario.truth!.expectedFindings.length).toBeGreaterThanOrEqual(2);
      expect(scenario.evidenceAvailable.some((d) => d.provenance && d.period && d.scope)).toBe(
        true,
      );
    }
    expect(
      authored
        .filter((s) => s.lab?.family === 'Mega-Case')
        .every((s) => (s.lab?.chapters.length ?? 0) > 0),
    ).toBe(true);
  });
});
