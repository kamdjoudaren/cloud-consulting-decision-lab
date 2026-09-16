import type { ADR, Draft } from '../types';
import { DomainError } from '../validation';

export function acceptADR(
  draft: Draft,
  previous: ADR[],
  supersedes?: string | null,
  reason = '',
): ADR {
  if (!Object.values(draft.adr).every((value) => value.trim()))
    throw new DomainError('Complete every decision record field before accepting it.');
  const requirements = draft.links
    .filter(
      (link) => link.status !== 'unaddressed' && link.decision.trim() && link.rationale.trim(),
    )
    .map((link) => link.requirementId);
  if (!requirements.length)
    throw new DomainError(
      'Link the decision to at least one requirement before accepting its ADR.',
    );
  if (previous.length && supersedes !== previous.at(-1)!.id)
    throw new DomainError('A new accepted ADR must supersede the latest accepted record.');
  if (supersedes && !previous.some((item) => item.id === supersedes))
    throw new DomainError('The superseded ADR does not exist in this case.');
  if (supersedes && reason.trim().length < 10)
    throw new DomainError(
      'Explain why this record supersedes the previous decision (at least 10 characters).',
    );
  return {
    id: `ADR-${String(previous.length + 1).padStart(3, '0')}`,
    ...structuredClone(draft.adr),
    requirements,
    createdAt: new Date().toISOString(),
    supersedes: supersedes || null,
    reason: reason.trim(),
    status: 'accepted',
  };
}

export function assertADRUnchanged(previous: ADR, incoming: ADR): void {
  if (JSON.stringify(previous) !== JSON.stringify(incoming))
    throw new DomainError('Accepted ADRs are immutable. Create a superseding record instead.', 409);
}

export function hasCurrentADR(draft: Draft, records: ADR[]): boolean {
  const last = records.at(-1);
  const addressed = draft.links
    .filter(
      (link) => link.status !== 'unaddressed' && link.decision.trim() && link.rationale.trim(),
    )
    .map((link) => link.requirementId)
    .sort();
  return (
    !!last &&
    Object.entries(draft.adr).every(([key, value]) => last[key as keyof Draft['adr']] === value) &&
    JSON.stringify([...last.requirements].sort()) === JSON.stringify(addressed)
  );
}
