/**
 * Horizontal step indicator showing the "agent's fingerprints" on a role:
 *   Sourced ─── Scored ─── Tailored · · · Applied · · · Response
 *
 * Solid line = step completed by the agent (or by Matthew).
 * Dotted line = step still ahead.
 *
 * Per-step authorship is labeled visually: agent-driven steps get a small
 * gold dot, human-driven steps a cream dot, so the automation is visible.
 */

type Step = 'sourced' | 'scored' | 'tailored' | 'applied' | 'response'

interface AgentTrailProps {
  /** Current role.status from the DB. */
  status: string
  /** Whether an application_packages row exists. */
  hasPackage: boolean
  /** Source provider (greenhouse/ashby/manual/email/research) — used to set sourced auth. */
  source: string | null
}

interface StepState {
  key: Step
  label: string
  done: boolean
  author: 'agent' | 'human' | null
}

function statesFor(props: AgentTrailProps): StepState[] {
  const { status, hasPackage, source } = props
  const s = status.toLowerCase()

  // Map status into a position on the trail.
  const reachedScored = s !== 'sourced'
  const reachedTailored = hasPackage || ['tailored', 'queued', 'applied', 'responded', 'interviewing', 'offer', 'rejected'].includes(s)
  const reachedApplied = ['applied', 'responded', 'interviewing', 'offer', 'rejected'].includes(s)
  const reachedResponse = ['responded', 'interviewing', 'offer', 'rejected'].includes(s)

  // Historical = a past application Matthew did manually before the engine; every
  // step was human, so don't paint agent fingerprints on work the engine never did.
  const isHistorical = source === 'historical'

  // Author: greenhouse/ashby/email/research = agent; manual/historical = Matthew.
  const sourcedAuthor: 'agent' | 'human' =
    !isHistorical && source && source !== 'manual' ? 'agent' : 'human'
  const pipelineAuthor: 'agent' | 'human' = isHistorical ? 'human' : 'agent'

  // Tailoring is agent-driven for engine roles (Claude does it), human for historical.
  // Applying is Matthew today (Phase 1); flips to "agent" for engine auto-applies.
  return [
    { key: 'sourced', label: 'Sourced', done: true, author: sourcedAuthor },
    { key: 'scored', label: 'Scored', done: reachedScored, author: reachedScored ? pipelineAuthor : null },
    { key: 'tailored', label: 'Tailored', done: reachedTailored, author: reachedTailored ? pipelineAuthor : null },
    { key: 'applied', label: 'Applied', done: reachedApplied, author: reachedApplied ? 'human' : null },
    { key: 'response', label: 'Response', done: reachedResponse, author: reachedResponse ? null : null },
  ]
}

function dotColor(step: StepState): string {
  if (!step.done) return 'var(--color-text-whisper)'
  if (step.author === 'agent') return 'var(--color-gold)'
  if (step.author === 'human') return 'var(--color-text-bright)'
  return 'var(--color-text-faint)'
}

export default function AgentTrail(props: AgentTrailProps) {
  const steps = statesFor(props)

  return (
    <div className="flex items-center w-full">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1
        const nextDone = !isLast && steps[i + 1].done

        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-initial">
            {/* Dot + label stack */}
            <div className="flex flex-col items-center gap-1 min-w-0">
              <span
                aria-hidden
                className="inline-block rounded-full"
                style={{
                  width: step.done ? 7 : 5,
                  height: step.done ? 7 : 5,
                  backgroundColor: dotColor(step),
                  boxShadow: step.done && step.author === 'agent'
                    ? `0 0 4px var(--color-gold-dim)`
                    : 'none',
                }}
              />
              <span
                className="text-[9px] uppercase tracking-wider whitespace-nowrap"
                style={{
                  color: step.done
                    ? 'var(--color-text-secondary)'
                    : 'var(--color-text-ghost)',
                  fontFamily: 'var(--font-sans)',
                  letterSpacing: '0.10em',
                }}
              >
                {step.label}
              </span>
            </div>
            {/* Connector to next step */}
            {!isLast && (
              <div
                aria-hidden
                className="flex-1 mx-1.5"
                style={{
                  height: 1,
                  marginBottom: 16, // align with dot, not label
                  borderTop: nextDone
                    ? '1px solid var(--color-border-inner)'
                    : '1px dashed var(--color-text-whisper)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
