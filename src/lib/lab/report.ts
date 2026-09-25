import type { ConsultingDraft } from './schema';
import { economicMetrics, valueLedger } from './economics';
export const reportFields = (record: object) =>
  Object.entries(record)
    .map(
      ([key, value]) =>
        `**${key.replace(/([a-z])([A-Z])/g, '$1 $2')}:** ${Array.isArray(value) ? value.join(', ') : value === null ? 'Not established' : String(value === '' || value === undefined ? 'Not recorded' : value)}\n`,
    )
    .join('\n');
export function consultingMarkdown(c: ConsultingDraft): string {
  return `## Technical analysis\n\n${c.technicalAnalysis}\n\n### Competing hypothesis\n\n${c.hypotheses}\n\n## FinOps and economics\n\n${reportFields(c.economics)}\n${reportFields(economicMetrics(c.economics))}\n## Technology → Value findings\n\n${c.findings.map((f) => `### ${f.title}\n\n${reportFields(f)}`).join('\n\n')}\n## Value realization / 100-Day Plan\n\n${reportFields(valueLedger(c.initiatives))}\n\nPlanning cash estimates are not realized FCF. Capacity and avoidance are not automatically cash savings.\n\n${c.initiatives.map((i) => `### ${i.name}\n\n${reportFields(i)}`).join('\n\n')}\n## Executive communication\n\n${reportFields({ format: c.communicationFormat, confidence: c.recommendationConfidence, executiveSummary: c.executiveSummary, operatingPartner: c.operatingPartner, investmentCommittee: c.investmentCommittee })}\n## Deliverables\n\n${c.deliverables.map((d) => `### ${d.title}\n\n${d.body}`).join('\n\n')}`;
}
