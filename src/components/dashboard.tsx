'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  CheckCheck,
  Compass,
  Layers3,
  Play,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { phaseLabels } from '@/lib/types';
import {
  caseStatus,
  dateLabel,
  ErrorState,
  isCompleted,
  levelNames,
  LoadingScreen,
  skillLabel,
  useLabData,
} from './dashboard-data';
import './screens.css';

export default function Dashboard() {
  const { cases, scenarios, loading, error } = useLabData();
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} />;
  const personal = cases.filter((item) => !item.session.isExample);
  const completed = personal.filter(isCompleted);
  const active = personal.filter((item) => !isCompleted(item));
  const skills = [...new Set(completed.flatMap((item) => item.scenario.skillTags))];
  const average = completed.length
    ? Math.round(
        completed.reduce((sum, item) => sum + (item.session.evaluation?.total || 0), 0) /
          completed.length,
      )
    : null;
  const recent = personal
    .slice()
    .sort((a, b) => b.session.updatedAt.localeCompare(a.session.updatedAt))
    .slice(0, 3);
  const examples = cases.filter(
    (item) => item.session.isExample && isCompleted(item) && item.session.published,
  );
  const counts = [...new Set(scenarios.flatMap((s) => s.skillTags))]
    .map((id) => ({ id, count: completed.filter((c) => c.scenario.skillTags.includes(id)).length }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  const scores = completed
    .slice()
    .sort((a, b) => a.session.updatedAt.localeCompare(b.session.updatedAt))
    .slice(-8)
    .map((c) => c.session.evaluation!.total);
  const criticalMisses = personal.reduce(
    (sum, item) => sum + (item.session.evaluation?.criticalMisses.length || 0),
    0,
  );
  const currentLevel =
    active[0]?.scenario.level ||
    (completed.length ? Math.max(...completed.map((item) => item.scenario.level)) : 1);
  const domains = [...new Set(scenarios.map((item) => item.category))]
    .map((name) => ({
      name,
      count: completed.filter((item) => item.scenario.category === name).length,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);
  const points = scores
    .map((score, i) => `${32 + i * (420 / Math.max(scores.length - 1, 1))},${152 - score * 1.15}`)
    .join(' ');
  return (
    <div className="dashboard-screen">
      <div className="page-header">
        <div>
          <p className="eyebrow">YOUR CONSULTING WORKSPACE</p>
          <h1>Build better judgment.</h1>
          <p className="muted">Every good architecture starts with a better question.</p>
        </div>
        <Link className="button secondary" href="/scenarios">
          Explore scenarios <ArrowUpRight size={16} />
        </Link>
      </div>
      <section className="lab-hero">
        <div className="hero-copy">
          <span className="hero-kicker">
            <span />
            THE DECISION LAB
          </span>
          <h2>
            Practice the decisions,
            <br />
            not just the services.
          </h2>
          <p>
            Step into a business problem. Ask the right questions.
            <br className="desktop-break" /> Make a recommendation you can stand behind.
          </p>
          <Link
            href={active.length ? `/cases/${active[0].session.id}` : '/practice'}
            className="button hero-button"
          >
            <Play size={16} fill="currentColor" />
            {active.length ? 'Continue your case' : 'Start your first case'}
            <ArrowRight size={17} />
          </Link>
          <span className="hero-footnote">
            Realistic scenarios. Your reasoning. A sharper perspective.
          </span>
        </div>
        <div className="hero-diagram" aria-hidden="true">
          <div className="diagram-dot-grid" />
          <div className="diagram-node node-problem">
            <BriefcaseBusiness size={19} />
            <span>Business problem</span>
          </div>
          <div className="diagram-line line-one" />
          <div className="diagram-node node-discover">
            <Compass size={20} />
            <span>Discover & question</span>
          </div>
          <div className="diagram-line line-two" />
          <div className="diagram-node node-decide">
            <Layers3 size={20} />
            <span>Weigh the trade-offs</span>
          </div>
          <div className="diagram-line line-three" />
          <div className="diagram-node node-outcome">
            <CheckCheck size={19} />
            <span>A decision that fits</span>
            <span className="node-pip" />
          </div>
        </div>
      </section>
      <div className="stats-grid">
        {[
          {
            label: 'Cases completed',
            value: String(completed.length).padStart(2, '0'),
            note: 'Decisions made and defended',
            icon: BriefcaseBusiness,
          },
          {
            label: 'In progress',
            value: String(active.length).padStart(2, '0'),
            note: 'Your next perspective awaits',
            icon: Compass,
          },
          {
            label: 'Average score',
            value: average === null ? '—' : `${average}`,
            note:
              average === null
                ? 'Complete a case to establish a baseline'
                : 'Across your completed cases',
            icon: ChartNoAxesCombined,
          },
          {
            label: 'Skills practiced',
            value: String(skills.length).padStart(2, '0'),
            note: 'Built through deliberate practice',
            icon: Target,
          },
        ].map((stat) => (
          <section className="stat-card" key={stat.label}>
            <div className="stat-top">
              <span>{stat.label}</span>
              <stat.icon size={18} />
            </div>
            <strong>
              {stat.value}
              {stat.label === 'Average score' && average !== null && <small>/100</small>}
            </strong>
            <p>{stat.note}</p>
          </section>
        ))}
      </div>
      <div className="progress-context">
        <span>
          <strong>{personal.length ? 'Current practice level' : 'Suggested starting level'}</strong>{' '}
          Level {currentLevel} · {levelNames[currentLevel - 1]}
        </span>
        <span>
          <strong>Critical misses</strong> {criticalMisses} in your latest case evaluations
        </span>
      </div>
      <div className="dashboard-columns">
        <section className="card recent-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">KEEP THE MOMENTUM</p>
              <h2>Your recent cases</h2>
            </div>
            <Link className="text-link" href="/cases">
              View all <ArrowRight size={15} />
            </Link>
          </div>
          {recent.length ? (
            recent.map((item) => (
              <Link className="case-row" key={item.session.id} href={`/cases/${item.session.id}`}>
                <span className="case-icon">
                  <BriefcaseBusiness size={20} />
                </span>
                <span className="case-row-main">
                  <strong>{item.scenario.title}</strong>
                  <span>
                    {item.scenario.company} · Level {item.scenario.level} ·{' '}
                    {phaseLabels[item.session.phase]}
                  </span>
                </span>
                <span className={`status-pill ${isCompleted(item) ? 'complete' : ''}`}>
                  {caseStatus(item)}
                </span>
                <ArrowUpRight size={17} />
              </Link>
            ))
          ) : (
            <div className="case-empty">
              <span className="empty-line-icon">
                <Compass size={27} />
              </span>
              <h3>Your first decision starts here.</h3>
              <p>
                Choose a guided scenario and turn an incomplete
                <br />
                client brief into a thoughtful recommendation.
              </p>
              <Link className="text-link" href="/practice">
                Find your first case <ArrowRight size={15} />
              </Link>
            </div>
          )}
          {examples[0] && (
            <Link href={`/showcase/${examples[0].session.id}`} className="example-callout">
              <span className="example-symbol">
                <Sparkles size={17} />
              </span>
              <span>
                <strong>See a worked example</strong>
                <small>A synthetic demonstration · excluded from your progress</small>
              </span>
              <ArrowUpRight size={18} />
            </Link>
          )}
        </section>
        <section className="card coverage-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">DEVELOP YOUR RANGE</p>
              <h2>Skill coverage</h2>
            </div>
            <Target size={19} />
          </div>
          <p className="muted small-copy">Your practice across professional skills.</p>
          <div className="coverage-list">
            {counts.map((skill) => (
              <div key={skill.id}>
                <div className="progress-label">
                  <span>{skillLabel(skill.id)}</span>
                  <small>
                    {skill.count} {skill.count === 1 ? 'case' : 'cases'}
                  </small>
                </div>
                <div className="progress-track">
                  <span
                    style={{
                      width: `${completed.length ? (skill.count / completed.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Link className="text-link" href="/skills">
            Explore skill matrix <ArrowRight size={15} />
          </Link>
        </section>
      </div>
      <div className="dashboard-columns lower-columns">
        <section className="card growth-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THINKING, OVER TIME</p>
              <h2>Decision quality</h2>
            </div>
            <TrendingUp size={19} />
          </div>
          {scores.length ? (
            <>
              <svg
                className="score-chart"
                viewBox="0 0 480 175"
                role="img"
                aria-label={`Completed case scores in chronological order: ${scores.join(', ')}`}
              >
                <line x1="30" y1="37" x2="465" y2="37" stroke="#e6ebe6" strokeDasharray="4 5" />
                <line x1="30" y1="95" x2="465" y2="95" stroke="#e6ebe6" strokeDasharray="4 5" />
                <line x1="30" y1="152" x2="465" y2="152" stroke="#e6ebe6" />
                <text x="2" y="40" fontSize="9" fill="#7e8d86">
                  100
                </text>
                <text x="6" y="98" fontSize="9" fill="#7e8d86">
                  50
                </text>
                <text x="12" y="155" fontSize="9" fill="#7e8d86">
                  0
                </text>
                <polyline points={points} fill="none" stroke="#426b53" strokeWidth="3" />
                {scores.map((score, i) => (
                  <circle
                    key={i}
                    cx={32 + i * (420 / Math.max(scores.length - 1, 1))}
                    cy={152 - score * 1.15}
                    r="4"
                    fill="#426b53"
                    stroke="white"
                    strokeWidth="2"
                  />
                ))}
              </svg>
              <p className="chart-note">
                Last {scores.length} completed {scores.length === 1 ? 'case' : 'cases'} · oldest to
                newest
              </p>
            </>
          ) : (
            <div className="chart-empty">
              <ChartNoAxesCombined size={30} />
              <p>
                A little practice.
                <br />
                <strong>A clearer perspective.</strong>
              </p>
              <span>Your scores will appear here as you complete cases.</span>
            </div>
          )}
        </section>
        <section className="card mindset-note">
          <span className="note-number">01 / A CONSULTANT’S MINDSET</span>
          <h2>
            Understand the problem
            <br />
            before choosing the platform.
          </h2>
          <p>
            A three-person team and a platform team might make different decisions. Both can be
            right. Context is the work.
          </p>
          <Link className="text-link" href="/scenarios">
            Put it into practice <ArrowRight size={16} />
          </Link>
        </section>
      </div>
      <section className="domain-coverage card">
        <div className="section-heading">
          <h2>Cases by domain</h2>
          <span className="muted small-copy">Completed practice · examples excluded</span>
        </div>
        <div className="domain-counts">
          {domains.map((domain) => (
            <Link href={`/scenarios?category=${encodeURIComponent(domain.name)}`} key={domain.name}>
              <span>{domain.name}</span>
              <strong>{domain.count}</strong>
            </Link>
          ))}
        </div>
      </section>
      <section className="learning-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A PATH, NOT A RACE</p>
            <h2>Your learning journey</h2>
          </div>
          <span className="muted small-copy">Five levels. Increasingly nuanced decisions.</span>
        </div>
        <div className="journey-grid">
          {levelNames.map((name, i) => {
            const count = completed.filter((c) => c.scenario.level === i + 1).length;
            return (
              <Link
                key={name}
                href={`/scenarios?level=${i + 1}`}
                className={`journey-step ${i + 1 === currentLevel ? 'journey-current' : ''}`}
              >
                <span className="level-number">0{i + 1}</span>
                <span className="journey-label">LEVEL {i + 1}</span>
                <h3>{name}</h3>
                <span className="journey-count">
                  {count
                    ? `${count} completed`
                    : i === 0
                      ? 'Start with the fundamentals'
                      : 'Explore at your own pace'}
                  <ArrowRight size={14} />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <p className="dashboard-footer">Thoughtful architecture is a practice. Make space for it.</p>
    </div>
  );
}
