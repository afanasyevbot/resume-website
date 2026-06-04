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
  const palettes = [
    { bg: 'rgba(212,178,120,0.18)', fg: '#d4b278' }, // gold
    { bg: 'rgba(184,138,120,0.20)', fg: '#c89e88' }, // copper
    { bg: 'rgba(154,180,138,0.16)', fg: '#a8c094' }, // sage
    { bg: 'rgba(180,160,200,0.16)', fg: '#b8a4c8' }, // muted lilac
    { bg: 'rgba(190,170,140,0.18)', fg: '#c8b89a' }, // sand
  ]
  return palettes[h % palettes.length]
}
