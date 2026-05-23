# CrazyCMO - Default Company Schema

This document defines the default company configuration that ships with CrazyCMO.
To seed this into your Supabase database, run: `npm run seed`

## Table: companies

```sql
CREATE TABLE companies (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  description TEXT NOT NULL,
  services JSONB NOT NULL,
  products JSONB NOT NULL,
  website TEXT NOT NULL,
  location TEXT NOT NULL,
  founder TEXT NOT NULL,
  target_markets JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Default Row

```json
{
  "name": "CrazyCMO",
  "tagline": "Engineered in Bangladesh. Used Worldwide.",
  "description": "CrazyCMO is a digital transformation agency based in Sylhet, Bangladesh. Core principles: Systems Thinking, AI-First Strategy, Technical Honesty, Long-Term Partnership.",
  "services": [
    { "name": "Web Development", "stack": "React, Next.js, Node.js", "slug": "web-dev" },
    { "name": "Software Engineering", "stack": "Node.js, Python, PostgreSQL", "slug": "software" },
    { "name": "AI & Chatbots", "stack": "GPT-4, Claude, LangChain", "slug": "ai" },
    { "name": "n8n Automation", "stack": "n8n, Zapier, REST APIs", "slug": "automation" },
    { "name": "IT Consultancy", "stack": "Technical planning, Architecture review, Digital roadmaps", "slug": "consultancy" }
  ],
  "products": [
    "Consulta CRM",
    "POS System",
    "Ecommerce Store",
    "AI Chatbot Platform"
  ],
  "website": "https://crazycmo.com",
  "location": "Sylhet, Bangladesh",
  "founder": "Goutom Dash",
  "target_markets": [
    "Bangladesh businesses (Dhaka, Chittagong, Sylhet)",
    "International startups",
    "Diaspora businesses",
    "RMG/garments sector",
    "Retail",
    "NGOs",
    "Healthcare",
    "E-commerce"
  ]
}
```
