import { useState } from 'react'

const TABS = [
  { id: 'google_search', label: 'Google Search' },
  { id: 'second_opinion', label: 'Second opinion' },
  { id: 'url_context', label: 'URL context' },
]

/**
 * Google tools panel — interactive tabs for Search / Second opinion / URL context.
 */
export default function GeminiToolsPanel({ tools, delay = 950 }) {
  const [tab, setTab] = useState('google_search')

  if (!tools) return null

  const searchResults = tools.google_search?.results || []
  const opinion =
    typeof tools.second_opinion === 'string'
      ? tools.second_opinion
      : tools.second_opinion?.text
  const urlNote = tools.url_context?.note
  const urlLinks = tools.url_context?.links || []

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

      {/* Real switchable tabs */}
      <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label="Google tools">
        {TABS.map((t) => {
          const active = tab === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-full border font-semibold transition-colors ${
                active
                  ? 'border-sky-400 bg-sky-500/25 text-sky-200'
                  : 'border-sky-500/30 bg-sky-500/5 text-sky-400/70 hover:bg-sky-500/15 hover:text-sky-300'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {tab === 'google_search' && (
        <div role="tabpanel">
          {searchResults.length === 0 ? (
            <p className="text-sm text-gray-500">No search results for this incident yet.</p>
          ) : (
            <ul className="space-y-2">
              {searchResults.map((hit, i) => (
                <li
                  key={`${hit.title}-${i}`}
                  className="rounded-lg border border-pitch-600/80 bg-pitch-900/50 px-3 py-2.5"
                >
                  <p className="text-sm text-white font-medium">{hit.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{hit.snippet}</p>
                  {hit.url ? (
                    <a
                      href={hit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[10px] uppercase tracking-wider text-sky-400 mt-1.5 hover:text-sky-300 underline underline-offset-2"
                    >
                      {(hit.source || 'Open source')} ↗
                    </a>
                  ) : (
                    hit.source && (
                      <p className="text-[10px] uppercase tracking-wider text-sky-400/80 mt-1">
                        {hit.source}
                      </p>
                    )
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'second_opinion' && (
        <div role="tabpanel" className="rounded-lg border border-sky-500/20 bg-sky-500/5 px-4 py-3">
          {opinion ? (
            <p className="text-sm text-gray-300 leading-relaxed">{opinion}</p>
          ) : (
            <p className="text-sm text-gray-500">No second opinion available.</p>
          )}
        </div>
      )}

      {tab === 'url_context' && (
        <div role="tabpanel" className="space-y-3">
          {urlNote && <p className="text-sm text-gray-300 leading-relaxed">{urlNote}</p>}
          {urlLinks.length > 0 ? (
            <ul className="space-y-2">
              {urlLinks.map((link) => (
                <li key={link.url}>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-pitch-600/80 bg-pitch-900/50 px-3 py-2.5 hover:border-sky-500/40 transition-colors"
                  >
                    <p className="text-sm text-sky-300 font-medium">{link.title} ↗</p>
                    {link.note && (
                      <p className="text-xs text-gray-500 mt-0.5">{link.note}</p>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            !urlNote && <p className="text-sm text-gray-500">No URL context links yet.</p>
          )}
          {tools.demo_mode && (
            <p className="text-[11px] text-gray-500 leading-relaxed border-t border-pitch-700 pt-3">
              Demo mode shows curated links. Add <code className="text-sky-400/90">GEMINI_API_KEY</code> on
              Vercel and set <code className="text-sky-400/90">DEMO_MODE=false</code> for live Search.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
