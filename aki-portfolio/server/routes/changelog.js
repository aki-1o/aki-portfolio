import { Router } from 'express'
import { timingSafeEqual } from 'node:crypto'
import { changelog } from '../db.js'
import { parseVersion, compareVersions, normalizeVersion } from '../lib/semver.js'

const router = Router()
const TYPES = ['feature', 'improvement', 'fix', 'design']

// Tiny in-memory brake on key guessing: 8 failures per IP per 15 minutes.
const failures = new Map()
const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS = 8

function isBlocked(ip) {
  const f = failures.get(ip)
  if (!f) return false
  if (Date.now() > f.resetAt) {
    failures.delete(ip)
    return false
  }
  return f.count >= MAX_FAILS
}
function recordFailure(ip) {
  const f = failures.get(ip)
  if (!f || Date.now() > f.resetAt) failures.set(ip, { count: 1, resetAt: Date.now() + WINDOW_MS })
  else f.count += 1
}

function keyMatches(provided) {
  const expected = process.env.ADMIN_KEY
  if (!expected || typeof provided !== 'string') return false
  const a = Buffer.from(provided)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

function isIsoDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

async function allEntries() {
  const docs = await changelog().find({}, { projection: { _id: 0 } }).toArray()
  return docs.sort((a, b) => compareVersions(b.version, a.version))
}

router.get('/', async (req, res, next) => {
  try {
    if (!changelog()) return res.status(503).json({ error: 'Database unavailable' })
    res.json(await allEntries())
  } catch (err) {
    next(err)
  }
})

router.post('/', async (req, res, next) => {
  try {
    if (!changelog()) return res.status(503).json({ error: 'Database unavailable' })
    if (!process.env.ADMIN_KEY) return res.status(503).json({ error: 'Editing is disabled: ADMIN_KEY is not set on the server' })
    if (isBlocked(req.ip)) return res.status(429).json({ error: 'Too many failed attempts. Try again in a few minutes.' })

    if (!keyMatches(req.get('x-admin-key'))) {
      recordFailure(req.ip)
      return res.status(401).json({ error: 'Invalid admin key' })
    }

    const { version, title, description, date, type = 'improvement', link = '' } = req.body || {}

    if (!parseVersion(version)) return res.status(400).json({ error: 'Version must look like 1.2.3' })
    if (typeof title !== 'string' || !title.trim() || title.length > 120) return res.status(400).json({ error: 'Title is required (max 120 characters)' })
    if (typeof description !== 'string' || !description.trim() || description.length > 2000) return res.status(400).json({ error: 'Description is required (max 2000 characters)' })
    if (!isIsoDate(date)) return res.status(400).json({ error: 'Date must be a valid YYYY-MM-DD' })
    if (!TYPES.includes(type)) return res.status(400).json({ error: `Type must be one of: ${TYPES.join(', ')}` })
    if (link && !/^https?:\/\/\S+$/i.test(link)) return res.status(400).json({ error: 'Link must start with http:// or https://' })

    const [latest] = await allEntries()
    const v = normalizeVersion(version)
    if (latest && compareVersions(v, latest.version) <= 0) {
      return res.status(409).json({ error: `Version must be higher than the latest (${latest.version})` })
    }
    if (latest && date <= latest.date) {
      return res.status(409).json({ error: `Date must be later than the latest entry (${latest.date})` })
    }

    const doc = { version: v, title: title.trim(), description: description.trim(), date, type, link, createdAt: new Date() }
    try {
      await changelog().insertOne(doc)
    } catch (err) {
      if (err?.code === 11000) return res.status(409).json({ error: `Version ${v} already exists` })
      throw err
    }
    const { _id, ...clean } = doc
    res.status(201).json(clean)
  } catch (err) {
    next(err)
  }
})

export default router
