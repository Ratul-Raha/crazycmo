import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const workspace = await prisma.workspace.findFirst({
        where: { id, companyId: payload.company_id },
      });
      if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }
      return NextResponse.json({ workspace });
    }

    const workspaces = await prisma.workspace.findMany({
      where: { companyId: payload.company_id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ workspaces });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, serviceName, serviceType, website } = await request.json();
    if (!serviceName) {
      return NextResponse.json({ error: 'Service/product name is required' }, { status: 400 });
    }

    const workspace = await prisma.workspace.create({
      data: {
        companyId: payload.company_id,
        name: name || `${serviceName} - Marketing Workspace`,
        serviceName,
        serviceType: serviceType || 'service',
        website: website || '',
        status: 'idle',
        outputs: {
          icp: '',
          positioning: '',
          competitors: '',
          contentStrategy: '',
          tasks: '',
          outreach: '',
          calendar: '',
        },
      },
    });

    return NextResponse.json({ workspace });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, ...data } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    const workspace = await prisma.workspace.findFirst({
      where: { id, companyId: payload.company_id },
    });
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const updated = await prisma.workspace.update({
      where: { id },
      data,
    });

    return NextResponse.json({ workspace: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    await prisma.workspace.deleteMany({
      where: { id, companyId: payload.company_id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
