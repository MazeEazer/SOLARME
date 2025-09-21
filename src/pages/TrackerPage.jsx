// TrackerPage.jsx
import { useMemo, useState, useEffect } from "react"
import MetricInput from "../components/Tracker/MetricInput.jsx"
import SaveButton from "../components/Tracker/SaveButton.jsx"
import { useUserId } from "../App.jsx"
import { saveUserData } from "../utils/cloudStorage.js"

export default function TrackerPage() {
  const userId = useUserId()

  // Используем ISO string для даты
  const today = useMemo(() => {
    return new Date().toISOString().split("T")[0] // YYYY-MM-DD
  }, [])

  // Загружаем биохаки из localStorage или используем дефолтные
  const [hacksList, setHacksList] = useState(() => {
    const saved = localStorage.getItem("trackedHacks")
    if (saved) return JSON.parse(saved)
    return [
      { id: 1, title: "Прогулка на свежем воздухе", tracked: false },
      { id: 2, title: "Вода после пробуждения", tracked: false },
      { id: 3, title: "Зарядка утром", tracked: false },
      { id: 4, title: "Контрастный душ", tracked: false },
      { id: 5, title: "1 час без телефона", tracked: false },
      { id: 6, title: "Интервальное голодание 16/8", tracked: false },
      { id: 7, title: "Без синего света вечером", tracked: false },
    ]
  })

  const [form, setForm] = useState({
    mood: 5,
    work: "0",
    social: 5,
    steps: "",
    sleep: "",
    training: false,
    rating: 5,
    hacks: {}, // { [id]: boolean }
  })

  // При загрузке — инициализируем hacks из trackedHacks
  useEffect(() => {
    const load = async () => {
      const savedData = await loadUserData(userId, "trackerData")
      if (savedData && savedData.length > 0) {
        // Можно использовать последнюю запись для предзаполнения формы (опционально)
      }
    }
    if (userId) load()
  }, [userId])

  const update = (key) => (value) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const toggleHack = (id) => {
    setForm((prev) => ({
      ...prev,
      hacks: {
        ...prev.hacks,
        [id]: !prev.hacks[id],
      },
    }))
  }

  return (
    <div className="tracker">
      <h2 className="tracker-date">{today}</h2>

      <MetricInput
        type="slider"
        label="Настроение"
        value={form.mood}
        onChange={update("mood")}
        min={1}
        max={10}
        colorMap={{
          1: "#ef4444",
          2: "#f97316",
          3: "#f59e0b",
          4: "#fbbf24",
          5: "#8b5cf6",
          6: "#6366f1",
          7: "#3b82f6",
          8: "#10b981",
          9: "#059669",
          10: "#047857",
        }}
      />

      <MetricInput
        type="buttons"
        label="Работа"
        value={form.work}
        options={[
          { value: "0", label: "0" },
          { value: "work", label: "work" },
          { value: "work+", label: "work+" },
        ]}
        onChange={update("work")}
      />

      <MetricInput
        type="slider"
        label="Социальность"
        value={form.social}
        onChange={update("social")}
        min={1}
        max={10}
        colorMap={{
          1: "#ef4444",
          2: "#f97316",
          3: "#f59e0b",
          4: "#fbbf24",
          5: "#8b5cf6",
          6: "#6366f1",
          7: "#3b82f6",
          8: "#10b981",
          9: "#059669",
          10: "#047857",
        }}
      />

      <MetricInput
        type="number"
        label="Шаги"
        value={form.steps}
        onChange={update("steps")}
      />
      <MetricInput
        type="number"
        label="Сон (часы)"
        value={form.sleep}
        onChange={update("sleep")}
      />

      <MetricInput
        type="toggle"
        label="Тренировка"
        value={form.training}
        onChange={update("training")}
      />

      <MetricInput
        type="slider"
        label="Оценка дня"
        value={form.rating}
        onChange={update("rating")}
        min={1}
        max={10}
        colorMap={{
          1: "#ef4444",
          2: "#f97316",
          3: "#f59e0b",
          4: "#fbbf24",
          5: "#8b5cf6",
          6: "#6366f1",
          7: "#3b82f6",
          8: "#10b981",
          9: "#059669",
          10: "#047857",
        }}
      />

      {/* Биохаки */}
      {Object.keys(form.hacks).length > 0 && (
        <div className="metric">
          <div className="metric-label">Биохаки сегодня</div>
          <div
            className="metric-buttons"
            style={{ gridTemplateColumns: "1fr" }}
          >
            {hacksList
              .filter((h) => h.tracked)
              .map((hack) => (
                <button
                  key={hack.id}
                  className={`metric-btn toggle-hack ${
                    form.hacks[hack.id] ? "active" : ""
                  }`}
                  onClick={() => toggleHack(hack.id)}
                  style={{
                    justifyContent: "space-between",
                    textAlign: "left",
                    padding: "12px 16px",
                  }}
                >
                  <span>{hack.title}</span>
                  <span style={{ fontSize: "18px" }}>
                    {form.hacks[hack.id] ? "✅" : "⬜"}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}

      <SaveButton
        onClick={async () => {
          const data = {
            date: today,
            mood: form.mood,
            work: form.work,
            social: form.social,
            steps: Number(form.steps) || 0,
            sleep: Number(form.sleep) || 0,
            training: form.training,
            rating: form.rating,
            hacks: { ...form.hacks },
          }

          // Сохраняем в облако
          const saved = (await loadUserData(userId, "trackerData")) || []
          saved.push(data)
          await saveUserData(userId, "trackerData", saved)

          alert("✅ День сохранён!")
        }}
      />
    </div>
  )
}
