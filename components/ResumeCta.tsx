import Image from 'next/image'

export default function ResumeCta() {
  return (
    <a href="/resume" className="btn-ghost">
      <Image src="/icons/document.svg" alt="" aria-hidden width={16} height={16} />
      Résumé
    </a>
  )
}
