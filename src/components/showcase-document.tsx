'use client';

import { dimensions, type Draft } from '@/lib/types';
import { readableLabel } from '@/lib/export';
import MermaidDiagram from './mermaid-diagram';

export function DetailFields({ fields }: { fields: Record<string, unknown> }) {
  return (
    <dl className="document-fields">
      {Object.entries(fields).map(([key, value]) => (
        <div key={key}>
          <dt>{readableLabel(key)}</dt>
          <dd>
            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value || 'Not recorded.')}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function DraftDocument({
  draft,
  includeDiagram = true,
}: {
  draft: Draft;
  includeDiagram?: boolean;
}) {
  return (
    <div className="draft-document">
      <section>
        <h3>Facts, assumptions, and unknowns</h3>
        {draft.notes.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Note</th>
                  <th>Source / confidence</th>
                  <th>Validation</th>
                </tr>
              </thead>
              <tbody>
                {draft.notes.map((note) => (
                  <tr key={note.id}>
                    <td>
                      <span className="badge">{note.kind}</span>
                    </td>
                    <td>{note.text}</td>
                    <td>
                      {note.source}
                      <br />
                      <small>{note.confidence} confidence</small>
                    </td>
                    <td>{note.validation || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No notes recorded.</p>
        )}
      </section>
      <section>
        <h3>The problem behind the request</h3>
        <DetailFields fields={draft.framing} />
      </section>
      <section>
        <h3>Business and technical requirements</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Requirement</th>
                <th>Priority</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {draft.requirements.map((req) => (
                <tr key={req.id}>
                  <td>
                    <code>{req.id}</code>
                  </td>
                  <td>{req.text}</td>
                  <td>{req.priority}</td>
                  <td>{req.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h3>Architecture options</h3>
        {draft.options.map((option, i) => {
          const { id, name, ratings: _ratings, ...fields } = option;
          return (
            <article key={id} className="document-option">
              <p className="eyebrow">
                OPTION {i + 1} · {id}
              </p>
              <h4>{name}</h4>
              <DetailFields fields={fields} />
            </article>
          );
        })}
      </section>
      <section>
        <h3>The trade-offs</h3>
        <p className="muted small-copy">
          Contextual ratings by the learner · 1–5, higher is more favorable · not measured
          benchmarks.
        </p>
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
                  <td>{readableLabel(d)}</td>
                  {draft.options.map((o) => (
                    <td key={o.id}>{o.ratings[d]}/5</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="document-recommendation">
        <h3>My recommendation</h3>
        <DetailFields
          fields={{
            selectedOption:
              draft.options.find((o) => o.id === draft.recommendation.optionId)?.name ||
              draft.recommendation.optionId,
            ...draft.recommendation,
          }}
        />
      </section>
      <section>
        <h3>Why not something simpler?</h3>
        <p className="preserve-lines">{draft.simpler || 'Not recorded.'}</p>
      </section>
      <section>
        <h3>Requirement traceability</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Requirement</th>
                <th>Decision</th>
                <th>Status</th>
                <th>Rationale</th>
              </tr>
            </thead>
            <tbody>
              {draft.links.map((link, i) => (
                <tr key={`${link.requirementId}-${i}`}>
                  <td>
                    <code>{link.requirementId}</code>
                  </td>
                  <td>{link.decision}</td>
                  <td>{readableLabel(link.status)}</td>
                  <td>{link.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section>
        <h3>What would change my mind?</h3>
        {draft.conditions.map((condition, i) => (
          <article className="document-condition" key={condition.id}>
            <span className="condition-number">0{i + 1}</span>
            <DetailFields
              fields={{
                condition: condition.condition,
                signal: condition.signal,
                threshold: condition.threshold,
                alternative: condition.alternative,
              }}
            />
          </article>
        ))}
      </section>
      <section>
        <h3>Validation and proof of concept</h3>
        <DetailFields fields={draft.poc} />
      </section>
      <section>
        <h3>ADR working draft</h3>
        <DetailFields fields={draft.adr} />
      </section>
      <section>
        <h3>Communicating the decision</h3>
        <DetailFields fields={draft.communication} />
      </section>
      <section>
        <h3>Architecture diagram</h3>
        {draft.diagram ? (
          <>
            {includeDiagram && <MermaidDiagram source={draft.diagram} />}
            <details className="source-details">
              <summary>Mermaid source</summary>
              <pre>{draft.diagram}</pre>
            </details>
          </>
        ) : (
          <p className="muted">No diagram recorded.</p>
        )}
      </section>
      <section>
        <h3>Final decision</h3>
        <p className="preserve-lines">{draft.finalDecision || 'Not recorded.'}</p>
      </section>
      <section>
        <h3>Lessons learned</h3>
        <p className="preserve-lines">{draft.lessons || 'Not recorded.'}</p>
      </section>
    </div>
  );
}
