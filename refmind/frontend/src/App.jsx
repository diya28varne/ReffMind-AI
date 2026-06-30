import { useCallback, useEffect, useState } from 'react'
import { api } from './api/client'
import ProgressBar from './components/ProgressBar'
import OpeningQuote from './components/OpeningQuote'
import FutureScope from './components/FutureScope'
import RevealScreen from './components/RevealScreen'
import VotingScreen from './components/VotingScreen'
import { computeTrustStats } from './utils/trustSession'

const PHASE = { LOADING: 'loading', VOTE: 'vote', REVEAL: 'reveal', ERROR: 'error' }

export default function App() {
  const [incidents, setIncidents] = useState([])
  const [index, setIndex] = useState(0)
  const [phase, setPhase] = useState(PHASE.LOADING)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [voting, setVoting] = useState(false)
  const [trustStats, setTrustStats] = useState(() => computeTrustStats())

  useEffect(() => {
    api
      .getIncidents()
      .then((list) => {
        setIncidents(list)
        const params = new URLSearchParams(window.location.search)
        const demoId = params.get('demo')
        if (demoId) {
          const idx = list.findIndex((i) => i.id === demoId)
          if (idx >= 0) setIndex(idx)
        }
      })
      .catch((e) => {
        setError(e.message)
        setPhase(PHASE.ERROR)
      })
      .finally(() => setPhase((p) => (p === PHASE.LOADING ? PHASE.VOTE : p)))
  }, [])

  const incident = incidents[index]

  const handleVote = useCallback(
    async (userVote) => {
      if (!incident) return
      setVoting(true)
      try {
        const analysis = await api.analyze(incident.id, userVote)
        setResult(analysis)
        setPhase(PHASE.REVEAL)
      } catch (e) {
        setError(e.message)
        setPhase(PHASE.ERROR)
      } finally {
        setVoting(false)
      }
    },
    [incident],
  )

  const handleRestart = () => {
    setResult(null)
    setPhase(PHASE.VOTE)
  }

  const handleNext = () => {
    setResult(null)
    setIndex((i) => (i + 1) % incidents.length)
    setPhase(PHASE.VOTE)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pitch-900 via-pitch-800 to-pitch-900">
      <header className="border-b border-pitch-700 bg-pitch-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight">
              Ref<span className="text-accent-gold">Mind</span>
            </h1>
            <p className="text-xs text-gray-500 italic">
              Don't just watch the match. Understand the moment.
            </p>
          </div>
          {incidents.length > 0 && (
            <div className="text-right">
              <span className="text-xs text-gray-500 block">
                {index + 1} / {incidents.length}
              </span>
              {trustStats.count > 0 && (
                <span className="text-[10px] text-accent-gold">
                  Trust {trustStats.currentAvg.toFixed(1)}/5
                </span>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {phase === PHASE.LOADING && (
          <div className="text-center py-20 text-gray-400">Loading incidents…</div>
        )}

        {phase === PHASE.ERROR && (
          <div className="text-center py-20 space-y-4">
            <p className="text-accent-red">{error}</p>
            {window.location.hostname === 'localhost' ? (
              <p className="text-gray-500 text-sm">
                Local mode: run <code className="text-gray-400">refmind\scripts\start-demo.cmd</code> (backend
                8001 + frontend 5173).
              </p>
            ) : (
              <p className="text-gray-500 text-sm">Try refreshing the page.</p>
            )}
            <a
              href="https://hands-on-labs.vercel.app/?demo=wc2022-montiel-handball"
              className="inline-block text-accent-gold underline text-sm"
            >
              Open always-on live demo →
            </a>
          </div>
        )}

        {incident && phase !== PHASE.LOADING && phase !== PHASE.ERROR && (
          <>
            {phase === PHASE.VOTE && <OpeningQuote />}
            <ProgressBar incidentIndex={index} totalIncidents={incidents.length} />

            {phase === PHASE.VOTE && (
              <VotingScreen incident={incident} onVote={handleVote} loading={voting} />
            )}

            {phase === PHASE.REVEAL && result && (
              <RevealScreen
                result={result}
                onNext={handleNext}
                onRestart={handleRestart}
                hasNext={incidents.length > 1}
                onTrustUpdate={setTrustStats}
              />
            )}

            {phase === PHASE.VOTE && index === 0 && <FutureScope />}
          </>
        )}
      </main>

      <footer className="text-center py-8 text-xs text-gray-400">
        IBM Granite · Docling · LangChain · Chroma
      </footer>
    </div>
  )
}
