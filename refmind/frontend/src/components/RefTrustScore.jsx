import { useState } from 'react'
import { computeTrustStats, saveTrustRating } from '../utils/trustSession'

export default function RefTrustScore({ incidentId, onRated }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [stats, setStats] = useState(null)

  const handleRate = (stars) => {
    if (submitted) return
    setRating(stars)
    const s = saveTrustRating(incidentId, stars)
    setStats(s)
    setSubmitted(true)
    onRated?.(s)
  }

  return (
    <div className="animate-fade-up bg-pitch-800 border border-pitch-600 rounded-xl p-6 text-center">
      <p className="text-gray-400 text-sm uppercase tracking-widest mb-2">
        Referee trust score
      </p>
      <p className="text-white mb-4">Your trust in this decision:</p>
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={submitted}
            onMouseEnter={() => !submitted && setHover(star)}
            onMouseLeave={() => !submitted && setHover(0)}
            onClick={() => handleRate(star)}
            className={`text-3xl transition-transform hover:scale-110 disabled:cursor-default ${
              (hover || rating) >= star ? 'opacity-100' : 'opacity-30'
            }`}
          >
            ⭐
          </button>
        ))}
      </div>
      {submitted && stats && (
        <div className="space-y-1 pt-2 border-t border-pitch-600">
          <p className="text-sm text-gray-300">
            Session trust average: <span className="text-accent-gold font-bold">{stats.currentAvg.toFixed(1)}/5</span>
          </p>
        </div>
      )}
    </div>
  )
}
