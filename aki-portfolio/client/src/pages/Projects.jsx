import { useState } from 'react'
import ProjectCard from '../components/ProjectCard.jsx'
import ScreenshotModal from '../components/ScreenshotModal.jsx'
import { projects } from '../data/projects.js'

export default function Projects() {
  const [activeProject, setActiveProject] = useState(null)

  return (
    <main className="wrap">
      <div className="page-head">
        <p className="eyebrow">All Projects</p>
        <h1>Everything I've shipped</h1>
      </div>
      <div id="all-projects-grid">
        {projects.map((p) => (
          <ProjectCard project={p} onShowScreenshots={setActiveProject} key={p.title} />
        ))}
      </div>
      <ScreenshotModal project={activeProject} onClose={() => setActiveProject(null)} />
    </main>
  )
}
