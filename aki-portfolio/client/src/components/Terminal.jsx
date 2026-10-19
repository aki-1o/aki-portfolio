import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { projects } from '../data/projects.js'
import { services } from '../data/services.js'
import { intro, process, social } from '../data/site.js'
import { changelogSeed } from '../data/changelog.seed.js'
import { fetchChangelog } from '../lib/api.js'
import { compareVersions } from '../lib/semver.js'

const out = (text = '', href) => ({ t: 'out', text, href })
const err = (text) => ({ t: 'err', text })

const HELP = [
  ['help', 'list commands'],
  ['home', 'who I am'],
  ['about', 'how I work'],
  ['work', 'projects I have built'],
  ['stack', 'what I work with'],
  ['changelog', 'latest site updates'],
  ['contact', 'email, phone, links'],
  ['snake', 'play commit.snake()'],
  ['coffee', 'a mug, for morale'],
  ['clear', 'clear the screen'],
  ['exit', 'back to the website (or press Esc)'],
]
const NAMES = [...HELP.map(([c]) => c), 'whoami']

const commands = {
  help: () => [out('Available commands:'), ...HELP.map(([c, d]) => out(`  ${c.padEnd(11)}${d}`))],
  whoami: () => [out('akshat — full-stack developer')],
  home: () => [
    out(intro.name),
    out(''),
    ...intro.lead.map((l) => out(l)),
    out(''),
    ...intro.facts.map((f) => out(`  > ${f}`)),
  ],
  about: () => [
    out('How I work:'),
    ...process.map((s) => out(`  ${s.index.replace(/\//g, '').trim()}  ${s.title.padEnd(12)}${s.body}`)),
  ],
  work: () => [
    out(`${projects.length} projects:`),
    ...projects.flatMap((p) => [
      out(`  ${p.title} (${p.year})`),
      out(`    ${p.description}`),
      out(`    [${p.tags.join(', ')}]  ${p.link}`, p.link),
    ]),
  ],
  stack: () => services.map((s) => out(`  ${s.name.padEnd(36)}${s.tools}`)),
  contact: () => [
    out(`  email     ${social.email}`, `mailto:${social.email}`),
    out(`  phone     ${social.phoneDisplay}`, `tel:${social.phone}`),
    out(`  github    ${social.github}`, social.github),
    out(`  linkedin  ${social.linkedin}`, social.linkedin),
  ],
  coffee: () => [
    out('      ( (  '),
    out('       ) ) '),
    out('    ........'),
    out('    |      |]'),
    out('    \\      /'),
    out('     `----\''),
    out(''),
    out('Fuel for the next commit.'),
  ],
}

export default function Terminal({ onClose }) {
  const navigate = useNavigate()
  const [lines, setLines] = useState([
    out(`${intro.name} — console mode`),
    out("Type 'help' for commands, 'exit' (or Esc) to go back."),
    out(''),
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [hIdx, setHIdx] = useState(-1)
  const inputRef = useRef(null)
  const endRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  useEffect(() => {
    endRef.current?.scrollIntoView()
  }, [lines])

  async function run(raw) {
    const name = raw.trim().toLowerCase()
    const echo = { t: 'cmd', text: raw }
    if (!name) return setLines((l) => [...l, echo])
    setHistory((h) => [raw, ...h])

    if (name === 'clear') return setLines([])
    if (name === 'exit' || name === 'quit') return onClose()
    if (name === 'snake') {
      onClose()
      return navigate('/snake', { state: { autostart: true } })
    }
    if (name === 'changelog') {
      setLines((l) => [...l, echo, out('fetching…')])
      let list
      try {
        list = await fetchChangelog()
      } catch {
        list = [...changelogSeed].sort((a, b) => compareVersions(b.version, a.version))
      }
      return setLines((l) => [
        ...l.slice(0, -1),
        ...list.slice(0, 5).flatMap((e) => [out(`v${e.version}  ${e.date}  [${e.type}]  ${e.title}`), out(`    ${e.description}`)]),
      ])
    }
    const fn = commands[name]
    setLines((l) => [...l, echo, ...(fn ? fn() : [err(`command not found: ${name}. Type 'help'.`)])])
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      run(input)
      setInput('')
      setHIdx(-1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      const n = Math.min(hIdx + 1, history.length - 1)
      if (n >= 0) { setHIdx(n); setInput(history[n]) }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      const n = hIdx - 1
      setHIdx(n)
      setInput(n >= 0 ? history[n] : '')
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const match = NAMES.filter((c) => c.startsWith(input.toLowerCase()))
      if (input && match.length === 1) setInput(match[0])
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    }
  }

  return (
    <div className="term" role="dialog" aria-label="Console mode" onClick={() => inputRef.current?.focus()}>
      <div className="term-scroll">
        {lines.map((l, i) => (
          <div key={i} className={`term-line ${l.t}`}>
            {l.t === 'cmd' && <span className="term-prompt">aki@portfolio:~$ </span>}
            {l.href ? <a href={l.href} target="_blank" rel="noopener noreferrer">{l.text}</a> : l.text || '\u00a0'}
          </div>
        ))}
        <div className="term-line">
          <span className="term-prompt">aki@portfolio:~$ </span>
          <input
            ref={inputRef}
            className="term-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            aria-label="Console input"
          />
        </div>
        <div ref={endRef} />
      </div>
      <button className="term-exit" onClick={onClose}>exit</button>
    </div>
  )
}
