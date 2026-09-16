import { describe, expect, it } from 'vitest';
import { exampleCase } from '../src/data/example-case';
import { caseToMarkdown, reasoningChanges, syntheticDisclaimer } from '../src/lib/export';

describe('Portfolio documents', () => {
  it('exports the full reasoning trail and labels synthetic example content', () => {
    const markdown = caseToMarkdown(exampleCase);
    expect(markdown).toContain(syntheticDisclaimer);
    expect(markdown).toContain('demonstration content, not the learner');
    for (const section of [
      'Business brief',
      'Requirement traceability',
      'Trade-off matrix',
      'Validation / proof of concept',
      'Accepted architecture decision records',
      'Reviewer feedback and my responses',
      'Immutable first analysis',
      'Immutable final analysis',
      'Architecture diagram',
    ]) {
      expect(markdown).toContain(section);
    }
    expect(markdown).toContain('ADR-001');
    expect(markdown).toContain('ADR-002');
    expect(markdown).toContain('reject');
  });

  it('uses the newest final snapshot and retains earlier immutable revisions', () => {
    const revised = structuredClone(exampleCase);
    const draft = structuredClone(revised.session.draft);
    draft.finalDecision = 'LATEST DECISION: validate the new condition before proceeding.';
    revised.session.snapshots.push({
      id: 'new-final',
      kind: 'final',
      draft,
      createdAt: '2026-02-01T12:00:00Z',
    });
    const markdown = caseToMarkdown(revised);
    const currentReasoning = markdown.split('## Discovery transcript')[0];
    expect(currentReasoning).toContain('LATEST DECISION');
    expect(markdown).toContain('SNAPSHOT-FIRST');
    expect(markdown).toContain('SNAPSHOT-FINAL');
    expect(markdown).toContain('new-final');
  });

  it('shows field changes without altering either original draft', () => {
    const before = structuredClone(exampleCase.session.draft);
    const after = structuredClone(before);
    after.recommendation.risks = 'An additional dependency needs validation.';
    const changes = reasoningChanges(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0].field).toContain('Risks');
    expect(before.recommendation.risks).not.toBe(after.recommendation.risks);
  });
});
