import ConfidenceMeter, { VERDICT_META } from './ConfidenceMeter'
import HighlightedText from './HighlightedText'
import VoiceReaderButton from './VoiceReaderButton'
import { useSpeech } from '../context/SpeechContext'

const VERDICT_STYLES = {
  Correct: 'border-accent-green/50 bg-accent-green/5',
  'Defensible but debatable': 'border-accent-gold/50 bg-accent-gold/5',
  'Likely wrong': 'border-accent-red/50 bg-accent-red/5',
}

export default function FinalVerdict({
  verdict,
  confidence,
  confidencePct,
  reasoning,
  speakText,
}) {
  const meta = VERDICT_META[verdict] || VERDICT_META['Defensible but debatable']
  const { isActive, highlightRange } = useSpeech()
  const active = isActive('final-verdict')
  const narration =
    speakText ||
    `Final verdict: ${verdict}. ${reasoning} Confidence level ${confidence}, ${confidencePct} percent.`

  return (
    <section
      className={`rounded-xl border-2 p-6 animate-fade-up ${
        VERDICT_STYLES[verdict] || VERDICT_STYLES['Defensible but debatable']
      }`}
      aria-labelledby="final-verdict-heading"
      data-gravity
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <p
          id="final-verdict-heading"
          className="text-sm uppercase tracking-widest text-gray-400"
        >
          Final verdict
        </p>
        <VoiceReaderButton sectionId="final-verdict" speakText={narration} />
      </div>
      <p className={`font-display text-2xl font-bold mb-1 text-center ${meta.color}`}>
        {meta.emoji} {verdict}
      </p>
      <p className="text-gray-300 text-sm leading-relaxed text-center mb-2">
        <HighlightedText text={reasoning} highlightRange={highlightRange} isActive={active} />
      </p>
      <ConfidenceMeter
        verdict={verdict}
        confidencePct={confidencePct}
        confidenceLabel={confidence}
      />
    </section>
  )
}
