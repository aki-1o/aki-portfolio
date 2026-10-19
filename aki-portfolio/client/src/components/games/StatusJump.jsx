import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CRUMBLE_S, H, PLAT_H, SIZE, TYPES, W, createState, stepJump } from '../../lib/jump.js'

const BEST_KEY = 'aki-jump-best'
const loadBest = () => {
  try { return Number(localStorage.getItem(BEST_KEY)) || 0 } catch { return 0 }
}

export default function StatusJump() {
  const cvRef = useRef(null)
  const S = useRef(null)
  const [ui, setUi] = useState({ phase: 'idle', score: 0, best: loadBest(), cause: '' })

  useEffect(() => {
    const cv = cvRef.current
    const ctx = cv.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const s = { phase: 'idle', game: createState(), keys: { l: false, r: false }, target: null, score: 0, cause: '' }
    S.current = s
    let synced = ''
    const sync = () => {
      const snap = `${s.phase}|${s.score}`
      if (snap === synced) return
      synced = snap
      setUi((u) => ({ ...u, phase: s.phase, score: s.score, cause: s.cause }))
    }

    const start = () => {
      s.game = createState()
      s.score = 0
      s.cause = ''
      s.phase = 'playing'
      sync()
    }
    s.start = start

    const die = (cause) => {
      s.phase = 'over'
      s.cause = cause
      setUi((u) => {
        const best = Math.max(u.best, s.score)
        try { localStorage.setItem(BEST_KEY, String(best)) } catch { /* storage unavailable */ }
        return { ...u, phase: 'over', score: s.score, best, cause }
      })
    }

    function update(dt) {
      const g = s.game
      // steer with the keys, or toward the pointer
      let dir = (s.keys.r ? 1 : 0) - (s.keys.l ? 1 : 0)
      if (!dir && s.target != null) {
        const d = s.target - (g.p.x + SIZE / 2)
        dir = Math.abs(d) < 6 ? 0 : Math.max(-1, Math.min(1, d / 40))
      }
      const failure = stepJump(g, dt, dir)
      s.score = g.score
      if (failure) die(failure)
    }

    function draw() {
      ctx.fillStyle = '#0b0d10'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#ffffff10'
      for (let i = 0; i < 30; i++) ctx.fillRect((i * 83) % W, ((i * 61 - s.game.cam * 0.2) % H + H) % H, 1.5, 1.5)

      ctx.textAlign = 'center'
      for (const pl of s.game.plats) {
        const t = TYPES[pl.type]
        const y = pl.y - s.game.cam
        const crumble = pl.state === 'crumbling' ? pl.t / CRUMBLE_S : 0
        ctx.globalAlpha = 1 - crumble * 0.7
        const jitter = crumble ? (Math.random() - 0.5) * 3 : 0
        ctx.fillStyle = t.color + '28'
        ctx.strokeStyle = t.color
        ctx.lineWidth = 2
        ctx.setLineDash(pl.type === 'missing' ? [5, 4] : [])
        ctx.beginPath()
        ctx.roundRect(pl.x + jitter, y, pl.w, PLAT_H, 6)
        ctx.fill()
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = t.color
        ctx.font = '700 12px ui-monospace, Menlo, Consolas, monospace'
        ctx.fillText(t.label, pl.x + pl.w / 2 + jitter, y + 14)
        ctx.globalAlpha = 1
      }

      {
        const { x, y } = s.game.p
        const py = y - s.game.cam
        ctx.fillStyle = '#58a6ff'
        ctx.shadowColor = '#58a6ff'
        ctx.shadowBlur = 10
        ctx.beginPath()
        ctx.roundRect(x, py, SIZE, SIZE, 7)
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.fillStyle = '#0b0d10'
        ctx.fillRect(x + 7, py + 9, 4, 6)
        ctx.fillRect(x + 17, py + 9, 4, 6)
      }
    }

    let raf
    let last = performance.now()
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.033)
      last = now
      if (s.phase === 'playing') {
        update(dt)
        sync()
      }
      draw()
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    const toGame = (e) => {
      const r = cv.getBoundingClientRect()
      return ((e.clientX - r.left) / r.width) * W
    }
    const onMove = (e) => {
      if (e.pointerType === 'mouse' || e.buttons) s.target = toGame(e)
    }
    const onDown = (e) => {
      s.target = toGame(e)
      if (s.phase !== 'playing') start()
    }
    const onUp = (e) => {
      if (e.pointerType !== 'mouse') s.target = null
    }
    const onKey = (down) => (e) => {
      const k = e.key.toLowerCase()
      if (e.target.tagName === 'INPUT') return
      if (k === 'arrowleft' || k === 'a') s.keys.l = down
      else if (k === 'arrowright' || k === 'd') s.keys.r = down
      else if (down && (k === ' ' || k === 'enter') && s.phase !== 'playing') start()
      else return
      if (k.startsWith('arrow') || k === ' ') e.preventDefault()
      if (down && s.phase === 'idle' && (k === 'arrowleft' || k === 'arrowright' || k === 'a' || k === 'd')) start()
    }
    const kd = onKey(true)
    const ku = onKey(false)
    cv.addEventListener('pointermove', onMove)
    cv.addEventListener('pointerdown', onDown)
    cv.addEventListener('pointerup', onUp)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      cancelAnimationFrame(raf)
      cv.removeEventListener('pointermove', onMove)
      cv.removeEventListener('pointerdown', onDown)
      cv.removeEventListener('pointerup', onUp)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
  }, [])

  return (
    <div className="nf-game nf-jump">
      <div className="nf-hud">
        <span>Height <b>{ui.score}</b></span>
        <span>Best <b>{Math.max(ui.best, ui.score)}</b></span>
        <span className="nf-hint">← → / A D / move the mouse</span>
      </div>
      <div className="nf-canvas-wrap">
        <canvas ref={cvRef} className="nf-canvas" aria-label="HTTP Status Jump game" />
        {ui.phase !== 'playing' && (
          <div className="snake-overlay">
            <p className="snake-overlay-title">{ui.phase === 'over' ? 'Request failed' : 'HTTP Status Jump'}</p>
            {ui.phase === 'over' ? <p>{ui.cause}<br />Height {ui.score}</p> : (
              <p>
                <b style={{ color: '#39d353' }}>200</b> solid · <b style={{ color: '#58a6ff' }}>301</b> moves ·{' '}
                <b style={{ color: '#ff6b6b' }}>403</b> deadly · <b style={{ color: '#f0883e' }}>404</b> crumbles
              </p>
            )}
            <button className="cta-pill" onClick={() => S.current.start()}>{ui.phase === 'over' ? 'Try again' : 'Start'}</button>
            {ui.phase === 'over' && <Link to="/" className="view-more-link">Take me home</Link>}
          </div>
        )}
      </div>
    </div>
  )
}
