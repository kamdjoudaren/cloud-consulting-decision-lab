'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, BookOpen, FileCheck2 } from 'lucide-react';
import {
  ErrorState,
  isCompleted,
  LoadingScreen,
  skillLabel,
  useLabData,
} from '@/components/dashboard-data';
import { syntheticDisclaimer } from '@/lib/export';
import '@/components/screens.css';

export default function ShowcasePage() {
  const { cases, loading, error } = useLabData();
  if (loading) return <LoadingScreen />;
  if (error) return <ErrorState message={error} />;
  const published = cases.filter((c) => c.session.published && c.session.evaluation);
  return (
    <div>
      <div className="page-header">
        <div>
          <p className="eyebrow">THINKING MADE VISIBLE</p>
          <h1>Decisions worth sharing.</h1>
          <p className="muted">
            The context, the trade-offs, and the reasoning behind the recommendation.
          </p>
        </div>
        <span className="badge">
          <BookOpen size={16} />
          Case study collection
        </span>
      </div>
      <div className="synthetic-notice">
        <FileCheck2 size={20} />
        <p>{syntheticDisclaimer}</p>
      </div>
      <div className="showcase-grid">
        {published.map((c) => (
          <Link href={`/showcase/${c.session.id}`} className="showcase-card" key={c.session.id}>
            <div className="showcase-card-art">
              <span className="showcase-art-label">ARCHITECTURE DECISION STUDY</span>
              <span className="showcase-art-company">{c.scenario.company}</span>
              <div className="showcase-art-line">
                <span />
                <span />
                <span />
              </div>
              <span className="showcase-art-bottom">
                LEVEL {c.scenario.level}
                <ArrowUpRight size={25} />
              </span>
            </div>
            <div className="showcase-card-copy">
              <div className="section-heading">
                <span className="eyebrow">{c.scenario.industry}</span>
                {c.session.isExample && <span className="sample-badge">Worked example</span>}
              </div>
              <h2>{c.scenario.title}</h2>
              <p>{c.session.draft.recommendation.decision || c.scenario.businessBrief}</p>
              {c.session.evaluation?.status === 'needs_revision' && (
                <span className="badge" style={{ marginTop: 10 }}>Draft · revisions required</span>
              )}
              <div className="scenario-tags">
                {c.scenario.skillTags.slice(0, 3).map((skill) => (
                  <span key={skill}>{skillLabel(skill)}</span>
                ))}
              </div>
              <span className="text-link">
                Read the case study <ArrowRight size={16} />
              </span>
            </div>
          </Link>
        ))}
      </div>
      {!published.length && (
        <div className="empty-state">
          <BookOpen size={35} />
          <h2>Good reasoning deserves a home.</h2>
          <p>Publish your case from its evaluation step to add it to this collection.</p>
          <Link className="button primary" href="/cases">
            Open your cases <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <p className="dashboard-footer">
        First analysis preserved. Feedback considered. Final decisions owned.
      </p>
    </div>
  );
}
