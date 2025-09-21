// BiohacksPage.jsx
import { useState, useEffect } from "react"

export default function BiohacksPage() {
  const [hacks, setHacks] = useState([])
  const [toast, setToast] = useState(null)

  // Загружаем из localStorage
  useEffect(() => {
    const load = async () => {
      const saved = await loadUserData(userId, "trackedHacks")
      if (saved) {
        setHacks(saved)
      } else {
        const defaultHacks = [
          /* твой массив */
        ]
        setHacks(defaultHacks)
        await saveUserData(userId, "trackedHacks", defaultHacks)
      }
    }
    if (userId) load()
  }, [userId])
  const toggleHack = async (id) => {
    setHacks((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const updated = { ...h, tracked: !h.tracked }
          setToast(
            updated.tracked
              ? `"${h.title}" добавлен к ежедневному отслеживанию`
              : `"${h.title}" удалён из отслеживания"`
          )
          setTimeout(() => setToast(null), 2000)
          return updated
        }
        return h
      })
    )

    // После изменения — сохраняем в облако
    setTimeout(async () => {
      await saveUserData(userId, "trackedHacks", hacks)
    }, 500)
  }
  // Сохраняем в localStorage при изменении
  useEffect(() => {
    if (hacks.length > 0) {
      localStorage.setItem("trackedHacks", JSON.stringify(hacks))
    }
  }, [hacks])

  return (
    <div className="biohacks">
      <div className="cards">
        {hacks.map((h) => (
          <div key={h.id} className="hack-card">
            <div className="hack-title">{h.title}</div>
            <div className="hack-desc">{h.desc}</div>
            <button className="add-track" onClick={() => toggleHack(h.id)}>
              {h.tracked ? "Уже отслеживается" : "Добавить к отслеживанию"}
            </button>
          </div>
        ))}
      </div>

      {/* Toast-уведомление */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "90px", // выше bottom-nav
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--accent)",
            color: "#000",
            padding: "12px 24px",
            borderRadius: "8px",
            fontWeight: 500,
            zIndex: 2000,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {toast}
        </div>
      )}
    </div>
  )
}
