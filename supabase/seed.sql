-- =============================================
-- CrazyCMO Database Schema
-- =============================================

-- Companies table (tenant config)
CREATE TABLE IF NOT EXISTS companies (
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

-- Users table (auth)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  company_id BIGINT REFERENCES companies(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outputs table (generated content)
CREATE TABLE IF NOT EXISTS outputs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  company_id BIGINT REFERENCES companies(id),
  user_id BIGINT REFERENCES users(id),
  module TEXT NOT NULL,
  service TEXT NOT NULL,
  prompt TEXT NOT NULL,
  output TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for history queries
CREATE INDEX IF NOT EXISTS idx_outputs_company_created
  ON outputs(company_id, created_at DESC);

-- =============================================
-- Seed default company
-- =============================================
INSERT INTO companies (name, tagline, description, services, products, website, location, founder, target_markets)
VALUES (
  'CrazyCMO',
  'Engineered in Bangladesh. Used Worldwide.',
  'CrazyCMO is a digital transformation agency based in Sylhet, Bangladesh. Core principles: Systems Thinking, AI-First Strategy, Technical Honesty, Long-Term Partnership.',
  '[
    {"name": "Web Development", "stack": "React, Next.js, Node.js", "slug": "web-dev"},
    {"name": "Software Engineering", "stack": "Node.js, Python, PostgreSQL", "slug": "software"},
    {"name": "AI & Chatbots", "stack": "GPT-4, Claude, LangChain", "slug": "ai"},
    {"name": "n8n Automation", "stack": "n8n, Zapier, REST APIs", "slug": "automation"},
    {"name": "IT Consultancy", "stack": "Technical planning, Architecture review, Digital roadmaps", "slug": "consultancy"}
  ]',
  '["Consulta CRM", "POS System", "Ecommerce Store", "AI Chatbot Platform"]',
  'https://crazycmo.com',
  'Sylhet, Bangladesh',
  'Goutom Dash',
  '["Bangladesh businesses (Dhaka, Chittagong, Sylhet)", "International startups", "Diaspora businesses", "RMG/garments sector", "Retail", "NGOs", "Healthcare", "E-commerce"]'
);
