import type {
  CaseSession,
  ClientResponse,
  Draft,
  Evaluation,
  EvidenceResponse,
  GeneratorInput,
  ReviewItem,
  Scenario,
} from '../types';
export interface AIProvider {
  readonly name: string;
  respondAsClient(
    scenario: Scenario,
    session: CaseSession,
    question: string,
    stakeholder: string,
  ): Promise<ClientResponse>;
  requestEvidence(scenario: Scenario, question: string, reason: string): Promise<EvidenceResponse>;
  reviewCase(scenario: Scenario, session: CaseSession): Promise<ReviewItem[]>;
  generateScenario(input: GeneratorInput): Promise<Scenario>;
  evaluateCommunication(draft: Draft): Promise<{ audience: string; feedback: string }[]>;
  evaluateCase?(
    scenario: Scenario,
    session: CaseSession,
    baseline: Evaluation,
  ): Promise<Evaluation>;
}
