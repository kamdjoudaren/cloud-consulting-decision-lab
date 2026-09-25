'use client';

import { useState } from 'react';
import { FileDown } from 'lucide-react';

export default function DownloadPdfButton({
  caseId,
  title,
  className = 'button secondary',
}: {
  caseId: string;
  title: string;
  className?: string;
}) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function download() {
    setDownloading(true);
    setError('');
    try {
      const response = await fetch(
        `/api/cases/${encodeURIComponent(caseId)}/export?format=pdf`,
        { cache: 'no-store' },
      );
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || 'PDF generation failed. Please try again.');
      }
      const blob = await response.blob();
      if (blob.type !== 'application/pdf' || blob.size < 500)
        throw new Error('The server returned an invalid PDF. Please try again.');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      const filename =
        title
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || 'cloud-architecture-case-study';
      anchor.href = url;
      anchor.download = `${filename}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'PDF download failed.');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <>
      <button className={className} disabled={downloading} onClick={() => void download()}>
        <FileDown size={16} />
        {downloading ? 'Preparing PDF…' : 'Download PDF'}
      </button>
      {error && <p className="alert error no-print" role="alert">{error}</p>}
    </>
  );
}
