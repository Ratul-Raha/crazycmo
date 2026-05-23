import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  const payload = getUserFromRequest(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!prisma) {
    return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: payload.user_id },
    select: { id: true, email: true, companyId: true },
  });

  if (!dbUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  let company = null;
  if (dbUser.companyId) {
    company = await prisma.company.findUnique({ where: { id: dbUser.companyId } });
  }

  return NextResponse.json({
    user: { id: dbUser.id, email: dbUser.email, company_id: dbUser.companyId },
    company,
  });
}
