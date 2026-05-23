import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { buildSystemPrompt } from '@/lib/groq';
import * as prompts from '@/lib/prompts';

const MODULE_CONFIG = {
  icp: { promptFn: 'workspaceIcpPrompt', args: ['serviceName', 'serviceType', 'crawledContent'] },
  positioning: { promptFn: 'workspacePositioningPrompt', args: ['serviceName', 'serviceType', 'icp', 'crawledContent'] },
  competitors: { promptFn: 'workspaceCompetitorPrompt', args: ['serviceName', 'serviceType', 'positioning', 'crawledContent'] },
  contentStrategy: { promptFn: 'workspaceContentStrategyPrompt', args: ['serviceName', 'serviceType', 'competitors', 'crawledContent'] },
  tasks: { promptFn: 'workspaceTaskPrompt', args: ['serviceName', 'serviceType', 'contentStrategy'] },
  outreach: { promptFn: 'workspaceOutreachPrompt', args: ['serviceName', 'serviceType', 'positioning', 'crawledContent'] },
  calendar: { promptFn: 'workspaceCalendarPrompt', args: ['serviceName', 'serviceType', 'contentStrategy', 'tasks'] },
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { workspaceId, module } = body;

    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!workspaceId || !module) return NextResponse.json({ error: 'workspaceId and module required' }, { status: 400 });

    const config = MODULE_CONFIG[module];
    if (!config) return NextResponse.json({ error: `Unknown module: ${module}` }, { status: 400 });

    const workspace = await prisma.workspace.findFirst({
      where: { id: workspaceId, companyId: payload.company_id },
    });
    if (!workspace) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const company = await prisma.company.findUnique({ where: { id: payload.company_id } });
    if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 });

    const systemPrompt = buildSystemPrompt(company, workspace);
    const outputs = workspace.outputs || {};

    const promptFn = prompts[config.promptFn];
    const args = config.args.map(arg => {
      if (arg === 'serviceName') return workspace.serviceName;
      if (arg === 'serviceType') return workspace.serviceType;
      if (arg === 'crawledContent') return workspace.crawledContent || '';
      return outputs[arg] || '';
    });
    const prompt = promptFn(company, ...args);

    const Groq = (await import('groq-sdk')).default;
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      max_tokens: 3000,
    });
    const text = completion.choices?.[0]?.message?.content || 'Generation failed.';

    outputs[module] = text;
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: { outputs },
    });

    return NextResponse.json({ output: text, module });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
