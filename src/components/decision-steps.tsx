'use client';
import { useState } from 'react';
import {
  Banknote,
  BriefcaseBusiness,
  Check,
  Code2,
  Eye,
  FileDown,
  GitBranch,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { CaseData, Draft, Phase, ReviewItem } from '@/lib/types';
import { hasCurrentADR } from '@/lib/adr/service';
import { SectionIntro, TextField } from './form-fields';
type Run = (action: string, payload?: Record<string, unknown>) => Promise<boolean>;
export type ReviewEdit = Pick<ReviewItem, 'response' | 'rationale'>;
export function AdrEditor({
  data,
  draft,
  onChange,
  run,
  busy,
}: {
  data: CaseData;
  draft: Draft;
  onChange: (d: Draft) => void;
  run: Run;
  busy: boolean;
}) {
  const [reason, setReason] = useState('');
  const latest = data.session.adrs.at(-1);
  const matches = hasCurrentADR(draft, data.session.adrs);
  return (
    <>
      <div className="card step-card">
        <div className="section-heading">
          <div>
            <h3>{latest ? 'New decision record' : 'Your first decision record'}</h3>
            <p>
              Accepted records are permanent. Changes create a new record with a visible
              relationship.
            </p>
          </div>
          <LockKeyhole size={18} />
        </div>
        {(['title', 'context', 'decision', 'alternatives', 'consequences', 'risks'] as const).map(
          (k) => (
            <TextField
              key={k}
              label={`ADR ${k}`}
              value={draft.adr[k]}
              rows={k === 'title' ? 1 : 3}
              onChange={(v) => onChange({ ...draft, adr: { ...draft.adr, [k]: v } })}
              required
            />
          ),
        )}
        <div className="actions" style={{ marginBottom: 20 }}>
          <span className="inline-label">Requirements addressed:</span>
          {draft.requirements
            .filter((r) =>
              draft.links.some(
                (link) =>
                  link.requirementId === r.id &&
                  link.status !== 'unaddressed' &&
                  link.decision.trim() &&
                  link.rationale.trim(),
              ),
            )
            .map((r) => (
              <span key={r.id} className="badge">
                {r.id}
              </span>
            ))}
        </div>
        {latest && (
          <TextField
            label={`Reason for superseding ${latest.id}`}
            value={reason}
            onChange={setReason}
            required={!matches}
          />
        )}
        <button
          className="button primary"
          disabled={busy || !!matches}
          onClick={() => run('acceptAdr', latest ? { supersedes: latest.id, reason } : {})}
        >
          <LockKeyhole size={14} />
          {matches
            ? 'Current decision accepted'
            : latest
              ? 'Accept superseding ADR'
              : 'Accept decision record'}
        </button>
      </div>
      {data.session.adrs.length > 0 && (
        <div className="card">
          <div className="section-heading">
            <h3>Decision history</h3>
            <GitBranch size={16} />
          </div>
          {data.session.adrs.map((adr) => (
            <article className="adr-record" key={adr.id}>
              <div className="actions">
                <span className="badge green">{adr.id} · ACCEPTED</span>
                <span className="inline-label">{new Date(adr.createdAt).toLocaleDateString()}</span>
                <LockKeyhole size={11} />
              </div>
              <h3>{adr.title}</h3>
              {adr.supersedes && (
                <p>
                  Supersedes {adr.supersedes} · {adr.reason}
                </p>
              )}
              <p>{adr.decision}</p>
              <details>
                <summary>Read permanent record</summary>
                <dl>
                  {(['context', 'alternatives', 'consequences', 'risks'] as const).map((k) => (
                    <div key={k} style={{ display: 'contents' }}>
                      <dt>{k[0].toUpperCase() + k.slice(1)}</dt>
                      <dd>{adr[k]}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
function ReviewCard({
  item,
  run,
  busy,
  edit,
  onEdit,
}: {
  item: ReviewItem;
  run: Run;
  busy: boolean;
  edit: ReviewEdit;
  onEdit: (edit: ReviewEdit) => void;
}) {
  const { response, rationale } = edit;
  return (
    <article className="review-card">
      <div className="actions">
        <span
          className={`badge ${item.severity === 'critical' ? 'red' : item.severity === 'warning' ? 'amber' : ''}`}
        >
          {item.severity}
        </span>
        <span className="eyebrow">{item.category}</span>
        {item.response && item.response === response && item.rationale === rationale && (
          <span className="badge green">
            <Check size={11} />
            Response saved
          </span>
        )}
      </div>
      <blockquote>{item.suggestion}</blockquote>
      <div className="review-buttons">
        {(['accept', 'partial', 'reject'] as const).map((r) => (
          <button
            key={r}
            className={`button ${response === r ? 'selected' : ''}`}
            onClick={() => onEdit({ response: r, rationale })}
            aria-pressed={response === r}
          >
            {r === 'partial' ? 'Partially accept' : r[0].toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>
      <TextField
        label={`Rationale: ${item.category}`}
        hint="Explain your judgment. Accepting feedback is not a substitute for evaluating it."
        value={rationale}
        onChange={(rationale) => onEdit({ response, rationale })}
        required
      />
      <button
        className="button secondary small"
        disabled={
          busy ||
          !response ||
          rationale.trim().length < 10 ||
          (response === item.response && rationale === item.rationale)
        }
        onClick={() => run('respondReview', { reviewId: item.id, response, rationale })}
      >
        Save response
      </button>
    </article>
  );
}
export default function DecisionSteps({
  phase,
  data,
  draft,
  onChange,
  run,
  busy,
  reviewEdits,
  onReviewEdit,
}: {
  phase: Phase;
  data: CaseData;
  draft: Draft;
  onChange: (d: Draft) => void;
  run: Run;
  busy: boolean;
  reviewEdits: Record<string, ReviewEdit>;
  onReviewEdit: (id: string, edit: ReviewEdit) => void;
}) {
  const { session, scenario } = data;
  if (phase === 'adr')
    return (
      <>
        <SectionIntro
          eyebrow="10 / ARCHITECTURE DECISION RECORD"
          title="Leave a clear record of your decision."
        >
          Record the context, alternatives and consequences. Once accepted, this record can only be
          superseded.
        </SectionIntro>
        <AdrEditor {...{ data, draft, onChange, run, busy }} />
      </>
    );
  if (phase === 'communication')
    return (
      <>
        <SectionIntro
          eyebrow="11 / COMMUNICATION STUDIO"
          title="Same decision. Four different conversations."
        >
          Change the explanation to match the audience’s concerns. Keep the architecture and its
          limitations consistent.
        </SectionIntro>
        <div className="grid-2">
          {(
            [
              {
                key: 'engineer',
                name: 'Engineer',
                icon: Code2,
                focus: 'Mechanisms, deployment, failure modes and observability.',
              },
              {
                key: 'cto',
                name: 'CTO',
                icon: Users,
                focus: 'Team fit, maintainability, technical risks and strategy.',
              },
              {
                key: 'cfo',
                name: 'CFO',
                icon: Banknote,
                focus: 'Costs, predictability, financial exposure and value.',
              },
              {
                key: 'ceo',
                name: 'CEO',
                icon: BriefcaseBusiness,
                focus: 'Customers, revenue, growth and business outcomes.',
              },
            ] as const
          ).map((a) => (
            <section className="card" key={a.key}>
              <div className="audience-heading">
                <span className="audience-icon">
                  <a.icon size={20} />
                </span>
                <div>
                  <h3>{a.name}</h3>
                  <p>{a.focus}</p>
                </div>
              </div>
              <TextField
                label={`Explain to the ${a.name}`}
                value={draft.communication[a.key]}
                onChange={(v) =>
                  onChange({ ...draft, communication: { ...draft.communication, [a.key]: v } })
                }
                rows={7}
                required
              />
            </section>
          ))}
        </div>
        <div className="card" style={{ marginTop: 20 }}>
          <TextField
            label="A useful analogy"
            hint="Optional. Simplify the mechanism without hiding its limitations."
            value={draft.communication.analogy}
            onChange={(v) =>
              onChange({ ...draft, communication: { ...draft.communication, analogy: v } })
            }
          />
          <TextField
            label="Explain it without AWS service names"
            hint="Optional challenge: describe the architectural pattern before the products."
            value={draft.communication.withoutServiceNames}
            onChange={(v) =>
              onChange({
                ...draft,
                communication: { ...draft.communication, withoutServiceNames: v },
              })
            }
          />
        </div>
      </>
    );
  if (phase === 'review')
    return (
      <>
        <SectionIntro eyebrow="12 / AI REVIEW" title="Let the reviewer challenge your reasoning.">
          Your first analysis is preserved before feedback. Every suggestion needs your own judgment
          and a reasoned response.
        </SectionIntro>
        <div className="alert">
          <strong>
            <LockKeyhole size={14} style={{ display: 'inline', marginRight: 7 }} />
            {session.snapshots.some((s) => s.kind === 'first')
              ? 'First analysis locked'
              : 'Your reasoning comes first'}
          </strong>
          {session.snapshots.some((s) => s.kind === 'first')
            ? 'The original draft is permanently stored. Editing your working draft cannot change it.'
            : 'Requesting a review seals your draft before the reviewer sees it.'}
        </div>
        {!session.reviews.length ? (
          <div className="card empty-state">
            <Sparkles size={29} style={{ margin: '0 auto 15px', color: '#91a977' }} />
            <h3>Ready for a second perspective?</h3>
            <p>
              The reviewer will challenge discovery gaps, traceability, operational fit and the
              evidence supporting your recommendation.
            </p>
            <button className="button primary" disabled={busy} onClick={() => run('review')}>
              <LockKeyhole size={14} />
              Seal first analysis & request review
            </button>
          </div>
        ) : (
          <>
            <p className="muted small">
              Reviewer: {session.reviewProvider ?? 'Mock'} ·{' '}
              {session.reviews.filter((r) => r.response).length} of {session.reviews.length}{' '}
              responses saved
            </p>
            {session.reviews.map((item) => (
              <ReviewCard
                key={item.id}
                {...{ item, run, busy }}
                edit={reviewEdits[item.id] ?? item}
                onEdit={(edit) => onReviewEdit(item.id, edit)}
              />
            ))}
          </>
        )}
      </>
    );
  if (phase === 'final') {
    const first = session.snapshots.find((s) => s.kind === 'first');
    return (
      <>
        <SectionIntro eyebrow="13 / FINAL REVISION" title="Defend or revise your decision.">
          Use the earlier steps to refine your working analysis. The first draft and accepted
          records remain visible. If your architecture changes, accept a superseding ADR below.
        </SectionIntro>
        <div className="snapshot-compare">
          <div>
            <div className="eyebrow">
              <LockKeyhole size={11} style={{ display: 'inline' }} /> BEFORE REVIEW
            </div>
            <h3 style={{ marginTop: 10 }}>Your original recommendation</h3>
            <p>{first?.draft.recommendation.decision ?? 'No first snapshot recorded.'}</p>
          </div>
          <div>
            <div className="eyebrow">CURRENT WORKING DRAFT</div>
            <h3 style={{ marginTop: 10 }}>Your current recommendation</h3>
            <p>{draft.recommendation.decision}</p>
          </div>
        </div>
        <div className="card" style={{ marginTop: 20 }}>
          <TextField
            label="Final decision"
            hint="Explain what changed after review, what you retained, and why. Be explicit about remaining uncertainty."
            value={draft.finalDecision}
            onChange={(v) => onChange({ ...draft, finalDecision: v })}
            rows={7}
            required
          />
          <TextField
            label="Lessons learned"
            value={draft.lessons}
            onChange={(v) => onChange({ ...draft, lessons: v })}
            rows={4}
            required
          />
        </div>
        <details className="card" style={{ marginTop: 20 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
            Review or supersede the accepted ADR
          </summary>
          <div style={{ marginTop: 20 }}>
            <AdrEditor {...{ data, draft, onChange, run, busy }} />
          </div>
        </details>
      </>
    );
  }
  if (phase === 'evaluation') {
    const result = session.evaluation;
    if (!result)
      return (
        <div className="alert warning">
          <strong>Evaluation has not finished.</strong>
          <p>
            The final snapshot is safe. Refresh if the evaluator is still working, or reopen the
            final revision to submit it again.
          </p>
          <div className="actions">
            <button className="button secondary" onClick={() => window.location.reload()}>
              Refresh evaluation
            </button>
            <button className="button secondary" disabled={busy} onClick={() => run('reopen')}>
              Reopen final revision
            </button>
          </div>
        </div>
      );
    return (
      <>
        <SectionIntro eyebrow="14 / EVALUATION" title="A score is a starting point for reflection.">
          This assessment rewards your process and requirement coverage. A critical miss requires
          revision regardless of the numerical score.
        </SectionIntro>
        <div className="score-hero">
          <div className="score-circle">
            <strong>{result.total}</strong>
            <span>OUT OF 100</span>
          </div>
          <div>
            <h2>{result.status === 'completed' ? 'Case complete.' : 'Needs revision.'}</h2>
            <p>
              {result.status === 'completed'
                ? 'Your decision is ready to document and share.'
                : 'Resolve the critical gaps and submit a revised analysis, or publish this draft with its revision notice.'}
            </p>
            <span className="badge" style={{ marginTop: 12 }}>
              {result.provider} assessment
            </span>
          </div>
        </div>
        {result.criticalMisses.length > 0 && (
          <div className="alert error">
            <strong>Critical misses</strong>
            <ul>
              {result.criticalMisses.map((m, i) => (
                <li key={i}>{m}</li>
              ))}
            </ul>
            <button
              className="button danger small"
              style={{ marginTop: 12 }}
              disabled={busy}
              onClick={() => run('reopen')}
            >
              Revise this case
            </button>
            <p className="muted small" style={{ marginTop: 12 }}>
              You can also publish this draft from the bottom of the page. Its revision status and
              critical misses will remain visible in your portfolio.
            </p>
          </div>
        )}
        <div className="grid-2">
          <section className="card">
            <h3>Reasoning breakdown</h3>
            {result.dimensions.map((d) => (
              <div key={d.name} className="score-row">
                <div className="score-row-head">
                  <span>{d.name}</span>
                  <strong>
                    {d.score}/{d.max}
                  </strong>
                </div>
                <div className="score-track">
                  <span style={{ width: `${(d.score / d.max) * 100}%` }} />
                </div>
                <p>{d.feedback}</p>
              </div>
            ))}
          </section>
          <div>
            <section className="card step-card">
              <h3>What worked</h3>
              <ul className="checklist">
                {result.strengths.map((s, i) => (
                  <li key={i}>
                    <Check size={14} />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
            <section className="card step-card">
              <h3>Practice next</h3>
              <ul className="checklist">
                {result.improvements.map((s, i) => (
                  <li key={i}>
                    <GitBranch size={14} />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
            <section className="card">
              <h3>Skills practiced</h3>
              <div className="actions">
                {scenario.skillTags.map((s) => (
                  <span key={s} className="badge">
                    {s.replaceAll('_', ' ')}
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>
        <div className="alert" style={{ marginTop: 20 }}>
          Mock scoring uses discovery coverage, structured evidence and explicit risk checks. It is
          a practice aid, not professional certification of the architecture.
        </div>
      </>
    );
  }
  if (phase === 'portfolio')
    return (
      <>
        <SectionIntro eyebrow="15 / PORTFOLIO" title="Make your reasoning visible.">
          Share a complete, read-only case study: your first analysis, the review, your response and
          the final decision.
        </SectionIntro>
        <div className="publication-banner">
          <ShieldCheck size={29} style={{ marginBottom: 15 }} />
          <h3>Your consulting case study</h3>
          <p>
            {scenario.title} · {session.evaluation?.total ?? 0}/100 · {scenario.skillTags.length}{' '}
            skills practiced
          </p>
          <div className="actions">
            {session.published ? (
              <Link href={`/showcase/${session.id}`} className="button primary">
                <Eye size={14} />
                View portfolio case study
              </Link>
            ) : (
              <button
                className="button primary"
                disabled={busy || session.evaluation?.status !== 'completed'}
                onClick={() => run('publish')}
              >
                <Eye size={14} />
                Publish to local portfolio
              </button>
            )}
            <button
              className="button secondary"
              disabled={busy}
              onClick={async () => {
                const { exportMarkdown } = await import('@/lib/export');
                const md = exportMarkdown(data);
                const url = URL.createObjectURL(
                  new Blob([md], { type: 'text/markdown;charset=utf-8' }),
                );
                const a = document.createElement('a');
                a.href = url;
                a.download = `case-${session.id}.md`;
                a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <FileDown size={14} />
              Export Markdown
            </button>
            <Link href="/practice" className="button ghost">
              Find your next case →
            </Link>
          </div>
        </div>
        <p className="synthetic-disclaimer">
          This is a synthetic consulting case created for cloud architecture practice. No real
          customer data is represented.
        </p>
        <div className="card">
          <h3>Continue improving</h3>
          <p className="muted small">
            Reopening creates a revision workflow. It removes the case from the portfolio until the
            new decision has been evaluated and published again.
          </p>
          <button className="button secondary" onClick={() => run('reopen')} disabled={busy}>
            Reopen for revision
          </button>
        </div>
      </>
    );
  return null;
}
