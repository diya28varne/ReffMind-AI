import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

/**
 * Google Gravity easter egg — drop cards with Matter.js (classic Google Gravity vibe).
 */
export default function GoogleGravityButton({ rootSelector = 'main' }) {
  const [active, setActive] = useState(false)
  const [busy, setBusy] = useState(false)
  const cleanupRef = useRef(null)

  const stopGravity = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }
    setActive(false)
  }, [])

  useEffect(() => () => stopGravity(), [stopGravity])

  const startGravity = useCallback(() => {
    if (busy || active) return
    setBusy(true)
    try {
      const { Engine, Runner, Bodies, Composite, Mouse, MouseConstraint, Body } = Matter

      const root = document.querySelector(rootSelector) || document.body
      const targets = Array.from(root.querySelectorAll('[data-gravity]')).filter(
        (el) => el.offsetWidth > 20 && el.offsetHeight > 20,
      )
      if (!targets.length) {
        setBusy(false)
        return
      }

      const engine = Engine.create()
      engine.gravity.y = 1.05
      const world = engine.world
      const runner = Runner.create()

      const wallOpts = { isStatic: true, render: { visible: false } }
      const w = window.innerWidth
      const h = window.innerHeight
      Composite.add(world, [
        Bodies.rectangle(w / 2, h + 40, w + 200, 80, wallOpts),
        Bodies.rectangle(-40, h / 2, 80, h * 2, wallOpts),
        Bodies.rectangle(w + 40, h / 2, 80, h * 2, wallOpts),
      ])

      const mouse = Mouse.create(document.body)
      const mouseConstraint = MouseConstraint.create(engine, {
        mouse,
        constraint: { stiffness: 0.15, render: { visible: false } },
      })
      Composite.add(world, mouseConstraint)

      const originals = []
      const bodies = []

      targets.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const clone = el.cloneNode(true)
        clone.removeAttribute('data-gravity')
        clone.classList.add('gravity-clone')
        Object.assign(clone.style, {
          position: 'fixed',
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          margin: '0',
          zIndex: '9998',
          pointerEvents: 'auto',
          transformOrigin: 'center center',
        })
        document.body.appendChild(clone)
        el.style.visibility = 'hidden'

        originals.push({ el, clone })
        const body = Bodies.rectangle(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          Math.max(rect.width, 40),
          Math.max(rect.height, 40),
          { restitution: 0.35, friction: 0.2, density: 0.002 },
        )
        Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * -2,
        })
        bodies.push({ body, clone, w: rect.width, h: rect.height })
        Composite.add(world, body)
      })

      Runner.run(runner, engine)

      let raf = 0
      const tick = () => {
        bodies.forEach(({ body, clone, w: bw, h: bh }) => {
          clone.style.left = `${body.position.x - bw / 2}px`
          clone.style.top = `${body.position.y - bh / 2}px`
          clone.style.transform = `rotate(${body.angle}rad)`
        })
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)

      cleanupRef.current = () => {
        cancelAnimationFrame(raf)
        Runner.stop(runner)
        Engine.clear(engine)
        Composite.clear(world, false)
        originals.forEach(({ el, clone }) => {
          clone.remove()
          el.style.visibility = ''
        })
      }

      setActive(true)
    } catch (err) {
      console.warn('Google Gravity failed', err)
    } finally {
      setBusy(false)
    }
  }, [active, busy, rootSelector])

  return (
    <div className="flex items-center gap-2">
      {!active ? (
        <button
          type="button"
          onClick={startGravity}
          disabled={busy}
          className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 transition-colors font-semibold disabled:opacity-50"
          title="Google Gravity — drop the cards like the classic easter egg"
        >
          {busy ? 'Loading…' : 'Google Gravity'}
        </button>
      ) : (
        <button
          type="button"
          onClick={stopGravity}
          className="text-[10px] uppercase tracking-wider px-2.5 py-1.5 rounded-lg border border-accent-gold/40 bg-accent-gold/10 text-accent-gold hover:bg-accent-gold/20 transition-colors font-semibold"
        >
          Reset pitch
        </button>
      )}
    </div>
  )
}
