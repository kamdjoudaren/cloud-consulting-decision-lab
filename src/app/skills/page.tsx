'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Check, Target } from 'lucide-react';
import { skills } from '@/data/market-skill-matrix';
import { ErrorState, isCompleted, LoadingScreen, useLabData } from '@/components/dashboard-data';
import '@/components/screens.css';

export default function SkillsPage() {
  const { cases, scenarios, loading, error } = useLabData();
  const [group, setGroup] = useState('All skills');
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} />;
  const completed = cases.filter((c) => !c.session.isExample && isCompleted(c));
  const practiced = new Set(completed.flatMap((c) => c.scenario.skillTags));
  const groups = [...new Set(skills.map((s) => s.group))];
  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">SKILLS THAT TRAVEL WITH YOU</p>
          <h1>Build range. Find your gaps.</h1>
          <p className="muted">
            A curriculum organized around professional judgment, not memorized services.
          </p>
        </div>
        <span className="badge">
          <Target size={15} />
          Market skill matrix
        </span>
      </div>
      <section className="skill-summary">
        <div>
          <strong>
            {skills.filter((s) => practiced.has(s.id)).length}
            <small> / {skills.length}</small>
          </strong>
          <p>skills practiced in completed cases</p>
        </div>
        <div>
          <strong>{completed.length}</strong>
          <p>completed cases shaping your judgment</p>
        </div>
        <div className="skill-summary-note">
          <p>
            Coverage records practice, not certification or mastery. Scores reflect case feedback
            and are not a professional credential.
          </p>
          <span>Synthetic examples are excluded.</span>
        </div>
      </section>
      <div className="skill-group-tabs tab-buttons">
        <button
          onClick={() => setGroup('All skills')}
          className={group === 'All skills' ? 'selected' : ''}
        >
          All skills
        </button>
        {groups.map((g) => (
          <button key={g} onClick={() => setGroup(g)} className={group === g ? 'selected' : ''}>
            {g}
          </button>
        ))}
      </div>
      <div className="skill-grid">
        {skills
          .filter((s) => group === 'All skills' || s.group === group)
          .map((skill) => {
            const practicedCases = completed.filter((c) => c.scenario.skillTags.includes(skill.id));
            const score = practicedCases.length
              ? Math.round(
                  practicedCases.reduce((n, c) => n + c.session.evaluation!.total, 0) /
                    practicedCases.length,
                )
              : null;
            const available = scenarios.filter((s) => s.skillTags.includes(skill.id)).length;
            return (
              <article key={skill.id} className="card skill-card">
                <div className="section-heading">
                  <span className="eyebrow">{skill.group}</span>
                  <span className={`skill-check ${practicedCases.length ? 'practiced' : ''}`}>
                    {practicedCases.length ? <Check size={15} /> : <Target size={15} />}
                  </span>
                </div>
                <h2>{skill.name}</h2>
                <p className="muted">{skill.description}</p>
                <div className="skill-metrics">
                  <div>
                    <strong>{practicedCases.length}</strong>
                    <span>Cases</span>
                  </div>
                  <div>
                    <strong>{score === null ? '—' : `${score}/100`}</strong>
                    <span>Avg. case score</span>
                  </div>
                  <div>
                    <strong>
                      {practicedCases.length
                        ? `L${Math.max(...practicedCases.map((c) => c.scenario.level))}`
                        : '—'}
                    </strong>
                    <span>Highest level</span>
                  </div>
                </div>
                <Link
                  className="text-link"
                  href={`/scenarios?skill=${encodeURIComponent(skill.id)}`}
                >
                  {available
                    ? `${available} practice ${available === 1 ? 'scenario' : 'scenarios'}`
                    : 'Explore scenarios'}
                  <ArrowRight size={15} />
                </Link>
              </article>
            );
          })}
      </div>
      <p className="dashboard-footer">
        This editable curriculum is a curated skills framework, not a live analysis of job listings.
      </p>
    </div>
  );
}
