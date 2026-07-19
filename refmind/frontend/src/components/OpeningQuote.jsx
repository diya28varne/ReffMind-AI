import HighlightedText from './HighlightedText'
import VoiceReaderButton from './VoiceReaderButton'
import { TRANSPARENCY_DISCLAIMER } from './TransparencyNote'
import { useSpeech } from '../context/SpeechContext'

const QUOTE =
  'Every football AI argues who was right. RefMind answers why the argument never ends.'

const DISCLAIMER = TRANSPARENCY_DISCLAIMER

const READ_ALOUD = `${QUOTE} ${DISCLAIMER}`
const DISCLAIMER_OFFSET = QUOTE.length + 1

function mapHighlight(range, offset, maxLen) {
  const start = Math.max(0, range.start - offset)
  const end = Math.max(start, Math.min(maxLen, range.end - offset))
  return { start, end }
}

export default function OpeningQuote() {
  const { isActive, highlightRange } = useSpeech()
  const active = isActive('opening-quote')
  const inQuote = active && highlightRange.start < QUOTE.length
  const inDisclaimer = active && highlightRange.start >= DISCLAIMER_OFFSET

  return (
    <section
      className="animate-fade-up mb-8 rounded-xl border border-accent-gold/25 bg-pitch-800/80 p-6 relative overflow-hidden"
      aria-labelledby="opening-quote-heading"
    >
      <div className="absolute top-0 left-0 w-1 h-full bg-accent-gold/60" aria-hidden="true" />

      <div className="flex items-start justify-between gap-3 mb-4 pl-2">
        <p
          id="opening-quote-heading"
          className="text-[10px] uppercase tracking-widest text-accent-gold/80 font-semibold"
        >
          Before you vote
        </p>
        <VoiceReaderButton
          sectionId="opening-quote"
          speakText={READ_ALOUD}
          label="Read to me"
        />
      </div>

      <blockquote className="pl-2 border-none m-0">
        <p className="font-display text-xl md:text-2xl text-white leading-snug italic">
          &ldquo;
          {inQuote ? (
            <HighlightedText
              text={QUOTE}
              highlightRange={{
                start: highlightRange.start,
                end: Math.min(highlightRange.end, QUOTE.length),
              }}
              isActive
            />
          ) : (
            QUOTE
          )}
          &rdquo;
        </p>
      </blockquote>

      {inDisclaimer && (
        <p
          className="mt-4 ml-2 text-sm text-gray-200 leading-relaxed rounded-lg border border-accent-gold/35 bg-accent-gold/10 px-4 py-3"
          aria-live="polite"
        >
          <HighlightedText
            text={DISCLAIMER}
            highlightRange={mapHighlight(highlightRange, DISCLAIMER_OFFSET, DISCLAIMER.length)}
            isActive
          />
        </p>
      )}
    </section>
  )
}
