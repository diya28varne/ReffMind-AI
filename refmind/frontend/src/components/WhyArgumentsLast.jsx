import { useEffect, useState } from 'react'
import { ATMOSPHERE } from '../data/atmosphere'

const FACTOR_META = {
  rule_unclear: { short: 'Rule ambiguity' },
  truth_unknowable: { short: 'Indeterminacy' },
  referee_sightline: { short: 'Decision-time' },
  sides_want: { short: 'Cultural bias' },
}

/**
 * OFFSIDE-style disagreement engine with real stadium photos + 3D card moves.
 */
export default function WhyArgumentsLast({ anatomy, delay = 500 }) {
  const factors = anatomy?.factors || []
  const [step, setStep] = useState(-1)

  useEffect(() => {
    if (!factors.length) return undefined
    setStep(-1)
    const timers = []
    timers.push(setTimeout(() => setStep(0), delay + 200))
    factors.forEach((_, i) => {
      timers.push(setTimeout(() => setStep(i + 1), delay + 200 + (i + 1) * 750))
    })
    return () => timers.forEach(clearTimeout)
  }, [anatomy, delay, factors.length])

  if (!factors.length) return null

  const live = factors.filter((f) => f.active)
  const ruledOut = factors.filter((f) => !f.active)
  const scanning = step >= 0 && step < factors.length
  const done = step >= factors.length
  const current = scanning ? factors[step] : null

  return (
    <section
      className="animate-fade-up relative overflow-hidden rounded-2xl border border-accent-gold/40 bg-pitch-900"
      style={{ animationDelay: `${delay}ms` }}
      aria-labelledby="why-arguments-last-heading"
      data-gravity
    >
      {/* Stadium hero */}
      <div className="relative h-36 sm:h-44 overflow-hidden">
        <img
          src={ATMOSPHERE.hero}
          alt=""
          className="absolute inset-0 h-full w-full object-cover scale-105 stadium-ken-pan"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-pitch-900 via-pitch-900/70 to-pitch-900/25" />
        <div className="absolute inset-0 bg-gradient-to-r from-pitch-900/80 via-transparent to-pitch-900/40" />
        <div className="relative z-10 h-full flex flex-col justify-end p-5 sm:p-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-accent-gold font-semibold mb-1">
            Disagreement engine
          </p>
          <h3
            id="why-arguments-last-heading"
            className="font-display text-xl md:text-2xl font-bold text-white leading-snug drop-shadow-md"
          >
            Why this argument never ends
          </h3>
        </div>
      </div>

      <div className="p-5 sm:p-6 pt-4">
        <p className="text-sm text-gray-400 mb-3 leading-relaxed">
          {anatomy.headline || 'Break the call into the four reasons an argument lasts.'}
        </p>

        <p className="mb-5 text-xs font-medium min-h-[1.25rem] text-accent-gold/90" aria-live="polite">
          {scanning && current && (
            <span className="inline-flex items-center gap-2">
              <span className="reason-scan-dot" aria-hidden="true" />
              Diagnosing: {current.label}
            </span>
          )}
          {done && (
            <span>
              Engine complete — {live.length} live, {ruledOut.length} ruled out
            </span>
          )}
        </p>

        <div className="reason-3d-stage grid gap-4 sm:grid-cols-2">
          {factors.map((factor, i) => {
            const revealed = step > i
            const isScanning = step === i
            const meta = FACTOR_META[factor.id] || { short: 'Reason' }
            const photo = ATMOSPHERE.cards[factor.id] || ATMOSPHERE.hero

            return (
              <div key={factor.id} className="reason-3d-card-wrap">
                <article
                  className={`reason-3d-card rounded-xl border overflow-hidden ${
                    isScanning
                      ? 'is-scanning'
                      : revealed && factor.active
                        ? 'is-live'
                        : revealed && !factor.active
                          ? 'is-ruled-out'
                          : 'is-waiting'
                  }`}
                >
                  <div className="reason-3d-art relative h-28 overflow-hidden">
                    <img
                      src={photo}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                      aria-hidden="true"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-pitch-900 via-pitch-900/55 to-pitch-900/10" />
                    <p className="absolute bottom-2 left-3 text-[10px] uppercase tracking-widest text-accent-gold font-semibold drop-shadow">
                      {meta.short}
                    </p>
                    <span
                      className={`absolute top-2 right-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold ${
                        !revealed
                          ? 'bg-pitch-900/70 text-gray-500'
                          : factor.active
                            ? 'bg-accent-gold text-pitch-900'
                            : 'bg-pitch-900/80 text-gray-400'
                      }`}
                    >
                      {!revealed ? '…' : factor.verdict}
                    </span>
                  </div>

                  <div className="p-4 bg-pitch-900/85 backdrop-blur-sm">
                    <p className="text-sm font-semibold text-white leading-snug mb-1.5">{factor.label}</p>
                    <p
                      className={`text-xs leading-relaxed transition-opacity duration-400 ${
                        revealed ? 'text-gray-300 opacity-100' : 'text-gray-600 opacity-40'
                      }`}
                    >
                      {revealed ? factor.detail : 'Waiting for engine…'}
                    </p>
                  </div>
                </article>
              </div>
            )
          })}
        </div>

        <div
          className={`mt-5 flex flex-wrap gap-3 text-xs transition-opacity duration-500 ${
            done ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span className="rounded-lg border border-accent-gold/30 bg-accent-gold/5 px-3 py-1.5 text-accent-gold">
            {live.length} live reason{live.length === 1 ? '' : 's'}
          </span>
          <span className="rounded-lg border border-pitch-600 px-3 py-1.5 text-gray-500">
            {ruledOut.length} ruled out
          </span>
        </div>

        {anatomy.closing && (
          <p
            className={`mt-4 font-display text-base text-white/90 italic leading-snug transition-opacity duration-700 ${
              done ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {anatomy.closing}
          </p>
        )}
      </div>
    </section>
  )
}
