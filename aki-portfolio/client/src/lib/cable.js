// Server Cable Reconnect: pure puzzle logic (no DOM) so solvability can be tested in Node.
export const ROWS = 4
export const COLS = 5

// Sides: 0 = N, 1 = E, 2 = S, 3 = W. Each tile type lists which sides its wire touches at rotation 0.
const N = 0, E = 1, S = 2, W = 3
const BASE = { straight: [E, W], corner: [E, S], tee: [W, E, S], broken: [], empty: [] }
const DR = [-1, 0, 1, 0]
const DC = [0, 1, 0, -1]
const opp = (s) => (s + 2) % 4

export const sidesOf = (type, rot) => BASE[type].map((s) => (s + (((rot % 4) + 4) % 4)) % 4)

export function seededRng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Which wires are live (connected to the client) and whether the circuit reaches the server.
export function trace({ grid, startRow, endRow }) {
  const lit = new Set()
  let connected = false
  const stack = [{ r: startRow, c: 0, from: W }]
  while (stack.length) {
    const { r, c, from } = stack.pop()
    const tile = grid[r][c]
    const sides = sidesOf(tile.type, tile.rot)
    if (!sides.includes(from)) continue
    const key = `${r},${c}`
    if (lit.has(key)) continue
    lit.add(key)
    for (const s of sides) {
      const nr = r + DR[s]
      const nc = c + DC[s]
      if (nc >= COLS) {
        if (r === endRow && s === E) connected = true
        continue
      }
      if (nr < 0 || nr >= ROWS || nc < 0) continue
      stack.push({ r: nr, c: nc, from: opp(s) })
    }
  }
  return { lit, connected }
}

export function generate(rng = Math.random) {
  const startRow = Math.floor(rng() * ROWS)

  // 1. Random monotone walk from the left edge to the right edge.
  const path = [{ r: startRow, c: 0 }]
  const seen = new Set([`${startRow},0`])
  let last = E
  while (path[path.length - 1].c < COLS - 1) {
    const { r, c } = path[path.length - 1]
    const options = [E, E]
    if (r > 0 && !seen.has(`${r - 1},${c}`) && last !== S) options.push(N)
    if (r < ROWS - 1 && !seen.has(`${r + 1},${c}`) && last !== N) options.push(S)
    const d = options[Math.floor(rng() * options.length)]
    path.push({ r: r + DR[d], c: c + DC[d] })
    seen.add(`${r + DR[d]},${c + DC[d]}`)
    last = d
  }
  const endRow = path[path.length - 1].r

  // 2. Path tiles get the right shape; everything else is a decoy.
  const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => null))
  const solution = {}
  path.forEach((p, i) => {
    const inSide = i === 0 ? W : opp(dirBetween(path[i - 1], p))
    const outSide = i === path.length - 1 ? E : dirBetween(p, path[i + 1])
    const type = (inSide + 2) % 4 === outSide ? 'straight' : 'corner'
    let solved = 0
    for (let rot = 0; rot < 4; rot++) {
      const sides = sidesOf(type, rot)
      if (sides.includes(inSide) && sides.includes(outSide)) { solved = rot; break }
    }
    grid[p.r][p.c] = { type, rot: Math.floor(rng() * 4), onPath: true }
    solution[`${p.r},${p.c}`] = solved
  })
  const decoys = ['straight', 'straight', 'straight', 'corner', 'corner', 'corner', 'tee', 'broken', 'broken', 'empty']
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (!grid[r][c]) grid[r][c] = { type: decoys[Math.floor(rng() * decoys.length)], rot: Math.floor(rng() * 4), onPath: false }
    }
  }

  // 3. Never hand over an already-solved board.
  const puzzle = { grid, startRow, endRow, solution }
  if (trace(puzzle).connected) grid[path[0].r][path[0].c].rot += 1
  return puzzle
}

function dirBetween(a, b) {
  if (b.r < a.r) return N
  if (b.c > a.c) return E
  if (b.r > a.r) return S
  return W
}
