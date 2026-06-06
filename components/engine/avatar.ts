/**
 * Shared avatar helpers — used by RoleCard and ReminderItem so cards and
 * follow-up rows tint the same company the same way.
 */

/** Two-letter avatar from the company name. */
export function avatarLetters(company: string): string {
  const parts = company.trim().split(/\s+/)
  if (parts.length === 0) return '??'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

/** Deterministic warm-palette tint per company. */
export function avatarTint(company: string): { bg: string; fg: string } {
  // Simple hash → choose from a small warm palette
  let h = 0
  for (let i = 0; i < company.length; i++) h = (h * 31 + company.charCodeAt(i)) >>> 0
  // Tints for cream paper: soft light bg, darker saturated letters.
  const palettes = [
    { bg: 'rgba(184,134,42,0.16)',  fg: '#8a6310' }, // gold
    { bg: 'rgba(168,86,60,0.15)',   fg: '#9a5238' }, // copper
    { bg: 'rgba(79,128,56,0.15)',   fg: '#3f6a2c' }, // sage
    { bg: 'rgba(110,90,150,0.15)',  fg: '#5e4a82' }, // muted indigo
    { bg: 'rgba(150,120,70,0.16)',  fg: '#705430' }, // sand
  ]
  return palettes[h % palettes.length]
}
