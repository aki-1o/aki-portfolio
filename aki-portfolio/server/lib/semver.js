// Strict "major.minor.patch" versions (an optional leading "v" is accepted).
export function parseVersion(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(String(v ?? '').trim())
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null
}

// >0 if a is newer than b, <0 if older, 0 if equal. Both must be valid.
export function compareVersions(a, b) {
  const pa = parseVersion(a)
  const pb = parseVersion(b)
  for (let i = 0; i < 3; i++) {
    if (pa[i] !== pb[i]) return pa[i] - pb[i]
  }
  return 0
}

export const normalizeVersion = (v) => parseVersion(v).join('.')
