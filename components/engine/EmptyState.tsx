interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  subtitle?: string
}

export default function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-14 px-6 text-center"
      style={{ color: 'var(--color-text-ghost)', fontFamily: 'var(--font-sans)' }}
    >
      {icon && (
        <div className="mb-4 opacity-40" aria-hidden="true">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium" style={{ color: 'var(--color-text-faint)' }}>
        {title}
      </p>
      {subtitle && (
        <p className="text-[12px] mt-1.5 max-w-[260px] leading-relaxed" style={{ color: 'var(--color-text-ghost)' }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
