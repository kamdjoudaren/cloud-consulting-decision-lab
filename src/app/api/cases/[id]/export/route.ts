import { getCase } from '@/lib/cases/store';
import { exportCaseMarkdown } from '@/lib/export';
import { failure } from '../../../_shared';
import { workProducts, zipWorkProducts } from '@/lib/lab/bundle';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const data = getCase((await context.params).id);
    const filename = data.scenario.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 80);
    if (new URL(_request.url).searchParams.get('format') === 'zip')
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
