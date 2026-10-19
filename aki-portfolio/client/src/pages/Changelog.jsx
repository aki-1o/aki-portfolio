import { useEffect, useState } from 'react'
import { fetchChangelog } from '../lib/api.js'
import { compareVersions, formatDate } from '../lib/semver.js'
import { changelogSeed } from '../data/changelog.seed.js'
import ExternalLink from '../components/ExternalLink.jsx'

export default function Changelog() {
  const [entries, setEntries] = useState(null)
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    fetchChangelog()
      .then(setEntries)
      .catch(() => {
        setOffline(true)
        setEntries([...changelogSeed].sort((a, b) => compareVersions(b.version, a.version)))
      })
  }, [])

  return (
    <main className="wrap page-narrow">
      <div className="page-head">
        <p className="eyebrow">Changelog</p>
        <h1>What's new</h1>
        <p className="page-sub">Every change to this site, newest first.</p>
      </div>

      {offline && (
        <p className="cl-note">Showing a saved snapshot. The live changelog is waking up, so refresh in a moment.</p>
      )}
      {!entries && <p className="cl-note">Loading…</p>}

      <div className="cl-list">
        {entries?.map((e) => (
          <article className="cl-item" key={e.version}>
            <div className="cl-meta">
              <span className="cl-version">v{e.version}</span>
              <time dateTime={e.date}>{formatDate(e.date)}</time>
            </div>
            <div>
              <span className="cl-type">{e.type}</span>
              <h2 className="cl-title">{e.title}</h2>
              <p className="cl-desc">{e.description}</p>
              {e.link && (
                <ExternalLink href={e.link} className="view-more-link" style={{ marginTop: 14 }}>
                  Learn more
                </ExternalLink>
              )}
            </div>
          </article>
        ))}
      </div>
    </main>
  )
}
