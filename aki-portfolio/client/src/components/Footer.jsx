import { Link } from 'react-router-dom'
import ExternalLink from './ExternalLink.jsx'
import { social } from '../data/site.js'
import { useEffect, useState } from 'react'

export default function Footer() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const tick = () => {
      setTime(
        new Date().toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <footer id="contact">
      <div className="wrap">
        <div className="footer-callout">Let's build something great together</div>
        <div className="availability-note">
          <span className="avail-dot" /> Available for freelance projects, small tasks, and technical consults.
        </div>
        <div className="footer-grid">
          <div className="footer-col">
            <h4>Contact</h4>
            <ExternalLink href={`mailto:${social.email}`}>{social.email}</ExternalLink>
            <ExternalLink href={`tel:${social.phone}`}>{social.phoneDisplay}</ExternalLink>
          </div>
          <div className="footer-col">
            <h4>Elsewhere</h4>
            <ExternalLink href={social.github}>GitHub</ExternalLink>
            <ExternalLink href={social.linkedin}>LinkedIn</ExternalLink>
          </div>
          <div className="footer-col">
            <h4>Local Time</h4>
            <span className="clock">{time}</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Ahmedabad, IN</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>{new Date().getFullYear()} Akshat Thoriya. All rights reserved.</span>
          <span>Designed &amp; built by Aki and Claude &middot; <Link to="/changelog" className="footer-link">Changelog</Link></span>
        </div>
      </div>
    </footer>
  )
}
