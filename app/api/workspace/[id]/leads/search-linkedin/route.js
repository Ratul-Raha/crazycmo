import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import axios from 'axios';
import * as cheerio from 'cheerio';

function parseDdgResult(title, href, snippet) {
  const linkedinUrl = href?.includes('linkedin.com') ? href.split('?')[0] : null;
  if (!linkedinUrl) return null;

  let contactName = '';
  let position = '';
  let companyName = '';

  const pipeIdx = title.indexOf(' | LinkedIn');
  const titleClean = pipeIdx > 0 ? title.substring(0, pipeIdx).trim() : title.trim();
  const dashIdx = titleClean.indexOf(' - ');
  if (dashIdx > 0) {
    contactName = titleClean.substring(0, dashIdx).trim();
    position = titleClean.substring(dashIdx + 3).trim();
  } else {
    contactName = titleClean;
  }

  const atIdx = position.toLowerCase().indexOf(' at ');
  if (atIdx > 0) {
    const remainder = position.substring(atIdx + 4).trim();
    position = position.substring(0, atIdx).trim();
    companyName = remainder;
  }

  if (!companyName && snippet) {
    const m = snippet.match(/(?:at|@)\s+([A-Z][A-Za-z0-9\s&.]+?)(?:\s*[-,]|\s*$)/);
    if (m) companyName = m[1].trim().replace(/\s+/g, ' ');
  }

  let industry = '';
  if (snippet) {
    const industryKeywords = ['Garment', 'Textile', 'Software', 'Technology', 'IT', 'Healthcare', 'Finance', 'Banking', 'Retail', 'E-commerce', 'Manufacturing', 'Education'];
    for (const kw of industryKeywords) {
      if (snippet.toLowerCase().includes(kw.toLowerCase())) {
        industry = kw;
        break;
      }
    }
  }

  return {
    contactName: contactName || null,
    companyName: companyName || linkedinUrl.split('/in/')[1]?.split('-')?.map(w => w.charAt(0).toUpperCase() + w.slice(1))?.join(' ') || 'LinkedIn Lead',
    linkedinUrl,
    source: 'linkedin_search',
    stage: 'new',
    notes: snippet?.slice(0, 200) || position || null,
    position,
    industry: industry || null,
  };
}

async function searchDdgHtml(query) {
  const results = [];
  try {
    const url = 'https://html.duckduckgo.com/html/';
    const res = await axios.post(url, new URLSearchParams({ q: query }), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(res.data);
    $('.result').each((i, el) => {
      if (results.length >= 15) return false;
      const titleEl = $(el).find('.result__title a');
      const href = titleEl.attr('href');
      const title = titleEl.text().trim();
      const snippet = $(el).find('.result__snippet').text().trim();
      const parsed = parseDdgResult(title, href, snippet);
      if (parsed) results.push(parsed);
    });
  } catch (e) {
    console.warn('DDG HTML search failed:', e.message);
  }
  return results;
}

function buildQueries(company, ws) {
  const icp = (ws.outputs?.icp || '').toLowerCase();
  const service = (ws.serviceName || '').toLowerCase();
  const base = 'site:linkedin.com/in';
  const queries = [];
  const location = company?.location || '';

  const industries = [];
  if (icp.includes('garment') || icp.includes('textile')) industries.push('garment', 'textile');
  if (icp.includes('software') || icp.includes('tech') || icp.includes('it')) industries.push('software', 'technology');
  if (icp.includes('retail') || icp.includes('ecommerce')) industries.push('retail', 'ecommerce');
  if (icp.includes('health') || icp.includes('medical')) industries.push('healthcare');
  if (icp.includes('bank') || icp.includes('finance') || icp.includes('insurance')) industries.push('banking', 'finance');
  if (icp.includes('manufacturing') || icp.includes('factory')) industries.push('manufacturing');
  if (icp.includes('education') || icp.includes('university')) industries.push('education');

  const titles = [];
  if (icp.includes('ceo') || icp.includes('founder') || icp.includes('owner')) titles.push('CEO', 'Founder', 'Director');
  if (icp.includes('manager')) titles.push('Manager');
  if (icp.includes('cto') || icp.includes('tech') || icp.includes('it')) titles.push('CTO', 'IT Head', 'Technology');
  if (icp.includes('market')) titles.push('Marketing', 'Growth');
  if (icp.includes('sales')) titles.push('Sales', 'Business Development');

  const finalTitles = titles.length > 0 ? titles.slice(0, 3) : ['CEO', 'Director', 'Manager'];
  const inds = industries.length > 0 ? industries.slice(0, 2) : [''];

  for (const title of finalTitles) {
    for (const ind of inds) {
      const parts = [base, '"' + title + '"', location, ind].filter(Boolean);
      queries.push(parts.join(' '));
    }
  }

  if (service) queries.push([base, '"' + service + '"', location].filter(Boolean).join(' '));
  queries.push([base, location].filter(Boolean).join(' '));

  return [...new Set(queries)].slice(0, 6);
}

export async function POST(request, { params }) {
  try {
    const payload = getUserFromRequest(request);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = params;
    const ws = await prisma.workspace.findFirst({ where: { id, companyId: payload.company_id } });
    if (!ws) return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });

    const company = await prisma.company.findUnique({ where: { id: payload.company_id } });

    const queries = buildQueries(company, ws);
    const seen = new Set();
    const allResults = [];

    for (const q of queries) {
      if (allResults.length >= 30) break;
      const results = await searchDdgHtml(q);
      for (const r of results) {
        const key = r.linkedinUrl;
        if (!seen.has(key)) {
          seen.add(key);
          allResults.push(r);
          if (allResults.length >= 30) break;
        }
      }
    }

    return NextResponse.json({ leads: allResults, count: allResults.length, queries });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
