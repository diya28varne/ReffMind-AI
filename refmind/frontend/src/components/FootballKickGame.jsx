import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../api/client'

const ROUNDS = 7
const W = 360
const H = 300

const GOAL = { x: 46, y: 32, w: 268, h: 82 }
const BALL_START = { x: W / 2, y: 248 }
const KEEPER_Y = GOAL.y + GOAL.h - 6

const STYLES = {
  place: {
    id: 'place',
    label: 'Place',
    tip: 'Aim true — easiest way to score',
    speed: 0.92,
    curve: 0,
    loft: 0.05,
    keepGuess: 0.32,
    reach: 20,
  },
  power: {
    id: 'power',
    label: 'Power',
    tip: 'Fast shot — beat the dive',
    speed: 1.15,
    curve: 0,
    loft: 0.02,
    keepGuess: 0.38,
    reach: 18,
  },
  chip: {
    id: 'chip',
    label: 'Chip',
    tip: 'Lob over a diving keeper',
    speed: 0.78,
    curve: 0,
    loft: 0.42,
    keepGuess: 0.35,
    reach: 17,
  },
  curl: {
    id: 'curl',
    label: 'Curl',
    tip: 'Bends into the far corner',
    speed: 0.95,
    curve: 0.14,
    loft: 0.06,
    keepGuess: 0.34,
    reach: 19,
  },
}

const GOAL_CHEERS = {
  en: 'GOAL!',
  es: '¡GOL!',
  hi: 'गोल!',
  pt: 'GOLO!',
  fr: 'BUT !',
  de: 'TOR!',
  it: 'GOL!',
}
const CHEER_LANGS = ['es', 'hi', 'pt', 'fr', 'de', 'it', 'en']

const FALLBACK_LINES = {
  goal: [
    'Net dances — pure theatre!',
    'Keeper guessed wrong. Ice in the veins.',
    'Corner pocket found. Beginners to ballers.',
  ],
  bonus: [
    'TOP BINS! Bonus corner cashed.',
    'Postage-stamp placement. Crowd loses it.',
    'That is how YouTube compilations start.',
  ],
  save: [
    'World-class gloves. Mix your style next time.',
    'Blocked — try a chip if they dive early.',
    'Strong hands. Curl away from the dive.',
  ],
  miss: [
    'Wide — keep the crosshair inside the white.',
    'Over the bar — dial power back a touch.',
    'Post groans. Same aim, cleaner power.',
  ],
}

const BADGE_DEFS = [
  { id: 'first', label: 'First Blood', test: (s) => s.goals >= 1 },
  { id: 'streak3', label: 'On Fire ×3', test: (s) => s.bestStreak >= 3 },
  { id: 'topbins', label: 'Top Bins', test: (s) => s.bonuses >= 1 },
  { id: 'styles', label: 'Toolkit', test: (s) => s.stylesUsed.size >= 3 },
  { id: 'perfect', label: 'Clean Sheet Atk', test: (s) => s.goals >= 5 && s.misses === 0 },
  { id: 'hat', label: 'Hat-trick', test: (s) => s.goals >= 3 },
]

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n))
}

function makeKeeper() {
  return {
    x: GOAL.x + GOAL.w / 2,
    y: KEEPER_Y,
    targetX: GOAL.x + GOAL.w / 2,
    dive: 0,
    diveAmt: 0,
    bob: 0,
    wanderT: 0,
    mode: 'idle',
  }
}

function makeStriker() {
  return {
    x: BALL_START.x - 28,
    y: BALL_START.y + 8,
    kickLeg: 0,
    plant: 0,
  }
}

function makeBonusSpot() {
  // Random hot corner (bonus 2×)
  const side = Math.random() < 0.5 ? 'left' : 'right'
  return {
    x: side === 'left' ? GOAL.x + 28 : GOAL.x + GOAL.w - 28,
    y: GOAL.y + 22 + Math.random() * 18,
    r: 22,
    pulse: 0,
  }
}

/** Tiny Web Audio beeps — no asset downloads. */
function createSfx() {
  let ctx = null
  const ensure = () => {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) return null
      ctx = new AC()
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }
  const tone = (freq, dur, type = 'square', vol = 0.04, slide = 0) => {
    const c = ensure()
    if (!c) return
    const t0 = c.currentTime
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t0)
    if (slide) o.frequency.linearRampToValueAtTime(freq + slide, t0 + dur)
    g.gain.setValueAtTime(vol, t0)
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur)
    o.connect(g)
    g.connect(c.destination)
    o.start(t0)
    o.stop(t0 + dur + 0.02)
  }
  return {
    kick: () => {
      tone(90, 0.08, 'sawtooth', 0.05)
      tone(180, 0.06, 'square', 0.03)
    },
    goal: () => {
      tone(440, 0.12, 'square', 0.05, 200)
      setTimeout(() => tone(660, 0.14, 'square', 0.045, 180), 80)
      setTimeout(() => tone(880, 0.2, 'triangle', 0.04), 160)
    },
    save: () => tone(140, 0.15, 'triangle', 0.05, -40),
    miss: () => tone(110, 0.22, 'sawtooth', 0.035, -60),
    bonus: () => {
      tone(520, 0.1, 'square', 0.045, 100)
      setTimeout(() => tone(740, 0.16, 'triangle', 0.05), 70)
    },
    ui: () => tone(320, 0.04, 'sine', 0.02),
  }
}

