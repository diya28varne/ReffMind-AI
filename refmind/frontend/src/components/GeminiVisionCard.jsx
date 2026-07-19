/**
 * Gemini Vision — what the OG still reveals.
 */
export default function GeminiVisionCard({ vision, delay = 650 }) {
  if (!vision?.description) return null

  return (
    <section
      className="animate-fade-up rounded-xl border border-sky-500/30 bg-pitch-800/90 p-6"
      style={{ animationDelay: `${delay}ms` }}
      aria-labelledby="gemini-vision-heading"
      data-gravity
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-sky-400 font-semibold mb-1">
            Google Gemini Vision
          </p>
          <h3 id="gemini-vision-heading" className="font-semibold text-lg text-sky-300">
            What the still shows
          </h3>
        </div>
        <span
          className={`text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full font-semibold border ${
            vision.demo_mode
              ? 'border-sky-500/40 bg-sky-500/10 text-sky-300'
              : 'border-accent-green/40 bg-accent-green/10 text-accent-green'
          }`}
        >
          {vision.demo_mode ? 'Demo' : 'Live'}
        </span>
      </div>
      <p className="text-sm text-gray-300 leading-relaxed">{vision.description}</p>
      {vision.caption_hint && (
        <p className="mt-3 text-[11px] text-gray-500">Broadcast hint: {vision.caption_hint}</p>
      )}
    </section>
  )
}
