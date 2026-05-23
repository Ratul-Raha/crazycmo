import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

const MODELS = {
  tasks: 'task',
  leads: 'lead',
  calendar: 'calendarEntry',
  contents: 'content',
};

export async function PATCH(request, { params }) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, resource, rid } = params;
    const model = MODELS[resource];
    if (!model) return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });

    const ws = await prisma.workspace.findFirst({ where: { id, companyId: payload.company_id } });
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const body = await request.json();
    delete body.id;

    const update = prisma[model].update;
    const item = await update({
      where: { id: rid },
      data: body,
    });

    return NextResponse.json({ item });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, resource, rid } = params;
    const model = MODELS[resource];
    if (!model) return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });

    const del = prisma[model].delete;
    await del({ where: { id: rid } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
