import { NextResponse } from 'next/server';

function extractPageContent(html, url) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : '';

  const cleaned = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

  const headingRegex = /<h[12][^>]*>([^<]+)<\/h[12]>/gi;
  const headings = [];
  let m;
  while ((m = headingRegex.exec(cleaned)) !== null) {
    headings.push({ text: m[1].trim(), start: m.index + m[0].length });
  }

  const sections = [];
  if (headings.length > 0) {
    for (let i = 0; i < headings.length; i++) {
      const contentEnd = i < headings.length - 1 ? headings[i + 1].start : cleaned.length;
      const sectionHtml = cleaned.slice(headings[i].start, contentEnd);
      const sectionText = sectionHtml
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (sectionText.length > 20) {
        sections.push(`## ${headings[i].text}\n${sectionText}`);
      }
    }
  }

  let text;
  if (sections.length > 0) {
    text = (pageTitle ? `# ${pageTitle}\n\n` : '') + sections.join('\n\n');
  } else {
    const allText = cleaned
      .replace(/<[^>]+>/g, '')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    text = pageTitle ? `# ${pageTitle}\n\n${allText}` : allText;
  }

  return { text: text.trim(), title: pageTitle || url };
}

function extractInternalLinks(html, baseUrl) {
  const base = new URL(baseUrl);
  const links = new Set();
  const linkRegex = /<a[^>]+href\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = linkRegex.exec(html)) !== null) {
    try {
      const href = m[1].split('#')[0];
      if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
      const absolute = new URL(href, baseUrl).href;
      if (new URL(absolute).hostname === base.hostname) {
        const filtered = absolute.replace(/\/$/, '');
        const ext = filtered.split('?')[0].split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'pdf', 'zip', 'mp4', 'mp3', 'pdf', 'doc', 'docx', 'xls', 'xlsx'].includes(ext)) continue;
        links.add(filtered);
      }
    } catch {}
  }
  return [...links];
}

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const fetchOpts = {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CrazyCMO/1.0)' },
      signal: AbortSignal.timeout(15000),
    };

    const homepageRes = await fetch(url, fetchOpts);
    if (!homepageRes.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${homepageRes.status}` }, { status: 502 });
    }
    const homepageHtml = await homepageRes.text();
    const homepageContent = extractPageContent(homepageHtml, url);

    const internalLinks = extractInternalLinks(homepageHtml, url);
    const MAX_PAGES = 30;
    const pagesToFetch = internalLinks.slice(0, MAX_PAGES);

    const allContent = [homepageContent];
    const visited = new Set([url.replace(/\/$/, '')]);

    const concurrency = 5;
    for (let i = 0; i < pagesToFetch.length; i += concurrency) {
      const batch = pagesToFetch.slice(i, i + concurrency);
      const results = await Promise.allSettled(
        batch.map(async (pageUrl) => {
          const normalized = pageUrl.replace(/\/$/, '');
          if (visited.has(normalized)) return null;
          visited.add(normalized);
          const res = await fetch(pageUrl, {
            ...fetchOpts,
            signal: AbortSignal.timeout(10000),
          });
          if (!res.ok) return null;
          const html = await res.text();
          const content = extractPageContent(html, pageUrl);
          return content;
        })
      );
      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          allContent.push(result.value);
        }
      }
    }

    const fullText = allContent
      .map(c => `--- Page: ${c.title} ---\n${c.text}`)
      .join('\n\n')
      .slice(0, 35000);

    if (!fullText.trim()) {
      return NextResponse.json({ error: 'No content found' }, { status: 422 });
    }

    return NextResponse.json({
      content: fullText,
      pagesCount: allContent.length,
    });
  } catch (e) {
    if (e.name === 'TimeoutError' || e.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 408 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
