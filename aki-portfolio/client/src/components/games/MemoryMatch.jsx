import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Cat, FileQuestion, ImageOff, ServerCrash, Unlink, Unplug } from 'lucide-react'

const FACES = [
  { id: 'link', label: 'Broken link', Icon: Unlink },
  { id: 'image', label: 'Missing image', Icon: ImageOff },
  { id: 'plug', label: 'Unplugged cable', Icon: Unplug },
  { id: 'server', label: 'Crashed server rack', Icon: ServerCrash },
  { id: 'cat', label: '404 cat', Icon: Cat, tag: '404' },
  { id: 'file', label: 'File not found', Icon: FileQuestion },
]

// 4 columns x 3 rows = 12 cards = 6 pairs.
function deal() {
  const deck = [...FACES, ...FACES].map((f, i) => ({ ...f, key: i }))
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

export default function MemoryMatch() {
  const [deck, setDeck] = useState(deal)
  const [open, setOpen] = useState([]) // indices currently face-up and unmatched
  const [matched, setMatched] = useState([]) // face ids that are solved
  const [moves, setMoves] = useState(0)
  const locked = useRef(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const won = matched.length === FACES.length

  function flip(i) {
    if (locked.current || open.includes(i) || matched.includes(deck[i].id)) return
    const next = [...open, i]
    setOpen(next)
    if (next.length < 2) return

    setMoves((m) => m + 1)
    const [a, b] = next
    if (deck[a].id === deck[b].id) {
      setMatched((m) => [...m, deck[a].id])
      setOpen([])
    } else {
      locked.current = true
      timer.current = setTimeout(() => {
        setOpen([])
        locked.current = false
      }, 850)
    }
  }

  function restart() {
    clearTimeout(timer.current)
    locked.current = false
    setDeck(deal())
    setOpen([])
    setMatched([])
    setMoves(0)
  }

  return (
    <div className="nf-game">
      <div className="nf-hud">
        <span>Matched <b>{matched.length}</b>/{FACES.length}</span>
        <span>Moves <b>{moves}</b></span>
        <button className="nf-link-btn" onClick={restart}>Shuffle</button>
      </div>

      <div className="mm-grid">
        {deck.map((card, i) => {
          const isMatched = matched.includes(card.id)
          const faceUp = isMatched || open.includes(i)
          const { Icon } = card
          return (
            <button
              key={card.key}
              className={`mm-card${faceUp ? ' up' : ''}${isMatched ? ' done' : ''}`}
              onClick={() => flip(i)}
              aria-label={faceUp ? card.label : `Face-down card ${i + 1}`}
              aria-pressed={faceUp}
            >
              <span className="mm-inner">
                <span className="mm-face mm-back"><span>?</span></span>
                <span className="mm-face mm-front">
                  <Icon size={34} strokeWidth={1.6} />
                  {card.tag && <small>{card.tag}</small>}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {won && (
        <div className="nf-reward" role="status">
          <p className="nf-badge">🏅 Badge unlocked: <b>Page Finder</b></p>
          <p>Every missing page, found in {moves} moves.</p>
          <Link to="/" className="cta-pill">Take me home</Link>
        </div>
      )}
    </div>
  )
}
