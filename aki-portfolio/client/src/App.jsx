import { useCallback, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ScrollToHash from './components/ScrollToHash.jsx'
import GlobalKeys from './components/GlobalKeys.jsx'
import EmojiBurst from './components/EmojiBurst.jsx'
import CursorTrail from './components/CursorTrail.jsx'
import CoffeeClicker from './components/CoffeeClicker.jsx'
import Terminal from './components/Terminal.jsx'
import Home from './pages/Home.jsx'
import Projects from './pages/Projects.jsx'
import Changelog from './pages/Changelog.jsx'
import ChangelogEdit from './pages/ChangelogEdit.jsx'
import Snake from './pages/Snake.jsx'
import NotFound from './pages/NotFound.jsx'
import { useTheme } from './hooks/useTheme.js'

export default function App() {
  const [, toggleTheme] = useTheme()
  const [consoleOpen, setConsoleOpen] = useState(false)
  const { pathname } = useLocation()
  const onSnake = pathname === '/snake'

  const openConsole = useCallback(() => setConsoleOpen(true), [])
  const closeConsole = useCallback(() => setConsoleOpen(false), [])
  const toggleConsole = useCallback(() => setConsoleOpen((o) => !o), [])

  return (
    <>
      <ScrollToHash />
      <GlobalKeys onToggleConsole={toggleConsole} />
      <Navbar toggleTheme={toggleTheme} onConsole={openConsole} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/changelog/edit/by/:who" element={<ChangelogEdit />} />
        <Route path="/snake" element={<Snake />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {!onSnake && <Footer />}

      <EmojiBurst />
      <CursorTrail />
      {!onSnake && !consoleOpen && <CoffeeClicker />}
      {consoleOpen && <Terminal onClose={closeConsole} />}
    </>
  )
}
