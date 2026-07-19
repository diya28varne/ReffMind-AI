/**
 * Second-pass audit UI — every cited number must match grounded sources.
 */
export default function GuardianAudit({ audit, delay = 900 }) {
  if (!audit?.checks?.length) return null

  return (
    <section
      className="animate-fade-up rounded-xl border border-pitch-600 bg-pitch-800/90 p-6"
      style={{ animationDelay: `${delay}ms` }}
      aria-labelledby="guardian-audit-heading"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold mb-1">
            Second model
          </p>
          <h3 id="guardian-audit-heading" className="font-semibold text-lg text-accent-gold">
            {audit.model || 'Guardian audit'}
          </h3>
        </div>
        <span
          className={`shrink-0 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold border ${
            audit.passed
              ? 'border-accent-green/40 bg-accent-green/10 text-accent-green'
              : 'border-accent-red/40 bg-accent-red/10 text-accent-red'
          }`}
        >
          {audit.passed ? 'All clear' : 'Needs review'}
        </span>
      </div>

      <p className="text-sm text-gray-400 mb-4 leading-relaxed">
        {audit.tagline || 'A second pass checks every number so the first model cannot invent one.'}
      </p>

      <ul className="space-y-2">
        {audit.checks.map((check) => (
          <li
            key={check.id}
            className="flex items-start gap-3 rounded-lg border border-pitch-600/80 bg-pitch-900/50 px-3 py-2.5"
          >
            <span
              className={`mt-0.5 text-sm shrink-0 ${
                check.status === 'verified' ? 'text-accent-green' : 'text-accent-red'
              }`}
              aria-hidden="true"
            >
              {check.status === 'verified' ? '✓' : '!'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <p className="text-sm text-white font-medium">{check.label}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">{check.source}</p>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{check.claim}</p>
            </div>
          </li>
        ))}
      </ul>

      {audit.summary && (
        <p className="mt-4 text-xs text-gray-500 leading-relaxed border-t border-pitch-600 pt-3">
          {audit.summary}
        </p>
      )}
    </section>
  )
}
