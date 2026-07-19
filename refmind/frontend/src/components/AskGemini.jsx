import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

const STARTERS = [
  'Why do fans still argue about this?',
  'What did the referee miss live?',
  'Summarise the public controversy in one line',
]

/**
 * Ask Gemini — separate from Ask the Ref (IBM / IFAB-scoped).
 */
export default function AskGemini({ incidentId, analysisContext }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    setMessages([])
    setInput('')
    setError(null)
    setOpen(false)
  }, [incidentId])

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }, [])

  const sendQuestion = async (question) => {
    const q = question.trim()
    if (!q || loading) return
    setError(null)
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', text: q }])
    setLoading(true)
    scrollToBottom()
    try {
      const res = await api.askGemini(incidentId, q, analysisContext)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.answer, demo: res.demo_mode },
      ])
    } catch (e) {
      setError(e.message || 'Gemini unavailable')
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  return (
    <div
      className="animate-fade-up bg-pitch-800 border border-sky-500/30 rounded-2xl overflow-hidden"
      data-gravity
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-pitch-700/40 transition-colors"
        aria-expanded={open}
      >
        <div className="text-left">
          <p className="font-semibold text-sky-300">Ask Gemini</p>
          <p className="text-sm text-gray-400">Public web + controversy chat (Google)</p>
        </div>
        <span className="text-gray-500 text-xl">{open ? '−' : '+'}</span>
      </button>

      {open && (
        <div className="px-6 pb-5 border-t border-pitch-700">
          <div className="flex flex-wrap gap-2 py-3">
            {STARTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendQuestion(s)}
                className="text-xs px-2.5 py-1 rounded-full border border-sky-500/30 text-sky-300 hover:bg-sky-500/10"
              >
                {s}
              </button>
            ))}
          </div>
          <div
            ref={scrollRef}
            className="max-h-56 overflow-y-auto space-y-3 mb-3 pr-1"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-sm rounded-lg px-3 py-2 ${
                  m.role === 'user'
                    ? 'bg-sky-500/15 text-sky-100 ml-6'
                    : 'bg-pitch-900 text-gray-300 mr-6'
                }`}
              >
                {m.text}
              </div>
            ))}
            {loading && <p className="text-xs text-gray-500">Gemini is thinking…</p>}
          </div>
          {error && <p className="text-sm text-accent-red mb-2">{error}</p>}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendQuestion(input)
            }}
            className="flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Gemini about this moment…"
              className="flex-1 rounded-lg border border-pitch-600 bg-pitch-900 px-3 py-2 text-sm text-white"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2 rounded-lg bg-sky-500 text-pitch-900 font-semibold text-sm disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
