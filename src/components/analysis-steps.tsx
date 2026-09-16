'use client';
import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { dimensions, type ArchitectureOption, type Draft, type Phase } from '@/lib/types';
import { TextField, SelectField, SectionIntro } from './form-fields';
import MermaidDiagram from './mermaid-diagram';
export function emptyOption(): ArchitectureOption {
  return {
    id: crypto.randomUUID(),
    name: '',
    summary: '',
    components: '',
    advantages: '',
    disadvantages: '',
    cost: '',
    operations: '',
    reliability: '',
    security: '',
    implementation: '',
    assumptions: '',
    risks: '',
    ratings: Object.fromEntries(dimensions.map((d) => [d, 3])) as ArchitectureOption['ratings'],
    tradeoffRationale: '',
  };
}
const dimLabels: Record<string, string> = {
  cost: 'Cost efficiency',
  reliability: 'Reliability',
  performance: 'Performance',
  scalability: 'Scalability',
  security: 'Security',
  operationalBurden: 'Operational simplicity',
  implementationSpeed: 'Implementation speed',
  teamFit: 'Team fit',
  flexibility: 'Flexibility',
  reversibility: 'Reversibility',
};
export default function AnalysisSteps({
  phase,
  draft,
  onChange,
}: {
  phase: Phase;
  draft: Draft;
  onChange: (d: Draft) => void;
}) {
  const [optionIndex, setOptionIndex] = useState(0);
  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    onChange({ ...draft, [key]: value });
  }
  if (phase === 'frame')
    return (
      <>
        <SectionIntro eyebrow="03 / PROBLEM FRAMING" title="Solve the right problem.">
          Separate the client’s request from the outcome the business actually needs.
        </SectionIntro>
        <div className="card">
          {(
            [
              ['statedProblem', 'What the client says', 'Their request, in their own words.'],
              [
                'actualProblem',
                'The problem I believe needs solving',
                'Your working diagnosis. Separate observations from inference.',
              ],
              [
                'businessImpact',
                'Business impact',
                'Revenue, customer experience, delivery speed or financial exposure.',
              ],
              [
                'symptoms',
                'Technical symptoms',
                'Describe the observed behavior, not an assumed cause.',
              ],
              [
                'constraints',
                'Known constraints',
                'Budget, time, team capacity and risk tolerance.',
              ],
              ['uncertainties', 'Main uncertainties', 'What could change your diagnosis?'],
            ] as const
          ).map(([key, label, hint]) => (
            <TextField
              key={key}
              label={label}
              hint={hint}
              value={draft.framing[key]}
              onChange={(value) => field('framing', { ...draft.framing, [key]: value })}
              required
            />
          ))}
        </div>
      </>
    );
  if (phase === 'options') {
    const option = draft.options[Math.min(optionIndex, Math.max(0, draft.options.length - 1))];
    const update = (key: keyof ArchitectureOption, value: string) =>
      field(
        'options',
        draft.options.map((o) => (o.id === option.id ? { ...o, [key]: value } : o)),
      );
    return (
      <>
        <SectionIntro eyebrow="04 / ARCHITECTURE OPTIONS" title="Make room for alternatives.">
          Compare at least two defensible approaches. Include the simplest credible option.
        </SectionIntro>
        <div className="options-tabs">
          {draft.options.map((o, i) => (
            <button
              className={option?.id === o.id ? 'active' : ''}
              key={o.id}
              onClick={() => setOptionIndex(i)}
            >
              {o.name || `Option ${String.fromCharCode(65 + i)}`}
            </button>
          ))}
          <button
            onClick={() => {
              field('options', [...draft.options, emptyOption()]);
              setOptionIndex(draft.options.length);
            }}
          >
            <Plus size={15} />
            <span className="sr-only">Add option</span>
          </button>
        </div>
        {option ? (
          <div className="card">
            <div className="section-heading">
              <h3>Option {String.fromCharCode(65 + draft.options.indexOf(option))}</h3>
              {draft.options.length > 2 && (
                <button
                  className="button ghost small"
                  onClick={() => {
                    field(
                      'options',
                      draft.options.filter((o) => o.id !== option.id),
                    );
                    setOptionIndex(0);
                  }}
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              )}
            </div>
            <TextField
              label="Option name"
              value={option.name}
              onChange={(v) => update('name', v)}
              rows={1}
              required
            />
            <TextField
              label="Summary"
              value={option.summary}
              onChange={(v) => update('summary', v)}
              required
            />
            <TextField
              label="Architecture components"
              hint="Describe responsibilities and relationships, then name services if useful."
              value={option.components}
              onChange={(v) => update('components', v)}
              required
            />
            <div className="grid-2">
              {(
                [
                  ['advantages', 'Advantages'],
                  ['disadvantages', 'Disadvantages'],
                  ['cost', 'Estimated cost impact'],
                  ['operations', 'Operational complexity'],
                  ['reliability', 'Reliability implications'],
                  ['security', 'Security implications'],
                  ['implementation', 'Implementation difficulty'],
                  ['assumptions', 'Assumptions'],
                  ['risks', 'Risks'],
                ] as const
              ).map(([k, label]) => (
                <TextField
                  key={k}
                  label={label}
                  value={option[k]}
                  onChange={(v) => update(k, v)}
                  rows={3}
                  required
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="card empty-state">
            <p>Add your first architecture option.</p>
            <button
              className="button secondary"
              onClick={() => field('options', [emptyOption(), emptyOption()])}
            >
              Create two options
            </button>
          </div>
        )}
      </>
    );
  }
  if (phase === 'tradeoffs')
    return (
      <>
        <SectionIntro eyebrow="05 / TRADE-OFF MATRIX" title="A stronger choice has a cost.">
          Rate each approach in this specific context, then explain what you gain and what you give
          up. Ratings guide comparison; they do not decide the score.
        </SectionIntro>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dimension</th>
                {draft.options.map((o) => (
                  <th key={o.id}>{o.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dimensions.map((d) => (
                <tr key={d}>
                  <td>{dimLabels[d]}</td>
                  {draft.options.map((o) => (
                    <td className="rating-cell" key={o.id}>
                      <select
                        aria-label={`${o.name}: ${dimLabels[d]}`}
                        value={o.ratings[d]}
                        onChange={(e) =>
                          field(
                            'options',
                            draft.options.map((x) =>
                              x.id === o.id
                                ? { ...x, ratings: { ...x.ratings, [d]: Number(e.target.value) } }
                                : x,
                            ),
                          )
                        }
                      >
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} — {['Weak', 'Limited', 'Adequate', 'Strong', 'Excellent'][n - 1]}
                          </option>
                        ))}
                      </select>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="matrix-hint">
          Higher means more favorable for the client, including lower cost and lower operational
          burden.
        </p>
        <div className="grid-2">
          {draft.options.map((o) => (
            <div className="card" key={o.id}>
              <TextField
                label={`${o.name}: trade-off reasoning`}
                hint="Which requirement favors this option? Which requirement would be at risk?"
                value={o.tradeoffRationale}
                onChange={(v) =>
                  field(
                    'options',
                    draft.options.map((x) => (x.id === o.id ? { ...x, tradeoffRationale: v } : x)),
                  )
                }
                required
                rows={5}
              />
            </div>
          ))}
        </div>
      </>
    );
  if (phase === 'recommendation')
    return (
      <>
        <SectionIntro eyebrow="06 / RECOMMENDATION" title="Make a contextual recommendation.">
          Show how your decision follows from the requirements and which risks the business would
          accept.
        </SectionIntro>
        <div className="card step-card">
          <SelectField
            label="Recommended option"
            value={draft.recommendation.optionId}
            onChange={(v) => field('recommendation', { ...draft.recommendation, optionId: v })}
          >
            <option value="">Choose an option</option>
            {draft.options.map((o) => (
              <option value={o.id} key={o.id}>
                {o.name}
              </option>
            ))}
            <option value="hybrid">Combined / phased approach</option>
          </SelectField>
          {(
            [
              ['decision', 'My recommendation'],
              ['why', 'Why this option'],
              ['alternatives', 'Why not the alternatives'],
              ['risks', 'Risks accepted'],
              ['assumptions', 'Assumptions behind the decision'],
            ] as const
          ).map(([k, label]) => (
            <TextField
              key={k}
              label={label}
              value={draft.recommendation[k]}
              onChange={(v) => field('recommendation', { ...draft.recommendation, [k]: v })}
              required
            />
          ))}
        </div>
        <div className="card step-card">
          <div className="section-heading">
            <div>
              <h2>Requirement traceability</h2>
              <p>Connect each business need to a concrete decision.</p>
            </div>
          </div>
          {draft.requirements.map((r) => {
            const link = draft.links.find((l) => l.requirementId === r.id) ?? {
              requirementId: r.id,
              decision: '',
              status: 'unaddressed' as const,
              rationale: '',
            };
            function setLink(update: Partial<typeof link>) {
              field('links', [
                ...draft.links.filter((l) => l.requirementId !== r.id),
                { ...link, ...update },
              ]);
            }
            return (
              <div className="link-row" key={r.id}>
                <div className="requirement-title">
                  <span className="badge">{r.id}</span>
                  {r.text}
                </div>
                <div className="grid-2">
                  <TextField
                    label={`Decision for ${r.id}`}
                    value={link.decision}
                    onChange={(decision) => setLink({ decision })}
                    rows={1}
                  />
                  <SelectField
                    label={`Status of ${r.id}`}
                    value={link.status}
                    onChange={(status) => setLink({ status: status as typeof link.status })}
                  >
                    <option value="unaddressed">Unaddressed</option>
                    <option value="satisfied">Satisfied</option>
                    <option value="at_risk">At risk</option>
                  </SelectField>
                </div>
                <TextField
                  label={`Rationale for ${r.id}`}
                  value={link.rationale}
                  onChange={(rationale) => setLink({ rationale })}
                  rows={2}
                />
              </div>
            );
          })}
        </div>
        <div className="card">
          <h3>Architecture diagram</h3>
          <TextField
            label="Mermaid source"
            hint="Optional. Start with flowchart LR, then describe a connection, such as Client --> Application."
            value={draft.diagram}
            onChange={(v) => field('diagram', v)}
            rows={5}
          />
          <MermaidDiagram source={draft.diagram} />
        </div>
      </>
    );
  if (phase === 'simplify')
    return (
      <>
        <SectionIntro eyebrow="07 / SIMPLICITY CHECK" title="Why not something simpler?">
          Complexity must earn its place. What specific requirement prevents a simpler solution from
          being enough?
        </SectionIntro>
        <div className="card">
          <TextField
            label="Why not something simpler?"
            hint="Name the simpler alternative, the requirement it cannot satisfy, and the operational cost of your choice. If you chose the simplest option, explain why it is sufficient."
            value={draft.simpler}
            onChange={(v) => field('simpler', v)}
            rows={9}
            required
          />
        </div>
      </>
    );
  if (phase === 'conditions')
    return (
      <>
        <SectionIntro eyebrow="08 / DECISION BOUNDARIES" title="What would change your mind?">
          A recommendation is valid under certain conditions. Define observable signals that would
          make you reconsider it.
        </SectionIntro>
        {draft.conditions.map((c, i) => (
          <div className="condition-card" key={c.id}>
            <div className="section-heading">
              <h3>Reconsideration trigger {i + 1}</h3>
              <button
                className="icon-button"
                aria-label={`Remove trigger ${i + 1}`}
                onClick={() =>
                  field(
                    'conditions',
                    draft.conditions.filter((x) => x.id !== c.id),
                  )
                }
              >
                <Trash2 size={14} />
              </button>
            </div>
            <div className="grid-2">
              {(
                [
                  ['condition', 'Condition'],
                  ['signal', 'Metric / signal'],
                  ['threshold', 'Observable threshold'],
                  ['alternative', 'Potential alternative'],
                ] as const
              ).map(([k, label]) => (
                <TextField
                  key={k}
                  label={label}
                  value={c[k]}
                  onChange={(v) =>
                    field(
                      'conditions',
                      draft.conditions.map((x) => (x.id === c.id ? { ...x, [k]: v } : x)),
                    )
                  }
                  rows={2}
                  required
                />
              ))}
            </div>
          </div>
        ))}
        <button
          className="button secondary"
          onClick={() =>
            field('conditions', [
              ...draft.conditions,
              {
                id: crypto.randomUUID(),
                condition: '',
                signal: '',
                threshold: '',
                alternative: '',
              },
            ])
          }
        >
          <Plus size={14} />
          Add condition
        </button>
      </>
    );
  if (phase === 'validation')
    return (
      <>
        <SectionIntro
          eyebrow="09 / VALIDATION"
          title="Turn your decision into a testable hypothesis."
        >
          Define what evidence would support your choice, what failure looks like, and when to stop.
        </SectionIntro>
        <div className="card">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={draft.poc.required}
              onChange={(e) => field('poc', { ...draft.poc, required: e.target.checked })}
            />
            A proof of concept is required
          </label>
          <div className="divider" />
          {!draft.poc.required && (
            <TextField
              label="Why is no POC required?"
              hint="Explain the alternative validation method you will use."
              value={draft.poc.justification}
              onChange={(v) => field('poc', { ...draft.poc, justification: v })}
              required
            />
          )}
          {(draft.poc.required
            ? ([
                ['hypothesis', 'Hypothesis'],
                ['scope', 'Scope'],
                ['metrics', 'Metrics to observe'],
                ['success', 'Success criteria'],
                ['exit', 'Failure / exit criteria'],
                ['goNoGo', 'Go / No-Go decision'],
              ] as const)
            : ([
                ['scope', 'Alternative validation method'],
                ['success', 'Acceptance criteria'],
                ['goNoGo', 'Go / No-Go decision'],
              ] as const)
          ).map(([k, label]) => (
            <TextField
              key={k}
              label={label}
              value={draft.poc[k]}
              onChange={(v) => field('poc', { ...draft.poc, [k]: v })}
              required
            />
          ))}
        </div>
      </>
    );
  return null;
}
