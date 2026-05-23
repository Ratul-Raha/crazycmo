export function icpPrompt(company, service) {
  const contextNote = company.location ? 'Be specific with ' + company.location + ' market context.' : 'Be specific to the local market context.';
  return `Generate a detailed Ideal Customer Profile (ICP) for ${company.name}'s "${service}" service. Include:
1. Primary ICP (most likely buyer in ${company.location} / primary market)
2. Secondary ICP (international/diaspora)
3. Demographics & firmographics
4. Pain points they face
5. Where to find them online
6. What messaging resonates
7. Buying triggers
8. Red flags (bad fit customers)
${contextNote}`;
}

export function positioningPrompt(company, service, market, competitor) {
  return `Create a complete positioning and messaging framework for ${company.name}'s ${service} service targeting ${market}, differentiating from ${competitor}.

Include:
1. One-liner value proposition (10 words max)
2. Full positioning statement (Geoffrey Moore template)
3. 3 key messages (one per ICP pain point)
4. Proof points / evidence for each message
5. Tone of voice guidelines
6. What NOT to say (avoid)
7. Sample tagline options (3 variations)`;
}

export function contentPrompt(company, type, item, itemType, audience, tone, topic) {
  return `Write a complete "${type}" for ${company.name}'s ${item} ${itemType}.
Target audience: ${audience}
Tone: ${tone}
${topic ? 'Topic/angle: ' + topic : ''}

Make it full, publish-ready content. Include headlines, structure, CTAs pointing to ${company.website}. Be specific with examples relevant to ${company.location || 'your target'} market. SEO-optimized where applicable.`;
}

export function socialPrompt(company, platform, goal, service, variations, hook) {
  return `Write ${variations} ${platform} post(s) for ${company.name}.
Service: ${service}
Goal: ${goal}
${hook ? 'Key message/hook: ' + hook : ''}

For each variation:
- Write the full post with emojis where appropriate
- Include relevant hashtags
- Add a clear CTA
- Match the platform's character limits and style
- Make it feel human, not corporate
- Reference ${company.location || 'the local'} market context where relevant
Label each variation clearly (Version 1, Version 2, etc.)`;
}

export function emailPrompt(company, type, item, itemType, prospect, pain) {
  return `Write a "${type}" for ${company.name}'s ${item} ${itemType}.
Prospect type: ${prospect}
Pain point to address: ${pain}

Requirements:
- Personalized and human (not template-y)
- Subject line included for emails
- Focus on their problem first, ${company.name} solution second
- Short paragraphs, easy to read on mobile
- Strong but soft CTA (book a free call / reply to this)
- Mention ${company.name} is based in ${company.location || 'your local market'} (trust builder for local), or your global differentiator for international
- If follow-up sequence: write all 3 emails with send timing notes`;
}

export function calendarPrompt(company, item, itemType, channel) {
  return `Create a detailed 4-week content calendar for ${company.name} focusing on ${item} ${itemType} across ${channel}.

Format as:
WEEK 1 — [Theme]
Mon: [post type] — [topic]
Wed: [post type] — [topic]
Fri: [post type] — [topic]

(repeat for weeks 2-4)

For each entry include:
- Content type (post, story, article, video idea, etc.)
- Specific topic with angle
- Target audience
- Goal (awareness/leads/engagement)

Make themes strategic — build awareness → interest → desire → action across the month. Include local events and seasonal context where relevant.`;
}

export function battlecardPrompt(company, competitor, service, context) {
  return `Create a sales battlecard for ${company.name} vs ${competitor} for ${service}.
${context ? 'Competitor context: ' + context : ''}

Include:
1. THEM vs US comparison table (pricing, speed, tech stack, team, AI capability, support)
2. Where ${company.name} wins (our strengths)
3. Where they might try to attack us (our vulnerabilities + how to handle)
4. Key objection handlers ("Why ${company.name} over ${competitor}?")
5. Trap questions sales reps can ask prospects to disqualify competitors
6. Proof points ${company.name} should collect
7. One-sentence killer differentiator`;
}

export function batchIcpPrompt(company, service) {
  return `Write a brief ICP (3 bullet points each: Who, Pain, Where to find) for ${company.name}'s ${service} service${company.location ? ` in ${company.location}` : ''}.`;
}

export function batchSocialPrompt(company, service) {
  return `Write 1 LinkedIn post (max 200 words) promoting ${company.name}'s ${service} service. Include 3 hashtags and a CTA.`;
}

export function batchEmailPrompt(company, service) {
  return `Write a cold email (subject + 3 short paragraphs + CTA) pitching ${company.name}'s ${service}${company.location ? ` to a ${company.location} business` : ''}. Keep it under 120 words.`;
}

