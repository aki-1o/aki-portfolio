import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const W = 640
const H = 420
const SHIP_Y = H - 34
const PORTAL_SCORE = 250 // reach this score to reveal the warp portal
const CODES = [
  { t: '404', c: '#f0883e' },
  { t: '500', c: '#ff6b6b' },
  { t: '403', c: '#a78bfa' },
]
const rand = (a, b) => a + Math.random() * (b - a)
const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y

function enemy(x, y, extra = {}) {
  const code = CODES[Math.floor(Math.random() * CODES.length)]
  return { x, y, w: 42, h: 24, hp: 1, code, pts: 10, ...extra }
}

function spawnWave(s) {
  s.bullets = []
  s.shots = []
  s.dir = 1
  if (s.wave % 3 === 0) {
    s.enemies = []
    s.boss = { x: W / 2 - 110, y: 46, w: 220, h: 68, hp: 14, max: 14, dir: 1, splitHalf: false }
  } else {
    const rows = 3 + Math.floor(s.wave / 3)
    const cols = 7
    s.boss = null
    s.enemies = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) s.enemies.push(enemy(W / 2 - ((cols - 1) * 56) / 2 - 21 + c * 56, 46 + r * 38))
    }
  }
  s.total = s.enemies.length || 1
}

// Mini errors break off the boss and drift down on their own.
function spawnMinis(s, n) {
  const b = s.boss
  for (let i = 0; i < n; i++) {
    const m = enemy(b.x + rand(0, b.w - 42), b.y + rand(0, 20), { pts: 15, free: true, vx: rand(-70, 70), vy: rand(38, 62) })
    s.enemies.push(m)
  }
}

