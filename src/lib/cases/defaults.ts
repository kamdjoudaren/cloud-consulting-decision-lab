import type { Draft, ScenarioPublic } from '../types';
import { emptyConsulting } from '../lab/schema';
export function emptyDraft(scenario: ScenarioPublic): Draft {
  return {
    ...(scenario.lab ? { consulting: emptyConsulting() } : {}),
    notes: scenario.knownFacts.map((text, i) => ({
      id: `brief-${i + 1}`,
      kind: 'fact',
      text,
      source: 'Client brief',
      confidence: 'high',
      validation: '',
    })),
    requirements: [],
    framing: {
      statedProblem: scenario.businessBrief,
      actualProblem: '',
      businessImpact: '',
      symptoms: '',
      constraints: '',
      uncertainties: '',
    },
    options: [],
    recommendation: {
      optionId: '',
      decision: '',
      why: '',
      alternatives: '',
      risks: '',
      assumptions: '',
    },
    simpler: '',
    links: [],
    conditions: [],
    poc: {
      required: true,
      justification: '',
      hypothesis: '',
      scope: '',
      metrics: '',
      success: '',
      exit: '',
      goNoGo: '',
    },
    adr: { title: '', context: '', decision: '', alternatives: '', consequences: '', risks: '' },
    communication: {
      engineer: '',
      cto: '',
      cfo: '',
      ceo: '',
      analogy: '',
      withoutServiceNames: '',
    },
    diagram:
      'flowchart LR\n  Client[Customer] --> Application[Application]\n  Application --> Database[(Data store)]',
    finalDecision: '',
    lessons: '',
  };
}