export function batchCalendarPrompt(company) {
  return `Give a 2-week content calendar for ${company.name} (all services). 3 posts per week. Format: Day: [type] — [topic].`;
}

export function batchPositioningPrompt(company, service) {
  return `One-liner value prop + 3 key messages for ${company.name}'s ${service} service${company.location ? ` in ${company.location} market` : ''}.`;
}

export function batchBattlecardPrompt(company, service) {
  return `3 key ${company.name} advantages over ${service}. Bullet format.`;
}

// ---- Workspace / Onboarding Prompts (CMO Sequential Pipeline) ---- //

export function workspaceIcpPrompt(company, serviceName, serviceType, crawledContent) {
  const locationFocus = company.location ? ` (${company.location} + global)` : '';
  const marketNote = company.location ? ` Reference ${company.location} market context.` : '';
  return `You are a 20-year veteran CMO analyzing a ${serviceType} for ${company.name}.

SERVICE/PRODUCT: "${serviceName}" (${serviceType})
WEBSITE CONTENT:
${crawledContent?.slice(0, 8000) || 'No website content available.'}

Generate a detailed Ideal Customer Profile (ICP). Include:
1. PRIMARY ICP — exact job title, industry vertical, company size, annual revenue range, tech stack, purchase authority
2. SECONDARY ICP — adjacent buyer persona
3. DEMOGRAPHICS & FIRMOGRAPHICS — company size, location focus${locationFocus}, budget range
4. TOP 5 PAIN POINTS — specific, ranked by severity
5. BUYING TRIGGERS — what events make them actively search for this solution
6. WHERE TO FIND THEM — specific online communities, publications, events, LinkedIn groups
7. RED FLAGS — who NOT to sell to (bad fit signals)

Be specific, not generic. Use the website content to infer real details.${marketNote}`;
}

export function workspacePositioningPrompt(company, serviceName, serviceType, icpOutput, crawledContent) {
  return `You are a 20-year veteran CMO. Using the ICP below, craft a complete positioning and messaging framework.

SERVICE/PRODUCT: "${serviceName}" (${serviceType})
COMPANY: ${company.name} — ${company.tagline || ''}
WEBSITE CONTENT: ${(crawledContent || '').slice(0, 5000)}

ICP REFERENCE:
${icpOutput}

Generate:
1. ONE-LINER — compelling, under 12 words, instantly clear
2. POSITIONING STATEMENT — "For [target] who [need], [product] is a [category] that [key benefit]. Unlike [competitor], we [key differentiation]."
3. 3 KEY MESSAGES — one per primary pain point, each with proof points
4. TONE OF VOICE GUIDELINES — 5 specific rules for all copy
5. TAGLINE OPTIONS — 3 variations
6. WHAT NOT TO SAY — messaging traps to avoid
7. DIFFERENTIATION ANCHOR — the single strongest "why us"

Make every line specific to ${serviceName}, not generic marketing fluff.`;
}

export function workspaceCompetitorPrompt(company, serviceName, serviceType, positioningOutput, crawledContent) {
  const marketNote = company.location ? `Be specific about ${company.location} market if competitors are local.` : 'Be specific about local market if competitors are local.';
  return `You are a 20-year veteran CMO doing competitive analysis.

SERVICE/PRODUCT: "${serviceName}" (${serviceType})
COMPANY: ${company.name}
WEBSITE CONTENT: ${(crawledContent || '').slice(0, 5000)}

POSITIONING REFERENCE:
${positioningOutput}

Generate a complete competitive analysis and battlecard:
1. COMPETITOR LANDSCAPE — identify 3-5 real competitors (direct + indirect), what they offer, their pricing model, their perceived strength
2. THEM vs US TABLE — for each competitor, compare: pricing, speed, quality, tech, support, specialization
3. WHERE WE WIN — specific advantages with evidence (use website content)
4. WHERE THEY MIGHT ATTACK — our vulnerabilities and how to respond
5. OBJECTION HANDLERS — "Why you over [competitor]?" — 5 specific Q&A pairs
6. TRAP QUESTIONS — questions your sales team can ask to disqualify competitors
7. KILLER DIFFERENTIATOR — one sentence that changes the conversation

${marketNote}`;
}

