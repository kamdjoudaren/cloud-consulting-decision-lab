'use client';

import { useEffect, useState } from 'react';
import type { CaseData, ScenarioPublic } from '@/lib/types';
import { exampleCase } from '@/data/example-case';
import { skills } from '@/data/market-skill-matrix';

export const levelNames = [
  'Guided beginner',
  'Junior',
  'Consulting',
  'Advanced architecture',
  'Expert architecture',
];
export const skillLabel = (value: string) =>
  skills.find((skill) => skill.id === value)?.name ||
  value.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
export const isCompleted = (item: CaseData) => item.session.evaluation?.status === 'completed';
export const caseStatus = (item: CaseData) =>
  item.session.evaluation?.status === 'needs_revision'
    ? 'Needs revision'
    : isCompleted(item)
      ? 'Completed'
      : 'In progress';
export const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const data = await response.json();
  if (!response.ok) {
    const issues = Array.isArray(data.issues)
      ? data.issues
          .map(
            (issue: { path?: string; message?: string }) =>
              `${issue.path || 'Field'}: ${issue.message || 'Invalid value'}`,
          )
          .join('; ')
      : '';
    throw new Error(
      `${data.error || 'This request could not be completed. Please try again.'}${issues ? ` ${issues}` : ''}`,
    );
  }
  return data as T;
}

export function useLabData() {
  const [cases, setCases] = useState<CaseData[]>([]);
  const [scenarios, setScenarios] = useState<ScenarioPublic[]>([]);
  const [provider, setProvider] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([
      apiRequest<{ cases: CaseData[] }>('/api/cases'),
      apiRequest<{ scenarios: ScenarioPublic[]; provider: string }>('/api/scenarios'),
    ])
      .then(([a, b]) => {
        if (active) {
          setCases([...a.cases, exampleCase]);
          setScenarios(b.scenarios);
          setProvider(b.provider);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  return { cases, scenarios, setScenarios, provider, loading, error };
}

export function LoadingScreen() {
  return (
    <div className="screen-loading" role="status">
      <span className="loading-orbit" />
      Opening your workspace…
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="alert" role="alert">
      <strong>Unable to load this page.</strong>
      <p>{message}</p>
      <button className="button secondary" onClick={() => window.location.reload()}>
        Try again
      </button>
    </div>
  );
}
