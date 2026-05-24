import axios from 'axios';

const SERPAPI_BASE = 'https://serpapi.com/search';

function cleanUrl(url) {
  try {
    const u = new URL(url);
    u.search = '';
    return u.toString().replace(/\/$/, '');
  } catch { return url; }
}

function cleanTitle(title) {
  return title
    .replace(/ \| লিংকডইন$/, '').replace(/ \| LinkedIn$/, '')
    .replace(/ - LinkedIn$/, '').trim();
}

async function searchGoogle(query) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];
  try {
    const res = await axios.get(SERPAPI_BASE, {
      params: { api_key: apiKey, q: query, engine: 'google', hl: 'en', num: 15 },
      timeout: 15000,
    });
    return res.data?.organic_results || [];
  } catch { return []; }
}

function buildQueries(icp, location) {
  const text = icp.toLowerCase();
  const keywords = [];

  if (text.includes('garment') || text.includes('textile') || text.includes('apparel') || text.includes('clothing') || text.includes('fashion'))
    keywords.push('garment', 'textile', 'clothing');
  if (text.includes('software') || text.includes('tech') || text.includes('it') || text.includes('digital'))
    keywords.push('software', 'technology');
  if (text.includes('health') || text.includes('medical') || text.includes('pharma'))
    keywords.push('healthcare');
  if (text.includes('bank') || text.includes('finance') || text.includes('insurance'))
    keywords.push('banking', 'finance');
  if (text.includes('retail') || text.includes('ecommerce') || text.includes('shop'))
    keywords.push('retail');
  if (text.includes('manufacturing') || text.includes('factory') || text.includes('industrial'))
    keywords.push('manufacturing');
  if (text.includes('education') || text.includes('university') || text.includes('school'))
    keywords.push('education');

  if (keywords.length === 0) keywords.push('business');

  const roles = ['CEO', 'Founder', 'Director', 'Manager', 'Owner', 'Managing Director'];
  const queries = new Set();

  // People search (LinkedIn profiles) — highest priority
  for (const kw of keywords.slice(0, 2)) {
    for (const role of roles.slice(0, 3)) {
      if (location) queries.add(`site:linkedin.com/in/ ${role} ${kw} ${location}`);
      queries.add(`site:linkedin.com/in/ ${role} ${kw}`);
    }
  }

  // People with contact info in snippet
  if (location) queries.add(`site:linkedin.com/in/ ${keywords[0]} ${location} email`);
  queries.add(`site:linkedin.com/in/ ${keywords[0]} email`);

  // Company search (LinkedIn company pages)
  for (const kw of keywords) {
    if (location) queries.add(`site:linkedin.com/company ${kw} ${location}`);
    queries.add(`site:linkedin.com/company ${kw}`);
  }

  return [...queries].slice(0, 10);
}

function extractEmails(text) {
  return [...text.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]+/g)].map(m => m[0]).filter(e => !e.includes('example.com'));
}

function extractPhones(text) {
  const phones = [];
  const patterns = [
    /\+\d{1,3}[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4}[\s-]?\d{1,4}/g,
    /\d{3}[\s-]\d{3}[\s-]\d{4}/g,
    /\(\d{3}\)\s*\d{3}[\s-]\d{4}/g,
  ];
  for (const p of patterns) {
    const matches = text.match(p);
    if (matches) phones.push(...matches);
  }
  return [...new Set(phones)];
}

function parseLead(result, query) {
  const url = cleanUrl(result.link || '');
  const title = cleanTitle(result.title || '');
  const snippet = result.snippet || '';

  if (!url || !title) return null;

  const isProfile = url.includes('/in/');
  const isCompany = url.includes('/company/') && !isProfile;

  if (isProfile) {
    const nameParts = title.split(' - ');
    const contactName = nameParts[0]?.trim();
    if (!contactName) return null;

    let companyName = null;
    const atMatch = snippet.match(/\b(at|of)\s+([A-Z][A-Za-z0-9\s&.]+?)(?:\s*[-,;]|\s*$|\.\s|\s+and\s)/);
    if (atMatch) {
      companyName = atMatch[2].trim().replace(/\s+/g, ' ');
      if (companyName.length > 40) companyName = companyName.split(/[.,;]/)[0].trim();
    } else if (nameParts.length > 1) {
      const titlePart = nameParts.slice(1).join(' - ');
      const atIdx = titlePart.toLowerCase().indexOf(' at ');
      if (atIdx > 0) {
        companyName = titlePart.substring(atIdx + 4).trim().replace(/[.,;].*$/, '').trim();
      } else {
        const parts = titlePart.split(/\s+[–—-]\s+/);
        if (parts.length > 1) companyName = parts[parts.length - 1].trim();
      }
    }

    const emails = extractEmails(snippet);
    const phones = extractPhones(snippet);

    return {
      companyName: companyName || contactName,
      contactName,
      email: emails[0] || null,
      phone: phones[0] || null,
      linkedinUrl: url,
      sourceUrl: url,
      source: 'linkedin',
      stage: 'new',
      industry: null,
      notes: snippet ? snippet.slice(0, 300) : null,
    };
  }

  if (isCompany) {
    const slugMatch = url.match(/linkedin\.com\/company\/([^/?]+)/);
    const slug = slugMatch?.[1] || '';
    const nameFromUrl = slug.replace(/[-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
    const companyName = title || nameFromUrl;
    if (!companyName) return null;
    return {
      companyName,
      contactName: null,
      linkedinUrl: url,
      sourceUrl: url,
      source: 'linkedin',
      stage: 'new',
      industry: null,
      notes: snippet ? snippet.slice(0, 300) : null,
    };
  }

  return null;
}

export async function searchLeads(company, ws, maxResults = 40) {
  const icp = (ws.outputs?.icp || '') + ' ' + (ws.serviceName || '');
  const location = company?.location || '';
  const queries = buildQueries(icp, location);
  const seen = new Set();
  const allResults = [];

  for (const query of queries) {
    if (allResults.length >= maxResults) break;
    const results = await searchGoogle(query);

    for (const r of results) {
      if (allResults.length >= maxResults) break;
      const lead = parseLead(r, query);
      if (!lead) continue;

      // Dedup by LinkedIn URL
      if (!seen.has(lead.linkedinUrl)) {
        seen.add(lead.linkedinUrl);
        allResults.push(lead);
      }
    }
  }

  return allResults;
}