export function workspaceContentStrategyPrompt(company, serviceName, serviceType, competitorOutput, crawledContent) {
  const contextNote = company.location ? ' Include ' + company.location + ' context.' : '';
  return `You are a 20-year veteran CMO designing a content strategy.

SERVICE/PRODUCT: "${serviceName}" (${serviceType})
COMPANY: ${company.name} — ${company.description || ''}
WEBSITE CONTENT: ${(crawledContent || '').slice(0, 5000)}

COMPETITIVE CONTEXT:
${competitorOutput}

Generate a complete content strategy:
1. 3-5 CONTENT PILLARS — theme/topic clusters that map to ICP pain points
2. CONTENT FUNNEL MAP — TOFU (awareness) → MOFU (education) → BOFU (decision) with specific content types and topics per stage
3. 10 BLOG POST IDEAS — specific titles with angles, each with target keyword, estimated word count, and which pillar it belongs to
4. 3 CASE STUDY IDEAS — specific client types and angles
5. VIDEO / VISUAL CONTENT IDEAS — 5 ideas for short-form and long-form
6. SEARCH OPPORTUNITIES — 5 high-value keyword clusters with search intent
7. CONTENT REPURPOSING PLAN — how to turn one piece of content into 5 formats

Each idea must be specific to ${serviceName}, not generic.${contextNote}`;
}

export function workspaceTaskPrompt(company, serviceName, serviceType, contentStrategyOutput) {
  return `You are a 20-year veteran CMO creating an actionable task plan.

SERVICE/PRODUCT: "${serviceName}" (${serviceType})
COMPANY: ${company.name}

CONTENT STRATEGY REFERENCE:
${contentStrategyOutput}

Generate a concrete, actionable task list. DO NOT assign to roles — list the actions themselves.

Organize by category:
1. CONTENT CREATION — specific pieces to write, record, or design
2. PUBLICATION — where and when to publish/distribute content
3. COLD OUTREACH — who to contact, how many, with what offer
4. CAMPAIGN — specific campaigns to run, with duration
5. OPTIMIZATION — website/service page improvements, SEO fixes
6. SOCIAL MEDIA — social media management, engagement, scheduling
7. RESEARCH — market research, competitor analysis, audience insights
8. EVENT — event planning, webinars, conferences
9. LEAD FOLLOW-UP — follow-up sequences for existing leads
10. LEAD GENERATION — strategies to generate new leads

For each task include:
- Priority: P1 (do first), P2 (important), P3 (nice to have)
- Task description (specific, actionable)
- Estimated effort (hours or days)
- Which week of the marketing plan it belongs to

Format as a clean structured list. Aim for 10-15 specific tasks.`;
}

export function workspaceOutreachPrompt(company, serviceName, serviceType, positioningOutput, crawledContent) {
  return `You are a 20-year veteran CMO writing outreach sequences.

SERVICE/PRODUCT: "${serviceName}" (${serviceType})
COMPANY: ${company.name} — ${company.tagline || ''}
WEBSITE: ${company.website || ''}
LOCATION: ${company.location || 'N/A'}
WEBSITE CONTENT: ${(crawledContent || '').slice(0, 5000)}

POSITIONING REFERENCE:
${positioningOutput}

Generate complete outreach templates:

1. COLD EMAIL (first touch) — subject line + 4 paragraph max, personalized, problem-first, soft CTA
2. FOLLOW-UP EMAIL (3 days later) — different angle, add social proof
3. BREAK-UP EMAIL (7 days later) — final attempt, value-first
4. LINKEDIN CONNECTION REQUEST — 300 char max, specific compliment + reason
5. LINKEDIN FOLLOW-UP MESSAGE — after connection accepted
6. WHATSAPP FIRST MESSAGE${company.location ? ' if applicable for ' + company.location + ' market' : ''}, VERY short

Each template should be adaptable to different prospect types. Include placeholders like [Prospect Company], [Specific Pain Point].

Focus on B2B outreach relevant to ${serviceName}.`;
}

export function workspaceCalendarPrompt(company, serviceName, serviceType, contentStrategyOutput, taskOutput) {
  const eventsNote = company.location ? ' Include ' + company.location + '-specific events/context where relevant.' : '';
  return `You are a 20-year veteran CMO building a go-to-market calendar.

SERVICE/PRODUCT: "${serviceName}" (${serviceType})
COMPANY: ${company.name}

CONTENT STRATEGY REFERENCE:
${contentStrategyOutput}

TASK REFERENCE:
${taskOutput}

Create a detailed 4-week content and marketing calendar.

Format each week with a THEME:

WEEK 1 — [Theme]
Week theme description:
- Content plan: [Day: content type — topic — channel]
- Outreach actions: [specific task]
- Campaign actions: [specific campaign task]

WEEK 2 — [Theme]
...

WEEK 3 — [Theme]
...

WEEK 4 — [Theme]
...

For each day include:
- Content type (blog post, LinkedIn post, email, case study, video, etc.)
- Specific topic or angle
- Distribution channel
- Goal (awareness/leads/engagement/conversion)

Make the sequence strategic — build from awareness → interest → desire → action.${eventsNote}`;
}
