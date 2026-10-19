import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

const KEY = 'aki-coffee-clicker'
const OFFLINE_CAP_MS = 60 * 60 * 1000

const UPGRADES = [
  { id: 'linter', name: 'Auto-Linter', desc: 'fixes semicolons while you sleep', base: 15, rate: 1 },
  { id: 'keyboard', name: 'Caffeinated Keyboard', desc: 'keys that type back', base: 100, rate: 4 },
  { id: 'copilot', name: 'Copilot', desc: 'finishes your sentences', base: 600, rate: 20 },
  { id: 'duck', name: 'Rubber Duck', desc: 'debugs by listening', base: 3000, rate: 100 },
]

const costOf = (u, owned) => Math.ceil(u.base * Math.pow(1.2, owned))
const rateOf = (owned) => UPGRADES.reduce((sum, u) => sum + u.rate * (owned[u.id] || 0), 0)

// 12x11 pixel-art mug. s = steam, m = mug, c = coffee.
const MUG = [
  '...s...s....',
  '....s...s...',
  '............',
  '.mmmmmmmm...',
  '.mccccccmmm.',
  '.mccccccm.m.',
  '.mccccccm.m.',
  '.mccccccmmm.',
  '.mmmmmmmm...',
  '..mmmmmm....',
]
const COLORS = { s: 'var(--muted)', m: '#d98c4f', c: '#3a2112' }

function load() {
  const fresh = { loc: 0, total: 0, owned: {}, savedAt: Date.now() }
  try {
    const s = JSON.parse(localStorage.getItem(KEY))
    if (!s || typeof s.loc !== 'number') return fresh
    // Catch up on what the upgrades wrote while the tab was closed (capped at an hour).
    const away = Math.min(Date.now() - (s.savedAt || Date.now()), OFFLINE_CAP_MS)
    const gained = (rateOf(s.owned || {}) * away) / 1000
    return { loc: s.loc + gained, total: (s.total || 0) + gained, owned: s.owned || {}, savedAt: Date.now() }
  } catch {
    return fresh
  }
}

const fmt = (n) => Math.floor(n).toLocaleString()

export default function CoffeeClicker() {
  const [open, setOpen] = useState(false)
  const [game, setGame] = useState(load)
  const [pops, setPops] = useState([])
  const ref = useRef(game)
  ref.current = game

  // Passive income, 5 ticks a second.
  useEffect(() => {
    const id = setInterval(() => {
      setGame((g) => {
        const r = rateOf(g.owned)
        return r ? { ...g, loc: g.loc + r / 5, total: g.total + r / 5 } : g
      })
    }, 200)
    return () => clearInterval(id)
  }, [])

  // Save every couple of seconds and when the tab goes away.
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(KEY, JSON.stringify({ ...ref.current, savedAt: Date.now() }))
      } catch { /* storage unavailable */ }
    }
    const id = setInterval(save, 2000)
    document.addEventListener('visibilitychange', save)
    window.addEventListener('pagehide', save)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', save)
      window.removeEventListener('pagehide', save)
      save()
    }
  }, [])

  function brew() {
    setGame((g) => ({ ...g, loc: g.loc + 1, total: g.total + 1 }))
    const id = Date.now() + Math.random()
    setPops((p) => [...p, { id, x: (Math.random() - 0.5) * 50 }])
    setTimeout(() => setPops((p) => p.filter((x) => x.id !== id)), 800)
  }

  function buy(u) {
    setGame((g) => {
      const cost = costOf(u, g.owned[u.id] || 0)
      if (g.loc < cost) return g
      return { ...g, loc: g.loc - cost, owned: { ...g.owned, [u.id]: (g.owned[u.id] || 0) + 1 } }
    })
  }

  function reset() {
    if (window.confirm('Reset your coffee progress?')) {
      setGame({ loc: 0, total: 0, owned: {}, savedAt: Date.now() })
    }
  }

  const rate = rateOf(game.owned)
  const mug = (size) => (
    <svg viewBox="0 0 12 10" width={size} height={size * (10 / 12)} shapeRendering="crispEdges" aria-hidden="true">
      {MUG.flatMap((row, y) =>
        [...row].map((ch, x) => (ch === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={COLORS[ch]} className={ch === 's' ? 'steam' : undefined} />))
      )}
    </svg>
  )

  if (!open) {
    return (
      <button className="clicker-fab" onClick={() => setOpen(true)} aria-label="Open the Coffee-to-Code clicker" title="Coffee-to-Code">
        {mug(26)}
        {game.total > 0 && <span className="clicker-badge">{fmt(game.loc)}</span>}
      </button>
    )
  }

  return (
    <aside className="clicker" aria-label="Coffee-to-Code idle clicker">
      <div className="clicker-head">
        <strong>Coffee → Code</strong>
        <button onClick={() => setOpen(false)} aria-label="Close"><X size={16} /></button>
      </div>

      <div className="clicker-stage">
        <button className="mug-btn" onClick={brew} aria-label="Sip coffee, write a line of code">
          {mug(96)}
        </button>
        {pops.map((p) => (
          <span key={p.id} className="loc-pop" style={{ left: `calc(50% + ${p.x}px)` }}>+1 LOC</span>
        ))}
      </div>

      <p className="clicker-count">{fmt(game.loc)} <span>lines of code</span></p>
      <p className="clicker-rate">{rate ? `+${rate} LOC/s` : 'click the mug'}</p>

      <ul className="upgrades">
        {UPGRADES.map((u) => {
          const owned = game.owned[u.id] || 0
          const cost = costOf(u, owned)
          return (
            <li key={u.id}>
              <button disabled={game.loc < cost} onClick={() => buy(u)}>
                <span className="u-name">{u.name} <em>×{owned}</em></span>
                <span className="u-desc">{u.desc} · +{u.rate}/s</span>
                <span className="u-cost">{fmt(cost)} LOC</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="clicker-foot">
        <span>Lifetime: {fmt(game.total)} LOC</span>
        <button onClick={reset}>reset</button>
      </div>
    </aside>
  )
}
