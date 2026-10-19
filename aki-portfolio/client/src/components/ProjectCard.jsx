import { ArrowRight, Image as ImageIcon, Users } from 'lucide-react'
import GlassPanel from './GlassPanel.jsx'
import ExternalLink from './ExternalLink.jsx'

export default function ProjectCard({ project, onShowScreenshots }) {
  const teamText =
    project.team.length === 1 && project.team[0] === 'Akshat Thoriya'
      ? 'Only me'
      : project.team.join(', ')

  return (
    <GlassPanel className="project-card">
      <div className="project-media">
        {project.image ? (
          <img src={project.image} alt={project.title} />
        ) : (
          <span className="placeholder-mark">Preview coming soon</span>
        )}
        <button
          className="ss-thumb-btn"
          title="View Screenshots"
          onClick={() => onShowScreenshots(project)}
        >
          <ImageIcon width={16} height={16} />
        </button>
      </div>
      <div className="project-body">
        <div className="project-top">
          <span className="project-title">{project.title}</span>
          <span className="project-year">{project.year}</span>
        </div>
        <p className="project-desc">{project.description}</p>
        <div className="project-tags">
          {project.tags.map((t) => (
            <span className="tag" key={t}>{t}</span>
          ))}
        </div>
        <div className="project-footer">
          <ExternalLink href={project.link} className="project-link">
            View Project <ArrowRight />
          </ExternalLink>
          <div className="team-btn-wrapper">
            <span className="team-btn"><Users width={12} height={12} /> Team</span>
            <div className="team-popover">{teamText}</div>
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}
