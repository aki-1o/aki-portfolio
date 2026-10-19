import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronDown } from 'lucide-react'
import ProjectCard from '../components/ProjectCard.jsx'
import ScreenshotModal from '../components/ScreenshotModal.jsx'
import { projects } from '../data/projects.js'
import { services } from '../data/services.js'
import { process, intro } from '../data/site.js'
import { burst } from '../lib/effects.js'

export default function Home() {
  const [activeProject, setActiveProject] = useState(null)
  const [showMore, setShowMore] = useState(false)
  const featured = projects.find((p) => p.featured) || projects[0]

  return (
    <main>
      <div className="intro" id="top">
        <div className="wrap">
          <div className="intro-col">
            <h1 className="intro-name" onDoubleClick={burst}>{intro.name}</h1>

            {intro.lead.map((text, i) => (
              <p className="intro-lead" key={i}>{text}</p>
            ))}
            <p className="intro-lead">
              Have a look at my <Link to={{ pathname: '/', hash: '#work' }}>recent work</Link>, or follow along in the{' '}
              <Link to="/changelog">changelog</Link>.
            </p>

            <div className="facts">
              {intro.facts.map((f) => (
                <p className="fact" key={f}>{f}</p>
              ))}
              <div className={`facts-more${showMore ? ' open' : ''}`}>
                <div id="more-facts">
                  {intro.moreFacts.map((f) => (
                    <p className="fact" key={f}>{f}</p>
                  ))}
                </div>
              </div>
              <button
                className="more-pill"
                aria-expanded={showMore}
                aria-controls="more-facts"
                onClick={() => setShowMore((s) => !s)}
              >
                {showMore ? 'Less' : 'More'} <ChevronDown width={16} height={16} />
              </button>
            </div>
          </div>
        </div>

        <Link to="/snake" className="snake-secret" aria-label="commit.snake()" data-tip="commit.snake()">
          <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
            <rect x="0" y="0" width="6" height="6" rx="1.5" />
            <rect x="8" y="0" width="6" height="6" rx="1.5" opacity=".5" />
            <rect x="0" y="8" width="6" height="6" rx="1.5" opacity=".5" />
            <rect x="8" y="8" width="6" height="6" rx="1.5" />
          </svg>
        </Link>
      </div>

      <section id="work">
        <div className="wrap">
          <div className="section-head">
            <h2>Featured Work</h2>
            <p className="desc">A running log of full-stack builds. More get added as they ship.</p>
          </div>
          <div id="projects-grid">
            <ProjectCard project={featured} onShowScreenshots={setActiveProject} />
          </div>
          <div className="view-more-row">
            <Link to="/projects" className="view-more-link">
              View more projects <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section id="stack">
        <div className="wrap">
          <p className="eyebrow" style={{ marginBottom: 14 }}>Core Capabilities</p>
          <div className="services-list">
            {services.map((s) => (
              <div className="service-row" key={s.name}>
                <span className="service-name">{s.name}</span>
                <span className="service-tools">{s.tools}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about">
        <div className="wrap">
          <div className="section-head">
            <h2>Seamless Process</h2>
            <p className="desc">
              From first insights to final deployment, every step is built to be clean, tested,
              and easy to hand off.
            </p>
          </div>
          <div className="process-grid">
            {process.map((step) => (
              <div className="process-card" key={step.title}>
                <div className="process-index">{step.index}</div>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <ScreenshotModal project={activeProject} onClose={() => setActiveProject(null)} />
    </main>
  )
}
