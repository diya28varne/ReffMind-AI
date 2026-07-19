import { useState } from 'react'
import { api } from '../api/client'
import { useSpeech } from '../context/SpeechContext'

const LANGS = [
  { id: 'en', label: 'EN' },
  { id: 'es', label: 'ES' },
  { id: 'hi', label: 'HI' },
  { id: 'pt', label: 'PT' },
  { id: 'fr', label: 'FR' },
]

/**
 * Google Translate bar — flips key explainability text + TTS language.
 * Works with Gemini when keyed; otherwise free public translate fallback.
 */
export default function TranslateBar({ texts = {}, onTranslated }) {
  const [lang, setLang] = useState('en')
  const [loading, setLoading] = useState(false)
  const [note, setNote] = useState(null)
  const { setSpeechLang } = useSpeech()

  const applyLang = async (next) => {
    setLang(next)
    setSpeechLang?.(next)
    if (next === 'en') {
      setNote(null)
      onTranslated?.(null)
      return
    }
    setLoading(true)
    setNote(null)
    try {
      const entries = Object.entries(texts).filter(([, v]) => typeof v === 'string' && v.trim())
      if (!entries.length) {
        setNote('Nothing to translate on this screen yet.')
        return
      }
      const out = {}
      let provider = null
      let failedNote = null
      for (const [key, value] of entries) {
        const res = await api.translate(value, next)
        out[key] = res.text
        provider = res.provider || provider
        if (res.note) failedNote = res.note
      }
      onTranslated?.(out)
      if (failedNote) {
        setNote(failedNote)
      } else {
        const name = LANGS.find((l) => l.id === next)?.label || next.toUpperCase()
        setNote(`Translated to ${name}${provider ? ` · ${provider}` : ''}`)
      }
    } catch (e) {
      setNote(e.message || 'Translate failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="animate-fade-up flex flex-wrap items-center gap-2 rounded-xl border border-sky-500/25 bg-pitch-800/70 px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-sky-400 font-semibold mr-1">
        Google Translate
      </p>
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          disabled={loading}
          onClick={() => applyLang(l.id)}
          className={`text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors ${
            lang === l.id
              ? 'border-sky-400 bg-sky-500/25 text-sky-100'
              : 'border-pitch-600 text-gray-400 hover:border-sky-500/40'
          }`}
        >
          {l.label}
        </button>
      ))}
      {loading && <span className="text-[10px] text-gray-500">Translating…</span>}
      {note && (
        <p
          className={`w-full text-[10px] mt-1 ${
            note.startsWith('Translated') ? 'text-sky-400/80' : 'text-gray-500'
          }`}
        >
          {note}
        </p>
      )}
    </div>
  )
}
