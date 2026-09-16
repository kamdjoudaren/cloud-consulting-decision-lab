import type { DecisionLink, Requirement } from '../types';
import { DomainError } from '../validation';

export function assignRequirementIds(
  previous: Requirement[],
  incoming: Requirement[],
  lastNumber: number,
) {
  const existing = new Set(previous.map((item) => item.id));
  const used = new Set<string>();
  const renamed = new Map<string, string>();
  let counter = lastNumber;
  const requirements = incoming.map((item) => {
    if (item.id && used.has(item.id))
      throw new DomainError('Each requirement must have a unique ID.');
    if (item.id) used.add(item.id);
    if (existing.has(item.id)) return item;
    const allocated = `R${String(++counter).padStart(2, '0')}`;
    if (item.id) renamed.set(item.id, allocated);
    return { ...item, id: allocated };
  });
  return { requirements, counter, renamed };
}

export function validateTraceability(requirements: Requirement[], links: DecisionLink[]) {
  const ids = new Set(requirements.map((item) => item.id));
  const linked = new Set<string>();
  for (const link of links) {
    if (!ids.has(link.requirementId))
      throw new DomainError(`Traceability references missing requirement ${link.requirementId}.`);
    if (linked.has(link.requirementId))
      throw new DomainError(`Only one traceability entry is allowed for ${link.requirementId}.`);
    linked.add(link.requirementId);
  }
}

export function requirementCoverage(requirements: Requirement[], links: DecisionLink[]): number {
  if (!requirements.length) return 0;
  const traced = new Set(
    links
      .filter((item) => item.decision.trim() && item.rationale.trim())
      .map((item) => item.requirementId),
  );
  return requirements.filter((item) => traced.has(item.id)).length / requirements.length;
}
