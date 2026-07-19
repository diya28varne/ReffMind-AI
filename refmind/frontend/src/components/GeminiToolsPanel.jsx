/**
 * Google tools panel — Search + second opinion + URL context.
 */
export default function GeminiToolsPanel({ tools, delay = 950 }) {
  if (!tools) return null

  const searchResults = tools.google_search?.results || []
  const opinion =
    typeof tools.second_opinion === 'string'
      ? tools.second_opinion
      : tools.second_opinion?.text

  return (
    <section
      className="animate-fade-up rounded-xl border border-sky-500/30 bg-pitch-800/90 p-6"
      style={{ animationDelay: `${delay}ms` }}
      aria-labelledby="gemini-tools-heading"
      data-gravity
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-sky-400 font-semibold mb-1">
            Google tools
          </p>
          <h3 id="gemini-tools-heading" className="font-semibold text-lg text-sky-300">
            {tools.provider || 'Google Gemini'}
          </h3>
        </div>
        <span
          className={`shrink-0 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold border ${
            tools.demo_mode
              ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
              : 'border-accent-green/40 bg-accent-green/10 text-accent-green'
          }`}
        >
          {tools.demo_mode ? 'Demo' : 'Live'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(tools.tools_used || ['google_search', 'second_opinion', 'url_context']).map((t) => (
          <span
            key={t}
            className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-sky-500/30 bg-sky-500/5 text-sky-300 font-semibold"
          >
            {t.replace(/_/g, ' ')}
          </span>
        ))}
      </div>

      {searchResults.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-widest text-gray-500 font-semibold mb-2">
            {tools.google_search?.label || 'Google Search'}
          </p>
          <ul className="space-y-2">
            {searchResults.map((hit, i) => (
              <li
                key={`${hit.title}-${i}`}
                className="rounded-lg border border-pitch-600/80 bg-pitch-900/50 px-3 py-2.5"
              >
                <p className="text-sm text-white font-medium">{hit.title}</p>
                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{hit.snippet}</p>
                {hit.source && (
                  <p className="text-[10px] uppercase tracking-wider text-sky-400/80 mt-1">
                    {hit.source}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {opinion && (
        <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3 mb-3">
          <p className="text-[10px] uppercase tracking-widest text-sky-400 font-semibold mb-1">
            {tools.second_opinion?.label || 'Second opinion'}
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">{opinion}</p>
        </div>
      )}

      {tools.url_context?.note && (
        <p className="text-[11px] text-gray-500 leading-relaxed">
          <span className="text-sky-400/80 font-semibold uppercase tracking-wider text-[10px]">
            {tools.url_context.label || 'URL context'} ·{' '}
          </span>
          {tools.url_context.note}
        </p>
      )}
    </section>
  )
}
