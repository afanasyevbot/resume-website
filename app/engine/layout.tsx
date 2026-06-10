export default function EngineLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Clean light backdrop — overrides the root site's dark gradient. */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: 1, backgroundColor: '#f8f9fb' }}
      />
      {/* Content sits above the backdrop. .engine-ops re-tones every design
          token (colors + fonts) for the Day Light theme — see globals.css. */}
      <div className="engine-ops relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </>
  )
}
