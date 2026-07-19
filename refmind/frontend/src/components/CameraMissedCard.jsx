import HighlightedText from './HighlightedText'
import VoiceReaderButton from './VoiceReaderButton'
import { useSpeech } from '../context/SpeechContext'

export default function CameraMissedCard({
  bullets,
  narrative,
  speakText,
  ogScene,
  delay = 600,
}) {
  const items = bullets?.length ? bullets : narrative ? [narrative] : []
  const { isActive, highlightRange } = useSpeech()
  const active = isActive('camera-missed')
  const fullText = speakText || items.join('. ')
  const hasScene = Boolean(ogScene?.image)
  const hasClip = Boolean(ogScene?.video_url)

  return (
    <section
      className="animate-fade-up relative overflow-hidden rounded-xl border-2 border-accent-gold/30"
      style={{ animationDelay: `${delay}ms` }}
      aria-labelledby="camera-missed-heading"
      data-gravity
    >
      {hasScene && (
        <>
          <img
            src={ogScene.image}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-pitch-900/82 backdrop-blur-[2px]" />
        </>
      )}
      {!hasScene && <div className="absolute inset-0 bg-pitch-800" />}

      <div className="relative z-10 p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl shrink-0" aria-hidden="true">
              📺
            </span>
            <h3 id="camera-missed-heading" className="font-semibold text-lg text-accent-gold">
              What the camera missed
            </h3>
          </div>
          <VoiceReaderButton sectionId="camera-missed" speakText={fullText} />
        </div>

        {(hasScene || hasClip) && (
          <div className="mb-5 rounded-lg overflow-hidden border border-white/10 bg-pitch-900/50">
            {hasScene ? (
              <div className="relative aspect-video max-h-44 sm:max-h-52">
                <img
                  src={ogScene.image}
                  alt={ogScene.alt || 'Original broadcast scene'}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pitch-900 via-pitch-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <p className="text-[10px] uppercase tracking-widest text-accent-gold font-semibold mb-1">
                    {ogScene.label || 'OG scene'} · {ogScene.broadcast || 'Live broadcast'}
                  </p>
                  <p className="text-sm text-white/90 leading-snug">{ogScene.caption}</p>
                  {hasClip && (
                    <a
                      href={ogScene.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-2 text-xs text-accent-gold/90 hover:text-accent-gold underline underline-offset-2"
                    >
                      Watch OG clip ↗
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-widest text-accent-gold font-semibold mb-1">
                  {ogScene.label || 'OG scene'} · {ogScene.broadcast || 'Live broadcast'}
                </p>
                <p className="text-sm text-white/90 leading-snug mb-2">{ogScene.caption}</p>
                <a
                  href={ogScene.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent-gold/90 hover:text-accent-gold underline underline-offset-2"
                >
                  Watch OG clip ↗
                </a>
              </div>
            )}
          </div>
        )}

        <ul className="space-y-3">
          {items.map((item, i) => (
            <li key={i} className="flex gap-3 text-white text-sm leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
              <span className="text-accent-gold shrink-0 mt-0.5">•</span>
              <span>
                {active && i === 0 ? (
                  <HighlightedText text={item} highlightRange={highlightRange} isActive={active} />
                ) : (
                  item
                )}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
