function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char];
  });
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

async function embedCssAssets(css: string, stylesheetUrl: string): Promise<string> {
  const matches = [...css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g)];
  for (const match of matches) {
    const source = (match[1] || match[2] || match[3] || '').trim();
    if (!source || /^(data:|https?:|\/\/|#)/i.test(source)) continue;
    const assetUrl = new URL(source, stylesheetUrl);
    if (assetUrl.origin !== window.location.origin) continue;
    try {
      const response = await fetch(assetUrl);
      if (!response.ok) continue;
      const mime = response.headers.get('content-type') || 'application/octet-stream';
      const data = `data:${mime};base64,${toBase64(await response.arrayBuffer())}`;
      css = css.replaceAll(match[0], `url("${data}")`);
    } catch {
      // The page remains readable with the browser's fallback fonts if an asset is unavailable.
    }
  }
  return css;
}

export async function downloadCaseHtml(article: HTMLElement, title: string): Promise<void> {
  const clone = article.cloneNode(true) as HTMLElement;
  clone.querySelectorAll('.no-print').forEach((element) => element.remove());

  const links = [...document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href]')];
  const styles: string[] = [];
  for (const link of links) {
    const response = await fetch(link.href);
    if (!response.ok) throw new Error('The portfolio styles could not be loaded for export.');
    styles.push(await embedCssAssets(await response.text(), link.href));
  }
  if (!styles.length) throw new Error('The portfolio styles could not be found for export.');

  const html = `<!doctype html>
<html lang="${escapeHtml(document.documentElement.lang || 'en')}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Standalone cloud architecture case study">
  <title>${escapeHtml(title)}</title>
  <style>${styles.join('\n')}</style>
</head>
<body>${clone.outerHTML}</body>
</html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
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
  anchor.download = `${filename}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
