// Rocker switch. The raised half (with the red glow) shows the active theme:
// top = dark, bottom = light. Single click toggles; double click opens console mode.
export default function ThemeToggle({ toggleTheme, onConsole }) {
  return (
    <button
      className="rocker"
      onClick={toggleTheme}
      onDoubleClick={onConsole}
      aria-label="Toggle dark mode"
      title="Click: theme · Double-click: console"
    >
      <span className="rocker-half top" />
      <span className="rocker-half bottom" />
    </button>
  )
}
