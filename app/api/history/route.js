import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const payload = getUserFromRequest(request);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rows = await prisma.output.findMany({
      where: { companyId: payload.company_id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ rows: rows || [] });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
