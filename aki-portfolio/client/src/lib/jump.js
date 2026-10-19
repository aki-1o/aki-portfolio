// HTTP Status Jump: platform generation (pure) so reachability can be tested in Node.
export const W = 360
export const H = 560
export const PLAT_W = 78
export const PLAT_H = 20

// Physics (px, seconds). Max jump height = V0^2 / (2 * G) = 172px, so gaps stay well under that.
export const G = 1500
export const V0 = 720
export const MAX_GAP = 118

export const TYPES = {
  ok: { label: '200 OK', color: '#39d353' },
  moved: { label: '301', color: '#58a6ff' },
  forbidden: { label: '403', color: '#ff6b6b' },
  missing: { label: '404', color: '#f0883e' },
}

// One "row" always contains a safe platform (200 or 301) and sometimes an extra, riskier one.
export function makeRow(y, level, rng = Math.random) {
  const safeX = rng() * (W - PLAT_W)
  const safe = { x: safeX, y, w: PLAT_W, type: rng() < Math.min(0.15 + level * 0.04, 0.4) ? 'moved' : 'ok', vx: 0, state: 'idle', t: 0 }
  if (safe.type === 'moved') safe.vx = (rng() < 0.5 ? -1 : 1) * (60 + rng() * 40)
  const row = [safe]
  if (rng() < Math.min(0.45 + level * 0.05, 0.8)) {
    let x = rng() * (W - PLAT_W)
    for (let i = 0; i < 6 && Math.abs(x - safeX) < PLAT_W + 14; i++) x = rng() * (W - PLAT_W)
    if (Math.abs(x - safeX) >= PLAT_W + 14) {
      const hazardChance = Math.min(0.3 + level * 0.06, 0.6)
      row.push({ x, y, w: PLAT_W, type: rng() < hazardChance ? 'forbidden' : 'missing', vx: 0, state: 'idle', t: 0 })
    }
  }
  return row
}

export const rowGap = (level, rng = Math.random) => 70 + rng() * Math.min(25 + level * 4, MAX_GAP - 70)

// ---------- simulation (pure; the component only renders and feeds input) ----------
export const SIZE = 28
export const SPEED = 320
export const CRUMBLE_S = 0.5
const START_Y = H - 90

export function createState(rng = Math.random) {
  const s = {
    rng,
    p: { x: W / 2 - SIZE / 2, y: START_Y, vx: 0, vy: -V0 },
    plats: [{ x: W / 2 - PLAT_W / 2, y: H - 60, w: PLAT_W, type: 'ok', vx: 0, state: 'idle', t: 0 }],
    cam: 0,
    topY: H - 60,
    level: 0,
    score: 0,
  }
  fillRows(s)
  return s
}

export function fillRows(s) {
  while (s.topY > s.cam - H * 1.4) {
    s.topY -= rowGap(s.level, s.rng)
    s.plats.push(...makeRow(s.topY, s.level, s.rng))
  }
}

// Advance one frame. `dir` is -1 / 0 / 1 (steering). Returns a failure message, or null while alive.
export function stepJump(s, dt, dir) {
  const p = s.p
  p.vx = dir * SPEED
  p.x += p.vx * dt
  if (p.x + SIZE < 0) p.x = W // wrap around the screen edges
  if (p.x > W) p.x = -SIZE

  const prevBottom = p.y + SIZE
  p.vy += G * dt
  p.y += p.vy * dt

  for (const pl of s.plats) {
    if (pl.type === 'moved') {
      pl.x += pl.vx * dt
      if (pl.x < 0 || pl.x + pl.w > W) pl.vx *= -1 // 301: shifts side to side
    }
    if (pl.state === 'crumbling') {
      pl.t += dt
      if (pl.t >= CRUMBLE_S) pl.state = 'gone' // 404: vanishes 0.5s after landing
    }
  }

  if (p.vy > 0) {
    for (const pl of s.plats) {
      if (pl.state === 'gone') continue
      const overlap = p.x + SIZE > pl.x - 4 && p.x < pl.x + pl.w + 4
      if (overlap && prevBottom <= pl.y + 2 && p.y + SIZE >= pl.y) {
        p.y = pl.y - SIZE
        if (pl.type === 'forbidden') return '403 Forbidden: you landed on a hazard'
        p.vy = -V0
        if (pl.type === 'missing' && pl.state === 'idle') pl.state = 'crumbling'
        break
      }
    }
  }

  s.cam = Math.min(s.cam, p.y - H * 0.42) // camera only ever climbs
  s.score = Math.max(s.score, Math.floor((START_Y - p.y) / 10))
  s.level = Math.floor(s.score / 60)
  fillRows(s)
  s.plats = s.plats.filter((pl) => pl.y - s.cam < H + 80 && pl.state !== 'gone')

  return p.y - s.cam > H + 20 ? '404: you fell off the page' : null
}
