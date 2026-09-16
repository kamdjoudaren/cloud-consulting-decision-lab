import type { Scenario, ScenarioPublic } from '@/lib/types';

/** Explicit allowlist: hidden curriculum data must never cross an API boundary. */
export function toPublicScenario(scenario: Scenario): ScenarioPublic {
  return {
    id: scenario.id,
    title: scenario.title,
    company: scenario.company,
    level: scenario.level,
    industry: scenario.industry,
    companySize: scenario.companySize,
    engineeringTeamSize: scenario.engineeringTeamSize,
    category: scenario.category,
    duration: scenario.duration,
    businessBrief: scenario.businessBrief,
    knownFacts: [...scenario.knownFacts],
    skillTags: [...scenario.skillTags],
    stakeholders: scenario.stakeholders.map((item) => ({ ...item })),
    generated: scenario.generated,
  };
}

export function normalizeQuestion(question: string) {
  return question
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function relevance(question: string, keywords: string[]): number {
  const normalized = ` ${normalizeQuestion(question)} `;
  return keywords.reduce(
    (score, keyword) =>
      score +
      (normalized.includes(` ${normalizeQuestion(keyword)} `) ? 1 + keyword.split(' ').length : 0),
    0,
  );
}

export function matchFacts(scenario: Scenario, question: string, max = 2) {
  return scenario.hiddenFacts
    .map((fact) => ({ fact, score: relevance(question, [fact.topic, ...fact.keywords]) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, Math.min(max, 2)))
    .map((item) => item.fact);
}

export function matchEvidence(scenario: Scenario, question: string, max = 1) {
  return scenario.evidenceAvailable
    .map((evidence) => ({
      evidence,
      score: relevance(question, [evidence.topic, ...evidence.keywords]),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, Math.min(max, 2)))
    .map((item) => item.evidence);
}
