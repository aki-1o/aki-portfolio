import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const isTyping = (el) =>
  el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)

// Typing S-N-A-K-E anywhere opens the game. The backtick key toggles console mode.
export default function GlobalKeys({ onToggleConsole }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const buf = useRef('')

  useEffect(() => {
    const onKey = (e) => {
      if (isTyping(e.target) || e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === '`') {
        onToggleConsole()
        return
      }
      if (pathname === '/snake' || e.key.length !== 1) return // the game page handles its own keys
      buf.current = (buf.current + e.key.toLowerCase()).slice(-5)
      if (buf.current === 'snake') {
        buf.current = ''
        navigate('/snake', { state: { autostart: true } })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pathname, navigate, onToggleConsole])

  return null
}
