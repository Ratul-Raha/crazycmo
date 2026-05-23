import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    let company = null;
    if (user.companyId) {
      company = await prisma.company.findUnique({ where: { id: user.companyId } });
    }

    const token = signToken({ user_id: user.id, company_id: user.companyId });
    return NextResponse.json({
      token,
      user: { id: user.id, email: user.email, company_id: user.companyId },
      company,
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
