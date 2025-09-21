import { useState, useEffect } from "react"
import { NavLink, Outlet } from "react-router-dom"
import "./styles/Layout.css"
import "./styles/App.css"

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode")
    return saved ? JSON.parse(saved) : true
  })

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.style.setProperty("--bg", "#000000")
      root.style.setProperty("--text", "#ffffff")
      root.style.setProperty("--accent", "#8b5cf6") // ← был #fbbf24
      root.style.setProperty("--muted", "#374151")
    } else {
      root.style.setProperty("--bg", "#ffffff")
      root.style.setProperty("--text", "#1f2937")
      root.style.setProperty("--accent", "#7c3aed") // ← чуть темнее для контраста на светлом
      root.style.setProperty("--muted", "#e5e7eb")
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode))
  }, [darkMode])

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        {/* 🔗 Сделали логотип кликабельным — ведёт на главную */}
        <NavLink to="/" className="logo">
          SÓLAR ME
        </NavLink>
        <button
          onClick={() => setDarkMode(!darkMode)}
          aria-label="Toggle theme"
          className="theme-toggle"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </header>
      {/* Main content */}
      <main className="app-main">
        <Outlet />
      </main>
      {/* Bottom navigation */}
      <nav className="bottom-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Главная</span>
        </NavLink>
        <NavLink
          to="/tracker"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">📝</span>
          <span className="nav-label">Трекер</span>
        </NavLink>
        <NavLink
          to="/analytics"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">📈</span>
          <span className="nav-label">Аналитика</span>
        </NavLink>
        <NavLink
          to="/biohacks"
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          <span className="nav-icon">✨</span>
          <span className="nav-label">Биохаки</span>
        </NavLink>
      </nav>{" "}
    </div>
  )
}

export default App
