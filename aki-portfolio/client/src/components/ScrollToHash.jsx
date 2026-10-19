import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Handles "/#work"-style links across routes, and resets scroll on page change.
export default function ScrollToHash() {
  const { pathname, hash, key } = useLocation()

  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0)
      return
    }
    const t = setTimeout(() => {
      const el = document.getElementById(hash.slice(1))
      if (el) el.scrollIntoView({ behavior: 'smooth' })
      else window.scrollTo(0, 0)
    }, 50)
    return () => clearTimeout(t)
  }, [pathname, hash, key])

  return null
}
