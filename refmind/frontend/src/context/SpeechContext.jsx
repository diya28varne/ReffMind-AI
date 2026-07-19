import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const SpeechContext = createContext(null)

export function SpeechProvider({ children }) {
  const [activeId, setActiveId] = useState(null)
  const [status, setStatus] = useState('idle') // idle | loading | playing | paused | error
  const [error, setError] = useState(null)
  const [highlightRange, setHighlightRange] = useState({ start: 0, end: 0 })
  const utteranceRef = useRef(null)
  const charIndexRef = useRef(0)
  const textRef = useRef('')
  const voicesReadyRef = useRef(false)

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() ?? []
      if (voices.length > 0) voicesReadyRef.current = true
    }
    loadVoices()
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices)
  }, [])

  const pickVoice = useCallback((langPref = 'en') => {
    const voices = window.speechSynthesis.getVoices()
    const lang = (langPref || 'en').toLowerCase()
    return (
      voices.find((v) => v.lang.toLowerCase().startsWith(lang) && /google/i.test(v.name)) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(lang)) ||
      voices.find((v) => v.lang.startsWith('en') && /google/i.test(v.name)) ||
      voices.find((v) => v.lang.startsWith('en-GB')) ||
      voices.find((v) => v.lang.startsWith('en')) ||
      null
    )
  }, [])

  const speechLangRef = useRef('en')
  const setSpeechLang = useCallback((lang) => {
    speechLangRef.current = lang || 'en'
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    utteranceRef.current = null
    charIndexRef.current = 0
    setActiveId(null)
    setStatus('idle')
    setHighlightRange({ start: 0, end: 0 })
    setError(null)
  }, [])

  const startUtterance = useCallback((sectionId, text, attempt = 0) => {
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    const lang = speechLangRef.current || 'en'
    utterance.lang = lang === 'en' ? 'en-GB' : lang
    const voice = pickVoice(lang)
    if (voice) utterance.voice = voice

    utterance.onstart = () => {
      setStatus('playing')
      setError(null)
    }
    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        charIndexRef.current = event.charIndex
        const end = event.charIndex + (event.charLength || 1)
        setHighlightRange({ start: event.charIndex, end })
      }
    }
    utterance.onend = () => {
      if (utteranceRef.current !== utterance) return
      setStatus('idle')
      setActiveId(null)
      setHighlightRange({ start: 0, end: 0 })
      utteranceRef.current = null
    }
    utterance.onerror = (e) => {
      if (utteranceRef.current !== utterance) return
      // Benign: stop(), switching sections, or Chrome cancel-before-speak quirk
      if (e.error === 'interrupted' || e.error === 'canceled') return
      if (attempt < 1) {
        window.setTimeout(() => startUtterance(sectionId, text, attempt + 1), 120)
        return
      }
      setError('Unable to play narration. Tap the speaker again or try Chrome/Edge.')
      setStatus('error')
    }

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [pickVoice])

  const speak = useCallback(
    (sectionId, text) => {
      if (!window.speechSynthesis) {
        setError('Speech not supported in this browser.')
        setStatus('error')
        return
      }
      if (!text?.trim()) {
        setError('Nothing to read aloud.')
        setStatus('error')
        return
      }

      window.speechSynthesis.cancel()
      utteranceRef.current = null
      charIndexRef.current = 0
      setHighlightRange({ start: 0, end: 0 })
      setActiveId(sectionId)
      setStatus('loading')
      setError(null)
      textRef.current = text

      // Chrome needs a tick after cancel(); voices may load async on first click
      window.setTimeout(() => startUtterance(sectionId, text), voicesReadyRef.current ? 50 : 150)
    },
    [startUtterance],
  )

  const pause = useCallback(() => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
      setStatus('paused')
    }
  }, [])

  const resume = useCallback(() => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      setStatus('playing')
    }
  }, [])

  const value = useMemo(
    () => ({
      activeId,
      status,
      error,
      highlightRange,
      textRef,
      speak,
      pause,
      resume,
      stop,
      setSpeechLang,
      isActive: (id) => activeId === id,
    }),
    [activeId, status, error, highlightRange, speak, pause, resume, stop, setSpeechLang],
  )

  return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>
}

export function useSpeech() {
  const ctx = useContext(SpeechContext)
  if (!ctx) throw new Error('useSpeech must be used within SpeechProvider')
  return ctx
}
