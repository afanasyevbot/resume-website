/**
 * Engine routes get their own flat backdrop so the public site's
 * radial-gold gradient (rendered in the root layout) doesn't fight the
 * dashboard's data-density. A subtle grid pattern adds quiet cockpit
 * texture without competing with the data.
 */
export default function EngineLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Opaque layer that sits ABOVE the root gradient (z-0) and BELOW
          the page content (z-10). Suppresses the gold glow on /engine. */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 1,
          // Moss-tinted dark — lifts off the near-black warm without going
          // light. Slight green undertone for a different mood from the
          // public resume site's gold-warm glow.
          backgroundColor: '#1c2a1f',
          backgroundImage:
            'linear-gradient(rgba(154,180,138,0.030) 1px, transparent 1px), linear-gradient(90deg, rgba(154,180,138,0.030) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          backgroundPosition: '-1px -1px',
        }}
      />
      {/* Soft vignette to the edges so the page doesn't feel like a flat slab */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background:
            'radial-gradient(ellipse 90% 70% at 50% 50%, transparent 0%, rgba(0,0,0,0.30) 100%)',
        }}
      />
      {/* Content must sit ABOVE the backdrop layers in this local stacking context.
          .engine-cream re-tones the dark theme: warmer surfaces, brighter
          labels, and a cream highlight on the top edge of every .vellum card. */}
      <div className="engine-cream relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </>
  )
}
