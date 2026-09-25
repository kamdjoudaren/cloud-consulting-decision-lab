'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, FileCheck2, FileCode2, LockKeyhole, Printer } from 'lucide-react';
import type { CaseData } from '@/lib/types';
import { exampleCase } from '@/data/example-case';
import {
  apiRequest,
  dateLabel,
  ErrorState,
  LoadingScreen,
  skillLabel,
} from '@/components/dashboard-data';
import { DetailFields, DraftDocument } from '@/components/showcase-document';
import DownloadPdfButton from '@/components/download-pdf-button';
import { downloadCaseMarkdown, reasoningChanges, syntheticDisclaimer } from '@/lib/export';
import { downloadCaseHtml } from '@/lib/html-export';
import '@/components/screens.css';

export default function CaseStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<CaseData | null>(id === 'example' ? exampleCase : null);
  const [error, setError] = useState('');
  useEffect(() => {
    let closedDetails: HTMLDetailsElement[] = [];
    const prepare = () => {
      closedDetails = Array.from(
        document.querySelectorAll<HTMLDetailsElement>('.showcase-document details:not([open])'),
      );
      closedDetails.forEach((element) => {
        element.open = true;
      });
    };
    const restore = () => {
      closedDetails.forEach((element) => {
        element.open = false;
      });
      closedDetails = [];
    };
    window.addEventListener('beforeprint', prepare);
    window.addEventListener('afterprint', restore);
    return () => {
      window.removeEventListener('beforeprint', prepare);
      window.removeEventListener('afterprint', restore);
    };
  }, []);
  useEffect(() => {
    if (id === 'example') {
      setData(exampleCase);
      return;
    }
    let active = true;
    setData(null);
    setError('');
    apiRequest<CaseData>(`/api/cases/${encodeURIComponent(id)}`)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);
  if (error) return <ErrorState message={error} />;
  if (!data) return <LoadingScreen />;
  if (!data.session.published || !data.session.evaluation)
    return (
      <div className="empty-state">
        <LockKeyhole size={33} />
        <h1>This case study is not published.</h1>
        <p>Finish the evaluation and publish the case to make its read-only study available.</p>
        <Link href={`/cases/${id}`} className="button primary">
          Return to the case
        </Link>
      </div>
    );
  const { session, scenario } = data;
  const first = session.snapshots.find((s) => s.kind === 'first');
  const final = session.snapshots.filter((s) => s.kind === 'final').at(-1);
  const changes = first && final ? reasoningChanges(first.draft, final.draft) : [];
  return (
    <article className="showcase-document">
      <div className="showcase-toolbar no-print">
        <Link className="text-link" href="/showcase">
          <ArrowLeft size={16} />
          All case studies
        </Link>
        <div>
          <button className="button secondary" onClick={() => window.print()}>
            <Printer size={16} />
            Print / PDF
          </button>
          <DownloadPdfButton caseId={session.id} title={scenario.title} />
          <button className="button primary" onClick={() => downloadCaseMarkdown(data)}>
            <Download size={16} />
            Export Markdown
          </button>
          <button
            className="button secondary"
            onClick={() => {
              const article = document.querySelector<HTMLElement>('.showcase-document');
              if (article)
                void downloadCaseHtml(article, scenario.title).catch((cause: unknown) =>
                  setError(cause instanceof Error ? cause.message : 'HTML export failed.'),
                );
            }}
          >
            <FileCode2 size={16} />
            Download HTML
          </button>
        </div>
      </div>
      <header className="study-header">
        <p className="eyebrow">
          A CLOUD CONSULTING CASE STUDY {session.isExample && '· WORKED EXAMPLE'}
        </p>
        <h1>{scenario.title}</h1>
        <p className="study-company">
          {scenario.company} · {scenario.industry} · Level {scenario.level}
        </p>
        <div className="study-tags">
          {scenario.skillTags.map((skill) => (
            <span className="badge" key={skill}>
              {skillLabel(skill)}
            </span>
          ))}
        </div>
        <div className="study-metadata">
          <span>
            {scenario.companySize} employees · {scenario.engineeringTeamSize} engineers
          </span>
          <span>
            {session.evaluation!.status === 'completed' ? 'Completed' : 'Published as a draft'}{' '}
            {dateLabel(session.evaluation!.evaluatedAt)}
          </span>
          <span>
            {session.evaluation!.total}/100 · {session.evaluation!.provider} feedback
          </span>
        </div>
      </header>
      <div className="synthetic-notice">
        <FileCheck2 size={21} />
        <div>
          <p>{syntheticDisclaimer}</p>
          {session.isExample && (
            <p>
              <strong>
                This worked example is demonstration content, not the learner’s own work.
              </strong>
            </p>
          )}
        </div>
      </div>
      {session.evaluation!.status === 'needs_revision' && (
        <div className="alert warning">
          <strong>Published draft · revisions required</strong>
          <p>This case study is shared as a work in progress. Its evaluation identified critical gaps.</p>
          {session.evaluation!.criticalMisses.length > 0 && (
            <ul>
              {session.evaluation!.criticalMisses.map((miss, i) => <li key={i}>{miss}</li>)}
            </ul>
          )}
        </div>
      )}
      <section className="study-section">
        <span className="eyebrow">01 / THE CONTEXT</span>
        <h2>The client’s problem</h2>
        <blockquote>{scenario.businessBrief}</blockquote>
        <h3>What was initially known</h3>
        <ul>
          {scenario.knownFacts.map((fact, i) => (
            <li key={i}>{fact}</li>
          ))}
        </ul>
        <h3>The people behind the decision</h3>
        <div className="stakeholder-grid">
          {scenario.stakeholders.map((s) => (
            <div key={`${s.name}-${s.role}`}>
              <strong>{s.name}</strong>
              <span>{s.role}</span>
              <p>{s.concern}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="study-section">
        <span className="eyebrow">02 / THE REASONING</span>
        <h2>A recommendation built from context</h2>
        <DraftDocument draft={final?.draft || session.draft} />
      </section>
      <section className="study-section">
        <span className="eyebrow">03 / THE DISCOVERY</span>
        <h2>Questions, answers, and evidence</h2>
        <details className="study-disclosure">
          <summary>
            Discovery transcript <span>{session.messages.length} messages</span>
          </summary>
          <div className="transcript">
            {session.messages.map((message) => (
              <div key={message.id} className={`transcript-message ${message.role}`}>
                <strong>
                  {message.role === 'consultant' ? 'Consultant' : message.stakeholder || 'Client'}
                </strong>
                <small>{new Date(message.timestamp).toLocaleString()}</small>
                <p>{message.text}</p>
              </div>
            ))}
            {!session.messages.length && <p>No discovery messages recorded.</p>}
          </div>
        </details>
        <h3>Evidence requests</h3>
        {session.evidenceRequests.map((request) => (
          <div key={request.id} className="document-option">
            <span className="badge">{request.status.replace(/_/g, ' ')}</span>
            <DetailFields
              fields={{
                question: request.question,
                reason: request.reason,
                response: request.response,
                evidenceReferences: request.evidenceIds.join(', '),
                timestamp: request.timestamp,
              }}
            />
          </div>
        ))}
        {!session.evidenceRequests.length && (
          <p className="muted">No evidence requests recorded.</p>
        )}
      </section>
      <section className="study-section">
        <span className="eyebrow">04 / THE DECISION RECORD</span>
        <h2>Accepted architecture decisions</h2>
        <p className="muted">
          Accepted records are immutable. A revised decision creates a new record that supersedes
          the original.
        </p>
        {session.adrs.map((adr) => (
          <article key={adr.id} className="document-adr">
            <div className="section-heading">
              <span className="badge">
                <LockKeyhole size={13} />
                Accepted · {adr.id}
              </span>
              <small>{dateLabel(adr.createdAt)}</small>
            </div>
            <h3>{adr.title}</h3>
            {adr.supersedes && (
              <p className="supersession">
                Supersedes {adr.supersedes} · {adr.reason}
              </p>
            )}
            {session.adrs.some((other) => other.supersedes === adr.id) && (
              <p className="supersession">
                Superseded by {session.adrs.find((other) => other.supersedes === adr.id)?.id}
              </p>
            )}
            <DetailFields
              fields={{
                context: adr.context,
                decision: adr.decision,
                alternatives: adr.alternatives,
                consequences: adr.consequences,
                risks: adr.risks,
                requirementIds: adr.requirements.join(', '),
                reason: adr.reason,
              }}
            />
          </article>
        ))}
      </section>
      <section className="study-section">
        <span className="eyebrow">05 / CHALLENGING THE DECISION</span>
        <h2>The review, and my response</h2>
        <p className="muted">
          Reviewer: {session.reviewProvider || 'Not recorded'}. Feedback is a challenge to examine,
          not an answer to copy.
        </p>
        {session.reviews.map((review) => (
          <article key={review.id} className="review-document-card">
            <div className="section-heading">
              <h3>{review.category}</h3>
              <span className="badge">{review.severity}</span>
            </div>
            <p>{review.suggestion}</p>
            <div className="review-response">
              <strong>My response: {review.response || 'No response'}</strong>
              <p>{review.rationale || 'No rationale recorded.'}</p>
            </div>
          </article>
        ))}
      </section>
      <section className="study-section">
        <span className="eyebrow">06 / OWNING THE REASONING</span>
        <h2>How my thinking changed</h2>
        <p className="muted">
          Compare the preserved first analysis with the final revision. Changes below are field
          comparisons, not an AI interpretation.
        </p>
        {changes.length ? (
          <div className="reasoning-diff">
            {changes.map((change) => (
              <div key={change.field}>
                <h4>{change.field}</h4>
                <div className="diff-columns">
                  <div>
                    <span>BEFORE REVIEW</span>
                    <p>{change.before}</p>
                  </div>
                  <div>
                    <span>FINAL REVISION</span>
                    <p>{change.after}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>
            {first && final
              ? 'No fields changed between the first analysis and final revision.'
              : 'Both immutable snapshots are required for a comparison.'}
          </p>
        )}
        {session.snapshots.map((snapshot) => (
          <details className="study-disclosure" key={snapshot.id}>
            <summary>
              <span>
                <LockKeyhole size={14} />
                Immutable{' '}
                {snapshot.kind === 'first' ? 'first analysis · before feedback' : 'final revision'}
              </span>
              <small>{dateLabel(snapshot.createdAt)}</small>
            </summary>
            <DraftDocument draft={snapshot.draft} includeDiagram={false} />
          </details>
        ))}
      </section>
      <section className="study-section">
        <span className="eyebrow">07 / FEEDBACK FOR THE NEXT CASE</span>
        <h2>Evaluation</h2>
        <div className="evaluation-summary">
          <strong>
            {session.evaluation!.total}
            <small>/100</small>
          </strong>
          <div>
            <h3>{session.evaluation!.status === 'completed' ? 'Completed' : 'Needs revision'}</h3>
            <p>
              {session.evaluation!.provider} · {dateLabel(session.evaluation!.evaluatedAt)}
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Dimension</th>
                <th>Score</th>
                <th>Feedback</th>
              </tr>
            </thead>
            <tbody>
              {session.evaluation!.dimensions.map((d) => (
                <tr key={d.name}>
                  <td>{d.name}</td>
                  <td>
                    {d.score}/{d.max}
                  </td>
                  <td>{d.feedback}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="grid-2">
          <div>
            <h3>Strengths</h3>
            <ul>
              {session.evaluation!.strengths.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Keep developing</h3>
            <ul>
              {session.evaluation!.improvements.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        {session.evaluation!.criticalMisses.length > 0 && (
          <div className="alert">
            <h3>Critical misses</h3>
            <ul>
              {session.evaluation!.criticalMisses.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="muted small-copy">
          Scores are formative feedback for this synthetic case, not certification of professional
          competence.
        </p>
      </section>
      <footer className="study-footer">
        Cloud Consulting Decision Lab · Practice the decisions, not just the services.
      </footer>
    </article>
  );
}
