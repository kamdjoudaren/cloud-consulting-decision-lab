'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BriefcaseBusiness, Plus, Search } from 'lucide-react';
import { phaseLabels, phases } from '@/lib/types';
import { workflowPhases } from '@/lib/lab/workflow';
import {
  caseStatus,
  dateLabel,
  ErrorState,
  isCompleted,
  LoadingScreen,
  useLabData,
} from '@/components/dashboard-data';
import '@/components/screens.css';

export default function CasesPage() {
  const { cases, loading, error } = useLabData();
  const [filter, setFilter] = useState('All cases');
  const [search, setSearch] = useState('');
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} />;
  const personal = cases.filter((c) => !c.session.isExample);
  const filtered = personal
    .filter(
      (c) =>
        (filter === 'All cases' || caseStatus(c) === filter) &&
        `${c.scenario.title} ${c.scenario.company}`.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => b.session.updatedAt.localeCompare(a.session.updatedAt));
  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">YOUR BODY OF WORK</p>
          <h1>Every case, a new perspective.</h1>
          <p className="muted">
            Return to a decision, revisit your reasoning, and keep moving forward.
          </p>
        </div>
        <Link className="button primary" href="/scenarios">
          <Plus size={16} />
          Start a case
        </Link>
      </div>
      <div className="case-toolbar">
        <div className="tab-buttons">
          {['All cases', 'In progress', 'Needs revision', 'Completed'].map((label) => (
            <button
              key={label}
              className={filter === label ? 'selected' : ''}
              onClick={() => setFilter(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={17} />
          <input
            aria-label="Search cases"
            placeholder="Search your cases…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
      </div>
      {filtered.length ? (
        <div className="case-history-grid">
          {filtered.map((c) => (
            <article key={c.session.id} className="card history-card">
              <div className="section-heading">
                <span className="case-icon">
                  <BriefcaseBusiness size={22} />
                </span>
                <span className={`status-pill ${isCompleted(c) ? 'complete' : ''}`}>
                  {caseStatus(c)}
                </span>
              </div>
              <p className="eyebrow">
                {c.scenario.company} · LEVEL {c.scenario.level}
              </p>
              <h2>{c.scenario.title}</h2>
              <p className="muted">{phaseLabels[c.session.phase]}</p>
              <div className="progress-track">
                <span
                  style={{
                    width: `${isCompleted(c) ? 100 : ((workflowPhases(c.session).indexOf(c.session.phase) + 1) / workflowPhases(c.session).length) * 100}%`,
                  }}
                />
              </div>
              <div className="history-meta">
                <span>Updated {dateLabel(c.session.updatedAt)}</span>
                <strong>
                  {c.session.evaluation ? `${c.session.evaluation.total}/100` : 'Not evaluated'}
                </strong>
              </div>
              <div className="history-actions">
                <Link className="text-link" href={`/cases/${c.session.id}`}>
                  {isCompleted(c) ? 'Open case' : 'Continue case'}
                  <ArrowRight size={16} />
                </Link>
                {isCompleted(c) && c.session.published && (
                  <Link className="text-link" href={`/showcase/${c.session.id}`}>
                    Case study <ArrowUpRight size={16} />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <BriefcaseBusiness size={35} />
          <h2>
            {personal.length
              ? 'No cases match this view.'
              : 'Your consulting practice begins here.'}
          </h2>
          <p>
            {personal.length
              ? 'Try another status or search term.'
              : 'Start with a business problem. Build a recommendation with evidence.'}
          </p>
          <Link className="button primary" href="/practice">
            Explore guided practice <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </div>
  );
}
