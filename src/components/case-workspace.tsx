'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CheckCircle2, Clock, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { phases, phaseLabels, type CaseData, type Draft, type Phase } from '@/lib/types';
import DiscoveryWorkspace from './discovery-workspace';
import AnalysisSteps from './analysis-steps';
import DecisionSteps, { type ReviewEdit } from './decision-steps';
import { SectionIntro } from './form-fields';
export default function CaseWorkspace({ id }: { id: string }) {
  const router = useRouter();
  const [data, setData] = useState<CaseData | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [active, setActive] = useState<Phase>('brief');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savedAt, setSavedAt] = useState('');
  const [reviewEdits, setReviewEdits] = useState<Record<string, ReviewEdit>>({});
  const latest = useRef({ data, draft });
  latest.current = { data, draft };
  const lock = useRef(false);
  const pendingReviews =
    data?.session.reviews.filter((item) => {
      const edit = reviewEdits[item.id];
      return edit && (edit.response !== item.response || edit.rationale !== item.rationale);
    }) ?? [];
  const dirty =
    (!!data && !!draft && JSON.stringify(data.session.draft) !== JSON.stringify(draft)) ||
    pendingReviews.length > 0;
  const ingest = useCallback((next: CaseData, move = false) => {
    latest.current = { data: next, draft: next.session.draft };
    setData(next);
    setDraft(next.session.draft);
    if (move) setActive(next.session.phase);
    setSavedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    return next;
  }, []);
  useEffect(() => {
    let mounted = true;
    fetch(`/api/cases/${id}`, { cache: 'no-store' })
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error || 'Case could not be loaded.');
        return json as CaseData;
      })
      .then((d) => {
        if (mounted) ingest(d, true);
      })
      .catch((e) => {
        if (mounted) setError(e.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [id, ingest]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  async function request(path: string, body: unknown, method = 'POST'): Promise<CaseData> {
    const r = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const result = await r.json();
    if (!r.ok) {
      const details = Array.isArray(result.issues)
        ? result.issues
            .map((x: { path: string; message: string }) => `${x.path}: ${x.message}`)
            .join(' · ')
        : '';
      throw new Error(
        [result.error || 'The request could not be completed.', details].filter(Boolean).join(' '),
      );
    }
    return result;
  }
  async function saveCurrent() {
    const current = latest.current;
    if (!current.data || !current.draft) throw new Error('The case is not loaded.');
    if (JSON.stringify(current.data.session.draft) === JSON.stringify(current.draft))
      return current.data;
    const next = await request(
      `/api/cases/${id}`,
      { draft: current.draft, version: current.data.session.version },
      'PATCH',
    );
    latest.current = { data: next, draft: next.session.draft };
    return ingest(next);
  }
  async function run(action: string, payload: Record<string, unknown> = {}): Promise<boolean> {
    if (lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError('');
    let actionSent = false;
    try {
      const current = await saveCurrent();
      if (action === 'save') return true;
      actionSent = true;
      const next = await request(`/api/cases/${id}/action`, {
        action,
        ...payload,
        version: current.session.version,
      });
      ingest(next, next.session.phase !== current.session.phase);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      // A reviewer call can fail after the immutable snapshot has been committed.
      // Adopt the server's new version so retrying cannot overwrite the sealed draft.
      if (actionSent && (action === 'review' || action === 'evaluate')) {
        try {
          const response = await fetch(`/api/cases/${id}`, { cache: 'no-store' });
          if (response.ok) ingest(await response.json(), true);
        } catch {
          /* Keep the actionable error and saved server-side history. */
        }
      }
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  async function saveAll(): Promise<boolean> {
    if (!(await run('save'))) return false;
    for (const item of pendingReviews) {
      const edit = reviewEdits[item.id];
      if (!edit.response || edit.rationale.trim().length < 10) {
        setError(
          'Choose a response and provide at least 10 characters of rationale for each edited review item.',
        );
        return false;
      }
      if (!(await run('respondReview', { reviewId: item.id, ...edit }))) return false;
    }
    return true;
  }
  useEffect(() => {
    const navigate = (event: MouseEvent) => {
      if (
        !dirty ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor = (event.target as Element)?.closest?.('a');
      if (!anchor || anchor.target || anchor.hasAttribute('download')) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname)
        return;
      event.preventDefault();
      event.stopPropagation();
      void saveAll().then((saved) => {
        if (saved) router.push(url.pathname + url.search + url.hash);
      });
    };
    document.addEventListener('click', navigate, true);
    return () => document.removeEventListener('click', navigate, true);
  });
  if (loading)
    return (
      <div className="loading-state" role="status">
        <span className="spinner" />
        Opening your consulting workspace…
      </div>
    );
  if (!data || !draft)
    return (
      <div className="card empty-state">
        <h1>Unable to open this case.</h1>
        <p role="alert">{error}</p>
        <Link href="/cases" className="button primary">
          Back to my cases
        </Link>
      </div>
    );
  const { scenario, session } = data;
  const currentIndex = phases.indexOf(session.phase);
  const activeIndex = phases.indexOf(active);
  const locked = session.phase === 'evaluation' || session.phase === 'portfolio';
  function goBack() {
    setActive(phases[Math.max(0, activeIndex - 1)]);
  }
  const next = async () => {
    if (active !== session.phase) {
      setActive(phases[Math.min(currentIndex, activeIndex + 1)]);
      return;
    }
    if (await saveAll()) await run(active === 'final' ? 'evaluate' : 'advance');
  };
  return (
    <>
      <div className="case-heading">
        <Link
          className="muted small"
          href="/cases"
          style={{ display: 'inline-flex', gap: 5, alignItems: 'center', marginBottom: 20 }}
        >
          <ArrowLeft size={12} />
          My cases
        </Link>
        <div className="eyebrow">CONSULTING WORKSPACE / {scenario.company}</div>
        <h1 style={{ margin: '8px 0 0' }}>{scenario.title}</h1>
        <div className="case-meta">
          <span className="badge green">Level {scenario.level}</span>
          <span>{scenario.industry}</span>
          <span className="separator">/</span>
          <span>{scenario.companySize} people</span>
          <span className="separator">/</span>
          <Clock size={11} />
          <span>{scenario.duration} min practice</span>
          <span className="badge">
            {session.evaluation?.status === 'needs_revision'
              ? 'Needs revision'
              : phaseLabels[session.phase]}
          </span>
        </div>
      </div>
      <nav className="case-stepper" aria-label="Case progress">
        {phases.map((p, i) => (
          <button
            key={p}
            disabled={busy || i > currentIndex}
            onClick={() => setActive(p)}
            className={active === p ? 'current' : i < currentIndex ? 'complete' : ''}
            aria-current={active === p ? 'step' : undefined}
          >
            <span className="step-number">
              {i < currentIndex ? <Check size={11} /> : String(i + 1).padStart(2, '0')}
            </span>
            {phaseLabels[p]}
          </button>
        ))}
      </nav>
      {error && (
        <div className="alert error" role="alert">
          <strong>Action needs attention</strong>
          {error}
          {error.toLowerCase().includes('version') && (
            <button
              className="button secondary small"
              onClick={() => window.location.reload()}
              style={{ marginLeft: 10 }}
            >
              Reload saved version
            </button>
          )}
        </div>
      )}
      {locked && activeIndex < 13 && (
        <div className="alert">
          This evaluated draft is read-only. Reopen the case from Evaluation or Portfolio to revise
          it.
        </div>
      )}
      {session.phase === 'review' && activeIndex < 11 && (
        <div className="alert">
          Your first analysis is sealed. Respond to the review, then revise your working draft in
          the Final revision step.
        </div>
      )}
      <fieldset
        disabled={
          busy || (locked && activeIndex < 13) || (session.phase === 'review' && activeIndex < 11)
        }
        style={{ border: 0, margin: 0, padding: 0, minWidth: 0 }}
      >
        {active === 'brief' && (
          <>
            <SectionIntro
              eyebrow="01 / BUSINESS BRIEF"
              title="Every architecture starts with a business problem."
            >
              Read the initial brief. You don’t have all the information yet; discovery is where you
              find what matters.
            </SectionIntro>
            <div className="business-brief">
              <div className="eyebrow">THE CLIENT’S WORDS</div>
              <blockquote>“{scenario.businessBrief}”</blockquote>
              <div className="brief-person">
                {scenario.stakeholders[0]?.name} · {scenario.stakeholders[0]?.role} ·{' '}
                {scenario.company}
              </div>
            </div>
            <div className="grid-2" style={{ marginTop: 20 }}>
              <section className="card">
                <h3>What you know so far</h3>
                <ul className="brief-facts">
                  {scenario.knownFacts.map((fact, i) => (
                    <li key={i}>
                      <CheckCircle2 size={14} />
                      {fact}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="card">
                <h3>Your role</h3>
                <p className="muted small">
                  Understand the business impact, discover the constraints, and build a
                  recommendation you can defend.
                </p>
                <p className="muted small">
                  The client can share observations and evidence. The architecture decision belongs
                  to you.
                </p>
                <div className="actions">
                  {scenario.skillTags.map((s) => (
                    <span className="badge" key={s}>
                      {s.replaceAll('_', ' ')}
                    </span>
                  ))}
                </div>
              </section>
            </div>
            <p className="synthetic-disclaimer" style={{ marginTop: 20 }}>
              Synthetic consulting scenario. No real customer data is represented.
            </p>
          </>
        )}
        {active === 'discovery' && (
          <>
            <SectionIntro
              eyebrow="02 / CLIENT DISCOVERY"
              title="Ask the questions that could change the decision."
            >
              The brief is only the beginning. Capture confirmed facts, test your assumptions and
              make unknowns visible.
            </SectionIntro>
            <DiscoveryWorkspace
              data={data}
              draft={draft}
              onChange={setDraft}
              run={run}
              busy={busy}
            />
          </>
        )}
        {[
          'frame',
          'options',
          'tradeoffs',
          'recommendation',
          'simplify',
          'conditions',
          'validation',
        ].includes(active) && <AnalysisSteps phase={active} draft={draft} onChange={setDraft} />}
        {['adr', 'communication', 'review', 'final', 'evaluation', 'portfolio'].includes(
          active,
        ) && (
          <DecisionSteps
            phase={active}
            data={data}
            draft={draft}
            onChange={setDraft}
            run={run}
            busy={busy}
            reviewEdits={reviewEdits}
            onReviewEdit={(id, edit) => setReviewEdits((previous) => ({ ...previous, [id]: edit }))}
          />
        )}
      </fieldset>
      <div className="case-toolbar">
        <div className="actions">
          {activeIndex > 0 && (
            <button className="button ghost small" disabled={busy} onClick={goBack}>
              <ArrowLeft size={13} />
              Back
            </button>
          )}
          <span className="save-status">
            {busy ? (
              <>
                <span className="spinner" />
                Saving…
              </>
            ) : dirty ? (
              'Unsaved changes'
            ) : (
              <>
                <Check size={12} />
                {savedAt ? `Saved ${savedAt}` : 'All changes saved'}
              </>
            )}
          </span>
        </div>
        <div className="actions">
          {!locked && (
            <button className="button secondary" disabled={busy || !dirty} onClick={saveAll}>
              <Save size={13} />
              {pendingReviews.length ? 'Save changes' : 'Save draft'}
            </button>
          )}
          {active !== 'portfolio' &&
            !(active === 'evaluation' && session.evaluation?.status === 'needs_revision') && (
              <button className="button primary" disabled={busy} onClick={next}>
                {active === 'brief'
                  ? 'Start discovery'
                  : active === 'final'
                    ? 'Evaluate final decision'
                    : active === 'evaluation'
                      ? 'Prepare portfolio'
                      : active !== session.phase
                        ? 'Next step'
                        : `Continue to ${phaseLabels[phases[activeIndex + 1]].toLowerCase()}`}
                <ArrowRight size={13} />
              </button>
            )}
        </div>
      </div>
    </>
  );
}
