import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    if (!prisma) {
      return NextResponse.json({ error: 'Database not configured.' }, { status: 500 });
    }

    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const password_hash = await hashPassword(password);

    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: email.split('@')[0] + "'s Company",
          tagline: '',
          description: '',
          services: [],
          products: [],
          website: '',
          location: '',
          founder: email,
          targetMarkets: [],
        },
      });
    }

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: password_hash,
        companyId: company.id,
      },
      select: { id: true, email: true, companyId: true },
    });

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
