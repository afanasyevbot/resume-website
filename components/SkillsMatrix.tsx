import { professionalContext } from '@/lib/professionalContext'

const { deep, conversant, notMyZone } = professionalContext.skills

const columns = [
  {
    label: 'Deep Expertise',
    colorClass: 'text-gold',
    items: deep,
    itemClass: 'text-text-secondary',
  },
  {
    label: 'Conversant',
    colorClass: 'text-text-dim',
    items: conversant,
    itemClass: 'text-text-dim',
  },
  {
    label: 'Not My Zone',
    colorClass: 'text-text-whisper',
    items: notMyZone,
    itemClass: 'text-text-ghost italic',
  },
]

export default function SkillsMatrix() {
  return (
    <section id="skills" className="mt-24">
      <p className="text-[11px] tracking-[4px] uppercase text-text-faint font-semibold mb-8">Radical Transparency · Skills</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
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
