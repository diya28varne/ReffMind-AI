import { useState } from 'react'
import { api } from '../api/client'
import WhyArgumentsLast from './WhyArgumentsLast'

/**
 * Bring-your-own controversy — paste facts + two opposing quotes,
 * get a live four-reason disagreement breakdown.
 */
export default function BringYourOwnControversy() {
  const [facts, setFacts] = useState('')
  const [sideA, setSideA] = useState('')
  const [sideB, setSideB] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const canSubmit = facts.trim().length >= 20 && sideA.trim() && sideB.trim()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit || loading) return
    setLoading(true)
    setError(null)
    try {
      const data = await api.analyzeControversy({
        facts: facts.trim(),
        side_a: sideA.trim(),
        side_b: sideB.trim(),
      })
      setResult(data)
    } catch (err) {
      setError(err.message || 'Could not decompose this controversy')
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setResult(null)
    setError(null)
  }

  return (
    <section
      className="mt-8 animate-fade-up rounded-2xl border border-dashed border-accent-gold/35 bg-pitch-800/50 overflow-hidden"
      aria-labelledby="byo-heading"
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-accent-gold font-semibold mb-1">
            Standout feature
          </p>
          <h3 id="byo-heading" className="font-display text-lg font-bold text-white">
            Bring your own controversy
          </h3>
        </div>
        <span className="shrink-0 text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border border-accent-gold/40 bg-accent-gold/10 text-accent-gold font-semibold">
          Live
        </span>
      </div>

      <p className="px-5 text-sm text-gray-400 leading-relaxed mb-4">
        Give it the facts and two opposing quotes — RefMind decomposes why the room cannot agree.
      </p>

      {!result ? (
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3">
          <label className="block">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
              What happened
            </span>
            <textarea
              value={facts}
              onChange={(e) => setFacts(e.target.value)}
              rows={3}
              placeholder="e.g. 89th minute, box scramble, ball strikes an arm, penalty given…"
              className="mt-1 w-full rounded-lg border border-pitch-600 bg-pitch-900/70 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-gold/50 resize-y min-h-[80px]"
            />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Side A quote
              </span>
              <input
                type="text"
                value={sideA}
                onChange={(e) => setSideA(e.target.value)}
                placeholder="“Clear penalty — arm made the body bigger.”"
                className="mt-1 w-full rounded-lg border border-pitch-600 bg-pitch-900/70 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-gold/50"
              />
            </label>
            <label className="block">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                Side B quote
              </span>
              <input
                type="text"
                value={sideB}
                onChange={(e) => setSideB(e.target.value)}
                placeholder="“Ball to hand — natural position at that pace.”"
                className="mt-1 w-full rounded-lg border border-pitch-600 bg-pitch-900/70 px-3 py-2.5 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-accent-gold/50"
              />
            </label>
          </div>

          {error && <p className="text-sm text-accent-red">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-3 rounded-xl bg-accent-gold text-pitch-900 font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Decomposing argument…' : 'Decompose why they disagree →'}
          </button>
        </form>
      ) : (
        <div className="px-5 pb-5 space-y-4">
          {result.summary && (
            <p className="text-sm text-gray-300 leading-relaxed border-l-2 border-accent-gold/50 pl-3">
              {result.summary}
            </p>
          )}
          <WhyArgumentsLast anatomy={result.argument_anatomy} delay={0} />
          <button
            type="button"
            onClick={handleReset}
            className="w-full py-2.5 rounded-lg border border-pitch-600 text-sm text-gray-300 hover:border-accent-gold/50 hover:text-accent-gold transition-colors"
          >
            Try another controversy
          </button>
        </div>
      )}
    </section>
  )
}
