import { test, expect, type Page } from '@playwright/test';

async function fill(page: Page, label: string, value: string) {
  await page.getByRole('textbox', { name: label, exact: true }).fill(value);
}
async function next(page: Page) {
  await page.getByRole('button', { name: /^Continue to / }).click();
}

test('guided consulting case preserves reasoning and exports a completed portfolio', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  // Generated classic variants retain the pre-upgrade 15-step workflow.
  const legacyResponse = await request.post('/api/scenarios', {
    data: {
      level: 1,
      primarySkill: 'performance',
      secondarySkill: 'caching',
      industry: 'E-commerce',
      companySize: 24,
    },
  });
  expect(legacyResponse.ok()).toBe(true);
  const legacyScenario = (await legacyResponse.json()).scenario;
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Build better judgment.' })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/overview.png', fullPage: true });
  await page.getByRole('link', { name: 'Scenario library', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Real challenges. Better questions.' }),
  ).toBeVisible();
  const library = await (await request.get('/api/scenarios')).json();
  expect(library.scenarios.length).toBeGreaterThanOrEqual(25);
  expect(JSON.stringify(library)).not.toContain('hiddenFacts');
  const selected = library.scenarios.find((s: { id: string }) => s.id === legacyScenario.id);
  await page
    .locator('.scenario-card')
    .filter({ has: page.getByRole('heading', { name: selected.title, exact: true }) })
    .getByRole('button', { name: 'Start case', exact: true })
    .click();
  // The first dynamic page compiles on demand in the development test server.
  await expect(page).toHaveURL(/\/cases\//, { timeout: 60_000 });
  const caseId = page.url().split('/').at(-1);
  const created = await (await request.get(`/api/cases/${caseId}`)).json();
  await page.getByRole('button', { name: 'Start discovery', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Ask the questions that could change the decision.' }),
  ).toBeVisible({ timeout: 60000 });
  await page.screenshot({ path: 'docs/screenshots/discovery.png', fullPage: true });
  for (const question of [
    'What business impact and lost revenue do you observe?',
    'What are your traffic patterns and peak request volumes?',
    'What are the current architecture and database connections?',
    'What is the budget and monthly spend?',
    'How many engineers operate this and what skills does the team have?',
    'What downtime, recovery time and data loss can the business tolerate?',
    'What security and data constraints apply?',
    'What requirements constraints and operational observations affect this decision?',
    'What production operations and incident observations have actually been measured?',
  ]) {
    await fill(page, 'Your question to the client', question);
    await page.getByRole('button', { name: 'Send', exact: true }).click();
    await expect(page.getByLabel('Your question to the client')).toHaveValue('');
  }
  await page.getByRole('button', { name: 'I don’t have enough information yet' }).click();
  await fill(
    page,
    'What evidence do you need?',
    'Traffic latency metrics, database connections and cost breakdown during the campaign peak',
  );
  await fill(
    page,
    'How could this change your decision?',
    'We should defer the architecture commitment until the actual bottleneck is measured.',
  );
  await page.getByRole('button', { name: 'Request evidence', exact: true }).click();
  await expect(page.getByLabel('What evidence do you need?')).not.toBeVisible();
  await page.getByRole('tab', { name: /Requirements/ }).click();
  await fill(
    page,
    'New requirement',
    'Keep checkout responsive during campaign peaks, with p95 below 500 ms.',
  );
  await fill(page, 'Source / evidence', 'Client discovery and measured campaign traffic');
  await page.getByRole('button', { name: 'Add requirement', exact: true }).click();
  await next(page);
  await expect(page.getByRole('heading', { name: 'Solve the right problem.' })).toBeVisible();
  for (const [label, value] of Object.entries({
    'What the client says': 'Customers cannot complete checkout during marketing campaigns.',
    'The problem I believe needs solving':
      'Find and remove the constrained checkout path before increasing campaign spend.',
    'Business impact': 'Lost conversions reduce revenue and waste marketing spend.',
    'Technical symptoms':
      'Checkout latency rises during peaks; the limiting component needs measurement.',
    'Known constraints':
      'The small engineering team needs a reversible change within the agreed budget.',
    'Main uncertainties':
      'Confirm database connection saturation and the contribution of application work.',
  }))
    await fill(page, label, value);
  await next(page);
  await page.getByRole('button', { name: 'Create two options' }).click();
  for (let i = 0; i < 2; i++) {
    if (i === 1) await page.getByRole('button', { name: 'Option B', exact: true }).click();
    const managed = i === 0;
    for (const [label, value] of Object.entries({
      'Option name': managed
        ? 'Measure and tune the existing platform'
        : 'Migrate compute to managed containers',
      Summary: managed
        ? 'Measure the bottleneck, bound connections, and gradually tune capacity.'
        : 'Move application instances into a managed container service in phases.',
      'Architecture components': managed
        ? 'Keep the load balancer and private database; tune the connection pool and instrument checkout.'
        : 'Managed container tasks behind a load balancer with a private relational database.',
      Advantages: managed
        ? 'Small reversible steps with lower operational burden.'
        : 'Automated compute replacement and capacity management.',
      Disadvantages: managed
        ? 'Existing deployment work remains; horizontal scaling is still limited by the database.'
        : 'Migration cost and retraining, with no proof that compute is the bottleneck.',
      'Estimated cost impact': managed
        ? 'Use current budget with a temporary load-test allowance; measure spend before any commitment.'
        : 'More migration effort and possibly higher running spend, depending on sustained traffic.',
      'Operational complexity': managed
        ? 'Familiar to the current team; add clear runbooks and observable limits.'
        : 'Team needs container release skills and a reliable rollback process.',
      'Reliability implications':
        'Bound retries and connections; test failover and revert if checkout errors rise.',
      'Security implications':
        'Private database, encryption, least privilege roles and controlled application access.',
      'Implementation difficulty': managed
        ? 'Days for instrumentation, then a staged change after a load test.'
        : 'Several weeks with infrastructure and delivery pipeline changes.',
      Assumptions:
        'The measured peak is representative; validate before making a long-term commitment.',
      Risks:
        'An unobserved dependency may remain the bottleneck; monitor and stop on degraded conversion.',
    }))
      await fill(page, label, value);
  }
  await next(page);
  await fill(
    page,
    'Measure and tune the existing platform: trade-off reasoning',
    'R01 favors a small reversible experiment with low team overhead. This keeps deployment toil for now but can establish the actual constraint before adding services.',
  );
  await fill(
    page,
    'Migrate compute to managed containers: trade-off reasoning',
    'R01 may be satisfied after migration, but migration does not prove database capacity. We trade a longer delivery timeline and skills investment for managed compute operations.',
  );
  await next(page);
  await page
    .getByLabel('Recommended option', { exact: true })
    .selectOption({ label: 'Measure and tune the existing platform' });
  for (const [label, value] of Object.entries({
    'My recommendation':
      'Defer the platform migration pending measurement. Validate the checkout bottleneck, then tune the existing platform in reversible stages.',
    'Why this option':
      'R01 needs better checkout performance, not a new orchestrator. A measured change fits the team and protects the budget.',
    'Why not the alternatives':
      'Managed containers may reduce maintenance later but do not establish the source of today’s latency.',
    'Risks accepted':
      'We keep some deployment toil and need a tested rollback. Private access controls remain in place.',
    'Assumptions behind the decision':
      'The campaign workload is reproducible and the team can collect representative measurements.',
    'Decision for R01':
      'Instrument checkout, bound connections, and load-test before staged rollout.',
    'Rationale for R01': 'Validate p95 and error rate at campaign load before approving rollout.',
  }))
    await fill(page, label, value);
  await page.getByLabel('Status of R01', { exact: true }).selectOption('satisfied');
  await next(page);
  await fill(
    page,
    'Why not something simpler?',
    'Doing nothing leaves the revenue loss unresolved. A measured tuning change is the simplest option that can validate R01; migration adds work before its need is established.',
  );
  await next(page);
  await page.getByRole('button', { name: 'Add condition' }).click();
  for (const [label, value] of Object.entries({
    Condition: 'The existing platform cannot meet representative campaign load.',
    'Metric / signal': 'Checkout p95 and error rate under load.',
    'Observable threshold': 'p95 exceeds 500 ms or errors exceed 0.5% for 10 minutes.',
    'Potential alternative':
      'Evaluate managed compute after isolating and resolving the database limit.',
  }))
    await fill(page, label, value);
  await next(page);
  for (const [label, value] of Object.entries({
    Hypothesis:
      'A bounded connection pool and targeted tuning will sustain campaign checkout load.',
    Scope:
      'Replay a representative synthetic checkout workload in staging with no real customer data.',
    'Metrics to observe':
      'p95, p99, error rate, database connections, CPU and estimated monthly spend.',
    'Success criteria': 'p95 below 500 ms and errors below 0.5% at peak for 30 minutes.',
    'Failure / exit criteria':
      'Stop on error rate above 0.5%, data inconsistency or growing connection backlog.',
    'Go / No-Go decision':
      'Go after meeting criteria with the existing budget; otherwise defer rollout and investigate.',
  }))
    await fill(page, label, value);
  await next(page);
  for (const [label, value] of Object.entries({
    'ADR title': 'Validate and tune checkout before migrating platforms',
    'ADR context':
      'Campaign latency reduces conversion; the responsible bottleneck is not established.',
    'ADR decision':
      'Measure checkout, validate a bounded connection pool, and roll out a reversible tuning change.',
    'ADR alternatives':
      'Managed containers considered; defer migration until a platform limitation is demonstrated.',
    'ADR consequences':
      'Low immediate complexity; ongoing deployment effort remains and validation is mandatory.',
    'ADR risks':
      'A hidden dependency may limit performance. Stop on errors and roll back on failed criteria.',
  }))
    await fill(page, label, value);
  await page.getByRole('button', { name: 'Accept decision record', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Current decision accepted' })).toBeDisabled();
  await next(page);
  for (const [label, value] of Object.entries({
    'Explain to the Engineer':
      'Instrument checkout latency and connection counts. Test a bounded pool in staging and gradually roll out with rollback on elevated errors.',
    'Explain to the CTO':
      'A measured change fits the team and avoids platform migration risk. Revisit managed compute if current capacity fails the validated threshold.',
    'Explain to the CFO':
      'Limit spend to measurement and reversible tuning. Avoid long commitments until utilization is established, and compare cost against recovered conversions.',
    'Explain to the CEO':
      'Protect campaign revenue by validating checkout before increasing marketing spend. Use a measured rollout to preserve customer confidence.',
  }))
    await fill(page, label, value);
  await next(page);
  await page.getByRole('button', { name: 'Seal first analysis & request review' }).click();
  const cards = page.locator('.review-card');
  await expect(cards.first()).toBeVisible();
  for (let i = 0; i < (await cards.count()); i++) {
    const card = cards.nth(i);
    await card.getByRole('button', { name: 'Partially accept', exact: true }).click();
    await card
      .locator('textarea')
      .fill(
        'This concern is useful. I will validate the identified signal before rollout while retaining the small, reversible approach and documenting the remaining uncertainty.',
      );
    await card.getByRole('button', { name: 'Save response', exact: true }).click();
    await expect(card.getByText('Response saved')).toBeVisible();
  }
  await next(page);
  await fill(
    page,
    'Final decision',
    'Retain the conditional tuning recommendation. Defer any platform migration until representative load evidence shows it is necessary. Validate signals and roll back if the exit criteria are met.',
  );
  await fill(
    page,
    'Lessons learned',
    'Diagnose the business constraint before choosing services, record uncertainty, and make review feedback an explicit decision.',
  );
  await page.getByRole('button', { name: 'Evaluate final decision' }).click();
  await expect(
    page.getByRole('heading', { name: 'A score is a starting point for reflection.' }),
  ).toBeVisible();
  const result = await (await request.get(`/api/cases/${created.session.id}`)).json();
  expect(result.session.snapshots.filter((s: { kind: string }) => s.kind === 'first')).toHaveLength(
    1,
  );
  expect(result.session.snapshots.filter((s: { kind: string }) => s.kind === 'final')).toHaveLength(
    1,
  );
  expect(result.session.evaluation.total).toBeGreaterThan(40);
  expect(
    result.session.evaluation.status,
    JSON.stringify(result.session.evaluation.criticalMisses),
  ).toBe('completed');
  await page.getByRole('button', { name: 'Prepare portfolio', exact: true }).click();
  await page.getByRole('button', { name: 'Publish to local portfolio', exact: true }).click();
  await page.getByRole('link', { name: 'View portfolio case study', exact: true }).click();
  await expect(page.getByText(/No real customer data is represented/).first()).toBeVisible();
  await expect(
    page.getByText('Immutable first analysis · before feedback', { exact: true }),
  ).toBeVisible();
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'test-results/completed-case.png', fullPage: true });
});

test('dashboard and library adapt to a mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Build better judgment.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page.getByRole('link', { name: 'Scenario library', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Real challenges. Better questions.' }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Start case', exact: true }).first().click();
  await page.getByRole('button', { name: 'Start discovery', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Consultant notebook' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'docs/screenshots/mobile-discovery.png', fullPage: true });
});
