import { professionalContext } from '@/lib/professionalContext'
import type { Project } from '@/lib/types'

const projects = professionalContext.projects

function ProjectCard({ project, isWide }: { project: Project; isWide: boolean }) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-7 relative overflow-hidden ${isWide ? 'sm:col-span-2' : ''}`}>
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, #c9a96e, transparent)' }} />

      {isWide ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-9">
          <div>
            <p className="text-[10px] tracking-[2px] uppercase text-gold font-semibold mb-3">{project.badge}</p>
            <h3 className="font-display text-[24px] font-semibold text-text-bright mb-3">{project.name}</h3>
            <p className="text-[14px] text-text-muted leading-[1.75]">{project.description}</p>
            {project.link && (
              <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-[13px] text-gold font-medium tracking-wide mt-3 block hover:text-gold/80 transition-colors">
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
            <a href={project.link} target="_blank" rel="noopener noreferrer" className="text-[13px] text-gold font-medium tracking-wide mt-3 block hover:text-gold/80 transition-colors">
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
      <p className="text-[11px] tracking-[4px] uppercase text-text-faint font-semibold mb-2">AI Systems Built</p>
      <p className="text-[15px] text-text-muted mb-8 font-light">Production systems, not prototypes. Built while carrying full quota.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {projects.map((p, i) => <ProjectCard key={p.name} project={p} isWide={i === 0} />)}
      </div>
    </section>
  )
}
