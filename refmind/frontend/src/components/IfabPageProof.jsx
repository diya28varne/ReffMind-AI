import { useEffect, useState } from 'react'
import { ATMOSPHERE } from '../data/atmosphere'

/**
 * Exact IFAB page proof with stadium atmosphere + 3D page flip.
 */
export default function IfabPageProof({ proof, delay = 350 }) {
  const [flipped, setFlipped] = useState(false)

  useEffect(() => {
    setFlipped(false)
    const t = setTimeout(() => setFlipped(true), delay + 280)
    return () => clearTimeout(t)
  }, [proof, delay])

  if (!proof?.excerpt) return null

  return (
    <section
      className="animate-fade-up relative overflow-hidden rounded-2xl border border-accent-gold/35 bg-pitch-900"
      style={{ animationDelay: `${delay}ms` }}
      aria-labelledby="ifab-page-heading"
      data-gravity
    >
      {/* Stadium backdrop */}
      <img
        src={ATMOSPHERE.ifab}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-25 scale-105"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-pitch-900/85 via-pitch-900/90 to-pitch-900" />
      <div className="absolute inset-y-0 left-0 w-1.5 bg-accent-gold z-10" aria-hidden="true" />

      <div className="relative z-10 p-6 pl-7">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-accent-gold font-semibold mb-1">
              Rulebook proof
            </p>
            <h3
              id="ifab-page-heading"
              className="font-display text-xl font-bold text-white leading-snug"
            >
              {proof.title || 'Proven against the Laws of the Game'}
            </h3>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-md">
              {proof.tagline || 'Every answer is checked against a real IFAB page — not invented.'}
            </p>
          </div>

          <div className="ifab-page-badge shrink-0 text-right rounded-xl border border-pitch-600 bg-pitch-900/80 px-4 py-3 min-w-[7.5rem] backdrop-blur-sm">
            <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold">Page</p>
            <p className="font-display text-3xl font-bold text-accent-gold leading-none mt-1">
              {proof.page}
            </p>
            <p className="text-xs text-gray-400 mt-1">{proof.law}</p>
          </div>
        </div>

        <div className="ifab-3d-stage">
          <div className={`ifab-3d-book ${flipped ? 'is-open' : ''}`}>
            <div className="ifab-3d-spine" aria-hidden="true" />

            <article className="ifab-3d-page relative rounded-r-lg rounded-l-sm border border-pitch-600/40 bg-[#f4f0e6] text-pitch-900 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-pitch-900/10 bg-[#ebe6d8]">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-pitch-900/60">
                  {proof.edition || 'IFAB Laws of the Game'}
                </p>
                <p className="text-[10px] font-semibold text-pitch-900/50">p. {proof.page}</p>
              </div>
              <div className="px-4 py-4 min-h-[7.5rem]">
                {proof.section && (
                  <p className="text-[11px] uppercase tracking-wider font-bold text-pitch-900/50 mb-2">
                    {proof.section}
                  </p>
                )}
                <p className="font-display text-sm md:text-base leading-relaxed text-pitch-900/90">
                  {proof.excerpt}
                </p>
              </div>
              <div className="px-4 py-2 border-t border-pitch-900/10 bg-[#ebe6d8] flex flex-wrap gap-2 items-center justify-between">
                <span className="text-[10px] font-semibold text-pitch-900/55">{proof.source}</span>
                <span className="text-[10px] text-pitch-900/40">{proof.retrieved_via}</span>
              </div>
              <div className="ifab-page-curl" aria-hidden="true" />
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
