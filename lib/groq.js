import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export function buildSystemPrompt(company, workspace) {
  const services = company.services?.map(s =>
    `- ${s.name}${s.stack ? ` (${s.stack})` : ''}`
  ).join('\n') || '';

  const desc = (company.description || '').slice(0, 500);
  const markets = company.target_markets?.slice(0, 6).join(', ') || '';

  let wsBlock = '';
  if (workspace) {
    const wsDesc = (workspace.description || '').slice(0, 300);
    const wsMarkets = Array.isArray(workspace.targetMarkets) ? workspace.targetMarkets.slice(0, 4).join(', ') : '';
    const wsChannels = Array.isArray(workspace.channels) ? workspace.channels.join(', ') : '';
    wsBlock = [
      wsDesc ? `\nPRODUCT/SERVICE DETAILS: ${wsDesc}` : '',
      workspace.location ? `TARGET LOCATION: ${workspace.location}` : '',
      wsMarkets ? `TARGET MARKETS: ${wsMarkets}` : '',
      workspace.targetRegion ? `TARGET REGION: ${workspace.targetRegion}` : '',
      workspace.targetCountry ? `TARGET COUNTRY: ${workspace.targetCountry}` : '',
      workspace.stage ? `PRODUCT STAGE: ${workspace.stage}` : '',
      workspace.primaryGoal ? `PRIMARY GOAL: ${workspace.primaryGoal}` : '',
      wsChannels ? `FOCUS CHANNELS: ${wsChannels}` : '',
    ].filter(Boolean).join('\n');
  }

  return `You are the AI CMO of ${company.name}, a ${company.location || ''} agency. You generate specific, actionable marketing content.

COMPANY: ${company.name}. ${desc}
SERVICES:\n${services}
MARKETS: ${markets}
WEBSITE: ${company.website || ''}
TAGLINE: "${company.tagline || ''}"${wsBlock}

Be specific, use local market context. Write in English.`;
}

export async function generateChat(prompt, systemPrompt) {
  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    max_tokens: 1500,
  });

  return completion.choices?.[0]?.message?.content || '';
}
