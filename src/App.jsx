// src/App.jsx
import { useState, useEffect } from "react"
import { NavLink, Outlet, useOutletContext } from "react-router-dom"
import { useAuth } from "./hooks/useAuth"
import "./styles/Layout.css"
import "./styles/App.css"

function App() {
  const { user, loading } = useAuth()
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode")
    return saved ? JSON.parse(saved) : true
  })

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.style.setProperty("--bg", "#000000")
      root.style.setProperty("--text", "#ffffff")
      root.style.setProperty("--accent", "#8b5cf6")
      root.style.setProperty("--muted", "#374151")
    } else {
      root.style.setProperty("--bg", "#ffffff")
      root.style.setProperty("--text", "#1f2937")
      root.style.setProperty("--accent", "#7c3aed")
      root.style.setProperty("--muted", "#e5e7eb")
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode))
  }, [darkMode])

  if (loading) {
    return (
      <div
        className="app-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100dvh",
        }}
      >
        <div>Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <header className="header">
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

      <main className="app-main">
        <Outlet context={{ userId: user?.uid }} />
      </main>

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
      </nav>
    </div>
  )
}

export default App

// Утилита для получения userId в дочерних компонентах
export function useUserId() {
  return useOutletContext()?.userId
}
