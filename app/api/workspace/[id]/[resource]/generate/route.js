import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { buildSystemPrompt } from '@/lib/groq';

const loc = (c) => c.location || 'your target';
const marketNote = (c) => c.location ? c.location + ' market' : 'your target market';

const PROMPTS = {
  tasks: (company, ws) => `For ${company.name}'s "${ws.serviceName}" (${ws.serviceType}), generate 10 marketing tasks as a JSON array.

WEBSITE CONTENT:
${(ws.crawledContent || '').slice(0, 4000)}

EXISTING STRATEGY:
${(ws.outputs?.contentStrategy || '').slice(0, 2000)}
${(ws.outputs?.outreach || '').slice(0, 1000)}
${(ws.outputs?.calendar || '').slice(0, 1000)}

Return ONLY a JSON array. Each: { "title": "task", "priority": "P1"|"P2"|"P3", "category": "Content Creation"|"Publication"|"Cold Outreach"|"Campaign"|"Optimization"|"Social Media"|"Research"|"Event"|"Lead Follow-up"|"Lead Generation" }

Example: [{"title":"Write 3 blog posts","priority":"P1","category":"Content Creation"}]`,

  leads: (company, ws) => `For ${company.name}'s "${ws.serviceName}", generate 10 lead profiles as a JSON array.

ICP: ${(ws.outputs?.icp || 'N/A').slice(0, 3000)}
WEBSITE: ${(ws.crawledContent || '').slice(0, 3000)}

Return ONLY a JSON array. Each: { "companyName": "Name", "contactName": "Person", "email": "p@c.com", "phone": "+880-XXX", "industry": "Industry", "stage": "new", "source": "cold_outreach", "notes": "note" }

` + marketNote(company) + `. Real company names relevant to the service.`,

  calendar: (company, ws) => `For ${company.name}'s "${ws.serviceName}", create a 4-week content calendar as a JSON array.

STRATEGY:
${(ws.outputs?.contentStrategy || 'N/A').slice(0, 3000)}
${(ws.outputs?.tasks || 'N/A').slice(0, 2000)}

Return ONLY a JSON array. Each: { "title": "title", "date": "2026-06-01T00:00:00.000Z", "entryType": "content_creation"|"publication"|"cold_outreach"|"campaign"|"optimization"|"social_media"|"research"|"event"|"lead_followup"|"lead_generation"|"others", "channel": "LinkedIn"|"Facebook"|"Blog"|"Email"|"WhatsApp", "description": "desc", "status": "planned" }

12-16 entries (3-4/week). Start first Monday after today.`,

  contents: (company, ws) => `For ${company.name}'s "${ws.serviceName}", generate 10 content pieces as a JSON array.

CONTENT STRATEGY:
${(ws.outputs?.contentStrategy || 'N/A').slice(0, 3000)}

Return ONLY a JSON array. Each: { "title": "title", "contentType": "blog_post"|"case_study"|"social_post"|"email"|"video", "platform": "LinkedIn"|"Facebook"|"Blog"|"Newsletter", "status": "draft", "body": "brief outline" }

Specific, clickable titles. ` + loc(company) + ' context.',
};

export async function POST(request, { params }) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, resource } = params;
    if (!PROMPTS[resource]) return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });

    const ws = await prisma.workspace.findFirst({ where: { id, companyId: payload.company_id } });
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const company = await prisma.company.findUnique({ where: { id: payload.company_id } });
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const systemPrompt = buildSystemPrompt(company, ws);
    const prompt = PROMPTS[resource](company, ws);

    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1500,
    });

    const text = completion.choices?.[0]?.message?.content || '[]';
    const cleanJson = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    let items;
    try {
      items = JSON.parse(cleanJson);
    } catch {
      const match = cleanJson.match(/\[[\s\S]*\]/);
      items = match ? JSON.parse(match[0]) : [];
    }
    if (!Array.isArray(items)) items = [];

    const modelMap = { tasks: 'task', leads: 'lead', calendar: 'calendarEntry', contents: 'content' };
    const model = modelMap[resource];
    const create = prisma[model].create;
    const created = [];

    for (let i = 0; i < items.length; i++) {
      const item = { ...items[i], workspaceId: id };
      if (resource === 'tasks') item.sortOrder = i;
      try {
        const c = await create({ data: item });
        created.push(c);
      } catch {}
    }

    return NextResponse.json({ items: created, count: created.length });
  } catch (e) {
    const status = e.status === 429 ? 429 : 500;
    const message = status === 429
      ? 'AI rate limit reached. Please wait a few minutes and try again, or upgrade your Groq API plan.'
      : e.message;
    return NextResponse.json({ error: message, rateLimited: status === 429 }, { status });
  }
}
