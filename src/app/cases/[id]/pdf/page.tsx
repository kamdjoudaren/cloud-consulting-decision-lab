import { notFound } from 'next/navigation';
import CasePdfDocument from '@/components/case-pdf-document';
import { getCase } from '@/lib/cases/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default async function CasePdfPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    return <CasePdfDocument data={getCase(id)} />;
  } catch {
    notFound();
  }
}
