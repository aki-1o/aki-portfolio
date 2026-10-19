import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import NotFound from './NotFound.jsx'
import { addChangelogEntry, fetchChangelog } from '../lib/api.js'
import { addDays, bumpPatch, compareVersions, formatDate, parseVersion, todayISO } from '../lib/semver.js'

const ALLOWED = ['aki', 'akshat']
const TYPES = ['feature', 'improvement', 'fix', 'design']

// Suggested next version/date: patch bump, and today (or the day after the latest, if later).
function suggest(latest) {
  if (!latest) return { version: '1.0.0', date: todayISO() }
  const next = addDays(latest.date, 1)
  const today = todayISO()
  return { version: bumpPatch(latest.version), date: next > today ? next : today }
}

export default function ChangelogEdit() {
  const { who } = useParams()
  if (!ALLOWED.includes(String(who).toLowerCase())) return <NotFound />
  return <EditForm />
}

function EditForm() {
  const [latest, setLatest] = useState(undefined) // undefined = loading, null = none/unreachable
  const [loadError, setLoadError] = useState(false)
  const [form, setForm] = useState({ version: '', title: '', description: '', date: '', type: 'improvement', link: '' })
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('aki-admin-key') || '')
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ kind: 'idle', message: '' })

  // Keep this page out of search results.
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [])

  useEffect(() => {
    fetchChangelog()
      .then((list) => {
        const top = list[0] || null
        setLatest(top)
        setForm((f) => ({ ...f, ...suggest(top) }))
      })
      .catch(() => {
        setLatest(null)
        setLoadError(true)
        setForm((f) => ({ ...f, date: todayISO() }))
      })
  }, [])

  const set = (name) => (e) => setForm((f) => ({ ...f, [name]: e.target.value }))

  function validate() {
    const errs = {}
    if (!parseVersion(form.version)) errs.version = 'Use the form 1.2.3'
    else if (latest && compareVersions(form.version, latest.version) <= 0) errs.version = `Must be higher than ${latest.version}`
    if (!form.title.trim()) errs.title = 'Required'
    if (!form.description.trim()) errs.description = 'Required'
    if (!form.date) errs.date = 'Required'
    else if (latest && form.date <= latest.date) errs.date = `Must be later than ${latest.date}`
    if (form.link && !/^https?:\/\/\S+$/i.test(form.link)) errs.link = 'Must start with http:// or https://'
    if (!adminKey) errs.adminKey = 'Required'
    return errs
  }

  async function onSubmit(e) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length) return

    setStatus({ kind: 'saving', message: '' })
    try {
      const created = await addChangelogEntry(form, adminKey)
      sessionStorage.setItem('aki-admin-key', adminKey)
      setLatest(created)
      setForm({ version: '', title: '', description: '', date: '', type: 'improvement', link: '', ...suggest(created) })
      setStatus({ kind: 'ok', message: `Published v${created.version}.` })
    } catch (err) {
      setStatus({ kind: 'error', message: err.message })
    }
  }

  return (
    <main className="wrap page-narrow">
      <div className="page-head">
        <p className="eyebrow">Changelog · Editor</p>
        <h1>Add an update</h1>
        <p className="page-sub">
          {latest
            ? `Latest: v${latest.version} · ${formatDate(latest.date)}. New entries need a higher version and a later date.`
            : latest === undefined
              ? 'Loading the latest entry…'
              : 'No entries yet.'}
        </p>
      </div>

      {loadError && (
        <p className="form-banner error">
          Couldn't reach the API, so the version/date checks below can't compare against the latest entry. The server still enforces them.
        </p>
      )}

      <form className="edit-form" onSubmit={onSubmit} noValidate>
        <div className="field-row">
          <Field label="Version" error={errors.version} hint="major.minor.patch">
            <input value={form.version} onChange={set('version')} placeholder="1.0.1" inputMode="numeric" />
          </Field>
          <Field label="Date" error={errors.date}>
            <input type="date" value={form.date} onChange={set('date')} min={latest ? addDays(latest.date, 1) : undefined} />
          </Field>
        </div>

        <Field label="Title" error={errors.title}>
          <input value={form.title} onChange={set('title')} maxLength={120} />
        </Field>

        <Field label="Description" error={errors.description}>
          <textarea value={form.description} onChange={set('description')} maxLength={2000} />
        </Field>

        <div className="field-row">
          <Field label="Type">
            <select value={form.type} onChange={set('type')}>
              {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Link (optional)" error={errors.link}>
            <input value={form.link} onChange={set('link')} placeholder="https://" />
          </Field>
        </div>

        <Field label="Admin key" error={errors.adminKey} hint="Checked by the server. Kept for this browser session only.">
          <input type="password" value={adminKey} onChange={(e) => setAdminKey(e.target.value)} autoComplete="off" />
        </Field>

        {status.kind === 'error' && <p className="form-banner error">{status.message}</p>}
        {status.kind === 'ok' && (
          <p className="form-banner ok">
            {status.message} <Link to="/changelog" className="view-more-link">View changelog</Link>
          </p>
        )}

        <div>
          <button type="submit" className="cta-pill" disabled={status.kind === 'saving'}>
            {status.kind === 'saving' ? 'Publishing…' : 'Publish update'}
          </button>
        </div>
      </form>
    </main>
  )
}

function Field({ label, error, hint, children }) {
  return (
    <div className="field">
      <label>
        {label}
        {children}
      </label>
      {error ? <p className="error">{error}</p> : hint ? <p className="hint">{hint}</p> : null}
    </div>
  )
}
