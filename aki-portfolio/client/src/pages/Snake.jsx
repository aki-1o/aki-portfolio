import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { COLS, ROWS, createGame, step, turn, tickMs } from '../lib/snake.js'
import { TRAIL_MINUTES, trailRemainingMs, unlockTrail } from '../lib/effects.js'

const SCORES_KEY = 'aki-snake-scores'
const TRAIL_SCORE = 100 // points needed to earn the cursor trail
const IGNITE_MS = 1000

// GitHub-style contribution palettes (level 0 = empty square).
const PAL = {
  dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
}
const BOOST_COLOR = '#f0883e'
const COFFEE_SPRITE = ['..w..w..', '.w..w...', 'bbbbbb..', 'bccccbb.', 'bccccb.b', 'bccccbb.', 'bbbbbb..', '.bbbb...']
const SPRITE_COLORS = { b: '#c68642', c: '#5a3a1a', w: '#d0d7de' }

const KEYS = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
}

function loadScores() {
  try {
    const s = JSON.parse(localStorage.getItem(SCORES_KEY))
    return Array.isArray(s) ? s : []
  } catch {
    return []
  }
}
function saveScore(score) {
  const next = [...loadScores(), { score, date: new Date().toISOString().slice(0, 10) }]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
  try {
    localStorage.setItem(SCORES_KEY, JSON.stringify(next))
  } catch { /* storage unavailable */ }
  return next
}

const makeGraph = () =>
  Array.from({ length: COLS * ROWS }, () => {
    const r = Math.random()
    return r < 0.38 ? 0 : r < 0.62 ? 1 : r < 0.82 ? 2 : r < 0.94 ? 3 : 4
  })

