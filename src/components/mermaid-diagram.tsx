'use client';
import { useEffect, useId, useRef, useState } from 'react';
export default function MermaidDiagram({ source }: { source: string }) {
  const [error, setError] = useState('');
  const target = useRef<HTMLDivElement>(null);
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      if (!source.trim()) {
        if (target.current) target.current.innerHTML = '';
        setError('');
        return;
      }
      try {
        const mermaid = (await import('mermaid')).default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: {
            primaryColor: '#e6f0e8',
            primaryTextColor: '#18352d',
            primaryBorderColor: '#719382',
            lineColor: '#729080',
            fontFamily: 'Arial, sans-serif',
          },
        });
        await mermaid.parse(source, { suppressErrors: true }).then((valid) => {
          if (!valid) throw new Error('Check the Mermaid syntax to preview your diagram.');
        });
        const { svg } = await mermaid.render(`diagram${id}`, source);
        if (alive && target.current) {
          target.current.innerHTML = svg;
          setError('');
        }
      } catch (e) {
        if (alive) {
          setError(e instanceof Error ? e.message.split('\n')[0] : 'Unable to render the diagram.');
          if (target.current) target.current.innerHTML = '';
        }
      }
    }, 400);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [source, id]);
  return (
    <div className="diagram-container">
      {!source.trim() && <p className="muted">Your architecture diagram will appear here.</p>}
      {error && (
        <p className="alert warning" role="status">
          {error}
        </p>
      )}
      <div ref={target} aria-label="Architecture diagram" />
    </div>
  );
}
