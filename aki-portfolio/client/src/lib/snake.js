// Pure game logic for commit.snake(): no DOM, no timers, so it can be tested in Node.
export const COLS = 24
export const ROWS = 16
export const BOOST_MS = 5000
export const COFFEE_LIFETIME_MS = 8000

export const DIRS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}
const OPPOSITE = { up: 'down', down: 'up', left: 'right', right: 'left' }

// Milliseconds per move. Coffee makes the snake much faster; otherwise it creeps up with commits.
export function tickMs(g) {
  if (g.clock < g.boostUntil) return 60
  return Math.max(85, 130 - Math.floor(g.commits / 3) * 5)
}

function emptyCell(g) {
  const taken = new Set(g.snake.map((s) => `${s.x},${s.y}`))
  if (g.commit) taken.add(`${g.commit.x},${g.commit.y}`)
  if (g.coffee) taken.add(`${g.coffee.x},${g.coffee.y}`)
  const free = []
  for (let y = 0; y < g.rows; y++) {
    for (let x = 0; x < g.cols; x++) {
      if (!taken.has(`${x},${y}`)) free.push({ x, y })
    }
  }
  return free.length ? free[Math.floor(g.rng() * free.length)] : null
}

export function createGame({ cols = COLS, rows = ROWS, rng = Math.random } = {}) {
  const cy = Math.floor(rows / 2)
  const g = {
    cols, rows, rng,
    snake: [{ x: 5, y: cy }, { x: 4, y: cy }, { x: 3, y: cy }],
    dir: 'right',
    queue: [],
    commit: null,
    coffee: null,
    score: 0,
    commits: 0,
    clock: 0,
    boostUntil: 0,
    alive: true,
    won: false,
  }
  g.commit = emptyCell(g)
  return g
}

// Queue a turn. Reversing into yourself and repeating the current direction are ignored.
export function turn(g, d) {
  const last = g.queue.length ? g.queue[g.queue.length - 1] : g.dir
  if (d === last || d === OPPOSITE[last]) return
  if (g.queue.length < 2) g.queue.push(d)
}

export function step(g) {
  if (!g.alive) return
  const ms = tickMs(g)
  if (g.queue.length) g.dir = g.queue.shift()

  const head = g.snake[0]
  const v = DIRS[g.dir]
  const nx = head.x + v.x
  const ny = head.y + v.y
  const mult = g.clock < g.boostUntil ? 2 : 1 // coffee doubles points while it lasts

  if (nx < 0 || ny < 0 || nx >= g.cols || ny >= g.rows) {
    g.alive = false
    return
  }

  const eatsCommit = g.commit && g.commit.x === nx && g.commit.y === ny
  const eatsCoffee = g.coffee && g.coffee.x === nx && g.coffee.y === ny
  // The tail moves out of the way unless we're growing this turn.
  const body = eatsCommit ? g.snake : g.snake.slice(0, -1)
  if (body.some((s) => s.x === nx && s.y === ny)) {
    g.alive = false
    return
  }

  g.snake.unshift({ x: nx, y: ny })

  if (eatsCommit) {
    g.score += 10 * mult
    g.commits += 1
    g.commit = emptyCell(g)
    if (!g.commit) {
      g.alive = false
      g.won = true
      return
    }
    if (g.commits % 5 === 0 && !g.coffee) {
      const c = emptyCell(g)
      if (c) g.coffee = { ...c, expiresAt: g.clock + COFFEE_LIFETIME_MS }
    }
  } else {
    g.snake.pop()
    if (eatsCoffee) {
      g.score += 25 * mult
      g.boostUntil = Math.max(g.boostUntil, g.clock) + BOOST_MS
      g.coffee = null
    }
  }

  g.clock += ms
  if (g.coffee && g.clock >= g.coffee.expiresAt) g.coffee = null
}
