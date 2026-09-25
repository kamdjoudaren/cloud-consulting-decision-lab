import { test, expect, type Page } from '@playwright/test';
const fill = (page: Page, name: string, value: string) =>
  page.getByRole('textbox', { name, exact: true }).fill(value);
const next = (page: Page) => page.getByRole('button', { name: /^Continue to / }).click();
test('guided economics investigation reaches debrief and a work-product bundle', async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  // Reserved cases remain usable through historical/direct case records, not the active library.
  const reserved = await (
    await request.post('/api/cases', { data: { scenarioId: 'aws-growth-55', mode: 'guided' } })
  ).json();
  await page.goto(`/cases/${reserved.session.id}`);
  await expect(page).toHaveURL(/\/cases\//, { timeout: 60000 });
  const id = page.url().split('/').at(-1)!;
  await expect(page.getByLabel('Assistance mode', { exact: true })).toHaveValue('guided');
  await page.getByRole('button', { name: 'Start discovery', exact: true }).click();
  await page.getByLabel('Speak to', { exact: true }).selectOption('Jordan Ellis');
  await fill(
    page,
    'Your question to the client',
    'What are the comparable unit economics and margin for completed transactions?',
  );
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByLabel('Your question to the client')).toHaveValue('');
  await page.getByRole('button', { name: 'I don’t have enough information yet' }).click();
  await fill(page, 'What evidence do you need?', 'CUR transactions economics margin cost');
  await fill(
    page,
    'How could this change your decision?',
    'Compare equivalent useful output before judging cost efficiency.',
  );
  await page.getByRole('button', { name: 'Request evidence', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'What evidence do you need?', exact: true }),
  ).not.toBeVisible();
  await page.getByRole('button', { name: 'I don’t have enough information yet' }).click();
  await fill(
    page,
    'What evidence do you need?',
    'engineering technical architecture load test report',
  );
  await fill(
    page,
    'How could this change your decision?',
    'Validate the technical hypothesis and protect customer quality.',
  );
  await page.getByRole('button', { name: 'Request evidence', exact: true }).click();
  await expect(
    page.getByRole('textbox', { name: 'What evidence do you need?', exact: true }),
  ).not.toBeVisible();
  await page.getByRole('tab', { name: /Requirements/ }).click();
  await fill(
    page,
    'New requirement',
    'Preserve p95 latency and the error rate during any capacity change.',
  );
  await fill(page, 'Source / evidence', 'Requested engineering report');
  await page.getByRole('button', { name: 'Add requirement', exact: true }).click();
  await next(page);
  await fill(
    page,
    'Technical interpretation',
    'Compare stable service quality and the same useful workload before reducing infrastructure.',
  );
  await fill(
    page,
    'Competing hypothesis',
    'A larger bill can reflect useful growth or unused capacity; compare source evidence before deciding.',
  );
  await page.getByRole('tab', { name: 'Economics', exact: true }).click();
  await page.getByRole('button', { name: 'Use requested ledger' }).click();
  const data = await (await request.get(`/api/cases/${id}`)).json();
  const metrics = data.documents.find((d: { metrics?: object }) => d.metrics).metrics;
  const improving =
    metrics.cloudAfter / metrics.unitsAfter < metrics.cloudBefore / metrics.unitsBefore;
  await page
    .getByLabel('Unit economics conclusion', { exact: true })
    .selectOption(improving ? 'improving' : 'deteriorating');
  await fill(
    page,
    'Economic interpretation and limits',
    'Compare cost per completed transaction and Gross Margin using the same period and scope. Future workload mix remains uncertain.',
  );
  await page.screenshot({ path: 'docs/screenshots/economics-v2.png', fullPage: true });
  await page.getByRole('tab', { name: 'Value bridge', exact: true }).click();
  await page.getByRole('button', { name: 'Add finding', exact: true }).click();
  for (const [name, value] of Object.entries({
    'Finding title': 'Interpret the cost per useful outcome',
    'Technical signal':
      'The technical report and ledger describe a comparable workload and stable service quality.',
    'Operational consequence':
      'Distinguish capacity used for growth from capacity that serves no useful output.',
    'Customer consequence': 'Protect response time and successful transaction completion.',
    'Business metric affected': 'Cost-to-Serve and sustainable customer growth.',
    'Financial metric affected':
      'Gross Margin through COGS; no verified saving has yet been delivered.',
    'Recommended action':
      'Validate owners and workload assumptions before approving any reversible pilot.',
    'Evidence still needed / validation':
      'Measure p95 and errors alongside comparable unit cost in the next workload.',
    'Why this is material':
      'Recurring spend matters, but a blind cost reduction could damage service quality.',
  }))
    await fill(page, name, value);
  for (const box of await page.locator('.lab-sheet .evidence-picker input').all())
    await box.check();
  await next(page);
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'Add option', exact: true }).click();
    const record = page.locator('.lab-sheet .lab-record').nth(i);
    for (const [name, value] of Object.entries({
      'Option name': i ? 'Bounded pilot' : 'Maintain and validate',
      'Option summary': 'Preserve the baseline while validating the relevant workload assumptions.',
      'Cost and implementation effort':
        'A $10,000 planning allowance for measurements and a reversible pilot.',
      'Risks and customer guardrails':
        'Stop if p95 latency or error rate worsens versus the baseline.',
      'Trade-off and reversibility':
        'Trade immediate implementation for better evidence; retain a clear rollback path.',
    }))
      await record.getByRole('textbox', { name, exact: true }).fill(value);
  }
  await next(page);
  await page
    .getByLabel('Recommended option', { exact: true })
    .selectOption({ label: 'Maintain and validate' });
  for (const [name, value] of Object.entries({
    'My recommendation':
      'Maintain a conditional baseline pending validation of workload mix and resource ownership.',
    'Why this option':
      'Compare unit economics and customer outcomes instead of cutting capacity from a bill headline.',
    'Why not the alternatives':
      'A pilot may be justified after ownership, quality and cost effects are established.',
    'Risks accepted': 'The next workload may differ from the current comparable baseline.',
    'Assumptions behind the decision':
      'The financial ledger and completed transaction definitions are comparable.',
    'Decision for R01': 'Preserve latency and error guardrails before approving rollout.',
    'Rationale for R01': 'The engineering record establishes a baseline to test against.',
  }))
    await fill(page, name, value);
  await page.getByLabel('Status of R01', { exact: true }).selectOption('satisfied');
  await next(page);
  await fill(
    page,
    'Executive summary',
    'We should base the decision on useful output and customer guardrails. Validate the next workload before claiming realized cash value.',
  );
  await fill(
    page,
    'Explain to the Engineer',
    'Compare the measured workload, instrument p95 and errors, and keep a reversible rollout.',
  );
  await fill(
    page,
    'Explain to the CFO',
    'Use comparable annual unit costs and separate identified opportunity from verified cash savings.',
  );
  await next(page);
  await page.getByRole('button', { name: 'Seal first analysis & request review' }).click();
  const reviews = page.locator('.review-card');
  await expect(reviews.first()).toBeVisible();
  for (const card of await reviews.all()) {
    await card.getByRole('button', { name: 'Partially accept', exact: true }).click();
    await card
      .locator('textarea')
      .fill(
        'Accept the measurement concern and retain the conditional decision with a clear owner and validation plan.',
      );
    await card.getByRole('button', { name: 'Save response', exact: true }).click();
    await expect(card.getByText('Response saved')).toBeVisible();
  }
  await fill(
    page,
    'Defense to CFO',
    'The requested comparable ledger supports the conditional recommendation. Future workload mix and realized savings remain unverified.',
  );
  for (const box of await page.locator('.lab-sheet .evidence-picker input').all())
    await box.check();
  await page.getByRole('button', { name: 'Save defense', exact: true }).click();
  await expect(page.getByText('Defense saved', { exact: false })).toBeVisible();
  await next(page);
  await fill(
    page,
    'Final decision',
    'Retain a conditional recommendation pending a representative workload validation and accountable ownership of any capacity change.',
  );
  await fill(
    page,
    'Lessons learned',
    'Higher spend and worse efficiency are distinct claims. Trace the business implication and validate assumptions before claiming value.',
  );
  await page.getByRole('button', { name: 'Evaluate final decision', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Debrief & next practice' })).toBeVisible();
  const evaluated = await (await request.get(`/api/cases/${id}`)).json();
  expect(
    evaluated.session.evaluation.status,
    JSON.stringify(evaluated.session.evaluation.criticalMisses),
  ).toBe('completed');
  const bundle = await request.get(`/api/cases/${id}/export?format=zip`);
  expect(bundle.headers()['content-type']).toBe('application/zip');
  expect((await bundle.body()).readUInt32LE(0)).toBe(0x04034b50);
  await page.getByRole('button', { name: 'Prepare portfolio' }).click();
  await page.getByRole('button', { name: 'Publish to local portfolio' }).click();
  await page.getByRole('link', { name: 'View portfolio case study' }).click();
  await expect(
    page.getByRole('heading', { name: 'Technology → Value analysis' }).first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test('cloud-only catalog, discovery and learning path remain usable on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/scenarios');
  await expect(page.getByLabel('Scenario family', { exact: true })).toHaveCount(0);
  await expect(page.getByText('PE lifecycle stage', { exact: true })).toHaveCount(0);
  await page.getByLabel('Search scenarios').fill('ECS or EC2');
  await page.getByRole('button', { name: /01\s*Guided beginner/ }).click();
  await expect(
    page.getByRole('heading', { name: 'ECS or EC2 for an existing web application?', exact: true }),
  ).toBeVisible();
  await page
    .locator('.scenario-card')
    .filter({
      has: page.getByRole('heading', {
        name: 'ECS or EC2 for an existing web application?',
        exact: true,
      }),
    })
    .getByRole('button', { name: 'Start case', exact: true })
    .click();
  await expect(page).toHaveURL(/\/cases\//, { timeout: 60000 });
  await page.getByRole('button', { name: 'Start discovery', exact: true }).click();
  await fill(
    page,
    'Your question to the client',
    'What requirements and host constraints affect ECS or EC2?',
  );
  await page.getByRole('button', { name: 'Send', exact: true }).click();
  await expect(page.getByLabel('Your question to the client')).toHaveValue('');
  await expect(page.getByText(/a vendor agent requires host access/).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.goto('/learn');
  await expect(page.getByRole('heading', { name: 'Your recommended path' })).toBeVisible();
  await page.getByLabel('Find a term').fill('Fargate');
  await expect(page.getByText('EC2 / ECS / Fargate', { exact: true })).toBeVisible();
  await page.screenshot({ path: 'docs/screenshots/learning-v2-mobile.png', fullPage: true });
});
