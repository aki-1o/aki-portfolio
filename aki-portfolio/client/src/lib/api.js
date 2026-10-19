const API = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')

export async function fetchChangelog() {
  const res = await fetch(`${API}/api/changelog`)
  if (!res.ok) throw new Error('Could not load the changelog')
  return res.json()
}

export async function addChangelogEntry(entry, adminKey) {
  const res = await fetch(`${API}/api/changelog`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
    body: JSON.stringify(entry),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Request failed')
  return data
}
