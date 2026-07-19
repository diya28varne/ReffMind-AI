import { useState } from 'react'
import HighlightedText from './HighlightedText'
import VoiceReaderButton from './VoiceReaderButton'
import { useSpeech } from '../context/SpeechContext'

/**
 * Camera miss card + in-page YouTube embed for the OG clip.
 */
export default function CameraMissedCard({
  bullets,
  narrative,
  speakText,
  ogScene,
  delay = 600,
}) {
  const [play, setPlay] = useState(false)
  const items = bullets?.length ? bullets : narrative ? [narrative] : []
  const { isActive, highlightRange } = useSpeech()
  const active = isActive('camera-missed')
  const fullText = speakText || items.join('. ')
  const hasScene = Boolean(ogScene?.image)
  const videoId = ogScene?.video_id
  const start = Number(ogScene?.video_start || 0)
  const hasClip = Boolean(ogScene?.video_url || videoId)
  const embedSrc = videoId
    ? `https://www.youtube.com/embed/${videoId}?start=${start}&rel=0&modestbranding=1${play ? '&autoplay=1' : ''}`
    : null

  return (
    <section
      className="animate-fade-up relative overflow-hidden rounded-xl border-2 border-accent-gold/30"
      style={{ animationDelay: `${delay}ms` }}
      aria-labelledby="camera-missed-heading"
      data-gravity
    >
      {hasScene && !play && (
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
      {(!hasScene || play) && <div className="absolute inset-0 bg-pitch-800" />}

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
            {play && embedSrc ? (
              <div className="relative aspect-video">
                <iframe
                  title={ogScene?.caption || 'OG broadcast clip'}
                  src={embedSrc}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : hasScene ? (
              <div className="relative aspect-video max-h-52">
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
                  <div className="flex flex-wrap gap-3 mt-2">
                    {videoId && (
                      <button
                        type="button"
                        onClick={() => setPlay(true)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-pitch-900 bg-accent-gold px-2.5 py-1 rounded-md hover:bg-yellow-400 transition-colors"
                      >
                        ▶ Play in page
                      </button>
                    )}
                    {ogScene.video_url && (
                      <a
                        href={ogScene.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-accent-gold/90 hover:text-accent-gold underline underline-offset-2"
                      >
                        Open on YouTube ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-widest text-accent-gold font-semibold mb-1">
                  {ogScene.label || 'OG scene'} · {ogScene.broadcast || 'Live broadcast'}
                </p>
                <p className="text-sm text-white/90 leading-snug mb-2">{ogScene.caption}</p>
                {videoId && (
                  <button
                    type="button"
                    onClick={() => setPlay(true)}
                    className="text-xs font-semibold text-pitch-900 bg-accent-gold px-2.5 py-1 rounded-md"
                  >
                    ▶ Play in page
                  </button>
                )}
              </div>
            )}
            {play && (
              <div className="px-3 py-2 border-t border-white/10 flex justify-between items-center">
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">YouTube · in-page</p>
                <button
                  type="button"
                  onClick={() => setPlay(false)}
                  className="text-xs text-accent-gold hover:underline"
                >
                  Show still
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-white text-sm leading-relaxed drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
          <HighlightedText text={fullText} highlightRange={highlightRange} isActive={active} />
        </p>
      </div>
    </section>
  )
}
