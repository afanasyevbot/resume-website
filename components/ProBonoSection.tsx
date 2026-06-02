import { professionalContext } from '@/lib/professionalContext'

const pb = professionalContext.proBono[0]
const pbHost = pb.link ? pb.link.replace(/^https?:\/\//, '') : ''

export default function ProBonoSection() {
  return (
    <section id="pro-bono" className="mt-24">
      <p className="text-[11px] tracking-[4px] uppercase text-text-faint font-semibold mb-2">Pro Bono</p>
      <p className="text-[15px] text-text-muted mb-8 font-light">Giving back. A full technology stack upgrade for a non-technical team.</p>

      <div className="bg-surface border border-border rounded-xl p-7 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, #c9a96e, transparent)' }} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-9">
          <div>
            <p className="text-[10px] tracking-[2px] uppercase text-gold font-semibold mb-3">Pro Bono · Consulting</p>
            <h3 className="font-display text-[24px] font-semibold text-text-bright mb-3">{pb.name}</h3>
            <p className="text-[14px] text-text-muted leading-[1.75]">{pb.description}</p>
            {pb.link && (
              <a
                href={pb.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-gold font-medium tracking-wide mt-3 block hover:text-gold/80 transition-colors"
              >
                {pbHost} ↗
              </a>
            )}
          </div>
          <div>
            <p className="text-[10px] tracking-[2px] uppercase text-text-ghost font-semibold mb-3">Scope</p>
            <div className="flex flex-col gap-2">
              {pb.stack.map((item) => (
                <span key={item} className="text-[10px] bg-[#1e1a14] text-text-faint px-2.5 py-1 rounded tracking-wide inline-block w-fit">{item}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
