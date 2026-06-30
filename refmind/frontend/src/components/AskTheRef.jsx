import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { getAskRefStarters } from '../data/askRefStarters'

export default function AskTheRef({ incidentId, analysisContext, starters }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

  const promptStarters = starters?.length ? starters : getAskRefStarters(incidentId)

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
      const res = await api.askRef(incidentId, q, analysisContext)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.answer,
          confidence: res.confidence,
        },
      ])
    } catch (e) {
      setError(e.message || 'Unable to reach the assistant.')
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendQuestion(input)
  }

  return (
    <div className="animate-fade-up bg-pitch-800 border border-pitch-600 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-pitch-700/40 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-accent-gold/50"
        aria-expanded={open}
      >
        <div className="text-left">
          <p className="font-semibold text-accent-gold flex items-center gap-2">
            <span aria-hidden="true">🧑‍⚖️</span> Ask the Ref
          </p>
          <p className="text-sm text-gray-400">Still unsure? Ask the Ref.</p>
        </div>
        <span className="text-gray-500 text-xl" aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>

      {open && (
        <div className="border-t border-pitch-600 px-4 pb-4">
          <div
            ref={scrollRef}
            className="max-h-64 overflow-y-auto space-y-3 py-4 px-1"
            role="log"
            aria-live="polite"
            aria-label="Ask the Ref conversation"
          >
            {messages.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-2">
                Questions are scoped to this incident only — pick a prompt or type your own.
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent-gold/20 text-white rounded-br-sm'
                      : 'bg-pitch-900 text-gray-200 rounded-bl-sm border border-pitch-600'
                  }`}
                >
                  {msg.text}
                  {msg.confidence != null && (
                    <span className="inline-flex items-center mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-pitch-700 text-accent-gold border border-accent-gold/30">
                      {Math.round(msg.confidence * 100)}% confidence
                    </span>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-pitch-900 border border-pitch-600 rounded-2xl rounded-bl-sm px-4 py-3">
                  <span className="flex gap-1" aria-label="Assistant is typing">
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-accent-red mb-3 px-1" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-3">
            {promptStarters.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => sendQuestion(s)}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-full border border-pitch-600 text-gray-400 hover:border-accent-gold/50 hover:text-accent-gold transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent-gold/50"
              >
                {s}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this decision…"
              disabled={loading}
              className="flex-1 bg-pitch-900 border border-pitch-600 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-gold/50"
              aria-label="Your question about this incident"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-4 py-2.5 rounded-xl bg-accent-gold text-pitch-900 font-semibold text-sm hover:bg-yellow-400 transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent-gold/50"
            >
              Ask
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
