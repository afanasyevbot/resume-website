export default function EngineLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Warm editorial backdrop — overrides the root site's dark gradient.
          A soft amber wash up top gives the canvas depth without noise. */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          background:
            'radial-gradient(ellipse 90% 50% at 50% -8%, rgba(180,83,9,0.05) 0%, transparent 60%), #faf8f5',
        }}
      />
      {/* Content sits above the backdrop. .engine-ops re-tones every design
          token (colors + fonts) for the Day Light theme — see globals.css. */}
      <div className="engine-ops relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </>
  )
}
