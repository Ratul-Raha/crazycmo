import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

const MODELS = {
  tasks: 'task',
  leads: 'lead',
  calendar: 'calendarEntry',
  contents: 'content',
};

export async function GET(request, { params }) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, resource } = params;
    const model = MODELS[resource];
    if (!model) return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });

    const ws = await prisma.workspace.findFirst({ where: { id, companyId: payload.company_id } });
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const findMany = prisma[model].findMany;
    const items = await findMany({
      where: { workspaceId: id },
      orderBy: resource === 'tasks' ? { sortOrder: 'asc' } : resource === 'calendar' ? { date: 'asc' } : { createdAt: 'desc' },
    });

    return NextResponse.json({ items });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, resource } = params;
    const model = MODELS[resource];
    if (!model) return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });

    const ws = await prisma.workspace.findFirst({ where: { id, companyId: payload.company_id } });
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const body = await request.json();
    const create = prisma[model].create;
    const item = await create({
      data: { ...body, workspaceId: id },
    });

    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
