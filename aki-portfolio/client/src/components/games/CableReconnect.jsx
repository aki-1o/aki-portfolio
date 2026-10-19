import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Monitor, Server } from 'lucide-react'
import { COLS, ROWS, generate, seededRng, trace } from '../../lib/cable.js'

const LIT = '#39d353'

// Wire artwork at rotation 0 (the tile element is rotated with CSS).
function Wire({ type, lit }) {
  const stroke = lit ? LIT : 'var(--muted)'
  const common = { fill: 'none', stroke, strokeWidth: 9, strokeLinecap: 'round', strokeLinejoin: 'round' }
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {type === 'straight' && <path d="M0 50 H100" {...common} />}
      {type === 'corner' && <path d="M100 50 H66 Q50 50 50 66 V100" {...common} />}
      {type === 'tee' && <path d="M0 50 H100 M50 50 V100" {...common} />}
      {type === 'broken' && (
        <g>
          <path d="M0 50 H34 M66 50 H100" {...common} stroke="#ff6b6b" strokeDasharray="2 14" />
          <text x="50" y="57" textAnchor="middle" fontSize="22" fontWeight="700" fill="#ff6b6b" fontFamily="ui-monospace,Menlo,monospace">404</text>
        </g>
      )}
    </svg>
  )
}

export default function CableReconnect({ seed }) {
  const navigate = useNavigate()
  const [puzzle, setPuzzle] = useState(() => generate(seed != null ? seededRng(seed) : Math.random))
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)
  const [count, setCount] = useState(3)
  const [cancelled, setCancelled] = useState(false)
  const startedAt = useRef(Date.now())

  const { lit, connected } = useMemo(() => trace(puzzle), [puzzle])

  // Stopwatch.
  useEffect(() => {
    if (done) return
    const id = setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 100)
    return () => clearInterval(id)
  }, [done])

  useEffect(() => {
    if (connected && !done) setDone(true)
  }, [connected, done])

  // Circuit complete: wait 3 seconds, then send the visitor home.
  useEffect(() => {
    if (!done || cancelled) return
    setCount(3)
    let n = 3
    const id = setInterval(() => {
      n -= 1
      setCount(n)
      if (n <= 0) {
        clearInterval(id)
        navigate('/')
      }
    }, 1000)
    return () => clearInterval(id)
  }, [done, cancelled, navigate])

  function rotate(r, c) {
    if (done) return
    setPuzzle((p) => ({
      ...p,
      grid: p.grid.map((row, ri) => row.map((t, ci) => (ri === r && ci === c ? { ...t, rot: t.rot + 1 } : t))),
    }))
  }

  function reset() {
    setPuzzle(generate())
    setDone(false)
    setCancelled(false)
    setElapsed(0)
    startedAt.current = Date.now()
  }

  return (
    <div className="nf-game">
      <div className="nf-hud">
        <span>Time <b>{elapsed.toFixed(1)}s</b></span>
        <span className="nf-hint">Click a tile to rotate it</span>
        <button className="nf-link-btn" onClick={reset}>New puzzle</button>
      </div>

      <div className="cable-board" style={{ '--cols': COLS, '--rows': ROWS }}>
        <div className={`cable-node client${lit.has(`${puzzle.startRow},0`) ? ' on' : ''}`} style={{ gridRow: puzzle.startRow + 1, gridColumn: 1 }}>
          <Monitor size={22} /><small>Browser</small>
        </div>

        {puzzle.grid.map((row, r) =>
          row.map((tile, c) => (
            <button
              key={`${r}-${c}`}
              className="cable-tile"
              style={{ gridRow: r + 1, gridColumn: c + 2 }}
              onClick={() => rotate(r, c)}
              aria-label={`Rotate tile, row ${r + 1}, column ${c + 1}`}
              data-type={tile.type}
              data-rot={((tile.rot % 4) + 4) % 4}
              disabled={done}
            >
              <span className="cable-rot" style={{ transform: `rotate(${tile.rot * 90}deg)` }}>
                <Wire type={tile.type} lit={lit.has(`${r},${c}`)} />
              </span>
            </button>
          ))
        )}

        <div className={`cable-node server${connected ? ' on' : ''}`} style={{ gridRow: puzzle.endRow + 1, gridColumn: COLS + 2 }}>
          <Server size={22} /><small>Server</small>
        </div>
      </div>

      {done && (
        <div className="nf-reward" role="status">
          <p className="nf-badge">✅ Server Connection Restored!</p>
          <p>Solved in {elapsed.toFixed(1)}s.</p>
          {!cancelled ? (
            <>
              <p>Heading home in {Math.max(count, 0)}…</p>
              <button className="nf-link-btn" onClick={() => setCancelled(true)}>Stay here</button>
            </>
          ) : (
            <Link to="/" className="cta-pill">Take me home</Link>
          )}
        </div>
      )}
    </div>
  )
}
