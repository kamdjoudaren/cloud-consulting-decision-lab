'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowUp, Check, CircleHelp, Plus, Trash2 } from 'lucide-react';
import type { CaseData, Draft, Note, Requirement } from '@/lib/types';
import { SelectField, TextField } from './form-fields';
type Action = (action: string, payload?: Record<string, unknown>) => Promise<boolean>;
export default function DiscoveryWorkspace({
  data,
  draft,
  onChange,
  run,
  busy,
}: {
  data: CaseData;
  draft: Draft;
  onChange: (d: Draft) => void;
  run: Action;
  busy: boolean;
}) {
  const { session, scenario } = data;
  const [question, setQuestion] = useState('');
  const [stakeholder, setStakeholder] = useState(scenario.stakeholders[0]?.name ?? 'Client');
  const [tab, setTab] = useState<'fact' | 'assumption' | 'unknown' | 'requirements'>('fact');
  const [note, setNote] = useState('');
  const [source, setSource] = useState('');
  const [confidence, setConfidence] = useState<Note['confidence']>('medium');
  const [validation, setValidation] = useState('');
  const [priority, setPriority] = useState<Requirement['priority']>('must');
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [reason, setReason] = useState('');
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [session.messages.length]);
  async function ask(e: React.FormEvent) {
    e.preventDefault();
    if (question.trim() && (await run('chat', { question, stakeholder }))) setQuestion('');
  }
  function addNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    if (tab === 'requirements')
      onChange({
        ...draft,
        requirements: [
          ...draft.requirements,
          { id: `new-${crypto.randomUUID()}`, text: note.trim(), source: source.trim(), priority },
        ],
      });
    else
      onChange({
        ...draft,
        notes: [
          ...draft.notes,
          {
            id: crypto.randomUUID(),
            kind: tab,
            text: note.trim(),
            source: source.trim(),
            confidence,
            validation,
          },
        ],
      });
    setNote('');
    setSource('');
    setValidation('');
  }
  function changeNote(id: string, update: Partial<Note>) {
    onChange({ ...draft, notes: draft.notes.map((n) => (n.id === id ? { ...n, ...update } : n)) });
  }
  return (
    <>
      <div className="discovery-layout">
        <section className="card chat-panel" aria-label="Client conversation">
          <div className="chat-header">
            <span className="chat-avatar">
              {stakeholder
                .split(' ')
                .map((s) => s[0])
                .slice(0, 2)
                .join('')}
            </span>
            <div>
              <strong>{stakeholder}</strong>
              <small>Synthetic client · {scenario.company}</small>
            </div>
            <SelectField label="Speak to" value={stakeholder} onChange={setStakeholder}>
              {scenario.stakeholders.map((s) => (
                <option key={s.name}>{s.name}</option>
              ))}
            </SelectField>
          </div>
          <div className="chat-log" role="log" aria-label="Discovery messages" aria-live="polite">
            <div className="chat-message">
              <div className="message-who">CLIENT BRIEF</div>
              <p>{scenario.businessBrief}</p>
            </div>
            {session.messages.map((message) => (
              <div className={`chat-message ${message.role}`} key={message.id}>
                <div className="message-who">
                  {message.role === 'consultant'
                    ? 'YOU · CONSULTANT'
                    : message.stakeholder.toUpperCase()}
                </div>
                <p>{message.text}</p>
              </div>
            ))}
            <div ref={end} />
          </div>
          <form className="chat-composer" onSubmit={ask}>
            <label className="sr-only" htmlFor="client-question">
              Your question to the client
            </label>
            <textarea
              id="client-question"
              placeholder="Ask a question that could change your decision…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              maxLength={3000}
            />
            <div className="composer-bottom">
              <span>
                {scenario.level === 1
                  ? 'Try asking about business impact, traffic or budget.'
                  : 'Listen. Clarify. Challenge assumptions.'}
              </span>
              <button
                className="button primary small"
                disabled={busy || !question.trim()}
                type="submit"
              >
                Send <ArrowUp size={13} />
              </button>
            </div>
          </form>
        </section>
        <section className="card">
          <div className="section-heading">
            <div>
              <h2>Consultant notebook</h2>
              <p>Keep what you know separate from what you believe.</p>
            </div>
          </div>
          <div className="workspace-tabs" role="tablist" aria-label="Notebook categories">
            {(['fact', 'assumption', 'unknown', 'requirements'] as const).map((t) => (
              <button
                role="tab"
                aria-selected={tab === t}
                key={t}
                onClick={() => setTab(t)}
                className={tab === t ? 'active' : ''}
              >
                {t === 'requirements' ? 'Requirements' : `${t[0].toUpperCase()}${t.slice(1)}s`}{' '}
                <span>
                  (
                  {t === 'requirements'
                    ? draft.requirements.length
                    : draft.notes.filter((n) => n.kind === t).length}
                  )
                </span>
              </button>
            ))}
          </div>
          {tab === 'requirements'
            ? draft.requirements.map((r) => (
                <div className="note-card" key={r.id}>
                  <div className="note-meta">
                    <span className="badge">
                      {r.id.startsWith('new-') ? 'New requirement' : r.id}
                    </span>
                    <span>{r.priority.toUpperCase()}</span>
                    <button
                      className="icon-button"
                      aria-label={`Delete requirement ${r.id}`}
                      onClick={() =>
                        onChange({
                          ...draft,
                          requirements: draft.requirements.filter((x) => x.id !== r.id),
                          links: draft.links.filter((x) => x.requirementId !== r.id),
                        })
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <TextField
                    label="Requirement"
                    value={r.text}
                    rows={2}
                    onChange={(text) =>
                      onChange({
                        ...draft,
                        requirements: draft.requirements.map((x) =>
                          x.id === r.id ? { ...x, text } : x,
                        ),
                      })
                    }
                  />
                  <TextField
                    label={`Source for ${r.id.startsWith('new-') ? 'new requirement' : r.id}`}
                    value={r.source}
                    rows={1}
                    onChange={(source) =>
                      onChange({
                        ...draft,
                        requirements: draft.requirements.map((x) =>
                          x.id === r.id ? { ...x, source } : x,
                        ),
                      })
                    }
                  />
                  <SelectField
                    label={`Priority for ${r.id.startsWith('new-') ? 'new requirement' : r.id}`}
                    value={r.priority}
                    onChange={(priority) =>
                      onChange({
                        ...draft,
                        requirements: draft.requirements.map((x) =>
                          x.id === r.id
                            ? { ...x, priority: priority as Requirement['priority'] }
                            : x,
                        ),
                      })
                    }
                  >
                    <option value="must">Must have</option>
                    <option value="should">Should have</option>
                    <option value="could">Could have</option>
                  </SelectField>
                </div>
              ))
            : draft.notes
                .filter((n) => n.kind === tab)
                .map((n) => (
                  <div key={n.id} className="note-card">
                    <TextField
                      label={`${n.kind[0].toUpperCase() + n.kind.slice(1)}`}
                      value={n.text}
                      rows={2}
                      onChange={(text) => changeNote(n.id, { text })}
                    />
                    <div className="note-source">
                      Source: {n.source || 'Unconfirmed'}
                      {n.validation && <div>Validate: {n.validation}</div>}
                    </div>
                    <div className="note-meta">
                      <span>{n.confidence} confidence</span>
                      <select
                        aria-label={`Move note: ${n.text}`}
                        value={n.kind}
                        onChange={(e) => changeNote(n.id, { kind: e.target.value as Note['kind'] })}
                      >
                        <option value="fact">Fact</option>
                        <option value="assumption">Assumption</option>
                        <option value="unknown">Unknown</option>
                      </select>
                      <button
                        className="icon-button"
                        aria-label={`Delete note: ${n.text}`}
                        onClick={() =>
                          onChange({ ...draft, notes: draft.notes.filter((x) => x.id !== n.id) })
                        }
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <details>
                      <summary className="inline-label">Edit evidence and confidence</summary>
                      <SelectField
                        label="Note confidence"
                        value={n.confidence}
                        onChange={(confidence) =>
                          changeNote(n.id, { confidence: confidence as Note['confidence'] })
                        }
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </SelectField>
                      <TextField
                        label="Source / confirmation"
                        value={n.source}
                        rows={1}
                        onChange={(source) => changeNote(n.id, { source })}
                      />
                      <TextField
                        label="How to validate"
                        value={n.validation}
                        rows={1}
                        onChange={(validation) => changeNote(n.id, { validation })}
                      />
                    </details>
                  </div>
                ))}
          <form onSubmit={addNote}>
            <TextField
              label={tab === 'requirements' ? 'New requirement' : `New ${tab}`}
              value={note}
              onChange={setNote}
              placeholder={
                tab === 'requirements'
                  ? 'A measurable need, constraint or business outcome…'
                  : tab === 'fact'
                    ? 'What has the client confirmed?'
                    : tab === 'assumption'
                      ? 'What do you believe but have not validated?'
                      : 'What still needs to be established?'
              }
              rows={2}
              required
            />
            <TextField
              label="Source / evidence"
              value={source}
              onChange={setSource}
              rows={1}
              placeholder="Brief, client response, evidence report…"
              required={tab === 'fact'}
            />
            {tab === 'requirements' ? (
              <SelectField
                label="Priority"
                value={priority}
                onChange={(v) => setPriority(v as Requirement['priority'])}
              >
                <option value="must">Must have</option>
                <option value="should">Should have</option>
                <option value="could">Could have</option>
              </SelectField>
            ) : (
              tab !== 'fact' && (
                <>
                  <div className="grid-2">
                    <SelectField
                      label="Confidence"
                      value={confidence}
                      onChange={(v) => setConfidence(v as Note['confidence'])}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </SelectField>
                    <TextField
                      label="How to validate"
                      value={validation}
                      onChange={setValidation}
                      rows={1}
                    />
                  </div>
                </>
              )
            )}
            <button
              className="button secondary small"
              type="submit"
              disabled={!note.trim() || (tab === 'fact' && !source.trim())}
            >
              <Plus size={13} />
              Add {tab === 'requirements' ? 'requirement' : tab}
            </button>
          </form>
        </section>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
        <div className="section-heading">
          <div>
            <h3>Good decisions sometimes start with “not yet.”</h3>
            <p>Request the evidence you need before committing to an architecture.</p>
          </div>
          <button className="button secondary" onClick={() => setEvidenceOpen(!evidenceOpen)}>
            <CircleHelp size={15} />I don’t have enough information yet
          </button>
        </div>
        {evidenceOpen && (
          <form
            className="evidence-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run('evidence', { question: evidence, reason })) {
                setEvidence('');
                setReason('');
                setEvidenceOpen(false);
              }
            }}
          >
            <TextField
              label="What evidence do you need?"
              value={evidence}
              onChange={setEvidence}
              placeholder="For example: database connections and request latency during the slowdown"
              required
            />
            <TextField
              label="How could this change your decision?"
              value={reason}
              onChange={setReason}
              required
            />
            <button
              className="button primary"
              disabled={busy || !evidence.trim() || !reason.trim()}
            >
              Request evidence
            </button>
          </form>
        )}
        {session.evidenceRequests.map((r) => (
          <div className="evidence-card" key={r.id}>
            <div className="actions">
              <strong>{r.question}</strong>
              <span className="badge">{r.status.replaceAll('_', ' ')}</span>
            </div>
            <p>{r.response}</p>
            <div className="inline-label">Why it matters: {r.reason}</div>
          </div>
        ))}
      </div>
      {scenario.level === 1 && (
        <details className="glossary">
          <summary>Discovery field guide: RTO, RPO and p95</summary>
          <dl>
            <dt>RTO</dt>
            <dd>The longest the business can wait for service to be restored after a failure.</dd>
            <dt>RPO</dt>
            <dd>The amount of data the business can afford to lose, measured in time.</dd>
            <dt>p95 latency</dt>
            <dd>95% of requests complete faster than this. Ask what it means for customers.</dd>
          </dl>
        </details>
      )}
      {!draft.requirements.length && (
        <p className="alert warning" style={{ marginTop: 20 }}>
          Capture at least one measurable requirement before moving on.
        </p>
      )}
      {draft.notes.length > 0 && draft.notes.every((n) => n.kind === 'fact') && (
        <p className="alert warning" style={{ marginTop: 15 }}>
          Everything is classified as a fact. Check whether a belief or an important unknown is
          missing.
        </p>
      )}
    </>
  );
}
