import HighlightedText from './HighlightedText'
import VoiceReaderButton from './VoiceReaderButton'
import { useSpeech } from '../context/SpeechContext'

export default function WhyFansDisagree({ bullets, narrative, speakText, delay = 800 }) {
  const items = bullets?.length ? bullets : narrative ? [narrative] : []
  const { isActive, highlightRange } = useSpeech()
  const active = isActive('why-fans-disagree')
  const fullText = speakText || items.join('. ')

  if (!items.length && !speakText) return null

  return (
    <section
      className="animate-fade-up bg-pitch-800 border border-pitch-600 rounded-xl p-6"
      style={{ animationDelay: `${delay}ms` }}
      aria-labelledby="why-fans-disagree-heading"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">💬</span>
          <h3 id="why-fans-disagree-heading" className="font-semibold text-lg text-accent-gold">
            Why fans disagree
          </h3>
        </div>
        <VoiceReaderButton sectionId="why-fans-disagree" speakText={fullText} />
      </div>
      <p className="text-gray-300 text-sm leading-relaxed">
        <HighlightedText text={fullText} highlightRange={highlightRange} isActive={active} />
      </p>
    </section>
  )
}
