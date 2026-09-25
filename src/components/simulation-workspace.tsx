'use client';
import { useState } from 'react';
import type { CaseData, Draft, Evidence } from '@/lib/types';
import {
  assistanceModes,
  findingSchema,
  initiativeSchema,
  valueKinds,
  valueStages,
  type ConsultingDraft,
  type Finding,
  type Initiative,
} from '@/lib/lab/schema';
import { economicMetrics, valueLedger } from '@/lib/lab/economics';
import { reasoningFeedback } from '@/lib/lab/coaching';
import { glossary, driverMaps } from '@/data/learning-guide';
import { TextField, SelectField } from './form-fields';
import { emptyOption } from './analysis-steps';
import './simulation.css';

type Props = { data: CaseData; draft: Draft; onChange: (draft: Draft) => void };
type Run = (action: string, payload?: Record<string, unknown>) => Promise<boolean>;
const money = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
const number = (n: number | null, suffix = '') =>
  n === null
    ? 'Not established'
    : `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n)}${suffix}`;
export function EvidencePicker({
  documents,
  value,
  onChange,
}: {
  documents: Evidence[];
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  return (
    <fieldset className="evidence-picker">
      <legend>Source evidence</legend>
      {documents.length ? (
        documents.map((d) => (
          <label key={d.id}>
            <input
              type="checkbox"
              checked={value.includes(d.id)}
              onChange={(e) =>
                onChange(e.target.checked ? [...value, d.id] : value.filter((id) => id !== d.id))
              }
            />
            {d.title} <small>({d.status.replaceAll('_', ' ')})</small>
          </label>
        ))
      ) : (
        <p>Request a document in Discovery before linking evidence.</p>
      )}
    </fieldset>
  );
}
export function EvidenceLibrary({ documents }: { documents: Evidence[] }) {
  function download(d: Evidence) {
    const url = URL.createObjectURL(
      new Blob([d.content], {
        type: d.format === 'csv' ? 'text/csv;charset=utf-8' : 'text/plain;charset=utf-8',
      }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `${d.id}.${d.format === 'csv' ? 'csv' : 'txt'}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <details className="lab-panel">
      <summary>Evidence room · {documents.length} requested records</summary>
      <p className="muted">
        Records appear only after a relevant request. A planned measurement is not a completed test.
      </p>
      {documents.map((d) => (
        <details className="document-record" key={d.id}>
          <summary>
            {d.title} · {d.status.replaceAll('_', ' ')}
          </summary>
          <p>{d.source}</p>
          {(d.period || d.scope || d.owner || d.provenance || d.confidence) && (
            <p className="muted small">
              {[
                d.period,
                d.scope,
                d.owner,
                d.provenance,
                d.confidence ? `confidence: ${d.confidence}` : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          {d.definition && <p className="muted small">Definition: {d.definition}</p>}
          <pre>{d.content}</pre>
          <button type="button" className="button secondary small" onClick={() => download(d)}>
            Download record
          </button>
        </details>
      ))}
    </details>
  );
}
export function SimulationTools({ data, draft, run, busy }: Props & { run: Run; busy: boolean }) {
  const [term, setTerm] = useState('Gross Profit / Gross Margin');
  const [chapterNote, setChapterNote] = useState('');
  const sim = data.session.simulation;
  if (!sim) return null;
  const entry = glossary.find((g) => g.term === term)!;
  const chapters = data.scenario.lab?.chapters || [];
  const current = chapters[sim.chapter];
  return (
    <section className="simulation-tools" aria-label="Simulation assistance">
      <div className="simulation-mode">
        <strong>{data.scenario.lab?.context}</strong>
        {data.session.phase === 'brief' ? (
          <SelectField
            label="Assistance mode"
            value={sim.mode}
            onChange={(mode) => void run('assistance', { mode })}
          >
            {assistanceModes.map((m) => (
              <option key={m} value={m}>
                {m[0].toUpperCase() + m.slice(1)}
              </option>
            ))}
          </SelectField>
        ) : (
          <span className="badge">
            {sim.mode} · {sim.hints.length} hints
          </span>
        )}
      </div>
      <p className="muted small">
        Difficulty controls the work required. Assistance controls coaching. Hard hints cost 2
        points each, up to 10; Expert has no contextual hints.
      </p>
      {current && (
        <details className="lab-panel" open>
          <summary>
            {current.title} · {sim.chapter + 1}/{chapters.length}
          </summary>
          <p>{current.task}</p>
          {sim.chapter < chapters.length - 1 && (
            <>
              <TextField
                label="Chapter finding and remaining uncertainty"
                value={chapterNote}
                onChange={setChapterNote}
              />
              <button
                className="button secondary"
                disabled={busy || chapterNote.trim().length < 20}
                onClick={async () => {
                  if (await run('chapter', { note: chapterNote })) setChapterNote('');
                }}
              >
                Record chapter & advance workstream
              </button>
            </>
          )}
          {sim.chapterNotes.map((n) => (
            <p key={n.chapter}>
              <strong>{chapters[n.chapter]?.title}:</strong> {n.text}
            </p>
          ))}
        </details>
      )}
      {sim.mode !== 'expert' && (
        <details className="lab-panel">
          <summary>
            Coach & terminology{sim.mode === 'hard' ? ' · requested hints cost points' : ''}
          </summary>
          <div className="actions">
            {(['evidence', 'small', 'metric', 'reasoning'] as const).map((kind) => (
              <button
                type="button"
                className="button secondary small"
                key={kind}
                disabled={busy}
                onClick={() => void run('hint', { kind })}
              >
                {
                  {
                    evidence: 'What evidence could help?',
                    small: 'Give me a small hint',
                    metric: 'Why does this metric matter?',
                    reasoning: 'What is missing?',
                  }[kind]
                }
              </button>
            ))}
          </div>
          {sim.hints.map((h, i) => (
            <p className="coach-note" key={i}>
              {h.text}
              {h.cost > 0 && <small> Assistance cost: {h.cost} points</small>}
            </p>
          ))}
          {sim.mode === 'guided' &&
            reasoningFeedback({ ...data.session, draft })
              .slice(0, 2)
              .map((note) => (
                <p className="coach-note" key={note}>
                  {note}
                </p>
              ))}
          <SelectField label="Explain this term" value={term} onChange={setTerm}>
            {glossary.map((g) => (
              <option key={g.term}>{g.term}</option>
            ))}
          </SelectField>
          <p>
            <strong>{entry.term}:</strong> {entry.definition}
          </p>
          <p>{entry.example}</p>
          <p className="muted">{entry.analogy}</p>
        </details>
      )}
      <EvidenceLibrary documents={data.documents || []} />
    </section>
  );
}
const findingFields: [keyof Finding, string][] = [
  ['title', 'Finding title'],
  ['technical', 'Technical signal'],
  ['operational', 'Operational consequence'],
  ['customer', 'Customer consequence'],
  ['businessMetric', 'Business metric affected'],
  ['financialMetric', 'Financial metric affected'],
  ['action', 'Recommended action'],
  ['validation', 'Evidence still needed / validation'],
  ['materialityReason', 'Why this is material'],
];
function newFinding(): Finding {
  return findingSchema.parse({
    id: crypto.randomUUID(),
    title: '',
    technical: '',
    operational: '',
    customer: '',
    businessMetric: '',
    financialMetric: '',
    forecast: '',
    value: '',
    action: '',
    confidence: 'medium',
    evidenceIds: [],
    materiality: 'amber',
    materialityReason: '',
    probability: 50,
    timing: '',
    costToFix: 0,
    managementDependency: '',
    validation: '',
  });
}
function newInitiative(): Initiative {
  return initiativeSchema.parse({
    id: crypto.randomUUID(),
    name: '',
    owner: '',
    baseline: '',
    target: '',
    annualValue: 0,
    kind: 'recurring',
    stage: 'identified',
    cost: 0,
    offset: 0,
    monthsToStart: 0,
    timeline: 'Days 1–30',
    risk: '',
    confidence: 'medium',
    kpi: '',
    evidenceIds: [],
    verifiedAnnualValue: 0,
    financeSignoff: '',
    benefitKey: '',
  });
}
export function SimulationAnalysis({ data, draft, onChange }: Props) {
  const [tab, setTab] = useState('Technical analysis');
  const c = draft.consulting!;
  const docs = data.documents || [];
  const update = (patch: Partial<ConsultingDraft>) =>
    onChange({ ...draft, consulting: { ...c, ...patch } });
  const metrics = economicMetrics(c.economics);
  const ledger = valueLedger(c.initiatives);
  const editFinding = (id: string, patch: Partial<Finding>) =>
    update({ findings: c.findings.map((f) => (f.id === id ? { ...f, ...patch } : f)) });
  const editInitiative = (id: string, patch: Partial<Initiative>) =>
    update({ initiatives: c.initiatives.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  return (
    <section className="lab-analysis">
      <div className="step-intro">
        <div className="eyebrow">INVESTIGATE → REASON → QUANTIFY</div>
        <h2>Connect the technology to the decision.</h2>
        <p>
          Build a sourced explanation. An explicit “not established yet” is better than invented
          certainty.
        </p>
      </div>
      <div className="lab-tabs" role="tablist" aria-label="Analysis workstreams">
        {['Technical analysis', 'Economics', 'Value bridge', '100-Day Plan', 'Deliverables'].map(
          (name) => (
            <button role="tab" aria-selected={tab === name} key={name} onClick={() => setTab(name)}>
              {name}
            </button>
          ),
        )}
      </div>
      <div className="lab-sheet">
        {tab === 'Technical analysis' && (
          <>
            <TextField
              label="Technical interpretation"
              value={c.technicalAnalysis}
              onChange={(technicalAnalysis) => update({ technicalAnalysis })}
              hint="Separate a measured signal from its possible cause."
            />
            <TextField
              label="Competing hypothesis"
              value={c.hypotheses}
              onChange={(hypotheses) => update({ hypotheses })}
              hint="Include the possibility that management is right or no infrastructure change is needed."
            />
            <p className="muted">
              Return to Discovery from the progress bar whenever another question could change your
              conclusion.
            </p>
          </>
        )}
        {tab === 'Economics' && (
          <>
            <h3>Comparable units, then conclusions.</h3>
            <p>
              Use consistent periods and useful completed outputs. All inputs are fictional USD
              amounts.
            </p>
            {docs
              .filter((d) => d.metrics)
              .map((d) => (
                <button
                  type="button"
                  className="button secondary"
                  key={d.id}
                  onClick={() =>
                    update({
                      economics: {
                        ...c.economics,
                        ...d.metrics,
                        period: 'Comparable full years',
                        unit: 'Completed transactions',
                        sourceIds: [d.id],
                      },
                    })
                  }
                >
                  Use requested ledger
                </button>
              ))}
            <div className="lab-numbers">
              {(
                [
                  'cloudBefore',
                  'cloudAfter',
                  'unitsBefore',
                  'unitsAfter',
                  'revenueBefore',
                  'revenueAfter',
                  'cogsBefore',
                  'cogsAfter',
                ] as const
              ).map((key) => (
                <label className="field" key={key}>
                  {
                    {
                      cloudBefore: 'Prior cloud cost',
                      cloudAfter: 'Current cloud cost',
                      unitsBefore: 'Prior completed units',
                      unitsAfter: 'Current completed units',
                      revenueBefore: 'Prior recognized revenue',
                      revenueAfter: 'Current recognized revenue',
                      cogsBefore: 'Prior total COGS',
                      cogsAfter: 'Current total COGS',
                    }[key]
                  }
                  <input
                    type="number"
                    min="0"
                    value={c.economics[key] ?? ''}
                    onChange={(e) =>
                      update({
                        economics: {
                          ...c.economics,
                          [key]: e.target.value === '' ? null : Number(e.target.value),
                        },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="metric-comparison">
              <p>
                Cloud spend change <strong>{number(metrics.spendGrowth, '%')}</strong>
              </p>
              <p>
                Useful volume change <strong>{number(metrics.volumeGrowth, '%')}</strong>
              </p>
              <p>
                Cost per unit{' '}
                <strong>
                  {number(metrics.unitBefore)} → {number(metrics.unitAfter)} USD
                </strong>
              </p>
              <p>
                Unit-cost change <strong>{number(metrics.unitChange, '%')}</strong>
              </p>
              <p>
                Gross Margin{' '}
                <strong>
                  {number(metrics.grossMarginBefore, '%')} → {number(metrics.grossMarginAfter, '%')}
                </strong>
              </p>
            </div>
            <div className="grid-2">
              <TextField
                label="Comparison period"
                rows={1}
                value={c.economics.period}
                onChange={(period) => update({ economics: { ...c.economics, period } })}
              />
              <TextField
                label="Useful unit definition"
                rows={1}
                value={c.economics.unit}
                onChange={(unit) => update({ economics: { ...c.economics, unit } })}
              />
            </div>
            <EvidencePicker
              documents={docs}
              value={c.economics.sourceIds}
              onChange={(sourceIds) => update({ economics: { ...c.economics, sourceIds } })}
            />
            <SelectField
              label="Unit economics conclusion"
              value={c.economics.conclusion}
              onChange={(conclusion) =>
                update({
                  economics: {
                    ...c.economics,
                    conclusion: conclusion as typeof c.economics.conclusion,
                  },
                })
              }
            >
              {['unknown', 'improving', 'deteriorating', 'mixed'].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </SelectField>
            <TextField
              label="Economic interpretation and limits"
              value={c.economics.interpretation}
              onChange={(interpretation) =>
                update({ economics: { ...c.economics, interpretation } })
              }
            />
            <details>
              <summary>Metric driver maps</summary>
              {driverMaps.map((m) => (
                <p key={m.metric}>
                  <strong>{m.metric}:</strong> {m.drivers} {m.check}
                </p>
              ))}
            </details>
          </>
        )}
        {tab === 'Value bridge' && (
          <>
            <h3>Technology → Operations → Customer → Finance → Value</h3>
            <p>Connect the steps; distinguish a possible mechanism from a verified outcome.</p>
            {c.findings.map((f, index) => (
              <section className="lab-record" key={f.id}>
                <div className="section-heading">
                  <h3>Finding {index + 1}</h3>
                  <button
                    type="button"
                    className="button ghost small"
                    onClick={() => update({ findings: c.findings.filter((v) => v.id !== f.id) })}
                  >
                    Remove finding
                  </button>
                </div>
                {findingFields.map(([key, label]) => (
                  <TextField
                    key={key}
                    label={label}
                    value={String(f[key])}
                    rows={2}
                    onChange={(v) => editFinding(f.id, { [key]: v })}
                  />
                ))}
                <EvidencePicker
                  documents={docs}
                  value={f.evidenceIds}
                  onChange={(evidenceIds) => editFinding(f.id, { evidenceIds })}
                />
                <div className="grid-2">
                  <SelectField
                    label="Finding confidence"
                    value={f.confidence}
                    onChange={(v) => editFinding(f.id, { confidence: v as Finding['confidence'] })}
                  >
                    {['low', 'medium', 'high'].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </SelectField>
                  <SelectField
                    label="Materiality"
                    value={f.materiality}
                    onChange={(v) =>
                      editFinding(f.id, { materiality: v as Finding['materiality'] })
                    }
                  >
                    {['green', 'amber', 'red'].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </SelectField>
                </div>
                <details>
                  <summary>Forecast, transaction and remediation details</summary>
                  {(
                    [
                      ['forecast', 'Forecast consequence'],
                      ['value', 'Value / transaction consequence'],
                      ['timing', 'Timing'],
                      ['managementDependency', 'Management dependency'],
                    ] as const
                  ).map(([key, label]) => (
                    <TextField
                      key={key}
                      label={label}
                      value={f[key]}
                      onChange={(v) => editFinding(f.id, { [key]: v })}
                    />
                  ))}
                  <label className="field">
                    Estimated probability (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={f.probability}
                      onChange={(e) => editFinding(f.id, { probability: Number(e.target.value) })}
                    />
                  </label>
                  <label className="field">
                    Cost-to-fix planning estimate (USD)
                    <input
                      type="number"
                      min="0"
                      value={f.costToFix}
                      onChange={(e) => editFinding(f.id, { costToFix: Number(e.target.value) })}
                    />
                  </label>
                </details>
              </section>
            ))}
            <button
              className="button secondary"
              onClick={() => update({ findings: [...c.findings, newFinding()] })}
            >
              Add finding
            </button>
          </>
        )}
        {tab === '100-Day Plan' && (
          <>
            <h3>From identified opportunity to verified value.</h3>
            <p>
              Recurring savings, one-off cash, avoidance, capacity, revenue and risk reduction
              remain separate. Use the same benefit key for the same dollars across Gross Margin and
              EBITDA views.
            </p>
            <div className="metric-comparison">
              <p>
                Identified annual recurring opportunity{' '}
                <strong>{money(ledger.identifiedRecurring)}</strong>
              </p>
              <p>
                Verified net recurring value <strong>{money(ledger.verifiedRecurring)}</strong>
              </p>
              <p>
                Illustrative first-year net cash <strong>{money(ledger.firstYearNetCash)}</strong>
              </p>
            </div>
            <p className="muted">
              First-year cash is a planning illustration after implementation and recurring offsets;
              it is not realized FCF. Capacity, avoidance, revenue and risk are excluded.
            </p>
            {ledger.warnings.map((w) => (
              <p className="alert warning" key={w}>
                {w}
              </p>
            ))}
            {c.initiatives.map((i, index) => (
              <section className="lab-record" key={i.id}>
                <h3>Initiative {index + 1}</h3>
                {(
                  [
                    ['name', 'Initiative name'],
                    ['benefitKey', 'Unique benefit key'],
                    ['owner', 'Accountable owner'],
                    ['baseline', 'Measured baseline'],
                    ['target', 'Target'],
                    ['kpi', 'KPI and guardrail'],
                    ['risk', 'Execution risk'],
                    ['financeSignoff', 'Finance verification / sign-off'],
                  ] as const
                ).map(([key, label]) => (
                  <TextField
                    key={key}
                    label={label}
                    value={i[key]}
                    rows={2}
                    onChange={(v) => editInitiative(i.id, { [key]: v })}
                  />
                ))}
                <div className="grid-2">
                  <SelectField
                    label="Benefit category"
                    value={i.kind}
                    onChange={(v) => editInitiative(i.id, { kind: v as Initiative['kind'] })}
                  >
                    {valueKinds.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </SelectField>
                  <SelectField
                    label="Realization stage"
                    value={i.stage}
                    onChange={(v) => editInitiative(i.id, { stage: v as Initiative['stage'] })}
                  >
                    {valueStages.map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </SelectField>
                  <SelectField
                    label="Initiative confidence"
                    value={i.confidence}
                    onChange={(v) =>
                      editInitiative(i.id, { confidence: v as Initiative['confidence'] })
                    }
                  >
                    {['low', 'medium', 'high'].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </SelectField>
                  <SelectField
                    label="Delivery checkpoint"
                    value={i.timeline}
                    onChange={(timeline) => editInitiative(i.id, { timeline })}
                  >
                    {['Day 1', 'Days 1–30', 'Days 30–100', 'Month 6', 'Year 1'].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </SelectField>
                </div>
                <div className="lab-numbers">
                  {(
                    [
                      ['annualValue', 'Gross annual opportunity / one-off amount'],
                      ['cost', 'One-time implementation cash'],
                      ['offset', 'Annual recurring offset'],
                      ['monthsToStart', 'Months until benefits begin'],
                      ['verifiedAnnualValue', 'Finance-verified gross annual value'],
                    ] as const
                  ).map(([key, label]) => (
                    <label className="field" key={key}>
                      {label}
                      <input
                        type="number"
                        min="0"
                        value={i[key]}
                        onChange={(e) => editInitiative(i.id, { [key]: Number(e.target.value) })}
                      />
                    </label>
                  ))}
                </div>
                <EvidencePicker
                  documents={docs}
                  value={i.evidenceIds}
                  onChange={(evidenceIds) => editInitiative(i.id, { evidenceIds })}
                />
                <button
                  className="button ghost small"
                  onClick={() =>
                    update({ initiatives: c.initiatives.filter((v) => v.id !== i.id) })
                  }
                >
                  Remove initiative
                </button>
              </section>
            ))}
            <button
              className="button secondary"
              onClick={() => update({ initiatives: [...c.initiatives, newInitiative()] })}
            >
              Add initiative
            </button>
          </>
        )}
        {tab === 'Deliverables' && (
          <>
            <h3>Work products that show your reasoning.</h3>
            <p>Suggested: {data.scenario.lab?.deliverables.join(' · ')}</p>
            {c.deliverables.map((doc, index) => (
              <section className="lab-record" key={index}>
                <TextField
                  label="Deliverable title"
                  rows={1}
                  value={doc.title}
                  onChange={(title) =>
                    update({
                      deliverables: c.deliverables.map((v, i) =>
                        i === index ? { ...v, title } : v,
                      ),
                    })
                  }
                />
                <TextField
                  label="Deliverable content"
                  rows={10}
                  value={doc.body}
                  onChange={(body) =>
                    update({
                      deliverables: c.deliverables.map((v, i) =>
                        i === index ? { ...v, body } : v,
                      ),
                    })
                  }
                  hint="State finding, evidence, confidence, implications, options and an owned next step."
                />
                <button
                  className="button ghost small"
                  onClick={() =>
                    update({ deliverables: c.deliverables.filter((_, i) => i !== index) })
                  }
                >
                  Remove deliverable
                </button>
              </section>
            ))}
            <button
              className="button secondary"
              onClick={() => update({ deliverables: [...c.deliverables, { title: '', body: '' }] })}
            >
              Add deliverable
            </button>
          </>
        )}
      </div>
    </section>
  );
}
export function SimulationOptions({ draft, onChange }: Props) {
  return (
    <section className="lab-sheet">
      <h2>Compare actions, including doing less.</h2>
      <p>
        Compare at least two credible options. Deferring a change for a targeted test is a
        legitimate choice.
      </p>
      {draft.options.map((option, index) => (
        <section className="lab-record" key={option.id}>
          <h3>Option {index + 1}</h3>
          {(
            [
              ['name', 'Option name'],
              ['summary', 'Option summary'],
              ['cost', 'Cost and implementation effort'],
              ['risks', 'Risks and customer guardrails'],
              ['tradeoffRationale', 'Trade-off and reversibility'],
            ] as const
          ).map(([key, label]) => (
            <TextField
              key={key}
              label={label}
              value={option[key]}
              onChange={(value) =>
                onChange({
                  ...draft,
                  options: draft.options.map((o) =>
                    o.id === option.id ? { ...o, [key]: value } : o,
                  ),
                })
              }
            />
          ))}
          <details>
            <summary>Architecture and operations detail</summary>
            {(
              [
                'components',
                'reliability',
                'security',
                'operations',
                'assumptions',
                'implementation',
              ] as const
            ).map((key) => (
              <TextField
                key={key}
                label={key}
                value={option[key]}
                onChange={(value) =>
                  onChange({
                    ...draft,
                    options: draft.options.map((o) =>
                      o.id === option.id ? { ...o, [key]: value } : o,
                    ),
                  })
                }
              />
            ))}
          </details>
        </section>
      ))}
      <button
        className="button secondary"
        onClick={() => onChange({ ...draft, options: [...draft.options, emptyOption()] })}
      >
        Add option
      </button>
    </section>
  );
}
export function SimulationCommunication({ data, draft, onChange }: Props) {
  const c = draft.consulting!;
  const update = (patch: Partial<ConsultingDraft>) =>
    onChange({ ...draft, consulting: { ...c, ...patch } });
  return (
    <section className="lab-sheet">
      <h2>One decision, different responsibilities.</h2>
      <SelectField
        label="Communication format"
        value={c.communicationFormat}
        onChange={(v) =>
          update({ communicationFormat: v as ConsultingDraft['communicationFormat'] })
        }
      >
        {[
          '30-second summary',
          '90-second summary',
          '5-minute explanation',
          'Executive one-pager',
          'DD finding',
          'Risk register',
          'Business case',
          '100-Day action',
          'IC summary',
          'Sell-side evidence response',
        ].map((v) => (
          <option key={v}>{v}</option>
        ))}
      </SelectField>
      <TextField
        label="Executive summary"
        value={c.executiveSummary}
        onChange={(executiveSummary) => update({ executiveSummary })}
        hint="Decision, why it matters, evidence, uncertainty, owner and next step."
      />
      {(['engineer', 'cfo', 'cto', 'ceo'] as const).map((audience) => (
        <TextField
          key={audience}
          label={`Explain to the ${audience === 'engineer' ? 'Engineer' : audience.toUpperCase()}`}
          value={draft.communication[audience]}
          onChange={(value) =>
            onChange({ ...draft, communication: { ...draft.communication, [audience]: value } })
          }
          required={['engineer', 'cfo'].includes(audience)}
        />
      ))}
      {data.scenario.level >= 3 && (
        <>
          <TextField
            label="Operating Partner explanation"
            value={c.operatingPartner}
            onChange={(operatingPartner) => update({ operatingPartner })}
          />
          <TextField
            label="Investment Committee explanation"
            value={c.investmentCommittee}
            onChange={(investmentCommittee) => update({ investmentCommittee })}
          />
        </>
      )}
      <SelectField
        label="Recommendation confidence"
        value={c.recommendationConfidence}
        onChange={(v) =>
          update({ recommendationConfidence: v as ConsultingDraft['recommendationConfidence'] })
        }
      >
        {['low', 'medium', 'high'].map((v) => (
          <option key={v}>{v}</option>
        ))}
      </SelectField>
    </section>
  );
}
function Challenge({
  item,
  documents,
  run,
}: {
  item: NonNullable<CaseData['session']['simulation']>['challenges'][number];
  documents: Evidence[];
  run: Run;
}) {
  const [answer, setAnswer] = useState(item.answer);
  const [ids, setIds] = useState(item.evidenceIds);
  return (
    <section className="lab-record">
      <h3>{item.audience}</h3>
      <p>{item.question}</p>
      <TextField label={`Defense to ${item.audience}`} value={answer} onChange={setAnswer} />
      <EvidencePicker documents={documents} value={ids} onChange={setIds} />
      <button
        className="button secondary"
        disabled={answer.trim().length < 10}
        onClick={() => void run('defend', { challengeId: item.id, answer, evidenceIds: ids })}
      >
        Save defense
      </button>
      {item.answer === answer &&
        item.answer &&
        JSON.stringify(item.evidenceIds) === JSON.stringify(ids) && (
          <span role="status"> Defense saved</span>
        )}
    </section>
  );
}
export function SimulationChallenges({ data, run }: { data: CaseData; run: Run }) {
  return (
    <section className="lab-sheet">
      <h2>Defend the decision.</h2>
      <p>Use evidence and acknowledge what you cannot establish yet.</p>
      {data.session.simulation?.challenges.map((item) => (
        <Challenge key={item.id} item={item} documents={data.documents || []} run={run} />
      ))}
    </section>
  );
}
export function SimulationDebrief({ data }: { data: CaseData }) {
  const debrief = data.session.evaluation?.debrief;
  if (!debrief) return null;
  return (
    <section className="lab-sheet">
      <h2>Debrief & next practice</h2>
      <p>{debrief.summary}</p>
      <h3>What the scenario evidence supports</h3>
      <p>{debrief.reasoning}</p>
      <h3>Evidence and reasoning gaps</h3>
      <ul>
        {[...debrief.evidenceGaps, ...debrief.mistakes].map((v, i) => (
          <li key={i}>{v}</li>
        ))}
      </ul>
      <h3>Next attempt</h3>
      <ul>
        {debrief.nextPractice.map((v) => (
          <li key={v}>{v}</li>
        ))}
      </ul>
      <p>
        {debrief.hintsUsed} hints used · {debrief.hintPenalty} assistance points deducted.
      </p>
      <a className="button secondary" href={`/api/cases/${data.session.id}/export?format=zip`}>
        Download work-product bundle
      </a>
    </section>
  );
}
