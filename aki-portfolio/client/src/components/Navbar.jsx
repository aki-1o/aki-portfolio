import { Link } from 'react-router-dom'
import { Github, Linkedin, Mail } from 'lucide-react'
import GlassPanel from './GlassPanel.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import ExternalLink from './ExternalLink.jsx'
import { social } from '../data/site.js'
import { burst } from '../lib/effects.js'

// Section links route to the homepage first, then ScrollToHash jumps to the anchor.
const section = (id) => ({ pathname: '/', hash: `#${id}` })

export default function Navbar({ toggleTheme, onConsole }) {
  return (
    <header className="wrap">
      <GlassPanel className="navbar">
        <Link to="/" className="logo-block" aria-label="Aki, home" onDoubleClick={burst}>
          <span className="logo-word" />
          <span className="rainbow-bar" aria-hidden="true" />
        </Link>

        <nav className="links">
          <Link to={section('top')}>Home</Link>
          <Link to={section('work')}>Work</Link>
          <Link to={section('stack')}>Stack</Link>
          <Link to={section('about')}>About</Link>
          <Link to="/changelog">Changelog</Link>
          <Link to={section('contact')}>Contact</Link>
        </nav>

        <div className="nav-right">
          <div className="socials-inline">
            <ExternalLink href={social.github} aria-label="GitHub">
              <Github width={17} height={17} />
            </ExternalLink>
            <ExternalLink href={social.linkedin} aria-label="LinkedIn">
              <Linkedin width={17} height={17} />
            </ExternalLink>
            <ExternalLink href={`mailto:${social.email}`} aria-label="Email">
              <Mail width={17} height={17} />
            </ExternalLink>
          </div>
          <ThemeToggle toggleTheme={toggleTheme} onConsole={onConsole} />
          <Link to={section('contact')} className="cta-pill">Get in Touch</Link>
        </div>
      </GlassPanel>
    </header>
  )
}
