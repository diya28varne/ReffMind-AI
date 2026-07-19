/**
 * Signature frame from the disagreement engine:
 * four reasons an argument lasts — rule / truth / sightline / sides.
 */
export default function WhyArgumentsLast({ anatomy, delay = 500 }) {
  if (!anatomy?.factors?.length) return null

  const live = anatomy.factors.filter((f) => f.active)
  const ruledOut = anatomy.factors.filter((f) => !f.active)

  return (
    <section
      className="animate-fade-up relative overflow-hidden rounded-2xl border border-accent-gold/40 bg-gradient-to-br from-pitch-800 via-pitch-800 to-pitch-900 p-6"
      style={{ animationDelay: `${delay}ms` }}
      aria-labelledby="why-arguments-last-heading"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent-gold/10 blur-2xl"
        aria-hidden="true"
      />

      <p className="text-[10px] uppercase tracking-[0.2em] text-accent-gold font-semibold mb-2">
        Disagreement engine
      </p>
      <h3
        id="why-arguments-last-heading"
        className="font-display text-xl md:text-2xl font-bold text-white leading-snug mb-2"
      >
        Why this argument never ends
      </h3>
      <p className="text-sm text-gray-400 mb-5 leading-relaxed">
        {anatomy.headline || 'Break the call into the four reasons an argument lasts.'}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {anatomy.factors.map((factor, i) => (
          <article
            key={factor.id}
            className={`rounded-xl border p-4 transition-transform duration-500 ${
              factor.active
                ? 'border-accent-gold/50 bg-accent-gold/10 shadow-[0_0_24px_rgba(245,197,66,0.08)]'
                : 'border-pitch-600/80 bg-pitch-900/40 opacity-75'
            }`}
            style={{ animationDelay: `${delay + i * 80}ms` }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm font-semibold text-white leading-snug">{factor.label}</p>
              <span
                className={`shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold ${
                  factor.active
                    ? 'bg-accent-gold text-pitch-900'
                    : 'bg-pitch-700 text-gray-400'
                }`}
              >
                {factor.verdict}
              </span>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed">{factor.detail}</p>
          </article>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-xs">
        <span className="rounded-lg border border-accent-gold/30 bg-accent-gold/5 px-3 py-1.5 text-accent-gold">
          {live.length} live reason{live.length === 1 ? '' : 's'}
        </span>
        <span className="rounded-lg border border-pitch-600 px-3 py-1.5 text-gray-500">
          {ruledOut.length} ruled out
        </span>
      </div>

      {anatomy.closing && (
        <p className="mt-4 font-display text-base text-white/90 italic leading-snug">
          {anatomy.closing}
        </p>
      )}
    </section>
  )
}
