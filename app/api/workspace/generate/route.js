import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { buildSystemPrompt } from '@/lib/groq';
import * as prompts from '@/lib/prompts';

const MODULES = [
  {
    key: 'icp',
    promptFn: 'workspaceIcpPrompt',
    buildArgs: (company, ws) => [company, ws.serviceName, ws.serviceType, ws.crawledContent || ''],
  },
  {
    key: 'positioning',
    promptFn: 'workspacePositioningPrompt',
    buildArgs: (company, ws, outputs) => [company, ws.serviceName, ws.serviceType, outputs.icp || '', ws.crawledContent || ''],
  },
  {
    key: 'competitors',
    promptFn: 'workspaceCompetitorPrompt',
    buildArgs: (company, ws, outputs) => [company, ws.serviceName, ws.serviceType, outputs.positioning || '', ws.crawledContent || ''],
  },
  {
    key: 'contentStrategy',
    promptFn: 'workspaceContentStrategyPrompt',
    buildArgs: (company, ws, outputs) => [company, ws.serviceName, ws.serviceType, outputs.competitors || '', ws.crawledContent || ''],
  },
  {
    key: 'tasks',
    promptFn: 'workspaceTaskPrompt',
    buildArgs: (company, ws, outputs) => [company, ws.serviceName, ws.serviceType, outputs.contentStrategy || ''],
  },
  {
    key: 'outreach',
    promptFn: 'workspaceOutreachPrompt',
    buildArgs: (company, ws, outputs) => [company, ws.serviceName, ws.serviceType, outputs.positioning || '', ws.crawledContent || ''],
  },
  {
    key: 'calendar',
    promptFn: 'workspaceCalendarPrompt',
    buildArgs: (company, ws, outputs) => [company, ws.serviceName, ws.serviceType, outputs.contentStrategy || '', outputs.tasks || ''],
  },
];

export async function POST(request) {
  let workspaceId;
  try {
    const body = await request.json();
    workspaceId = body.workspaceId;

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId required' }, { status: 400 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, companyId: payload.company_id },
    });
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const company = await prisma.company.findUnique({
      where: { id: payload.company_id },
    });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { status: 'generating' },
    });

    const systemPrompt = buildSystemPrompt(company, workspace);
    const outputs = {};
    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const call = async (prompt) => {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
      });
      return completion.choices?.[0]?.message?.content || '';
    };

    for (const mod of MODULES) {
      const promptFn = prompts[mod.promptFn];
      const args = mod.buildArgs(company, workspace, outputs);
      const prompt = promptFn(...args);

      const text = await call(prompt);
      outputs[mod.key] = text || 'Generation failed.';

      await prisma.workspace.update({
        where: { id: workspaceId },
        data: { outputs },
      });
    }

    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { status: 'ready', outputs },
    });

    return NextResponse.json({ outputs, workspaceId });
  } catch (e) {
    if (workspaceId) {
      try {
        await prisma.workspace.update({
          where: { id: workspaceId },
          data: { status: 'failed' },
        });
      } catch {}
    }
    const status = e.status === 429 ? 429 : 500;
    const message = status === 429
      ? 'AI rate limit reached. Please wait a few minutes and try again, or upgrade your Groq API plan.'
      : e.message;
    return NextResponse.json({ error: message, rateLimited: status === 429 }, { status });
  }
}
