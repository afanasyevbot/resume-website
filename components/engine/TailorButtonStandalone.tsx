'use client'

import TailorAction from './TailorAction'

/**
 * Client-side wrapper that lets a server component embed the "Tailor" button
 * without passing functions across the server/client boundary.
 * Use on the drilldown page when no package exists yet — there's no expand
 * state to coordinate, so the toggle is a no-op.
 */
export default function TailorButtonStandalone({ roleId }: { roleId: number }) {
  return (
    <TailorAction
      roleId={roleId}
      hasPackage={false}
      expanded={false}
      onToggleExpanded={() => {}}
    />
  )
}
