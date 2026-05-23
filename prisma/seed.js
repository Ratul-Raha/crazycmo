import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const defaultCompany = {
  name: 'MadStack',
  tagline: 'Engineered in Bangladesh. Used Worldwide.',
  description: 'MadStack is a digital transformation agency based in Sylhet, Bangladesh. Founded by Goutom Dash (ex INC 5000 software engineer, 6+ years experience). Core principle: Systems Thinking, AI-First Strategy, Technical Honesty, Long-Term Partnership.',
  services: [
    { name: 'Web Development', description: 'Custom web apps, client portals, business platforms. Stack: React, Next.js, Node.js' },
    { name: 'Software Engineering', description: 'Scalable backends, APIs, enterprise software. Stack: Node.js, Python, PostgreSQL' },
    { name: 'AI & Chatbots', description: 'Intelligent AI assistants and automation agents. Stack: GPT-4, Claude, LangChain' },
    { name: 'n8n Automation', description: 'End-to-end workflow automation. Stack: n8n, Zapier, REST APIs' },
    { name: 'IT Consultancy', description: 'Technical planning, architecture review, digital roadmaps' },
  ],
  products: [
    { name: 'Consulta CRM', description: 'Customer relationship management system' },
    { name: 'POS System', description: 'Point of sale system for retail' },
    { name: 'Ecommerce Store', description: 'Full-featured ecommerce platform' },
    { name: 'AI Chatbot Platform', description: 'Intelligent chatbot builder' },
  ],
  website: 'https://madstackbd.com',
  location: 'Sylhet, Bangladesh',
  founder: 'Goutom Dash',
  target_markets: ['Bangladesh businesses', 'International startups', 'Diaspora businesses', 'RMG/garments sector', 'Retail', 'NGOs', 'Healthcare', 'E-commerce'],
};

async function main() {
  let company = await prisma.company.findFirst();
  if (company) {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        name: defaultCompany.name,
        tagline: defaultCompany.tagline,
        description: defaultCompany.description,
        services: defaultCompany.services,
        products: defaultCompany.products,
        website: defaultCompany.website,
        location: defaultCompany.location,
        founder: defaultCompany.founder,
        targetMarkets: defaultCompany.target_markets,
      },
    });
    console.log(`Updated company to: ${defaultCompany.name}`);
  } else {
    company = await prisma.company.create({
      data: {
        name: defaultCompany.name,
        tagline: defaultCompany.tagline,
        description: defaultCompany.description,
        services: defaultCompany.services,
        products: defaultCompany.products,
        website: defaultCompany.website,
        location: defaultCompany.location,
        founder: defaultCompany.founder,
        targetMarkets: defaultCompany.target_markets,
      },
    });
    console.log(`Created company: ${defaultCompany.name}`);
  }

  const existingUser = await prisma.user.findUnique({ where: { email: 'admin@gmail.com' } });
  if (!existingUser) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
      data: {
        email: 'admin@gmail.com',
        passwordHash,
        companyId: company.id,
      },
    });
    console.log('Created admin user: admin@gmail.com / admin123');
  } else {
    await prisma.user.update({
      where: { email: 'admin@gmail.com' },
      data: { companyId: company.id },
    });
    console.log('Admin user already exists, re-linked to MadStack.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
