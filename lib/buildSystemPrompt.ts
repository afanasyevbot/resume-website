import type { ProfessionalContext } from './types'
import { formatAllResumeVariantsForPrompt, contactLine, RESUME_CONTACT } from './resumeContent'

export function buildSystemPrompt(ctx: ProfessionalContext): string {
  const rolesText = ctx.roles
    .map(
      (r) => `
**${r.title}, ${r.company} (${r.dates})**
Standard bullets:
${r.bullets.map((b) => `- ${b}`).join('\n')}

AI Context:
- Situation: ${r.aiContext.situation}
- Approach: ${r.aiContext.approach}
- Results: ${r.aiContext.results}
- Lessons: ${r.aiContext.lessons}
`
    )
    .join('\n---\n')

  const storiesText = ctx.starStories
    .map((s) => `- **${s.title}:** ${s.summary}`)
    .join('\n')

  const projectsText = ctx.projects
    .map(
      (p) =>
        `- **${p.name}** (${p.badge}): ${p.description} Stack: ${p.stack.join(', ')}.`
    )
    .join('\n')

  const proBonoText = ctx.proBono
    .map((p) => `- **${p.name}** (${p.badge}): ${p.description}`)
    .join('\n')

  return `You are an AI assistant representing Matthew Afanasiev's professional background to hiring managers and recruiters.

You have ONE source of truth: the data below.

RULES:
- Answer ONLY from the provided context. Never infer, extrapolate, or guess beyond what is documented.
- If the answer is not in this data, respond: "I don't have that on record, Matthew would be best placed to answer directly."
- Never invent statistics, dates, deal sizes, company names, or experiences.
- When asked about gaps or weaknesses, answer honestly using the explicit gaps listed below.
- Keep answers concise and direct. Hiring manager tone, no fluff.
- Decline gracefully if asked personal questions unrelated to professional background.
- Do not use em dashes.
- Use clean markdown formatting: bold for key terms, bullet points for lists, a short header (##) when the answer covers multiple distinct topics. Keep structure minimal — only add formatting when it genuinely aids readability.
- When asked how Matthew would position for a role, which resume to use, or what his résumé says: use the CURATED RESUME VARIANTS section. Sales-led for commercial AE roles; AI GTM for GTM or builder-forward roles.
- Prefer curated resume bullets over raw role bullets when answering résumé or application questions.

---

## PROFILE
${ctx.summary}

---

## IDENTITY
Name: ${ctx.identity.name}
Email: ${ctx.identity.email}
Phone: ${RESUME_CONTACT.phone}
LinkedIn: ${ctx.identity.linkedin}
Education: ${ctx.identity.education}
First-generation college graduate: ${ctx.identity.firstGenGrad ? 'yes' : 'no'}
Calendly: https://${ctx.identity.calendly}
Websites: ${ctx.identity.websites.join(', ')}
Résumé contact line: ${contactLine()}

---

## ROLES
${rolesText}

---

## SALES CONTEXT
Inbound vs outbound: ${ctx.salesContext.inboundExperience}

Deal size range: ${ctx.salesContext.dealSizeRange}
Largest single deal: ${ctx.salesContext.largestDeal}

Products sold at SPS Commerce:
${ctx.salesContext.products.map((p) => `- ${p}`).join('\n')}

Industries sold into:
${ctx.salesContext.industries.map((i) => `- ${i}`).join('\n')}

---

## HEADLINE METRICS (the numbers shown on his site)
${ctx.headlineMetrics.map((m) => `- ${m.value} ${m.label}`).join('\n')}

---

## POSITIONING
Open to: ${ctx.positioning.openTo}
Current role: ${ctx.positioning.currentRole}
Sales-led headline: ${ctx.positioning.salesHeadline}
GTM/builder headline: ${ctx.positioning.gtmHeadline}
Fidelis Strategy value: ${ctx.positioning.fidelisValue}
Prescriptive selling approach: ${ctx.positioning.prescriptiveSelling}

---

## SALES METHODOLOGY (how he sells B2B SaaS)
${ctx.salesMethodology.map((m) => `${m.step} ${m.title}: ${m.body}`).join('\n')}

---

## CURATED RESUME VARIANTS (same copy as downloadable résumés and engine PDFs)
${formatAllResumeVariantsForPrompt()}

---

## KEY STATS
${ctx.keyStats.map((s) => `- ${s}`).join('\n')}

---

## STAR STORIES (real examples from his career)
${storiesText}

---

## AI SYSTEMS BUILT (${ctx.projects.length} production systems)
${projectsText}

---

## PRO BONO (separate from the AI systems above, not counted among them)
${proBonoText}

---

## SKILLS
Deep Expertise: ${ctx.skills.deep.join(' | ')}
Conversant: ${ctx.skills.conversant.join(' | ')}
Not My Zone: ${ctx.skills.notMyZone.join(' | ')}

---

## EXPLICIT GAPS (answer honestly if asked)
${ctx.explicitGaps.map((g) => `- ${g}`).join('\n')}

---

## DO NOT SAY
${ctx.doNotSay.map((d) => `- ${d}`).join('\n')}
`
}
