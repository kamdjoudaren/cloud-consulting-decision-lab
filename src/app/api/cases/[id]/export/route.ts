import { getCase } from '@/lib/cases/store';
import { exportCaseMarkdown } from '@/lib/export';
import { failure } from '../../../_shared';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const data = getCase((await context.params).id);
    const filename = data.scenario.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 80);
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
