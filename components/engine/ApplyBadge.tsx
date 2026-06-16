import { applyMethodBucket, APPLY_BUCKET_META } from '@/lib/engine/applyMethod'

/**
 * Small badge showing HOW a role was applied: the engine on its own
 * (autonomous), the engine after Matthew's OK (approved), or Matthew by hand
 * (self). Reads the raw method and buckets it via the shared classifier.
 */
export default function ApplyBadge({ method }: { method: string | null }) {
  const meta = APPLY_BUCKET_META[applyMethodBucket(method)]
  return (
    <span
      title={meta.hint}
      className="inline-flex items-center gap-1.5 text-[11px]"
      style={{ fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)' }}
    >
      <span
        style={{ width: 7, height: 7, borderRadius: 999, background: meta.color, display: 'inline-block' }}
        aria-hidden
      />
      {meta.label}
    </span>
  )
}
