// BiohacksPage.jsx
import { useState, useEffect } from "react"
import { useUserId } from "../App.jsx"
import { loadUserData, saveUserData } from "../utils/cloudStorage.js"

export default function BiohacksPage() {
  const userId = useUserId() // ← КРИТИЧНО!
  const [hacks, setHacks] = useState([])
  const [toast, setToast] = useState(null)

  // Защита: если userId ещё не загружен — показываем загрузку
  if (!userId) {
    return <div>Инициализация...</div>
  }

  useEffect(() => {
    const load = async () => {
      const saved = await loadUserData(userId, "trackedHacks")
      if (saved) {
        setHacks(saved)
      } else {
        const defaultHacks = [
          {
            id: 1,
            title: "Прогулка на свежем воздухе",
            desc: "Естественный свет обязательно должен присутствовать в нашей жизни.",
            tracked: false,
          },
          {
            id: 2,
            title: "Вода после пробуждения",
            desc: "Стакан воды для гидратации и метаболизма.",
            tracked: false,
          },
          {
            id: 3,
            title: "Зарядка утром",
            desc: "Движение и запуск организма",
            tracked: false,
          },
          {
            id: 4,
            title: "Контрастный душ",
            desc: "Тренировка сосудов и пробуждение за счет смены температур.",
            tracked: false,
          },
          {
            id: 5,
            title: "1 час в день без телефона",
            desc: "Снижение нагрузки на глаза и нервную систему.",
            tracked: false,
          },
          {
            id: 6,
            title: "Интервальное голодание 16/8",
            desc: "Соблюдение окна для приема пищи для улучшения метаболизма и аутофагии.",
            tracked: false,
          },
          {
            id: 7,
            title: "Без синего света вечером",
            desc: "Использование режима Night Shift и отказ от гаджетов перед сном для улучшения качества сна.",
            tracked: false,
          },
        ]
        setHacks(defaultHacks)
        await saveUserData(userId, "trackedHacks", defaultHacks)
      }
    }
    load()
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

    // Сохраняем изменения в облаке
    setTimeout(async () => {
      await saveUserData(userId, "trackedHacks", hacks)
    }, 500)
  }

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
            bottom: "90px",
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
