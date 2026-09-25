'use client';

import type { CaseData } from '@/lib/types';
import { dimensions } from '@/lib/types';
import { FileDown } from 'lucide-react';
import { readableLabel, reasoningChanges, syntheticDisclaimer } from '@/lib/export';
import DownloadPdfButton from './download-pdf-button';
import { DetailFields } from './showcase-document';
import MermaidDiagram from './mermaid-diagram';
import '@/components/screens.css';

const recorded = (value: string) => value?.trim() || 'Not recorded yet.';
export default function CasePdfDocument({ data }: { data: CaseData }) {
  const { session, scenario } = data;
  const { draft } = session;
  const first = session.snapshots.find((snapshot) => snapshot.kind === 'first');
  const final = session.snapshots.filter((snapshot) => snapshot.kind === 'final').at(-1);
  const changes = first && final ? reasoningChanges(first.draft, final.draft) : [];
  const decisionOption = draft.options.find((option) => option.id === draft.recommendation.optionId);

  return (
    <>
      <div className="case-pdf-toolbar no-print">
        <p>Download a complete PDF with every section expanded, starting with Discovery.</p>
        <DownloadPdfButton className="button primary" caseId={session.id} title={scenario.title} />
      </div>
      <article className="showcase-document case-pdf-document">
        <header className="study-header">
          <p className="eyebrow">CLOUD ARCHITECTURE DECISION · WORKING CASE</p>
          <h1>{scenario.title}</h1>
          <p className="study-company">
            {scenario.company} · {scenario.industry} · Level {scenario.level}
          </p>
          <div className="study-metadata">
            <span>{scenario.companySize} employees · {scenario.engineeringTeamSize} engineers</span>
            <span>Current step: {session.phase}</span>
            {session.evaluation && <span>{session.evaluation.total}/100 · {session.evaluation.status}</span>}
          </div>
        </header>
        <div className="synthetic-notice">
          <FileDown size={20} />
          <p>{syntheticDisclaimer}</p>
        </div>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">01 / DISCOVERY</span>
          <h2>Discovery</h2>
          <h3>Business brief</h3>
          <blockquote>{scenario.businessBrief}</blockquote>
          <h3>What the client initially shared</h3>
          <ul>{scenario.knownFacts.map((fact, i) => <li key={i}>{fact}</li>)}</ul>
          <h3>Stakeholders</h3>
          <div className="stakeholder-grid">
            {scenario.stakeholders.map((person) => (
              <div key={`${person.name}-${person.role}`}>
                <strong>{person.name}</strong><span>{person.role}</span><p>{person.concern}</p>
              </div>
            ))}
          </div>
          <h3>Questions and answers</h3>
          {session.messages.length ? (
            <div className="transcript">
              {session.messages.map((message) => (
                <div key={message.id} className={`transcript-message ${message.role}`}>
                  <strong>{message.role === 'consultant' ? 'My question' : message.stakeholder || 'Client'}</strong>
                  <p>{message.text}</p>
                </div>
              ))}
            </div>
          ) : <p>No discovery messages recorded yet.</p>}
          <h3>Evidence requests</h3>
          {session.evidenceRequests.length ? session.evidenceRequests.map((request) => (
            <article className="document-option" key={request.id}>
              <span className="badge">{request.status.replaceAll('_', ' ')}</span>
              <DetailFields fields={{ question: request.question, reason: request.reason, response: request.response, evidenceReferences: request.evidenceIds.join(', ') }} />
            </article>
          )) : <p>No evidence requests recorded yet.</p>}
          <h3>Facts, assumptions, and unknowns</h3>
          {draft.notes.length ? (
            <div className="table-wrap"><table><thead><tr><th>Type</th><th>Note</th><th>Source / confidence</th><th>Validation</th></tr></thead>
              <tbody>{draft.notes.map((note) => <tr key={note.id}><td>{readableLabel(note.kind)}</td><td>{note.text}</td><td>{note.source} · {note.confidence}</td><td>{note.validation || '—'}</td></tr>)}</tbody>
            </table></div>
          ) : <p>No notes recorded yet.</p>}
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">02 / PROBLEM FRAMING</span><h2>Problem framing</h2>
          <DetailFields fields={draft.framing} />
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">03 / REQUIREMENTS</span><h2>Business and technical requirements</h2>
          {draft.requirements.length ? <div className="table-wrap"><table><thead><tr><th>ID</th><th>Requirement</th><th>Priority</th><th>Source</th></tr></thead>
            <tbody>{draft.requirements.map((requirement) => <tr key={requirement.id}><td>{requirement.id}</td><td>{requirement.text}</td><td>{requirement.priority}</td><td>{requirement.source}</td></tr>)}</tbody>
          </table></div> : <p>No requirements recorded yet.</p>}
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">04 / ARCHITECTURE OPTIONS</span><h2>Architecture options</h2>
          {draft.options.length ? draft.options.map((option, i) => {
            const { id, name, ratings: _ratings, ...fields } = option;
            return <article key={id} className="document-option"><p className="eyebrow">OPTION {i + 1}</p><h3>{name}</h3><DetailFields fields={fields} /></article>;
          }) : <p>No architecture options recorded yet.</p>}
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">05 / TRADE-OFFS</span><h2>Trade-off matrix</h2>
          {draft.options.length ? <div className="table-wrap"><table><thead><tr><th>Dimension</th>{draft.options.map((option) => <th key={option.id}>{option.name}</th>)}</tr></thead>
            <tbody>{dimensions.map((dimension) => <tr key={dimension}><th>{readableLabel(dimension)}</th>{draft.options.map((option) => <td key={option.id}>{option.ratings[dimension]}/5</td>)}</tr>)}</tbody>
          </table></div> : <p>Trade-offs will appear after architecture options are recorded.</p>}
          <p className="muted small-copy">Contextual ratings by the learner · 1–5, higher is more favorable · not measured benchmarks.</p>
          {draft.links.length > 0 && <><h3>Requirement traceability</h3><div className="table-wrap"><table><thead><tr><th>Requirement</th><th>Decision</th><th>Status</th><th>Rationale</th></tr></thead>
            <tbody>{draft.links.map((link, i) => <tr key={`${link.requirementId}-${i}`}><td>{link.requirementId}</td><td>{link.decision}</td><td>{readableLabel(link.status)}</td><td>{link.rationale}</td></tr>)}</tbody>
          </table></div></>}
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">06 / RECOMMENDATION</span><h2>Recommendation</h2>
          <DetailFields fields={{ selectedOption: decisionOption?.name || draft.recommendation.optionId, ...draft.recommendation }} />
          <h3>Architecture diagram</h3>
          {draft.diagram ? <MermaidDiagram source={draft.diagram} /> : <p>No architecture diagram recorded yet.</p>}
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">07 / SIMPLER ALTERNATIVE</span><h2>Why not something simpler?</h2>
          <p className="preserve-lines">{recorded(draft.simpler)}</p>
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">08 / CHANGE CONDITIONS</span><h2>What would change my mind?</h2>
          {draft.conditions.length ? draft.conditions.map((condition, i) => <article className="document-condition" key={condition.id}><span className="condition-number">{String(i + 1).padStart(2, '0')}</span><DetailFields fields={{ condition: condition.condition, signal: condition.signal, threshold: condition.threshold, alternative: condition.alternative }} /></article>) : <p>No change conditions recorded yet.</p>}
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">09 / VALIDATION</span><h2>Validation and proof of concept</h2>
          <DetailFields fields={draft.poc} />
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">10 / DECISION RECORD</span><h2>ADR working draft</h2>
          <DetailFields fields={draft.adr} />
          <h3>Accepted decision records</h3>
          {session.adrs.length ? session.adrs.map((adr) => <article className="document-adr" key={adr.id}><h4>{adr.id} · {adr.title}</h4><DetailFields fields={{ context: adr.context, decision: adr.decision, alternatives: adr.alternatives, consequences: adr.consequences, risks: adr.risks, requirements: adr.requirements.join(', '), reason: adr.reason, status: adr.status }} /></article>) : <p>No accepted ADR recorded yet.</p>}
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">11 / COMMUNICATION</span><h2>Communicating the decision</h2>
          <DetailFields fields={draft.communication} />
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">12 / REVIEW</span><h2>Review and responses</h2>
          <p className="muted">Reviewer: {session.reviewProvider || 'Not requested yet.'}</p>
          {session.reviews.length ? session.reviews.map((review) => <article className="review-document-card" key={review.id}><h3>{review.category} · {review.severity}</h3><p>{review.suggestion}</p><p><strong>Response:</strong> {review.response || 'Not answered yet.'}</p><p><strong>Rationale:</strong> {recorded(review.rationale)}</p></article>) : <p>Review has not been requested yet.</p>}
        </section>

        {session.simulation && <section className="study-section case-pdf-section">
          <span className="eyebrow">13 / SIMULATION WORKSTREAM</span><h2>Workstream notes and challenges</h2>
          <DetailFields fields={{ assistanceMode: session.simulation.mode, hintsUsed: session.simulation.hints.length, currentChapter: session.simulation.chapter + 1 }} />
          {session.simulation.chapterNotes.map((note) => <article className="document-option" key={note.chapter}><h3>Chapter {note.chapter + 1}</h3><p className="preserve-lines">{note.text}</p></article>)}
          {session.simulation.challenges.map((challenge) => <article className="document-option" key={challenge.id}><h3>{challenge.audience} challenge</h3><p>{challenge.question}</p><p className="preserve-lines"><strong>My response:</strong> {recorded(challenge.answer)}</p></article>)}
        </section>}

        <section className="study-section case-pdf-section">
          <span className="eyebrow">{session.simulation ? '14' : '13'} / FINAL REVISION</span><h2>Final decision and lessons</h2>
          <DetailFields fields={{ finalDecision: draft.finalDecision, lessons: draft.lessons }} />
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">EVALUATION</span><h2>Evaluation</h2>
          {session.evaluation ? <><div className="evaluation-summary"><strong>{session.evaluation.total}<small>/100</small></strong><div><h3>{readableLabel(session.evaluation.status)}</h3><p>{session.evaluation.provider}</p></div></div>
            {session.evaluation.criticalMisses.length > 0 && <><h3>Critical misses</h3><ul>{session.evaluation.criticalMisses.map((miss, i) => <li key={i}>{miss}</li>)}</ul></>}
            <div className="table-wrap"><table><thead><tr><th>Dimension</th><th>Score</th><th>Feedback</th></tr></thead><tbody>{session.evaluation.dimensions.map((dimension) => <tr key={dimension.name}><td>{dimension.name}</td><td>{dimension.score}/{dimension.max}</td><td>{dimension.feedback}</td></tr>)}</tbody></table></div>
          </> : <p>Not evaluated yet.</p>}
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">REASONING HISTORY</span><h2>How the work changed</h2>
          <p>{session.snapshots.length} immutable snapshot(s) are saved.</p>
          {session.snapshots.map((snapshot) => <p key={snapshot.id}>{snapshot.kind === 'first' ? 'First analysis' : 'Final revision'}</p>)}
          {changes.length > 0 && <div className="table-wrap"><table><thead><tr><th>Field</th><th>Before review</th><th>Final revision</th></tr></thead><tbody>{changes.map((change) => <tr key={change.field}><td>{change.field}</td><td>{change.before}</td><td>{change.after}</td></tr>)}</tbody></table></div>}
        </section>

        <section className="study-section case-pdf-section">
          <span className="eyebrow">PORTFOLIO</span><h2>Publication status</h2>
          <p>{session.published ? 'Published in the portfolio.' : 'Not yet published in the portfolio.'}</p>
          <p className="muted">This PDF reflects the saved case.</p>
        </section>
      </article>
    </>
  );
}
