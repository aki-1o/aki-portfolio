import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import MemoryMatch from '../components/games/MemoryMatch.jsx'
import ErrorInvaders from '../components/games/ErrorInvaders.jsx'
import CableReconnect from '../components/games/CableReconnect.jsx'
import StatusJump from '../components/games/StatusJump.jsx'

const GAMES = [
  { id: 'memory', name: 'Memory Match: Missing Pages', Component: MemoryMatch },
  { id: 'invaders', name: 'Error Invaders', Component: ErrorInvaders },
  { id: 'cable', name: 'Server Cable Reconnect', Component: CableReconnect },
  { id: 'jump', name: 'HTTP Status Jump', Component: StatusJump },
]

// A random game each time the 404 shows. `?game=jump` forces one; `?game=invaders&wave=3` jumps to the boss.
export default function NotFound() {
  const [params] = useSearchParams()
  const forced = GAMES.findIndex((g) => g.id === params.get('game'))
  const [index, setIndex] = useState(() => (forced >= 0 ? forced : Math.floor(Math.random() * GAMES.length)))
  const [round, setRound] = useState(0) // bumping this remounts the game

  const { name, Component, id } = GAMES[index]
  const seed = params.get('seed')

  function another() {
    let next = index
    while (next === index) next = Math.floor(Math.random() * GAMES.length)
    setIndex(next)
    setRound((r) => r + 1)
  }

  return (
    <main className="wrap page-narrow notfound">
      <div className="page-head">
        <p className="eyebrow">404</p>
        <h1>Page not found</h1>
        <p className="page-sub">
          That page went missing. While you're here, play <b>{name}</b>.
        </p>
      </div>

      <section className="nf-stage" aria-label={name}>
        <Component key={`${id}-${round}`} seed={seed != null ? Number(seed) : undefined} startWave={Number(params.get('wave')) || 1} />
      </section>

      <div className="nf-actions">
        <button className="nf-link-btn" onClick={another}>Play a different game</button>
        <Link to="/" className="view-more-link">Back home</Link>
      </div>
    </main>
  )
}
