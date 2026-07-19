import { useCallback, useEffect, useRef, useState } from 'react'
import Matter from 'matter-js'

/**
 * Google Gravity easter egg — drop cards with Matter.js.
 * Drag uses native Pointer Events (Matter MouseConstraint is unreliable without a canvas).
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
      const { Engine, Runner, Bodies, Composite, Body } = Matter

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

      const originals = []
      const bodies = []
      const dragCleanups = []

      // Shared drag state (one card at a time)
      let dragging = null // { body, clone, offsetX, offsetY, lastX, lastY, lastT }
      const onPointerMove = (e) => {
        if (!dragging) return
        e.preventDefault()
        const x = e.clientX - dragging.offsetX
        const y = e.clientY - dragging.offsetY
        Body.setPosition(dragging.body, { x, y })
        Body.setAngularVelocity(dragging.body, 0)
        const now = performance.now()
        const dt = Math.max(now - dragging.lastT, 1) / 1000
        dragging.vx = (x - dragging.lastX) / dt
        dragging.vy = (y - dragging.lastY) / dt
        dragging.lastX = x
        dragging.lastY = y
        dragging.lastT = now
      }
      const endDrag = (e) => {
        if (!dragging) return
        const { body, clone, vx = 0, vy = 0 } = dragging
        Body.setStatic(body, false)
        Body.setVelocity(body, {
          x: Math.max(-40, Math.min(40, vx * 0.05)),
          y: Math.max(-40, Math.min(40, vy * 0.05)),
        })
        clone.style.cursor = 'grab'
        clone.style.zIndex = '9998'
        if (e?.pointerId != null) {
          try {
            clone.releasePointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
        }
        dragging = null
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
      }
      window.addEventListener('pointermove', onPointerMove, { passive: false })
      window.addEventListener('pointerup', endDrag)
      window.addEventListener('pointercancel', endDrag)

      targets.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const clone = el.cloneNode(true)
        clone.removeAttribute('data-gravity')
        clone.classList.add('gravity-clone')
        // Disable nested interactive bits so drag always wins
        clone.querySelectorAll('a, button, input, textarea, select, iframe').forEach((node) => {
          node.setAttribute('tabindex', '-1')
          node.style.pointerEvents = 'none'
        })
        Object.assign(clone.style, {
          position: 'fixed',
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          margin: '0',
          zIndex: '9998',
          pointerEvents: 'auto',
          transformOrigin: 'center center',
          cursor: 'grab',
          touchAction: 'none',
          userSelect: 'none',
        })
        document.body.appendChild(clone)
        el.style.visibility = 'hidden'

        originals.push({ el, clone })
        const body = Bodies.rectangle(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          Math.max(rect.width, 40),
          Math.max(rect.height, 40),
          { restitution: 0.35, friction: 0.25, density: 0.002, frictionAir: 0.02 },
        )
        Body.setVelocity(body, {
          x: (Math.random() - 0.5) * 4,
          y: Math.random() * -2,
        })
        bodies.push({ body, clone, w: rect.width, h: rect.height })
        Composite.add(world, body)

        const onPointerDown = (e) => {
          if (e.button != null && e.button !== 0) return
          e.preventDefault()
          e.stopPropagation()
          const bx = body.position.x
          const by = body.position.y
          dragging = {
            body,
            clone,
            offsetX: e.clientX - bx,
            offsetY: e.clientY - by,
            lastX: bx,
            lastY: by,
            lastT: performance.now(),
            vx: 0,
            vy: 0,
          }
          Body.setStatic(body, true)
          Body.setAngularVelocity(body, 0)
          Body.setVelocity(body, { x: 0, y: 0 })
          clone.style.cursor = 'grabbing'
          clone.style.zIndex = '10000'
          document.body.style.userSelect = 'none'
          document.body.style.cursor = 'grabbing'
          try {
            clone.setPointerCapture(e.pointerId)
          } catch {
            /* ignore */
          }
        }
        clone.addEventListener('pointerdown', onPointerDown)
        dragCleanups.push(() => clone.removeEventListener('pointerdown', onPointerDown))
      })

      Runner.run(runner, engine)

      let raf = 0
      const tick = () => {
        bodies.forEach(({ body, clone, w: bw, h: bh }) => {
          if (dragging && dragging.body === body) {
            // Still sync DOM while held (position set in pointermove)
            clone.style.left = `${body.position.x - bw / 2}px`
            clone.style.top = `${body.position.y - bh / 2}px`
            clone.style.transform = `rotate(${body.angle}rad)`
            return
          }
          clone.style.left = `${body.position.x - bw / 2}px`
          clone.style.top = `${body.position.y - bh / 2}px`
          clone.style.transform = `rotate(${body.angle}rad)`
        })
        raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)

      cleanupRef.current = () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('pointerup', endDrag)
        window.removeEventListener('pointercancel', endDrag)
        dragCleanups.forEach((fn) => fn())
        dragging = null
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
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
          title="Google Gravity — drop the cards, then grab and fling them"
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
