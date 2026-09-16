'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BriefcaseBusiness,
  Check,
  Clock3,
  Compass,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import type { CaseData, GeneratorInput, ScenarioPublic } from '@/lib/types';
import {
  apiRequest,
  ErrorState,
  levelNames,
  LoadingScreen,
  skillLabel,
  useLabData,
} from './dashboard-data';
import './screens.css';

function GeneratorDialog({
  skills,
  onClose,
  onGenerated,
}: {
  skills: string[];
  onClose: () => void;
  onGenerated: (scenario: ScenarioPublic) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState<GeneratorInput>({
    level: 1,
    primarySkill: skills[0] || 'discovery',
    secondarySkill: skills[1] || 'tradeoff_analysis',
    industry: 'B2B SaaS',
    companySize: 30,
  });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  async function generate(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const result = await apiRequest<{ scenario: ScenarioPublic }>('/api/scenarios', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      onGenerated(result.scenario);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className="generator-dialog"
      onCancel={onClose}
      aria-labelledby="generator-title"
    >
      <form onSubmit={generate}>
        <div className="section-heading">
          <span className="eyebrow">A NEW PERSPECTIVE</span>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close scenario generator"
          >
            <X size={21} />
          </button>
        </div>
        <h2 id="generator-title">Create your next challenge.</h2>
        <p className="muted">
          Choose the context. Discover the constraints. The solution is yours to work out.
        </p>
        <label className="field">
          Difficulty
          <select
            value={form.level}
            onChange={(e) => setForm({ ...form, level: Number(e.target.value) })}
          >
            {levelNames.map((name, i) => (
              <option key={name} value={i + 1}>
                Level {i + 1} — {name}
              </option>
            ))}
          </select>
        </label>
        <div className="grid-2">
          <label className="field">
            Primary skill
            <select
              value={form.primarySkill}
              onChange={(e) => setForm({ ...form, primarySkill: e.target.value })}
            >
              {skills.map((id) => (
                <option key={id} value={id}>
                  {skillLabel(id)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Secondary skill
            <select
              value={form.secondarySkill}
              onChange={(e) => setForm({ ...form, secondarySkill: e.target.value })}
            >
              {skills.map((id) => (
                <option key={id} value={id}>
                  {skillLabel(id)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid-2">
          <label className="field">
            Industry
            <input
              required
              maxLength={100}
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </label>
          <label className="field">
            Company size (employees)
            <input
              type="number"
              required
              min={2}
              max={100000}
              value={form.companySize}
              onChange={(e) => setForm({ ...form, companySize: Number(e.target.value) })}
            />
          </label>
        </div>
        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-footer">
          <button type="button" className="button secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={pending}>
            <Sparkles size={16} />
            {pending ? 'Creating scenario…' : 'Generate scenario'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

export default function ScenarioLibrary({ practice = false }: { practice?: boolean }) {
  const router = useRouter();
  const { scenarios, setScenarios, provider, loading, error } = useLabData();
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState(practice ? '1' : 'all');
  const [skill, setSkill] = useState('all');
  const [industry, setIndustry] = useState('all');
  const [category, setCategory] = useState('all');
  const [generator, setGenerator] = useState(false);
  const [starting, setStarting] = useState('');
  const [actionError, setActionError] = useState('');
  const [created, setCreated] = useState('');
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.has('level')) setLevel(query.get('level')!);
    if (query.has('skill')) setSkill(query.get('skill')!);
    if (query.has('category')) setCategory(query.get('category')!);
  }, []);
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} />;
  const skills = [...new Set(scenarios.flatMap((s) => s.skillTags))].sort();
  const industries = [...new Set(scenarios.map((s) => s.industry))].sort();
  const categories = [...new Set(scenarios.map((s) => s.category))].sort();
  const filtered = scenarios.filter(
    (s) =>
      (level === 'all' || s.level === Number(level)) &&
      (skill === 'all' || s.skillTags.includes(skill)) &&
      (industry === 'all' || s.industry === industry) &&
      (category === 'all' || s.category === category) &&
      `${s.title} ${s.company} ${s.businessBrief} ${s.skillTags.join(' ')}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  async function start(id: string) {
    setStarting(id);
    setActionError('');
    try {
      const data = await apiRequest<CaseData>('/api/cases', {
        method: 'POST',
        body: JSON.stringify({ scenarioId: id }),
      });
      router.push(`/cases/${data.session.id}`);
    } catch (e) {
      setActionError((e as Error).message);
      setStarting('');
    }
  }
  function reset() {
    setSearch('');
    setLevel('all');
    setSkill('all');
    setIndustry('all');
    setCategory('all');
  }
  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">{practice ? 'MAKE ROOM FOR PRACTICE' : 'THE SCENARIO LIBRARY'}</p>
          <h1>
            {practice ? 'One problem. Many possibilities.' : 'Real challenges. Better questions.'}
          </h1>
          <p className="muted">
            {practice
              ? 'Start small, think deeply, and build your consulting instincts.'
              : 'Explore business-first situations that demand architectural judgment.'}
          </p>
        </div>
        <button className="button primary" onClick={() => setGenerator(true)}>
          <Plus size={17} />
          Generate scenario
        </button>
      </div>
      {practice && (
        <section className="practice-intro">
          <Compass size={31} />
          <div>
            <h2>New to consulting? Start at level 1.</h2>
            <p>
              You will meet a client, investigate their problem, compare options, and explain your
              decision. Guidance is included at every step.
            </p>
          </div>
          <span className="badge">Guided practice</span>
        </section>
      )}
      <div className="library-levels">
        <button className={level === 'all' ? 'selected' : ''} onClick={() => setLevel('all')}>
          All levels <span>{scenarios.length}</span>
        </button>
        {levelNames.map((name, i) => (
          <button
            className={level === String(i + 1) ? 'selected' : ''}
            key={name}
            onClick={() => setLevel(String(i + 1))}
          >
            <span className="mini-level">0{i + 1}</span>
            {name}
          </button>
        ))}
      </div>
      <section className="library-filters" aria-label="Filter scenarios">
        <label className="search-field">
          <Search size={18} />
          <input
            aria-label="Search scenarios"
            placeholder="Search a problem, company, or skill…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="filter-selects">
          <SlidersHorizontal size={17} />
          <label className="sr-only" htmlFor="skill-filter">
            Skill
          </label>
          <select id="skill-filter" value={skill} onChange={(e) => setSkill(e.target.value)}>
            <option value="all">All skills</option>
            {skills.map((id) => (
              <option key={id} value={id}>
                {skillLabel(id)}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="industry-filter">
            Industry
          </label>
          <select
            id="industry-filter"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
          >
            <option value="all">All industries</option>
            {industries.map((id) => (
              <option key={id}>{id}</option>
            ))}
          </select>
          <label className="sr-only" htmlFor="category-filter">
            Category
          </label>
          <select
            id="category-filter"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((id) => (
              <option key={id}>{id}</option>
            ))}
          </select>
        </div>
      </section>
      <div className="library-meta">
        <span>
          {filtered.length} {filtered.length === 1 ? 'scenario' : 'scenarios'} to explore
        </span>
        <span>
          <span className="provider-dot" />
          {provider.toLowerCase().includes('mock')
            ? 'Mock client · no API key needed'
            : `${provider || 'Configured'} client provider`}
        </span>
      </div>
      {actionError && (
        <p className="alert" role="alert">
          {actionError}
        </p>
      )}
      {created && (
        <p className="success-message" role="status">
          <Check size={17} />“{created}” is ready in your library.
        </p>
      )}
      <div className="scenario-grid">
        {filtered.map((s) => (
          <article className="scenario-card" key={s.id}>
            <div className="scenario-card-top">
              <span className={`level-badge level-${s.level}`}>LEVEL {s.level}</span>
              <span className="scenario-category">{s.category}</span>
              {s.generated && (
                <span className="generated-dot" title="Generated scenario">
                  <Sparkles size={14} />
                </span>
              )}
            </div>
            <span className="scenario-company">
              {s.company} <span> / {s.industry}</span>
            </span>
            <h2>{s.title}</h2>
            <p className="scenario-brief">{s.businessBrief}</p>
            <div className="scenario-tags">
              {s.skillTags.slice(0, 4).map((tag) => (
                <span key={tag}>{skillLabel(tag)}</span>
              ))}
              {s.skillTags.length > 4 && (
                <span title={s.skillTags.slice(4).map(skillLabel).join(', ')}>
                  +{s.skillTags.length - 4}
                </span>
              )}
            </div>
            <details className="scenario-context">
              <summary>View company context</summary>
              <div>
                <p>
                  <BriefcaseBusiness size={14} />
                  {s.companySize} employees · {s.engineeringTeamSize} engineers
                </p>
                <ul>
                  {s.knownFacts.map((fact, i) => (
                    <li key={i}>{fact}</li>
                  ))}
                </ul>
              </div>
            </details>
            <div className="scenario-card-footer">
              <span>
                <Clock3 size={14} />
                {s.duration} min
                <Users size={14} />
                {s.engineeringTeamSize} eng.
              </span>
              <button className="text-link" disabled={!!starting} onClick={() => start(s.id)}>
                {starting === s.id ? 'Opening…' : 'Start case'}
                <ArrowRight size={16} />
              </button>
            </div>
          </article>
        ))}
      </div>
      {!filtered.length && (
        <div className="empty-state">
          <Search size={32} />
          <h2>No scenarios match those filters.</h2>
          <p>Try a different combination or create a scenario for this context.</p>
          <button className="button secondary" onClick={reset}>
            Clear filters
          </button>
        </div>
      )}
      {generator && (
        <GeneratorDialog
          skills={skills}
          onClose={() => setGenerator(false)}
          onGenerated={(scenario) => {
            setScenarios((previous) => [scenario, ...previous]);
            reset();
            setCreated(scenario.title);
          }}
        />
      )}
      <p className="dashboard-footer">
        All companies and scenarios are synthetic. The reasoning is yours.
      </p>
    </div>
  );
}
