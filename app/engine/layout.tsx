/**
 * Engine routes get their own "Night Desk" backdrop so the public site's
 * radial-gold gradient (rendered in the root layout) doesn't bleed through.
 * Deep ink canvas + fine instrument grid + a faint phosphor glow at the top
 * — built for a daily morning check-in, not a brochure.
 */
export default function EngineLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Opaque ink layer ABOVE the root gradient (z-0), BELOW content (z-10). */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          backgroundColor: '#0a0e14',
          backgroundImage:
            'linear-gradient(rgba(148,200,255,0.030) 1px, transparent 1px), linear-gradient(90deg, rgba(148,200,255,0.030) 1px, transparent 1px)',
          backgroundSize: '44px 44px',
          backgroundPosition: '-1px -1px',
        }}
      />
      {/* Phosphor wash from the top + vignette at the edges for depth. */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background:
            'radial-gradient(ellipse 90% 45% at 50% -10%, rgba(240,180,41,0.07) 0%, transparent 60%), radial-gradient(ellipse 90% 70% at 50% 55%, transparent 0%, rgba(0,0,0,0.38) 100%)',
        }}
      />
      {/* Content sits above the backdrop. .engine-ops re-tones every design
          token (colors + fonts) for the Night Desk theme — see globals.css. */}
      <div className="engine-ops relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </>
  )
}
