const columns = [
  {
    label: 'Deep Expertise',
    colorClass: 'text-gold',
    items: [
      'Full-cycle B2B SaaS sales',
      'Consultative discovery & ROI modeling',
      'AI systems (Claude API, agents, RAG)',
      'Pipeline building from zero',
      'C-suite multi-stakeholder cycles',
    ],
    itemClass: 'text-text-secondary',
  },
  {
    label: 'Conversant',
    colorClass: 'text-text-dim',
    items: [
      'Revenue operations & GTM strategy',
      'Data infrastructure (Supabase, Postgres)',
      'Product positioning & messaging',
      'CRM analytics (Salesforce, Power BI)',
    ],
    itemClass: 'text-text-dim',
  },
  {
    label: 'Not My Zone',
    colorClass: 'text-text-whisper',
    items: [
      'Enterprise (100K+ seat) deal cycles',
      'Pure backend / infrastructure engineering',
      'Channel / partner sales motion',
      'Inbound-led or PLG sales models',
    ],
    itemClass: 'text-text-ghost italic',
  },
]

export default function SkillsMatrix() {
  return (
    <section id="skills" className="mt-24">
      <p className="text-[11px] tracking-[4px] uppercase text-text-faint font-semibold mb-8">Radical Transparency · Skills</p>
      <div className="grid grid-cols-3 gap-8">
        {columns.map((col) => (
          <div key={col.label}>
            <p className={`text-[11px] tracking-[3px] uppercase font-semibold mb-4 ${col.colorClass}`}>{col.label}</p>
            {col.items.map((item) => (
              <p key={item} className={`text-[14px] py-2.5 border-b border-surface leading-snug ${col.itemClass}`}>{item}</p>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
