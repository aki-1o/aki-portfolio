import { X } from 'lucide-react'

export default function ScreenshotModal({ project, onClose }) {
  if (!project) return null

  return (
    <div className="modal-overlay active" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <X />
        </button>
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>{project.title} — Screenshots</h3>
        <div className="modal-gallery">
          {project.screenshots.length ? (
            project.screenshots.map((src, i) => <img src={src} alt={`Screenshot ${i + 1}`} key={i} />)
          ) : (
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>No extra screenshots uploaded yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
