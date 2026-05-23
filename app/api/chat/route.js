import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { buildSystemPrompt, generateChat } from '@/lib/groq';

export async function POST(request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt, module: mod, service } = await request.json();
    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    let company = null;
    if (payload.company_id) {
      company = await prisma.company.findUnique({ where: { id: payload.company_id } });
    }

    if (!company) {
      return NextResponse.json({ error: 'Company config not found' }, { status: 404 });
    }

    const systemPrompt = buildSystemPrompt(company);
    const text = await generateChat(prompt, systemPrompt);

    try {
      await prisma.output.create({
        data: {
          companyId: payload.company_id,
          userId: payload.user_id,
          module: mod || 'unknown',
          service: service || 'unknown',
          prompt,
          output: text,
        },
      });
    } catch (saveErr) {
      console.error('Failed to save output:', saveErr);
    }

    return NextResponse.json({ text });
  } catch (e) {
    console.error('Chat API error:', e);
    return NextResponse.json({ error: e.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, company } = await request.json();
    if (action === 'updateCompany' && company) {
      const data = {
        name: company.name,
        tagline: company.tagline,
        description: company.description,
        services: company.services,
        products: company.products,
        website: company.website,
        location: company.location,
        founder: company.founder,
        targetMarkets: company.targetMarkets || company.target_markets,
      };
      await prisma.company.update({
        where: { id: payload.company_id },
        data,
      });

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
