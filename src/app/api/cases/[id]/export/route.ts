import { getCase } from '@/lib/cases/store';
import { exportCaseMarkdown } from '@/lib/export';
import { failure } from '../../../_shared';
import { workProducts, zipWorkProducts } from '@/lib/lab/bundle';
import { chromium } from 'playwright';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const data = getCase(id);
    const filename = data.scenario.title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'cloud-architecture-case-study';
    const format = new URL(_request.url).searchParams.get('format');
    if (format === 'pdf') {
      const browser = await chromium.launch({ channel: 'chrome', headless: true });
      try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 960 } });
        const origin = new URL(_request.url).origin;
        await page.goto(`${origin}/cases/${encodeURIComponent(id)}/pdf`, {
          waitUntil: 'networkidle',
          timeout: 60_000,
        });
        await page.locator('.case-pdf-document').waitFor({ state: 'visible', timeout: 15_000 });
        await page.evaluate(async () => {
          await document.fonts.ready;
        });
        await page
          .waitForFunction(
            () => {
              const diagram = document.querySelector('.case-pdf-document .diagram-container');
              return !diagram || diagram.querySelector('svg') || diagram.querySelector('[role="status"]');
            },
            null,
            { timeout: 15_000 },
          )
          .catch(() => undefined);
        const pdf = await page.pdf({
          format: 'Letter',
          printBackground: true,
          preferCSSPageSize: true,
          displayHeaderFooter: false,
        });
        return new Response(new Uint8Array(pdf), {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}.pdf"`,
            'Cache-Control': 'no-store',
          },
        });
      } finally {
        await browser.close();
      }
    }
    if (format === 'zip')
      return new Response(new Uint8Array(zipWorkProducts(workProducts(data))), {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${filename}-work-products.zip"`,
          'Cache-Control': 'no-store',
        },
      });
    return new Response(exportCaseMarkdown(data), {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.md"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    return failure(error);
  }
}
