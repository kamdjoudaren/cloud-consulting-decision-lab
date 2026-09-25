import type { CaseData } from '../types';
import { caseToMarkdown, syntheticDisclaimer } from '../export';
import { reportFields } from './report';
import { economicMetrics } from './economics';

export function workProducts(data: CaseData): Record<string, string> {
  const { session } = data,
    d = session.draft,
    c = d.consulting;
  const header = `> ${syntheticDisclaimer}\n\n`;
  const files: Record<string, string> = { 'complete-case.md': caseToMarkdown(data) };
  if (!c) return files;
  Object.assign(files, {
    'discovery-notes.md': session.messages
      .map((m) => `### ${m.role} · ${m.stakeholder}\n\n${m.text}`)
      .join('\n\n'),
    'facts-assumptions-unknowns.md': d.notes
      .map(
        (n) =>
          `### ${n.kind}: ${n.text}\n\n${reportFields({ source: n.source, confidence: n.confidence, validation: n.validation })}`,
      )
      .join('\n\n'),
    'architecture-analysis.md': `${c.technicalAnalysis}\n\nCompeting hypothesis: ${c.hypotheses}\n\n${d.options.map((o) => `## ${o.name}\n\n${reportFields(o)}`).join('\n\n')}`,
    'finops-analysis.md': reportFields(c.economics),
    'financial-bridge.md': reportFields(economicMetrics(c.economics)),
    'dd-findings.md': c.findings.map((f) => `## ${f.title}\n\n${reportFields(f)}`).join('\n\n'),
    'risk-register.md': c.findings
      .map(
        (f) =>
          `## ${f.title}\n\n${reportFields({ materiality: f.materiality, reason: f.materialityReason, probability: f.probability, timing: f.timing, costToFix: f.costToFix, managementDependency: f.managementDependency, confidence: f.confidence, evidence: f.evidenceIds, validation: f.validation })}`,
      )
      .join('\n\n'),
    'executive-summary.md': reportFields({
      format: c.communicationFormat,
      summary: c.executiveSummary,
      confidence: c.recommendationConfidence,
      operatingPartner: c.operatingPartner,
      investmentCommittee: c.investmentCommittee,
    }),
    '100-day-plan.md': c.initiatives.map((i) => `## ${i.name}\n\n${reportFields(i)}`).join('\n\n'),
    'reflection.md': `${d.lessons}\n\n${session.evaluation?.debrief ? reportFields(session.evaluation.debrief) : 'Not evaluated yet.'}`,
  });
  for (const key of Object.keys(files))
    if (key !== 'complete-case.md') files[key] = header + files[key];
  files['financial-bridge.csv'] =
    'metric,value\n' +
    Object.entries(economicMetrics(c.economics))
      .map(([k, v]) => `${k},${v ?? ''}`)
      .join('\n');
  for (const doc of data.documents || [])
    files[
      `evidence/${doc.id.replace(/[^a-z0-9-]/gi, '-')}.${doc.format === 'csv' ? 'csv' : 'txt'}`
    ] = doc.content;
  return files;
}
function crc32(bytes: Buffer) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
/** ZIP stored entries: no subprocess, temporary files, external dependency or path input. */
export function zipWorkProducts(files: Record<string, string>): Buffer {
  const parts: Buffer[] = [],
    directory: Buffer[] = [];
  let offset = 0;
  for (const [path, content] of Object.entries(files)) {
    if (path.startsWith('/') || path.split('/').some((p) => p === '..') || path.includes('\\'))
      throw new Error('Invalid export entry path');
    const name = Buffer.from(path),
      bytes = Buffer.from(content),
      crc = crc32(bytes);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x800, 6);
    local.writeUInt16LE(33, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(bytes.length, 18);
    local.writeUInt32LE(bytes.length, 22);
    local.writeUInt16LE(name.length, 26);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x800, 8);
    central.writeUInt16LE(33, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(bytes.length, 20);
    central.writeUInt32LE(bytes.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(offset, 42);
    parts.push(local, name, bytes);
    directory.push(central, name);
    offset += local.length + name.length + bytes.length;
  }
  const central = Buffer.concat(directory),
    end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(Object.keys(files).length, 8);
  end.writeUInt16LE(Object.keys(files).length, 10);
  end.writeUInt32LE(central.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, central, end]);
}
