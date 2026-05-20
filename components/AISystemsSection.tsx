interface Project {
  name: string
  badge: string
  description: string
  stack: string[]
  link?: string
  wide?: boolean
}

const projects: Project[] = [
  {
    name: 'Fidelis Pulse',
    badge: '◉ Live SaaS Product',
    description:
      "Financial dashboard SaaS for owner-operators. Multi-tenant firm isolation, per-client Stripe billing, QuickBooks + Xero + Plaid integrations, and a Claude-powered AI advisor that generates narrative commentary on each client's financials.",
    stack: ['Next.js 15 App Router', 'Stripe billing — live mode', 'Claude API — AI advisor', 'Railway Postgres', 'QuickBooks + Xero + Plaid OAuth'],
    link: 'https://fidelispulse.com',
    wide: true,
  },
  {
    name: 'M&A Advisory — Buyer Intelligence Engine',
    badge: 'AI Agents · Client',
    description:
      'Multi-agent platform for a PE advisory firm. Discovers, enriches, and ranks acquisition targets using semantic search, Python FastAPI workers, and Anthropic Managed Agents for autonomous research tasks.',
    stack: ['Anthropic Agent SDK', 'pgvector', 'Supabase', 'FastAPI'],
  },
  {
    name: 'M&A Advisory — Lead Generation Platform',
    badge: 'Lead Gen · Client',
    description:
      'Automated acquisition target discovery and qualification. Claude-powered scoring against buyer criteria, persistent lead database, weekly automated reports.',
    stack: ['Next.js', 'Claude API', 'SQLite', 'Railway'],
  },
  {
    name: 'Real Estate Tech — AI Prospecting Engine',
    badge: 'Lead Gen · Client',
    description:
      'Playwright scraping, multi-provider enrichment (Apollo, Hunter, Snov), AI-scored ICP matching, and outreach draft generation. Cron-triggered pipeline on Railway.',
    stack: ['Playwright', 'Apollo + Hunter', 'Railway'],
  },
  {
    name: 'Glow Routine',
    badge: 'Consumer PWA',
    description:
      'Skincare tracking PWA — AM/PM checklists, streaks, journal photos, web push reminders, AI advisor. Sentry + PostHog instrumented.',
    stack: ['Supabase', 'Web Push', 'PostHog'],
  },
  {
    name: 'Grace Church — Full Technology Buildout',
    badge: 'Pro Bono',
    description:
      'Microsoft 365 tenant, staff email setup, donation platform, spend management, site redesign, and content tooling. Phase 2: QuickBooks Online implementation.',
    stack: [],
    link: 'https://eagangrace.com',
  },
]

function ProjectCard({ project }: { project: Project }) {
  const isWide = project.wide

  return (
    <div className={`bg-surface border border-border rounded-xl p-7 relative overflow-hidden ${isWide ? 'col-span-2' : ''}`}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, #c9a96e, transparent)' }} />

      {isWide ? (
        <div className="grid grid-cols-2 gap-9">
          <div>
            <p className="text-[10px] tracking-[2px] uppercase text-gold font-semibold mb-3">{project.badge}</p>
            <h3 className="font-display text-[24px] font-semibold text-text-bright mb-3">{project.name}</h3>
            <p className="text-[14px] text-text-muted leading-[1.75]">{project.description}</p>
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gold/85 tracking-wide mt-3 block hover:text-gold transition-colors">
                {project.link.replace('https://', '')} ↗
              </a>
            )}
          </div>
          <div>
            <p className="text-[10px] tracking-[2px] uppercase text-text-ghost font-semibold mb-3">Stack</p>
            <div className="flex flex-col gap-2">
              {project.stack.map((tech) => (
                <span key={tech} className="text-[10px] bg-[#1e1a14] text-text-faint px-2.5 py-1 rounded tracking-wide inline-block w-fit">{tech}</span>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-[10px] tracking-[2px] uppercase text-gold font-semibold mb-3">{project.badge}</p>
          <h3 className="font-display text-[24px] font-semibold text-text-bright mb-3">{project.name}</h3>
          <p className="text-[14px] text-text-muted leading-[1.75]">{project.description}</p>
          {project.link && (
            <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-gold/85 tracking-wide mt-3 block hover:text-gold transition-colors">
              {project.link.replace('https://', '')} ↗
            </a>
          )}
          {project.stack.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {project.stack.map((tech) => (
                <span key={tech} className="text-[10px] bg-[#1e1a14] text-text-faint px-2.5 py-1 rounded tracking-wide">{tech}</span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function AISystemsSection() {
  return (
    <section id="ai-systems" className="mt-24">
      <p className="text-[11px] tracking-[4px] uppercase text-text-faint font-semibold mb-2">AI Systems Shipped</p>
      <p className="text-[15px] text-text-muted mb-8 font-light">Production systems — not prototypes. Built while carrying full quota.</p>
      <div className="grid grid-cols-2 gap-3.5">
        {projects.map((p) => <ProjectCard key={p.name} project={p} />)}
      </div>
    </section>
  )
}