export default function Snake() {
  const location = useLocation()
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const R = useRef({
    phase: 'idle', game: null, acc: 0, last: 0, igniteStart: 0, igniteOrigin: { x: COLS / 2, y: ROWS / 2 },
    graph: makeGraph(), cell: 24, buf: '', trailGiven: false, touch: null,
  })
  const [ui, setUi] = useState({ phase: 'idle', score: 0, boostMs: 0, trail: trailRemainingMs() > 0 })
  const [scores, setScores] = useState(loadScores)

  useEffect(() => {
    document.title = 'commit.snake() — Akshat Thoriya'
    const r = R.current

    const start = (origin) => {
      r.game = createGame()
      r.phase = 'igniting'
      r.igniteStart = performance.now()
      r.igniteOrigin = origin || { x: Math.floor(COLS / 2), y: Math.floor(ROWS / 2) }
      r.acc = 0
      r.trailGiven = false
      setUi({ phase: 'igniting', score: 0, boostMs: 0, trail: trailRemainingMs() > 0 })
    }
    const togglePause = () => {
      if (r.phase === 'playing') { r.phase = 'paused'; setUi((u) => ({ ...u, phase: 'paused' })) }
      else if (r.phase === 'paused') { r.phase = 'playing'; r.last = performance.now(); setUi((u) => ({ ...u, phase: 'playing' })) }
    }
    const finish = () => {
      r.phase = 'over'
      if (r.game.score > 0) setScores(saveScore(r.game.score))
      setUi((u) => ({ ...u, phase: 'over', score: r.game.score, boostMs: 0 }))
    }
    const steer = (d) => r.phase === 'playing' && turn(r.game, d)

    // ---- sizing ----
    const resize = () => {
      const cv = canvasRef.current
      if (!cv || !wrapRef.current) return
      const dpr = window.devicePixelRatio || 1
      const cell = Math.max(10, Math.floor(Math.min(wrapRef.current.clientWidth / COLS, (window.innerHeight * 0.62) / ROWS)))
      r.cell = cell
      cv.width = cell * COLS * dpr
      cv.height = cell * ROWS * dpr
      cv.style.width = `${cell * COLS}px`
      cv.style.height = `${cell * ROWS}px`
      cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrapRef.current)

    // ---- drawing ----
    const roundRect = (ctx, x, y, w, h, rad) => {
      ctx.beginPath()
      ctx.roundRect ? ctx.roundRect(x, y, w, h, rad) : ctx.rect(x, y, w, h)
    }
    const draw = (now) => {
      const cv = canvasRef.current
      if (!cv) return
      const ctx = cv.getContext('2d')
      const cell = r.cell
      const pal = PAL[document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark']
      const gap = Math.max(1, cell * 0.14)
      const size = cell - gap * 2
      ctx.clearRect(0, 0, cv.width, cv.height)
      ctx.shadowBlur = 0

      const square = (x, y, color, alpha = 1) => {
        ctx.globalAlpha = alpha
        ctx.fillStyle = color
        roundRect(ctx, x * cell + gap, y * cell + gap, size, size, cell * 0.2)
        ctx.fill()
        ctx.globalAlpha = 1
      }

      const igniting = r.phase === 'igniting'
      const t = igniting ? Math.min((now - r.igniteStart) / IGNITE_MS, 1) : 1
      const showGraph = r.phase === 'idle' || igniting

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (!showGraph) { square(x, y, pal[0]); continue }
          let level = r.graph[y * COLS + x]
          if (r.phase === 'idle' && (x * 7 + y * 13 + Math.floor(now / 900)) % 29 === 0) level = Math.min(4, level + 1)
          if (!igniting) { square(x, y, pal[level]); continue }
          // The board lights up in a wave spreading from where you clicked, then settles to empty squares.
          const dist = (Math.abs(x - r.igniteOrigin.x) + Math.abs(y - r.igniteOrigin.y)) / (COLS + ROWS)
          const p = t * 1.7
          if (p < dist) { square(x, y, pal[level]); continue }
          const flash = 1 - Math.min((p - dist) / 0.45, 1)
          square(x, y, pal[0])
          if (flash > 0) square(x, y, pal[4], flash)
        }
      }

      const g = r.game
      if (g && (r.phase === 'playing' || r.phase === 'paused' || r.phase === 'over')) {
        const boosted = g.clock < g.boostUntil
        const dim = r.phase === 'over' ? 0.45 : 1

        if (g.commit) {
          const cx = (g.commit.x + 0.5) * cell
          const cy = (g.commit.y + 0.5) * cell
          const pulse = 1 + Math.sin(now / 220) * 0.08
          ctx.shadowColor = pal[4]
          ctx.shadowBlur = 14
          ctx.fillStyle = pal[4]
          ctx.beginPath()
          ctx.arc(cx, cy, cell * 0.28 * pulse, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        }

        if (g.coffee) {
          const px = (cell - gap * 2) / 8
          const left = Math.max(0, g.coffee.expiresAt - g.clock)
          const blink = left < 2000 && Math.floor(now / 160) % 2 === 0
          if (!blink) {
            COFFEE_SPRITE.forEach((row, sy) =>
              [...row].forEach((ch, sx) => {
                if (ch === '.') return
                ctx.fillStyle = SPRITE_COLORS[ch]
                ctx.fillRect(g.coffee.x * cell + gap + sx * px, g.coffee.y * cell + gap + sy * px, Math.ceil(px), Math.ceil(px))
              })
            )
          }
        }

        g.snake.forEach((s, i) => {
          const head = i === 0
          const color = boosted ? BOOST_COLOR : head ? pal[4] : pal[3]
          if (head || boosted) {
            ctx.shadowColor = color
            ctx.shadowBlur = head ? 16 : 8
          }
          square(s.x, s.y, color, dim)
          ctx.shadowBlur = 0
        })
      }
    }

    // ---- loop ----
    let raf
    r.last = performance.now()
    const frame = (now) => {
      const dt = Math.min(now - r.last, 100)
      r.last = now

      if (r.phase === 'igniting' && now - r.igniteStart >= IGNITE_MS) {
        r.phase = 'playing'
        setUi((u) => ({ ...u, phase: 'playing' }))
      }
      if (r.phase === 'playing') {
        r.acc += dt
        let moved = false
        while (r.acc >= tickMs(r.game) && r.game.alive) {
          r.acc -= tickMs(r.game)
          step(r.game)
          moved = true
        }
        if (moved) {
          const g = r.game
          if (!r.trailGiven && g.score >= TRAIL_SCORE) {
            r.trailGiven = true
            unlockTrail()
          }
          setUi((u) => ({ ...u, score: g.score, boostMs: Math.max(0, g.boostUntil - g.clock), trail: r.trailGiven || u.trail }))
        }
        if (!r.game.alive) finish()
      }
      draw(now)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // ---- input ----
    const onKey = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.ctrlKey || e.metaKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k.startsWith('arrow') || e.key === ' ') e.preventDefault()

      if (KEYS[k]) steer(KEYS[k])
      if (e.key === ' ' || e.key === 'Enter') {
        if (r.phase === 'idle' || r.phase === 'over') start()
        else togglePause()
      } else if (e.key === 'Escape') {
        if (r.phase === 'playing') togglePause()
      }
      if (e.key.length === 1) {
        r.buf = (r.buf + k).slice(-5)
        if (r.buf === 'snake' && (r.phase === 'idle' || r.phase === 'over')) { r.buf = ''; start() }
      }
    }
    const onVisibility = () => { if (document.hidden && r.phase === 'playing') togglePause() }
    window.addEventListener('keydown', onKey)
    document.addEventListener('visibilitychange', onVisibility)

    const cv = canvasRef.current
    const cellAt = (e) => {
      const rect = cv.getBoundingClientRect()
      return {
        x: Math.min(COLS - 1, Math.max(0, Math.floor(((e.clientX - rect.left) / rect.width) * COLS))),
        y: Math.min(ROWS - 1, Math.max(0, Math.floor(((e.clientY - rect.top) / rect.height) * ROWS))),
      }
    }
    const onClick = (e) => {
      if (r.phase === 'idle' || r.phase === 'over') start(cellAt(e))
      else if (r.phase === 'paused') togglePause()
    }
    const onTouchStart = (e) => { r.touch = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
    const onTouchEnd = (e) => {
      if (!r.touch) return
      const dx = e.changedTouches[0].clientX - r.touch.x
      const dy = e.changedTouches[0].clientY - r.touch.y
      r.touch = null
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
      steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
    }
    cv.addEventListener('click', onClick)
    cv.addEventListener('touchstart', onTouchStart, { passive: true })
    cv.addEventListener('touchend', onTouchEnd, { passive: true })

    if (location.state?.autostart) start()

    r.start = start
    r.togglePause = togglePause
    r.steer = steer

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onVisibility)
      cv.removeEventListener('click', onClick)
      cv.removeEventListener('touchstart', onTouchStart)
      cv.removeEventListener('touchend', onTouchEnd)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const r = R.current
  const best = scores[0]?.score ?? 0

  return (
    <main className="wrap snake-page">
      <div className="snake-top">
        <div>
          <p className="eyebrow">commit.snake()</p>
          <h1 className="snake-title">Keep the streak alive</h1>
        </div>
        <Link to="/" className="view-more-link">Back home</Link>
      </div>

      <div className="snake-hud">
        <span>Score <b>{ui.score}</b></span>
        <span>Best <b>{Math.max(best, ui.score)}</b></span>
        {ui.boostMs > 0 && <span className="boost">☕ boost {(ui.boostMs / 1000).toFixed(1)}s · 2× points</span>}
        {ui.trail && <span className="trail-chip">✨ cursor trail on</span>}
      </div>

      <div className="snake-board" ref={wrapRef}>
        <div className="snake-canvas-wrap">
          <canvas ref={canvasRef} className="snake-canvas" aria-label="Snake game board" />
          {ui.phase === 'idle' && (
            <div className="snake-overlay">
              <p className="snake-overlay-title">git commit -m "play"</p>
              <p>Click any square or press Space. Or just type <code>snake</code>.</p>
            </div>
          )}
          {ui.phase === 'paused' && (
            <div className="snake-overlay"><p className="snake-overlay-title">Paused</p><p>Space to resume</p></div>
          )}
          {ui.phase === 'over' && (
            <div className="snake-overlay">
              <p className="snake-overlay-title">Merge conflict</p>
              <p>Score {ui.score}{ui.score > 0 && ui.score >= best ? ' · new best' : ''}</p>
              <button className="cta-pill" onClick={() => r.start()}>Play again</button>
            </div>
          )}
        </div>
      </div>

      <div className="snake-pad" aria-label="Touch controls">
        <button onClick={() => r.steer?.('up')} aria-label="Up">▲</button>
        <button onClick={() => r.steer?.('left')} aria-label="Left">◀</button>
        <button onClick={() => r.togglePause?.()} aria-label="Pause">❚❚</button>
        <button onClick={() => r.steer?.('right')} aria-label="Right">▶</button>
        <button onClick={() => r.steer?.('down')} aria-label="Down">▼</button>
      </div>

      <div className="snake-info">
        <div>
          <h2>How to play</h2>
          <ul>
            <li>Arrow keys / WASD / swipe to steer, Space to pause.</li>
            <li>Green dots are commits: +10 each.</li>
            <li>Every 5th commit a coffee cup appears for a few seconds. Grab it for a 5s speed boost with double points.</li>
            <li>Score {TRAIL_SCORE}+ to unlock a glowing cursor trail across the site for {TRAIL_MINUTES} minutes.</li>
          </ul>
        </div>
        <div>
          <h2>High scores <small>(this browser)</small></h2>
          {scores.length ? (
            <ol>{scores.map((s, i) => <li key={i}>{s.score} <small>{s.date}</small></li>)}</ol>
          ) : (
            <p className="muted">No runs yet.</p>
          )}
        </div>
      </div>
    </main>
  )
}
