import { dimensions, type CaseData, type Draft } from './types';

export const syntheticDisclaimer =
  'This is a synthetic consulting case created for cloud architecture practice. No real customer data is represented.';
export const readableLabel = (text: string) =>
  text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/^./, (c) => c.toUpperCase());
const cell = (value: unknown) =>
  String(value ?? '')
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, '<br>');
const paragraph = (name: string, value: unknown) =>
  `**${name}:** ${String(value ?? '').trim() || 'Not recorded.'}\n\n`;
const objectParagraphs = (value: Record<string, unknown>) =>
  Object.entries(value)
    .map(([key, text]) => paragraph(readableLabel(key), text))
    .join('');
const table = (headers: string[], rows: unknown[][]) =>
  `| ${headers.map(cell).join(' | ')} |\n| ${headers.map(() => '---').join(' | ')} |\n${rows.map((row) => `| ${row.map(cell).join(' | ')} |`).join('\n')}\n\n`;
const codeBlock = (source: string, language: string) => {
  const fence = '`'.repeat(
    Math.max(3, ...(source.match(/`+/g) || []).map((value) => value.length + 1)),
  );
  return `${fence}${language}\n${source}\n${fence}\n\n`;
};

export function draftToMarkdown(draft: Draft, headingDepth = 2): string {
  const heading = (title: string) => `${'#'.repeat(headingDepth)} ${title}\n\n`;
  let out = heading('Facts, assumptions, and unknowns');
  out += table(
    ['ID', 'Type', 'Note', 'Source', 'Confidence', 'Validation'],
    draft.notes.map((n) => [n.id, n.kind, n.text, n.source, n.confidence, n.validation]),
  );
  out += heading('Problem framing') + objectParagraphs(draft.framing);
  out +=
    heading('Requirements') +
    table(
      ['ID', 'Requirement', 'Priority', 'Source'],
      draft.requirements.map((r) => [r.id, r.text, r.priority, r.source]),
    );
  out += heading('Architecture options');
  for (const option of draft.options) {
    out += `${'#'.repeat(headingDepth + 1)} ${option.id}: ${option.name}\n\n`;
    const { ratings, ...fields } = option;
    out +=
      objectParagraphs(fields) +
      table(
        ['Dimension', 'Rating (1–5; higher is more favorable)'],
        dimensions.map((d) => [readableLabel(d), ratings[d]]),
      );
  }
  out +=
    heading('Trade-off matrix') +
    table(
      ['Dimension', ...draft.options.map((o) => o.name)],
      dimensions.map((d) => [readableLabel(d), ...draft.options.map((o) => o.ratings[d])]),
    );
  out +=
    'Ratings are the learner’s contextual assessments, not benchmarks. Higher is more favorable.\n\n';
  out += heading('Recommendation') + objectParagraphs(draft.recommendation);
  out += heading('Why not something simpler?') + `${draft.simpler || 'Not recorded.'}\n\n`;
  out +=
    heading('Requirement traceability') +
    table(
      ['Requirement', 'Decision', 'Status', 'Rationale'],
      draft.links.map((link) => [link.requirementId, link.decision, link.status, link.rationale]),
    );
  out +=
    heading('What would change my mind?') +
    table(
      ['ID', 'Condition', 'Signal', 'Threshold', 'Alternative'],
      draft.conditions.map((c) => [c.id, c.condition, c.signal, c.threshold, c.alternative]),
    );
  out += heading('Validation / proof of concept') + objectParagraphs(draft.poc);
  out += heading('ADR working draft') + objectParagraphs(draft.adr);
  out += heading('Communication') + objectParagraphs(draft.communication);
  out += heading('Architecture diagram') + codeBlock(draft.diagram, 'mermaid');
  out += heading('Final decision') + `${draft.finalDecision || 'Not recorded.'}\n\n`;
  out += heading('Lessons learned') + `${draft.lessons || 'Not recorded.'}\n\n`;
  return out;
}

function flatten(value: unknown, prefix = ''): Record<string, string> {
  if (value === null || typeof value !== 'object') return { [prefix]: String(value ?? '') };
  return Object.fromEntries(
    Object.entries(value).flatMap(([key, entry]) =>
      Object.entries(flatten(entry, prefix ? `${prefix} › ${key}` : key)),
    ),
  );
}

export function reasoningChanges(first: Draft, final: Draft) {
  const before = flatten(first);
  const after = flatten(final);
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => before[key] !== after[key])
    .map((key) => ({
      field: key.split(' › ').map(readableLabel).join(' › '),
      before: before[key] || 'Not recorded',
      after: after[key] || 'Not recorded',
    }));
}

export function caseToMarkdown(data: CaseData): string {
  const { session, scenario } = data;
  const final = session.snapshots.filter((s) => s.kind === 'final').at(-1);
  const first = session.snapshots.find((s) => s.kind === 'first');
  let out = `# ${scenario.title}\n\n> ${syntheticDisclaimer}\n\n`;
  if (session.isExample)
    out +=
      '> Worked example supplied with the application. This is demonstration content, not the learner’s work.\n\n';
  out +=
    paragraph('Company', scenario.company) +
    paragraph('Industry', scenario.industry) +
    paragraph('Difficulty', `Level ${scenario.level}`) +
    paragraph(
      'Company size',
      `${scenario.companySize} employees; ${scenario.engineeringTeamSize} engineers`,
    ) +
    paragraph('Skills practiced', scenario.skillTags.map(readableLabel).join(', ')) +
    paragraph('Case status', session.evaluation?.status || 'In progress') +
    paragraph('Updated', session.updatedAt);
  out += `## Business brief\n\n${scenario.businessBrief}\n\n### Initially known facts\n\n${scenario.knownFacts.map((f) => `- ${f}`).join('\n')}\n\n`;
  out += `### Stakeholders\n\n${table(
    ['Name', 'Role', 'Concern'],
    scenario.stakeholders.map((s) => [s.name, s.role, s.concern]),
  )}`;
  out += `## Final reasoning\n\n${draftToMarkdown(final?.draft || session.draft, 3)}`;
  out += '## Discovery transcript\n\n';
  for (const message of session.messages)
    out += `### ${message.role === 'consultant' ? 'Consultant' : message.stakeholder || 'Client'} · ${message.timestamp}\n\n${message.text}\n\n`;
  out += '## Evidence requests\n\n';
  for (const request of session.evidenceRequests)
    out +=
      paragraph('Question', request.question) +
      paragraph('Reason', request.reason) +
      paragraph('Availability', request.status) +
      paragraph('Response', request.response) +
      paragraph('Evidence references', request.evidenceIds.join(', ')) +
      paragraph('Requested at', request.timestamp);
  out += '## Accepted architecture decision records\n\n';
  for (const adr of session.adrs)
    out += `### ${adr.id}: ${adr.title}\n\n${objectParagraphs({ ...adr, requirements: adr.requirements.join(', ') })}`;
  out += '## Reviewer feedback and my responses\n\n';
  out += paragraph('Review provider', session.reviewProvider);
  for (const review of session.reviews)
    out += `### ${review.category} (${review.severity})\n\n${paragraph('Feedback', review.suggestion)}${paragraph('Response', review.response)}${paragraph('My rationale', review.rationale)}`;
  out += '## How my reasoning changed\n\n';
  if (first && final)
    out += table(
      ['Field', 'Before review', 'Final revision'],
      reasoningChanges(first.draft, final.draft).map((c) => [c.field, c.before, c.after]),
    );
  else out += 'A comparison requires both an immutable first and final snapshot.\n\n';
  if (session.evaluation) {
    const evaluation = session.evaluation;
    out +=
      '## Evaluation\n\n' +
      paragraph('Score', `${evaluation.total}/100`) +
      paragraph('Status', evaluation.status) +
      paragraph('Provider', evaluation.provider) +
      paragraph('Evaluated at', evaluation.evaluatedAt);
    out += table(
      ['Dimension', 'Score', 'Maximum', 'Feedback'],
      evaluation.dimensions.map((d) => [d.name, d.score, d.max, d.feedback]),
    );
    out +=
      paragraph('Critical misses', evaluation.criticalMisses.join('; ') || 'None') +
      paragraph('Strengths', evaluation.strengths.join('; ')) +
      paragraph('Improvements', evaluation.improvements.join('; '));
    out +=
      'Scores are formative feedback for this synthetic case, not certification of professional competence.\n\n';
  }
  for (const snapshot of session.snapshots)
    out += `## Immutable ${snapshot.kind === 'first' ? 'first analysis (before review)' : 'final analysis'}\n\nSnapshot ${snapshot.id} · ${snapshot.createdAt}\n\n${draftToMarkdown(snapshot.draft, 3)}`;
  return out;
}

export function downloadCaseMarkdown(data: CaseData) {
  const blob = new Blob([caseToMarkdown(data)], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${data.scenario.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const exportMarkdown = caseToMarkdown;
export const exportCaseMarkdown = caseToMarkdown;
