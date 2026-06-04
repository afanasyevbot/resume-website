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
          backgroundColor: '#15110c',
          backgroundImage:
            'linear-gradient(rgba(212,178,120,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(212,178,120,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          backgroundPosition: '-1px -1px',
        }}
      />
      {/* Subtle vignette at the edges so the page doesn't feel like a flat slab */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 2,
          background:
            'radial-gradient(ellipse 90% 70% at 50% 50%, transparent 0%, rgba(0,0,0,0.35) 100%)',
        }}
      />
      {children}
    </>
  )
}
