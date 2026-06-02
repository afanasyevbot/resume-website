'use client'

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="text-gold border border-gold/50 px-5 py-2.5 rounded text-[13px] font-semibold tracking-wide hover:bg-gold/5 transition-colors"
    >
      Download / Print →
    </button>
  )
}
