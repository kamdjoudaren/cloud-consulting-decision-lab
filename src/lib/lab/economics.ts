import type { ConsultingDraft, Initiative } from './schema';

export function economicMetrics(e: ConsultingDraft['economics']) {
  const divide = (a: number | null, b: number | null) =>
    a === null || b === null || b <= 0 ? null : a / b;
  const change = (a: number | null, b: number | null) =>
    a === null || b === null || a <= 0 ? null : (b / a - 1) * 100;
  const unitBefore = divide(e.cloudBefore, e.unitsBefore);
  const unitAfter = divide(e.cloudAfter, e.unitsAfter);
  const margin = (r: number | null, c: number | null) =>
    r === null || c === null || r <= 0 ? null : ((r - c) / r) * 100;
  return {
    spendGrowth: change(e.cloudBefore, e.cloudAfter),
    volumeGrowth: change(e.unitsBefore, e.unitsAfter),
    unitBefore,
    unitAfter,
    unitChange: change(unitBefore, unitAfter),
    grossMarginBefore: margin(e.revenueBefore, e.cogsBefore),
    grossMarginAfter: margin(e.revenueAfter, e.cogsAfter),
  };
}

/** One benefit key identifies the same economic dollars across GM/EBITDA views. */
export function valueLedger(initiatives: Initiative[]) {
  const seen = new Set<string>();
  const warnings: string[] = [];
  let identifiedRecurring = 0,
    verifiedRecurring = 0,
    firstYearNetCash = 0,
    implementationCost = 0;
  for (const i of initiatives) {
    const key = i.benefitKey.trim().toLowerCase();
    if (!key) {
      warnings.push(`${i.name || 'Initiative'} needs a unique benefit key before aggregation.`);
      continue;
    }
    if (seen.has(key)) {
      warnings.push(
        `Duplicate benefit “${key}” excluded. Gross Margin and EBITDA are views of the same dollars.`,
      );
      continue;
    }
    seen.add(key);
    implementationCost += i.cost;
    firstYearNetCash -= i.cost;
    if (i.kind === 'recurring') {
      const net = Math.max(0, i.annualValue - i.offset);
      identifiedRecurring += net;
      if (i.stage === 'verified' && i.financeSignoff.trim() && i.evidenceIds.length)
        verifiedRecurring += Math.max(0, Math.min(i.verifiedAnnualValue, i.annualValue) - i.offset);
      firstYearNetCash += (net * Math.max(0, 12 - i.monthsToStart)) / 12;
    } else if (i.kind === 'one-time') {
      if (i.monthsToStart < 12) firstYearNetCash += Math.max(0, i.annualValue - i.offset);
    }
    if (i.stage === 'verified' && (!i.financeSignoff.trim() || !i.evidenceIds.length))
      warnings.push(`${i.name}: verified value requires measured evidence and Finance sign-off.`);
    if (i.verifiedAnnualValue > i.annualValue)
      warnings.push(
        `${i.name}: verified value exceeds the documented opportunity; reconcile the baseline.`,
      );
  }
  return { identifiedRecurring, verifiedRecurring, firstYearNetCash, implementationCost, warnings };
}
