import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CrazyCMO/1.0)' },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch URL: ${res.status} ${res.statusText}` }, { status: 502 });
    }

    const html = await res.text();

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

    text = text.slice(0, 15000);

    if (!text) {
      return NextResponse.json({ error: 'No content found at URL' }, { status: 422 });
    }

    return NextResponse.json({ text });
  } catch (e) {
    if (e.name === 'TimeoutError' || e.code === 'UND_ERR_CONNECT_TIMEOUT') {
      return NextResponse.json({ error: 'Request timed out' }, { status: 408 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}