export default function ErrorInvaders({ startWave = 1 }) {
  const cvRef = useRef(null)
  const S = useRef(null)
  const startWaveRef = useRef(Math.max(1, Math.floor(startWave) || 1))
  const [ui, setUi] = useState({ phase: 'idle', score: 0, lives: 3, wave: 1, portal: false })

  useEffect(() => {
    const cv = cvRef.current
    const ctx = cv.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const s = {
      phase: 'idle', ship: { x: W / 2, inv: 0 }, targetX: null, keys: { l: false, r: false },
      bullets: [], shots: [], enemies: [], boss: null, dir: 1, total: 1,
      score: 0, lives: 3, wave: 1, fireT: 0, enemyT: 1.2, portal: false, banner: '', bannerT: 0, nextWaveT: 0,
    }
    S.current = s
    let synced = ''
    const sync = () => {
      const snap = `${s.phase}|${s.score}|${s.lives}|${s.wave}|${s.portal}`
      if (snap === synced) return
      synced = snap
      setUi({ phase: s.phase, score: s.score, lives: s.lives, wave: s.wave, portal: s.portal })
    }

    const start = () => {
      Object.assign(s, { phase: 'playing', score: 0, lives: 3, wave: startWaveRef.current, portal: false, fireT: 0.2, enemyT: 1.2, banner: '', nextWaveT: 0 })
      s.ship = { x: s.targetX ?? W / 2, inv: 0 }
      spawnWave(s)
      sync()
    }
    s.start = start

    const gameOver = () => {
      s.phase = 'over'
      sync()
    }
    const addScore = (n) => {
      s.score += n
      if (!s.portal && s.score >= PORTAL_SCORE) s.portal = true
    }

    function update(dt) {
      // --- ship ---
      if (s.keys.l) s.ship.x -= 340 * dt
      if (s.keys.r) s.ship.x += 340 * dt
      if (s.targetX != null && !s.keys.l && !s.keys.r) s.ship.x += (s.targetX - s.ship.x) * Math.min(1, dt * 14)
      s.ship.x = Math.max(22, Math.min(W - 22, s.ship.x))
      s.ship.inv = Math.max(0, s.ship.inv - dt)

      // --- auto-fire (works with mouse and touch) ---
      s.fireT -= dt
      if (s.fireT <= 0) {
        s.bullets.push({ x: s.ship.x - 2, y: SHIP_Y - 16, w: 4, h: 12 })
        s.fireT = 0.34
      }
      s.bullets.forEach((b) => (b.y -= 560 * dt))
      s.bullets = s.bullets.filter((b) => b.y > -20)

      // --- formation movement ---
      const form = s.enemies.filter((e) => !e.free)
      if (form.length) {
        const speed = 36 + s.wave * 8 + (1 - form.length / s.total) * 70
        const dx = s.dir * speed * dt
        const minX = Math.min(...form.map((e) => e.x))
        const maxX = Math.max(...form.map((e) => e.x + e.w))
        if ((s.dir > 0 && maxX + dx > W - 8) || (s.dir < 0 && minX + dx < 8)) {
          s.dir *= -1
          form.forEach((e) => (e.y += 18))
        } else form.forEach((e) => (e.x += dx))
      }
      s.enemies.filter((e) => e.free).forEach((e) => {
        e.x += e.vx * dt
        e.y += e.vy * dt
        if (e.x < 6 || e.x + e.w > W - 6) e.vx *= -1
      })
      if (s.enemies.some((e) => e.y + e.h >= SHIP_Y - 8)) return gameOver()

      // --- boss ---
      const boss = s.boss
      if (boss) {
        boss.x += boss.dir * (60 + s.wave * 6) * dt
        if (boss.x < 8 || boss.x + boss.w > W - 8) boss.dir *= -1
      }

      // --- player bullets ---
      for (const b of s.bullets) {
        const e = s.enemies.find((en) => hit(b, en))
        if (e) {
          b.y = -99
          e.hp = 0
          addScore(e.pts)
          continue
        }
        if (boss && hit(b, boss)) {
          b.y = -99
          boss.hp -= 1
          boss.flash = 0.12
          if (!boss.splitHalf && boss.hp <= boss.max / 2) {
            boss.splitHalf = true
            spawnMinis(s, 3)
          }
          if (boss.hp <= 0) {
            addScore(100)
            spawnMinis(s, 6)
            s.boss = null
            break
          }
        }
      }
      s.enemies = s.enemies.filter((e) => e.hp > 0)
      if (s.boss?.flash) s.boss.flash = Math.max(0, s.boss.flash - dt)

      // --- enemy fire ---
      s.enemyT -= dt
      if (s.enemyT <= 0) {
        const shooters = s.boss ? [s.boss] : s.enemies
        if (shooters.length) {
          const e = shooters[Math.floor(Math.random() * shooters.length)]
          s.shots.push({ x: e.x + e.w / 2 - 3, y: e.y + e.h, w: 6, h: 10 })
        }
        s.enemyT = Math.max(0.45, 1.4 - s.wave * 0.08) * rand(0.7, 1.3)
      }
      s.shots.forEach((b) => (b.y += 220 * dt))
      s.shots = s.shots.filter((b) => b.y < H + 10)
      const shipBox = { x: s.ship.x - 18, y: SHIP_Y - 14, w: 36, h: 24 }
      if (s.ship.inv <= 0) {
        const idx = s.shots.findIndex((b) => hit(b, shipBox))
        if (idx >= 0) {
          s.shots.splice(idx, 1)
          s.lives -= 1
          s.ship.inv = 1.4
          if (s.lives <= 0) return gameOver()
        }
      }

      // --- wave cleared ---
      if (!s.enemies.length && !s.boss) {
        if (!s.nextWaveT) {
          s.nextWaveT = 1.2
          s.banner = `Wave ${s.wave} cleared`
        }
        s.nextWaveT -= dt
        if (s.nextWaveT <= 0) {
          s.nextWaveT = 0
          s.banner = ''
          s.wave += 1
          spawnWave(s)
        }
      }
    }

    const label = (e) => {
      ctx.lineWidth = 2
      ctx.strokeStyle = e.code.c
      ctx.fillStyle = e.code.c + '22'
      ctx.beginPath()
      ctx.roundRect(e.x, e.y, e.w, e.h, 6)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = e.code.c
      ctx.font = '700 15px ui-monospace, Menlo, Consolas, monospace'
      ctx.textAlign = 'center'
      ctx.fillText(e.code.t, e.x + e.w / 2, e.y + e.h / 2 + 5)
    }

    function draw(now) {
      ctx.fillStyle = '#0b0d10'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#ffffff14'
      for (let i = 0; i < 40; i++) ctx.fillRect((i * 97) % W, (i * 53 + now / 40) % H, 1.5, 1.5)

      const b = s.boss
      if (b) {
        const c = b.flash ? '#ffffff' : '#f0883e'
        ctx.lineWidth = 3
        ctx.strokeStyle = c
        ctx.fillStyle = '#f0883e22'
        ctx.beginPath()
        ctx.roundRect(b.x, b.y, b.w, b.h, 10)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = c
        ctx.textAlign = 'center'
        ctx.font = '700 34px ui-monospace, Menlo, Consolas, monospace'
        ctx.fillText('404', b.x + b.w / 2, b.y + 36)
        ctx.font = '600 13px ui-monospace, Menlo, Consolas, monospace'
        ctx.fillText('Page Not Found', b.x + b.w / 2, b.y + 56)
        ctx.fillStyle = '#ffffff22'
        ctx.fillRect(b.x, b.y - 10, b.w, 4)
        ctx.fillStyle = '#ff6b6b'
        ctx.fillRect(b.x, b.y - 10, (b.w * b.hp) / b.max, 4)
      }

      s.enemies.forEach(label) // after the boss, so freshly split minis sit on top of it

      ctx.fillStyle = '#39d353'
      s.bullets.forEach((p) => ctx.fillRect(p.x, p.y, p.w, p.h))
      ctx.fillStyle = '#ff6b6b'
      s.shots.forEach((p) => ctx.fillRect(p.x, p.y, p.w, p.h))

      if (s.phase !== 'over' && (s.ship.inv <= 0 || Math.floor(now / 90) % 2)) {
        ctx.fillStyle = '#39d353'
        ctx.shadowColor = '#39d353'
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.moveTo(s.ship.x, SHIP_Y - 16)
        ctx.lineTo(s.ship.x + 20, SHIP_Y + 10)
        ctx.lineTo(s.ship.x - 20, SHIP_Y + 10)
        ctx.closePath()
        ctx.fill()
        ctx.shadowBlur = 0
      }

      if (s.banner) {
        ctx.fillStyle = '#e6edf3'
        ctx.textAlign = 'center'
        ctx.font = '700 22px ui-monospace, Menlo, Consolas, monospace'
        ctx.fillText(s.banner, W / 2, H / 2)
      }
    }

    let raf
    let last = performance.now()
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (s.phase === 'playing') {
        update(dt)
        sync()
        cv.dataset.boss = s.boss ? s.boss.hp : 'none'
        cv.dataset.enemies = s.enemies.length
      }
      draw(now)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // --- input ---
    const toGame = (e) => {
      const r = cv.getBoundingClientRect()
      return ((e.clientX - r.left) / r.width) * W
    }
    const onMove = (e) => (s.targetX = toGame(e))
    const onDown = (e) => {
      s.targetX = toGame(e)
      if (s.phase !== 'playing') start()
    }
    const onKey = (down) => (e) => {
      const k = e.key.toLowerCase()
      if (e.target.tagName === 'INPUT') return
      if (k === 'arrowleft' || k === 'a') s.keys.l = down
      else if (k === 'arrowright' || k === 'd') s.keys.r = down
      else if (down && (k === ' ' || k === 'enter') && s.phase !== 'playing') start()
      else return
      if (k.startsWith('arrow') || k === ' ') e.preventDefault()
    }
    const kd = onKey(true)
    const ku = onKey(false)
    cv.addEventListener('pointermove', onMove)
    cv.addEventListener('pointerdown', onDown)
    window.addEventListener('keydown', kd)
    window.addEventListener('keyup', ku)
    return () => {
      cancelAnimationFrame(raf)
      cv.removeEventListener('pointermove', onMove)
      cv.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', kd)
      window.removeEventListener('keyup', ku)
    }
  }, [])

  return (
    <div className="nf-game">
      <div className="nf-hud">
        <span>Score <b>{ui.score}</b></span>
        <span>Lives <b>{'♥'.repeat(Math.max(ui.lives, 0)) || '–'}</b></span>
        <span>Wave <b>{ui.wave}</b></span>
        <span className="nf-hint">Move to aim · it fires automatically</span>
      </div>
      <div className="nf-canvas-wrap">
        <canvas ref={cvRef} className="nf-canvas" aria-label="Error Invaders game" />
        {ui.phase !== 'playing' && (
          <div className="snake-overlay">
            <p className="snake-overlay-title">{ui.phase === 'over' ? 'Fatal error' : 'Error Invaders'}</p>
            <p>
              {ui.phase === 'over'
                ? `You scored ${ui.score}.`
                : 'Shoot down the HTTP errors. Move the mouse (or finger), or use ← →.'}
            </p>
            <button className="cta-pill" onClick={() => S.current.start()}>
              {ui.phase === 'over' ? 'Try again' : 'Start'}
            </button>
          </div>
        )}
        {ui.portal && (
          <Link to="/" className="warp-portal">🌀 Secret Warp Portal to Home</Link>
        )}
      </div>
    </div>
  )
}