/**
 * Beginner penalty arcade — styles, bonus corners, streaks, crowd, SFX.
 */
export default function FootballKickGame({ incidentId }) {
  const canvasRef = useRef(null)
  const stateRef = useRef(null)
  const rafRef = useRef(0)
  const phaseRef = useRef('ready')
  const aimRef = useRef({ x: GOAL.x + GOAL.w / 2, y: GOAL.y + GOAL.h * 0.45 })
  const styleRef = useRef('place')
  const sfxRef = useRef(null)
  const statsRef = useRef({
    goals: 0,
    bonuses: 0,
    misses: 0,
    bestStreak: 0,
    stylesUsed: new Set(),
  })

  const [phase, setPhase] = useState('ready')
  const [power, setPower] = useState(0.5)
  const [aim, setAim] = useState({ x: GOAL.x + GOAL.w / 2, y: GOAL.y + GOAL.h * 0.45 })
  const [style, setStyle] = useState('place')
  const [score, setScore] = useState({ goals: 0, taken: 0, points: 0 })
  const [streak, setStreak] = useState(0)
  const [crowd, setCrowd] = useState(18)
  const [lastResult, setLastResult] = useState(null)
  const [floatMsg, setFloatMsg] = useState(null)
  const [cheer, setCheer] = useState(null)
  const [commentary, setCommentary] = useState(
    'Aim inside the goal, pick a style, Kick! — the red player shoots, the keeper dives.',
  )
  const [commentLoading, setCommentLoading] = useState(false)
  const [badges, setBadges] = useState([])
  const [newBadge, setNewBadge] = useState(null)
  const [shake, setShake] = useState(0)

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])
  useEffect(() => {
    aimRef.current = aim
  }, [aim])
  useEffect(() => {
    styleRef.current = style
  }, [style])
  useEffect(() => {
    sfxRef.current = createSfx()
  }, [])

  const flash = (text, kind = 'info') => {
    setFloatMsg({ text, kind, id: Date.now() })
    setTimeout(() => setFloatMsg((m) => (m?.text === text ? null : m)), 1400)
  }

  const unlockBadges = useCallback(() => {
    const st = statsRef.current
    const unlocked = []
    BADGE_DEFS.forEach((b) => {
      if (b.test(st) && !badges.includes(b.id)) unlocked.push(b)
    })
    if (unlocked.length) {
      setBadges((prev) => [...prev, ...unlocked.map((u) => u.id)])
      setNewBadge(unlocked[0].label)
      setTimeout(() => setNewBadge(null), 2200)
    }
  }, [badges])

  const resetBallVisual = useCallback((resetKeeper = false) => {
    const s = stateRef.current
    if (!s) return
    s.ball = { ...BALL_START, vx: 0, vy: 0, r: 11, spin: 0, trail: [], target: null, homing: 0 }
    if (resetKeeper || !s.keeper) {
      s.keeper = makeKeeper()
    } else {
      s.keeper.dive = 0
      s.keeper.diveAmt = 0
      s.keeper.y = KEEPER_Y
      s.keeper.mode = 'idle'
    }
    s.striker = makeStriker()
    s.particles = []
    s.shake = 0
  }, [])

  useEffect(() => {
    stateRef.current = {
      ball: { ...BALL_START, vx: 0, vy: 0, r: 11, spin: 0, trail: [], target: null, homing: 0 },
      keeper: makeKeeper(),
      striker: makeStriker(),
      particles: [],
      netWobble: 0,
      t: 0,
      shake: 0,
      bonus: makeBonusSpot(),
      crowdWave: 0,
      flashWhite: 0,
    }

    const updateKeeper = (s, ph) => {
      const k = s.keeper
      const left = GOAL.x + 28
      const right = GOAL.x + GOAL.w - 28
      s.t += 1
      s.bonus.pulse += 0.08
      s.crowdWave += 0.03

      if (ph === 'flying' || k.mode === 'diving') {
        k.x += (k.targetX - k.x) * 0.2
        k.diveAmt = Math.min(1, k.diveAmt + 0.09)
        k.y = KEEPER_Y - k.diveAmt * 12
        k.bob = Math.sin(s.t * 0.4) * 1.5
        return
      }

      k.mode = 'idle'
      k.diveAmt = Math.max(0, k.diveAmt - 0.055)
      k.wanderT -= 1
      if (k.wanderT <= 0) {
        k.targetX = left + Math.random() * (right - left)
        k.wanderT = 35 + Math.random() * 60
      }
      k.x += (k.targetX - k.x) * 0.05
      k.x = clamp(k.x, left, right)
      k.dive = k.targetX < k.x - 2 ? -1 : k.targetX > k.x + 2 ? 1 : k.dive * 0.85
      k.y = KEEPER_Y + Math.sin(s.t * 0.08) * 2
      k.bob = Math.sin(s.t * 0.12) * 3
    }

    const draw = () => {
      const canvas = canvasRef.current
      const s = stateRef.current
      if (!canvas || !s) return
      const ctx = canvas.getContext('2d')
      const dpr = window.devicePixelRatio || 1
      if (canvas.width !== W * dpr) {
        canvas.width = W * dpr
        canvas.height = H * dpr
        canvas.style.width = `${W}px`
        canvas.style.height = `${H}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      }

      const ph = phaseRef.current
      const aimNow = aimRef.current
      updateKeeper(s, ph)
      if (s.shake > 0) s.shake *= 0.86
      if (s.flashWhite > 0) s.flashWhite *= 0.82

      ctx.save()
      ctx.translate((Math.random() - 0.5) * s.shake, (Math.random() - 0.5) * s.shake)

      // Night stadium sky
      const sky = ctx.createLinearGradient(0, 0, 0, H)
      sky.addColorStop(0, '#0a1628')
      sky.addColorStop(0.35, '#12301f')
      sky.addColorStop(1, '#0d2418')
      ctx.fillStyle = sky
      ctx.fillRect(0, 0, W, H)

      // Crowd silhouette
      ctx.fillStyle = '#152238'
      for (let i = 0; i < 28; i++) {
        const cx = 8 + i * 13
        const bob = Math.sin(s.crowdWave + i * 0.4) * 3
        ctx.fillRect(cx, 8 + bob, 10, 18 - bob)
      }
      // Floodlights
      ctx.fillStyle = 'rgba(255,240,180,0.08)'
      ctx.beginPath()
      ctx.moveTo(40, 0)
      ctx.lineTo(120, 90)
      ctx.lineTo(20, 90)
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(320, 0)
      ctx.lineTo(340, 90)
      ctx.lineTo(240, 90)
      ctx.fill()

      // Pitch stripes
      for (let y = 100; y < H; y += 16) {
        ctx.fillStyle = y % 32 < 16 ? 'rgba(26,90,48,0.55)' : 'rgba(18,70,38,0.55)'
        ctx.fillRect(0, y, W, 16)
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(W / 2, BALL_START.y + 6, 40, Math.PI * 1.12, Math.PI * 1.88)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(30, BALL_START.y + 20)
      ctx.lineTo(W - 30, BALL_START.y + 20)
      ctx.stroke()

      // Goal
      ctx.fillStyle = '#eef3f8'
      ctx.fillRect(GOAL.x - 7, GOAL.y - 7, GOAL.w + 14, 7)
      ctx.fillRect(GOAL.x - 7, GOAL.y, 7, GOAL.h)
      ctx.fillRect(GOAL.x + GOAL.w, GOAL.y, 7, GOAL.h)
      ctx.strokeStyle = 'rgba(200,220,240,0.35)'
      ctx.lineWidth = 0.8
      const wob = s.netWobble
      for (let i = 0; i <= 9; i++) {
        const nx = GOAL.x + (GOAL.w * i) / 9 + Math.sin(wob + i) * wob * 0.45
        ctx.beginPath()
        ctx.moveTo(nx, GOAL.y)
        ctx.lineTo(GOAL.x + (GOAL.w * i) / 9, GOAL.y + GOAL.h)
        ctx.stroke()
      }

      // Bonus hot zone
      const bz = s.bonus
      const pulse = 0.55 + Math.sin(bz.pulse) * 0.35
      ctx.save()
      ctx.globalAlpha = ph === 'flying' ? 0.25 : pulse
      const ring = ctx.createRadialGradient(bz.x, bz.y, 2, bz.x, bz.y, bz.r)
      ring.addColorStop(0, 'rgba(250,204,21,0.85)')
      ring.addColorStop(0.5, 'rgba(56,189,248,0.35)')
      ring.addColorStop(1, 'rgba(56,189,248,0)')
      ctx.fillStyle = ring
      ctx.beginPath()
      ctx.arc(bz.x, bz.y, bz.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(250,204,21,0.9)'
      ctx.lineWidth = 1.5
      ctx.setLineDash([3, 3])
      ctx.beginPath()
      ctx.arc(bz.x, bz.y, bz.r * 0.7, 0, Math.PI * 2)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = '#fde68a'
      ctx.font = 'bold 9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('2×', bz.x, bz.y + 3)
      ctx.restore()

      // Striker (player taking the penalty)
      const sk = s.striker || makeStriker()
      if (ph === 'flying') {
        sk.kickLeg = Math.min(1, sk.kickLeg + 0.12)
        sk.plant = Math.min(1, sk.plant + 0.08)
      } else {
        sk.kickLeg = Math.max(0, sk.kickLeg - 0.06)
        sk.plant = Math.max(0, sk.plant - 0.05)
      }
      ctx.save()
      ctx.translate(sk.x, sk.y)
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.beginPath()
      ctx.ellipse(4, 6, 18, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(0, -8)
      ctx.lineTo(-6 + sk.plant * 2, 10)
      ctx.stroke()
      const kickAngle = -0.2 - sk.kickLeg * 1.1
      ctx.save()
      ctx.translate(2, -6)
      ctx.rotate(kickAngle)
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(4, 16)
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.ellipse(5, 17, 5, 3, 0.2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
      ctx.fillStyle = '#e11d48'
      ctx.fillRect(-8, -28, 16, 22)
      ctx.fillStyle = '#f5c542'
      ctx.beginPath()
      ctx.arc(0, -34, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#f5c542'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(-8, -22)
      ctx.lineTo(-16, -10 - sk.kickLeg * 4)
      ctx.moveTo(8, -22)
      ctx.lineTo(14, -12 + sk.kickLeg * 6)
      ctx.stroke()
      ctx.restore()

      // Keeper
      const k = s.keeper
      const lean = k.dive * (0.15 + k.diveAmt * 0.75)
      ctx.save()
      ctx.translate(k.x, k.y + k.bob * 0.15)
      ctx.rotate(lean)
      ctx.fillStyle = 'rgba(0,0,0,0.28)'
      ctx.beginPath()
      ctx.ellipse(0, 14, 16 + k.diveAmt * 8, 5, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#f5c542'
      ctx.beginPath()
      ctx.ellipse(0, -22, 11, 12, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#1e3a5f'
      ctx.fillRect(-11, -12, 22, 24)
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 7px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('1', 0, 2)
      ctx.fillStyle = '#0b1f36'
      ctx.fillRect(-10, 10, 8, 12)
      ctx.fillRect(2, 10, 8, 12)
      const armReach = 14 + k.diveAmt * 20
      ctx.strokeStyle = '#f5c542'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-8, -4)
      ctx.lineTo(-armReach, -8 - k.diveAmt * 8)
      ctx.moveTo(8, -4)
      ctx.lineTo(armReach, -8 + k.diveAmt * 5)
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(-armReach, -8 - k.diveAmt * 8, 6.5, 0, Math.PI * 2)
      ctx.arc(armReach, -8 + k.diveAmt * 5, 6.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Aim
      if (ph === 'ready' || ph === 'aiming' || ph === 'result') {
        const nearBonus = Math.hypot(aimNow.x - bz.x, aimNow.y - bz.y) < bz.r
        ctx.strokeStyle = nearBonus ? 'rgba(250,204,21,0.95)' : 'rgba(56,189,248,0.9)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(aimNow.x, aimNow.y, 11, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(aimNow.x - 15, aimNow.y)
        ctx.lineTo(aimNow.x + 15, aimNow.y)
        ctx.moveTo(aimNow.x, aimNow.y - 15)
        ctx.lineTo(aimNow.x, aimNow.y + 15)
        ctx.stroke()
        ctx.strokeStyle = 'rgba(56,189,248,0.3)'
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(BALL_START.x, BALL_START.y)
        // Preview curl
        const st = STYLES[styleRef.current] || STYLES.place
        const midX = (BALL_START.x + aimNow.x) / 2 + (aimNow.x < W / 2 ? 1 : -1) * st.curve * 80
        ctx.quadraticCurveTo(midX, (BALL_START.y + aimNow.y) / 2, aimNow.x, aimNow.y)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Ball trail
      const b = s.ball
      b.trail.forEach((p, i) => {
        ctx.globalAlpha = (i / b.trail.length) * 0.45
        ctx.fillStyle = '#7dd3fc'
        ctx.beginPath()
        ctx.arc(p.x, p.y, b.r * (0.4 + i / b.trail.length) * 0.6, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.globalAlpha = 1

      // Ball
      ctx.save()
      ctx.translate(b.x, b.y)
      ctx.rotate(b.spin)
      const grad = ctx.createRadialGradient(-3, -3, 1, 0, 0, b.r)
      grad.addColorStop(0, '#fff')
      grad.addColorStop(1, '#bbb')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(0, 0, b.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#222'
      ctx.lineWidth = 1
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(Math.cos(a) * b.r * 0.9, Math.sin(a) * b.r * 0.9)
        ctx.stroke()
      }
      ctx.restore()

      // Particles
      s.particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
        if (p.spark) {
          ctx.strokeStyle = p.color
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2)
          ctx.stroke()
        }
      })
      ctx.globalAlpha = 1

      if (s.flashWhite > 0.05) {
        ctx.fillStyle = `rgba(255,255,255,${s.flashWhite * 0.35})`
        ctx.fillRect(0, 0, W, H)
      }

      ctx.restore()
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  const burst = (x, y, color, n = 18, spark = false) => {
    const s = stateRef.current
    if (!s) return
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2
      const sp = 1 + Math.random() * 4
      s.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - (spark ? 1 : 0),
        r: 2 + Math.random() * 3,
        life: 1,
        color,
        spark,
      })
    }
  }

  const fetchCommentary = async (outcome, aimX, powerVal, styleId) => {
    setCommentLoading(true)
    const side =
      aimX < GOAL.x + GOAL.w * 0.33 ? 'left' : aimX > GOAL.x + GOAL.w * 0.66 ? 'right' : 'centre'
    const key = outcome === 'bonus' ? 'bonus' : outcome
    setCommentary(pick(FALLBACK_LINES[key] || FALLBACK_LINES.miss))

    try {
      const prompt =
        outcome === 'goal' || outcome === 'bonus'
          ? `Punchy stadium commentator line for a penalty ${outcome === 'bonus' ? 'TOP CORNER' : 'goal'} with a ${styleId} shot aimed ${side}, power ${Math.round(powerVal * 100)}%. Max 16 words.`
          : outcome === 'save'
            ? `Commentator line after keeper saves a ${styleId} penalty (${side}). Max 16 words.`
            : `Friendly tip after a missed ${styleId} penalty. Max 16 words.`
      const res = await api.askGemini(incidentId || 'wc1986-hand-of-god', prompt, {
        verdict: 'arcade penalty mini-game',
      })
      if (res?.answer) {
        const line = res.answer.replace(/\n+/g, ' ').trim().slice(0, 140)
        if (line.length > 8) setCommentary(line)
      }
    } catch {
      /* local */
    } finally {
      setCommentLoading(false)
    }
  }

  const celebrateGoal = async (bonus) => {
    const lang = pick(CHEER_LANGS)
    const local = bonus ? `${GOAL_CHEERS[lang] || 'GOAL!'} 2×` : GOAL_CHEERS[lang] || 'GOAL!'
    setCheer({ text: local, lang, bonus })
    try {
      if (lang !== 'en') {
        const res = await api.translate('GOAL!', lang)
        if (res?.text && res.text.length < 40 && !res.text.includes('[')) {
          setCheer({
            text: bonus ? `${res.text} 2×` : res.text,
            lang,
            bonus,
          })
        }
      }
    } catch {
      /* keep */
    }
  }

  const finishKick = async (outcome, meta = {}) => {
    const isGoal = outcome === 'goal' || outcome === 'bonus'
    const bonusHit = outcome === 'bonus'
    setLastResult(isGoal ? (bonusHit ? 'bonus' : 'goal') : outcome)

    const pts = isGoal ? (bonusHit ? 200 : 100) + streak * 25 + Math.round(power * 30) : 0
    const nextGoals = score.goals + (isGoal ? 1 : 0)
    const nextTaken = score.taken + 1
    const nextPts = score.points + pts
    const nextStreak = isGoal ? streak + 1 : 0

    setScore({ goals: nextGoals, taken: nextTaken, points: nextPts })
    setStreak(nextStreak)
    setCrowd((c) => clamp(c + (isGoal ? 14 + (bonusHit ? 10 : 0) : -6), 5, 100))
    setPhase(nextTaken >= ROUNDS ? 'done' : 'result')

    statsRef.current.goals = nextGoals
    statsRef.current.bestStreak = Math.max(statsRef.current.bestStreak, nextStreak)
    if (bonusHit) statsRef.current.bonuses += 1
    if (outcome === 'miss') statsRef.current.misses += 1
    statsRef.current.stylesUsed.add(style)
    unlockBadges()

    const s = stateRef.current
    const sfx = sfxRef.current

    if (isGoal) {
      s.netWobble = bonusHit ? 14 : 9
      s.shake = bonusHit ? 10 : 6
      s.flashWhite = bonusHit ? 1 : 0.55
      setShake(bonusHit ? 10 : 6)
      burst(s.ball.x, s.ball.y, '#38bdf8', 22, true)
      burst(s.ball.x, s.ball.y, '#f5c542', 18, true)
      if (bonusHit) burst(s.ball.x, s.ball.y, '#fbbf24', 28, true)
      if (sfx) (bonusHit ? sfx.bonus : sfx.goal)()
      celebrateGoal(bonusHit)
      if (nextStreak === 3) flash('HAT-TRICK!', 'fire')
      else if (nextStreak >= 4) flash('ON FIRE!', 'fire')
      else if (bonusHit) flash('TOP BINS +2×', 'bonus')
      else flash(`+${pts} pts`, 'goal')
    } else if (outcome === 'save') {
      burst(s.ball.x, s.ball.y, '#f5c542', 14)
      sfx?.save()
      flash('SAVED', 'save')
      setCheer(null)
    } else {
      sfx?.miss()
      flash(meta.wide ? 'WIDE!' : 'OVER!', 'miss')
      setCheer(null)
    }

    // New bonus spot each kick
    s.bonus = makeBonusSpot()

    await fetchCommentary(isGoal ? (bonusHit ? 'bonus' : 'goal') : outcome, aim.x, power, style)

    if (nextTaken >= ROUNDS) {
      setCommentary((prev) => {
        const rank =
          nextPts >= 900 ? 'Legend' : nextPts >= 500 ? 'Matchwinner' : nextPts >= 250 ? 'Academy' : 'Warm-up'
        return `${prev} · Final ${nextGoals}/${ROUNDS} · ${nextPts} pts · ${rank}`
      })
    }

    const decay = setInterval(() => {
      if (!stateRef.current) return
      const st = stateRef.current
      st.netWobble *= 0.85
      st.particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05
        p.life -= 0.035
      })
      st.particles = st.particles.filter((p) => p.life > 0)
      if (st.netWobble < 0.2 && st.particles.length === 0) {
        st.netWobble = 0
        clearInterval(decay)
      }
    }, 32)

    setTimeout(() => setShake(0), 400)
  }

  const kick = () => {
    if (phase === 'flying' || phase === 'done') return
    if (score.taken >= ROUNDS) return

    const s = stateRef.current
    if (!s) return
    sfxRef.current?.kick()
    setCheer(null)
    setLastResult(null)
    setPhase('flying')
    resetBallVisual(false)

    const st = STYLES[style] || STYLES.place
    // Ball homes to where you aimed — scoring is fair and readable
    const targetX = clamp(aim.x, GOAL.x + 12, GOAL.x + GOAL.w - 12)
    const targetY = clamp(aim.y, GOAL.y + 14, GOAL.y + GOAL.h - 10)
    s.ball.target = { x: targetX, y: targetY }
    s.ball.homing = 1

    const powerMul = 0.55 + power * 0.85
    const dx = targetX - BALL_START.x
    const dy = targetY - BALL_START.y
    const dist = Math.hypot(dx, dy) || 1
    const speed = 7.4 * powerMul * st.speed
    s.ball.vx = (dx / dist) * speed
    s.ball.vy = (dy / dist) * speed - st.loft * 2.8 * powerMul
    const curlDir = targetX < W / 2 ? 1 : -1
    s.ball.curl = curlDir * st.curve * speed * 0.08
    s.ball.spin = 0
    s.ball.trail = []
    if (s.striker) {
      s.striker.kickLeg = 0
      s.striker.plant = 0
    }

    // Keeper dives — often the wrong way so beginners can score
    const sides = [GOAL.x + 50, GOAL.x + GOAL.w / 2, GOAL.x + GOAL.w - 50]
    let diveTo
    if (Math.random() < st.keepGuess) {
      diveTo = targetX + (Math.random() - 0.5) * 50
    } else {
      const wrong = sides.filter((x) => Math.abs(x - targetX) > 55)
      diveTo = pick(wrong.length ? wrong : sides)
    }
    s.keeper.mode = 'diving'
    s.keeper.diveAmt = 0.05
    s.keeper.targetX = clamp(diveTo, GOAL.x + 30, GOAL.x + GOAL.w - 30)
    s.keeper.dive = s.keeper.targetX < s.keeper.x - 5 ? -1 : s.keeper.targetX > s.keeper.x + 5 ? 1 : 0

    let frames = 0
    let settled = false
    const settle = (outcome, meta) => {
      if (settled) return
      settled = true
      s.keeper.mode = 'idle'
      if (outcome === 'goal' || outcome === 'bonus') {
        s.ball.vx = 0
        s.ball.vy = 0
        s.ball.x = clamp(s.ball.x, GOAL.x + 10, GOAL.x + GOAL.w - 10)
        s.ball.y = clamp(s.ball.y, GOAL.y + 12, GOAL.y + GOAL.h - 8)
        s.ball.homing = 0
      }
      finishKick(outcome, meta)
    }

    const step = () => {
      if (settled) return
      frames += 1

      if (s.ball.target && s.ball.homing > 0) {
        const tx = s.ball.target.x - s.ball.x
        const ty = s.ball.target.y - s.ball.y
        s.ball.vx += tx * 0.035
        s.ball.vy += ty * 0.035
      }

      s.ball.x += s.ball.vx
      s.ball.y += s.ball.vy
      s.ball.vy += 0.09 + (style === 'chip' ? 0.03 : 0)
      s.ball.vx += s.ball.curl || 0
      s.ball.curl *= 0.96
      s.ball.vx *= 0.997
      s.ball.vy *= 0.998
      s.ball.spin += 0.25 + power * 0.2
      s.ball.trail.push({ x: s.ball.x, y: s.ball.y })
      if (s.ball.trail.length > 10) s.ball.trail.shift()

      s.keeper.x += (s.keeper.targetX - s.keeper.x) * 0.16
      s.keeper.diveAmt = Math.min(1, s.keeper.diveAmt + 0.07)

      const crossedLine = s.ball.y <= GOAL.y + GOAL.h * 0.55
      if (crossedLine) {
        const inPosts = s.ball.x >= GOAL.x + 4 && s.ball.x <= GOAL.x + GOAL.w - 4
        if (!inPosts) {
          settle('miss', { wide: true })
          return
        }
        if (s.ball.y < GOAL.y - 8) {
          settle('miss', { wide: false })
          return
        }

        const reachX = Math.abs(s.ball.x - s.keeper.x)
        const keeperHandY = s.keeper.y - 10 - s.keeper.diveAmt * 8
        const reachY = Math.abs(s.ball.y - keeperHandY)
        const chipBeats = style === 'chip' && s.ball.y < GOAL.y + 30 && s.keeper.diveAmt > 0.45
        const saved = reachX < st.reach && reachY < 28 && !chipBeats

        if (saved) {
          s.ball.vx *= -0.4
          s.ball.vy = Math.abs(s.ball.vy) * 0.25
          s.ball.homing = 0
          settle('save')
          return
        }

        const bz = s.bonus
        const hitBonus = Math.hypot(s.ball.x - bz.x, s.ball.y - bz.y) < bz.r + 8
        settle(hitBonus ? 'bonus' : 'goal')
        return
      }

      if (frames > 120 || s.ball.y > H + 30 || s.ball.x < -50 || s.ball.x > W + 50) {
        settle('miss', { wide: Math.abs(s.ball.x - W / 2) > 90 })
        return
      }
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  const nextRound = () => {
    if (score.taken >= ROUNDS) {
      setPhase('done')
      return
    }
    resetBallVisual(false)
    setPhase('ready')
    setLastResult(null)
    setCheer(null)
    setCommentary('New hot corner is live — pick a style and fire.')
  }

  const replay = () => {
    setScore({ goals: 0, taken: 0, points: 0 })
    setStreak(0)
    setCrowd(18)
    setLastResult(null)
    setCheer(null)
    setBadges([])
    setNewBadge(null)
    setPower(0.5)
    setStyle('place')
    setAim({ x: GOAL.x + GOAL.w / 2, y: GOAL.y + GOAL.h * 0.45 })
    statsRef.current = { goals: 0, bonuses: 0, misses: 0, bestStreak: 0, stylesUsed: new Set() }
    if (stateRef.current) stateRef.current.bonus = makeBonusSpot()
    resetBallVisual(true)
    setPhase('ready')
    setCommentary('Aim inside the goal, pick a style, Kick! — the red player shoots, the keeper dives.')
  }

  const onPointer = (e) => {
    if (phase === 'flying' || phase === 'done') return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const y = ((e.clientY - rect.top) / rect.height) * H
    setAim({
      x: clamp(x, GOAL.x + 8, GOAL.x + GOAL.w - 8),
      y: clamp(y, GOAL.y + 8, GOAL.y + GOAL.h - 4),
    })
    if (phase !== 'aiming') setPhase('aiming')
  }

  const resultLabel =
    lastResult === 'bonus'
      ? 'TOP BINS'
      : lastResult === 'goal'
        ? 'GOAL'
        : lastResult === 'save'
          ? 'SAVED'
          : lastResult === 'miss'
            ? 'MISS'
            : null

  const floatColor = {
    goal: 'text-sky-300',
    bonus: 'text-amber-300',
    fire: 'text-orange-400',
    save: 'text-accent-gold',
    miss: 'text-red-300',
    info: 'text-gray-200',
  }

  return (
    <section
      className="animate-fade-up bg-pitch-800 border border-sky-500/30 rounded-xl p-5 sm:p-6"
      data-gravity
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-sky-400 font-semibold">
            Google · beginner arcade
          </p>
          <h3 className="font-display text-lg text-white mt-0.5">Penalty Kick Lab</h3>
          <p className="text-sm text-gray-400 mt-1">
            Styles · bonus corners · streaks · crowd meter · Gemini calls every kick.
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-semibold text-accent-gold tabular-nums">
            {score.points}
            <span className="text-xs text-gray-500 font-normal ml-1">pts</span>
          </p>
          <p className="text-[10px] uppercase tracking-wider text-gray-500">
            {score.goals} goals · {score.taken}/{ROUNDS}
          </p>
          {streak > 0 && (
            <p className="text-[10px] text-orange-400 font-semibold mt-0.5">🔥 streak ×{streak}</p>
          )}
        </div>
      </div>

      {/* Crowd meter */}
      <div className="max-w-[360px] mx-auto mb-2">
        <div className="flex justify-between text-[10px] uppercase tracking-wider text-gray-500 mb-1">
          <span>Crowd</span>
          <span className="text-sky-300">{crowd}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-pitch-900 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-600 via-amber-400 to-orange-400 transition-all duration-500"
            style={{ width: `${crowd}%` }}
          />
        </div>
      </div>

      <div
        className="relative mx-auto w-full max-w-[360px] rounded-xl overflow-hidden border border-pitch-600 shadow-inner"
        style={{
          transform: shake ? `translate(${(Math.random() - 0.5) * shake}px, ${(Math.random() - 0.5) * shake}px)` : undefined,
        }}
      >
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-full touch-none cursor-crosshair bg-pitch-900"
          onPointerDown={(e) => {
            sfxRef.current?.ui()
            onPointer(e)
          }}
          onPointerMove={(e) => e.buttons === 1 && onPointer(e)}
        />
        {cheer && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p
              className={`text-4xl sm:text-5xl font-display drop-shadow-lg animate-fade-up ${
                cheer.bonus ? 'text-amber-300' : 'text-sky-300'
              }`}
            >
              {cheer.text}
            </p>
          </div>
        )}
        {floatMsg && (
          <div className="pointer-events-none absolute inset-x-0 top-1/3 text-center">
            <p className={`text-lg font-display font-bold animate-fade-up ${floatColor[floatMsg.kind] || floatColor.info}`}>
              {floatMsg.text}
            </p>
          </div>
        )}
        {resultLabel && (phase === 'result' || phase === 'done') && !cheer && (
          <div className="pointer-events-none absolute top-3 inset-x-0 text-center">
            <span
              className={`text-xs font-bold uppercase tracking-widest px-2 py-1 rounded ${
                lastResult === 'bonus' || lastResult === 'goal'
                  ? 'bg-accent-green/20 text-green-300'
                  : lastResult === 'save'
                    ? 'bg-accent-gold/20 text-accent-gold'
                    : 'bg-accent-red/20 text-red-300'
              }`}
            >
              {resultLabel}
            </span>
          </div>
        )}
        {newBadge && (
          <div className="pointer-events-none absolute bottom-3 inset-x-0 text-center">
            <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-sky-500/20 text-sky-200 border border-sky-400/30">
              Badge · {newBadge}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-3 max-w-[360px] mx-auto">
        {/* Shot styles */}
        <div>
          <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Shot style</p>
          <div className="grid grid-cols-4 gap-1.5">
            {Object.values(STYLES).map((st) => (
              <button
                key={st.id}
                type="button"
                disabled={phase === 'flying' || phase === 'done'}
                onClick={() => {
                  sfxRef.current?.ui()
                  setStyle(st.id)
                }}
                className={`py-2 rounded-lg text-[11px] font-semibold border transition-colors disabled:opacity-40 ${
                  style === st.id
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200'
                    : 'border-pitch-600 text-gray-400 hover:border-sky-500/40'
                }`}
                title={st.tip}
              >
                {st.label}
              </button>
            ))}
          </div>
          <p className="text-[11px] text-gray-500 mt-1">{STYLES[style]?.tip}</p>
        </div>

        <label className="block">
          <div className="flex justify-between text-[10px] uppercase tracking-wider text-gray-500 mb-1">
            <span>Power</span>
            <span className="text-sky-300">{Math.round(power * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.2}
            max={1}
            step={0.01}
            value={power}
            disabled={phase === 'flying' || phase === 'done'}
            onChange={(e) => setPower(Number(e.target.value))}
            className="w-full accent-sky-400"
          />
        </label>

        <div className="flex gap-2">
          {phase !== 'done' && score.taken < ROUNDS ? (
            <>
              <button
                type="button"
                onClick={kick}
                disabled={phase === 'flying'}
                className="flex-1 py-2.5 rounded-xl bg-sky-500 text-pitch-900 font-semibold hover:bg-sky-400 transition-colors disabled:opacity-50"
              >
                {phase === 'flying'
                  ? 'In flight…'
                  : phase === 'result'
                    ? 'Kick again →'
                    : `Kick · ${STYLES[style].label}`}
              </button>
              {phase === 'result' && (
                <button
                  type="button"
                  onClick={nextRound}
                  className="px-4 py-2.5 rounded-xl border border-pitch-600 text-gray-300 hover:bg-pitch-700/50"
                >
                  Place ball
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={replay}
              className="flex-1 py-2.5 rounded-xl bg-accent-gold text-pitch-900 font-semibold hover:bg-yellow-400"
            >
              Play again · {score.points} pts
            </button>
          )}
        </div>

        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {BADGE_DEFS.filter((b) => badges.includes(b.id)).map((b) => (
              <span
                key={b.id}
                className="text-[10px] px-2 py-0.5 rounded-full border border-amber-500/30 text-amber-200/90 bg-amber-500/10"
              >
                {b.label}
              </span>
            ))}
          </div>
        )}

        <div className="rounded-lg bg-pitch-900/80 border border-sky-500/20 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wider text-sky-400 mb-1">
            Gemini sideline {commentLoading ? '· thinking…' : ''}
          </p>
          <p className="text-sm text-gray-300 leading-snug">{commentary}</p>
          {cheer?.lang && cheer.lang !== 'en' && (
            <p className="text-[10px] text-gray-500 mt-1">
              Cheer via Google Translate → {cheer.lang.toUpperCase()}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
