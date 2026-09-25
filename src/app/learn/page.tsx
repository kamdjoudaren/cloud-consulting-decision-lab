'use client';
import Link from 'next/link';
import { useState } from 'react';
import { glossary, learningPath, driverMaps } from '@/data/cloud-learning-guide';
import { useLabData, ErrorState, LoadingScreen } from '@/components/dashboard-data';
import '@/components/simulation.css';
export default function LearningPage() {
  const [query, setQuery] = useState('');
  const { cases, loading, error } = useLabData();
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} />;
  const personal = cases.filter((c) => !c.session.isExample);
  const attempts = personal
    .flatMap((c) =>
      [
        ...(c.session.evaluationHistory || []),
        ...(c.session.evaluation ? [c.session.evaluation] : []),
      ].map((evaluation) => ({ evaluation, data: c })),
    )
    .sort((a, b) => a.evaluation.evaluatedAt.localeCompare(b.evaluation.evaluatedAt));
  const mistakes = [...new Set(attempts.flatMap((a) => a.evaluation.debrief?.mistakes || []))];
  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">CLOUD ARCHITECTURE DECISIONS</p>
          <h1>Build your reasoning, one workstream at a time.</h1>
          <p className="muted">
            Client discovery → requirements → architecture options → validation → ADR → portfolio.
            Practice common cloud decisions, then explain the strategy in your own words.
          </p>
        </div>
      </div>
      <section className="lab-sheet">
        <h2>Your recommended path</h2>
        <div className="learning-stages">
          {learningPath.map(([stage, title, id]) => (
            <Link key={stage} href={`/scenarios?scenario=${id}`}>
              <span className="eyebrow">STAGE {stage}</span>
              <strong>{title}</strong>
              <span>
                {personal.some(
                  (c) =>
                    c.session.scenarioId === id && c.session.evaluation?.status === 'completed',
                )
                  ? 'Practiced · review or try again'
                  : 'Explore a reference case'}{' '}
                →
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="lab-sheet">
        <h2>Practice history and improvement</h2>
        <p>
          Compare attempts at the same difficulty and assistance level. Different scenarios and
          rubrics are not interchangeable benchmarks.
        </p>
        {attempts.length ? (
          <div className="table-wrap">
            <table className="progress-table">
              <thead>
                <tr>
                  <th>Case</th>
                  <th>Level / assistance</th>
                  <th>Context / stage</th>
                  <th>Score</th>
                  <th>Hints</th>
                  <th>Review</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map(({ data, evaluation }, i) => (
                  <tr key={`${data.session.id}-${i}`}>
                    <td>
                      <Link href={`/cases/${data.session.id}`}>{data.scenario.title}</Link>
                      <small style={{ display: 'block' }}>
                        {new Date(evaluation.evaluatedAt).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      {data.scenario.level} / {data.session.simulation?.mode || 'classic'}
                    </td>
                    <td>
                      {data.scenario.lab?.family || 'Cloud'} ·{' '}
                      {data.scenario.lab?.peStage || 'None'}
                    </td>
                    <td>{evaluation.total}/100</td>
                    <td>{evaluation.debrief?.hintsUsed || 0}</td>
                    <td>
                      <details>
                        <summary>Dimensions</summary>
                        {evaluation.dimensions.map((d) => (
                          <p key={d.name}>
                            {d.name}: {d.score}/{d.max}
                          </p>
                        ))}
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>
            Your first evaluated case will start this history. Reopening a case preserves its
            earlier evaluation.
          </p>
        )}
        {mistakes.length > 0 && (
          <details>
            <summary>Reasoning patterns to revisit</summary>
            <ul>
              {mistakes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </details>
        )}
      </section>
      <section className="lab-sheet">
        <h2>Terms in context</h2>
        <label className="field">
          Find a term
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ECS, EC2, RTO, idempotency, ADR…"
          />
        </label>
        {glossary
          .filter((g) => `${g.term} ${g.definition}`.toLowerCase().includes(query.toLowerCase()))
          .map((g) => (
            <details className="document-record" key={g.term}>
              <summary>{g.term}</summary>
              <p>{g.definition}</p>
              <p>
                <strong>Technology example:</strong> {g.example}
              </p>
              <p className="muted">{g.analogy}</p>
            </details>
          ))}
      </section>
      <section className="lab-sheet">
        <h2>Metric driver maps</h2>
        {driverMaps.map((m) => (
          <section className="lab-record" key={m.metric}>
            <h3>{m.metric}</h3>
            <p>{m.drivers}</p>
            <p className="muted">{m.check}</p>
          </section>
        ))}
      </section>
    </div>
  );
}
