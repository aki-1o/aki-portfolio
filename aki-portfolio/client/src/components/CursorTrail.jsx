import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion, trailRemainingMs } from '../lib/effects.js'

// Glowing green cursor trail. Only runs while the snake reward is active.
export default function CursorTrail() {
  const [active, setActive] = useState(() => trailRemainingMs() > 0)
  const canvasRef = useRef(null)

  useEffect(() => {
    const check = () => setActive(trailRemainingMs() > 0)
    window.addEventListener('aki-trail', check)
    window.addEventListener('storage', check)
    const id = setInterval(check, 1000)
    return () => {
      window.removeEventListener('aki-trail', check)
      window.removeEventListener('storage', check)
      clearInterval(id)
    }
  }, [])

  useEffect(() => {
    if (!active || prefersReducedMotion()) return
    const cv = canvasRef.current
    const ctx = cv.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    const resize = () => {
      cv.width = window.innerWidth * dpr
      cv.height = window.innerHeight * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()

    let parts = []
    let raf
    const onMove = (e) => {
      parts.push({ x: e.clientX, y: e.clientY, born: performance.now(), hue: 130 + Math.random() * 50 })
      if (parts.length > 60) parts.shift()
    }
    const draw = (now) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      ctx.globalCompositeOperation = 'lighter'
      parts = parts.filter((p) => now - p.born < 700)
      for (const p of parts) {
        const life = 1 - (now - p.born) / 700
        ctx.beginPath()
        ctx.fillStyle = `hsla(${p.hue}, 95%, 60%, ${life * 0.8})`
        ctx.shadowColor = `hsl(${p.hue}, 100%, 55%)`
        ctx.shadowBlur = 18
        ctx.arc(p.x, p.y, 2 + life * 6, 0, Math.PI * 2)
        ctx.fill()
      }
      raf = requestAnimationFrame(draw)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', resize)
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
    }
  }, [active])

  if (!active) return null
  return <canvas ref={canvasRef} className="trail-canvas" aria-hidden="true" />
}
