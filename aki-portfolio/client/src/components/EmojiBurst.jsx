import { useEffect, useState } from 'react'
import { prefersReducedMotion } from '../lib/effects.js'

const POOL = ['🌈', '🌈', '🌈', '✨', '☕', '💻', '🦄', '🪄', '💖', '🌸', '⚡', '🔥', '🧶', '🎉']

// Rainbow wipe + emojis floating from the bottom of the screen to the top.
export default function EmojiBurst() {
  const [bursts, setBursts] = useState([])

  useEffect(() => {
    const onBurst = () => {
      if (prefersReducedMotion()) return
      const id = Date.now() + Math.random()
      const items = Array.from({ length: 30 }, (_, i) => ({
        i,
        emoji: POOL[Math.floor(Math.random() * POOL.length)],
        left: 3 + Math.random() * 94,
        size: 22 + Math.random() * 30,
        dur: 2.4 + Math.random() * 2,
        delay: Math.random() * 0.9,
        sway: (Math.random() - 0.5) * 120,
      }))
      setBursts((b) => [...b, { id, items }])
      setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 6200)
    }
    window.addEventListener('aki-burst', onBurst)
    return () => window.removeEventListener('aki-burst', onBurst)
  }, [])

  return (
    <div className="burst-layer" aria-hidden="true">
      {bursts.map((b) => (
        <div key={b.id}>
          <div className="rainbow-wipe" />
          {b.items.map((it) => (
            <span
              key={it.i}
              className="float-emoji"
              style={{
                left: `${it.left}%`,
                fontSize: it.size,
                animationDuration: `${it.dur}s`,
                animationDelay: `${it.delay}s`,
                '--sway': `${it.sway}px`,
              }}
            >
              {it.emoji}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
