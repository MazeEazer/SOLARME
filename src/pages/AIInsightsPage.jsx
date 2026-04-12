// src/pages/AIInsightsPage.jsx
import { useState } from "react"
import { useUserId } from "../App.jsx"
import {
  aggregateUserData,
  generateAIInsight,
  checkInsightCache,
  saveInsightCache,
} from "../utils/aiAnalytics.js"

export default function AIInsightsPage() {
  const userId = useUserId()
  const [insight, setInsight] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState("week")

  // 🔹 Тоггл: тестовые / реальные данные
  const [useMockData, setUseMockData] = useState(true)
  const [mockScenario, setMockScenario] = useState("balanced") // ← Используем mockScenario

  const handleGenerate = async () => {
    // Если нужны реальные данные — проверяем авторизацию
    if (!useMockData && !userId) {
      setError("🔐 Требуется авторизация для работы с реальными данными")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1. Проверяем кэш (только для реальных данных)
      if (!useMockData && userId) {
        const cached = await checkInsightCache(userId, period)
        if (cached) {
          setInsight(cached.insight)
          return
        }
      }

      // 2. Получаем данные
      let userData
      if (useMockData) {
        // 🔹 Загружаем mock-данные динамически
        const { getMockUserData } = await import("../utils/aiAnalyticsMock.js")
        userData = getMockUserData(mockScenario, period) // ← Используем mockScenario
      } else {
        // 🔹 Загружаем реальные данные из Firebase
        userData = await aggregateUserData(userId, period)
      }

      if (userData.dataPoints === 0) {
        throw new Error("Недостаточно данных. Заполни трекер за 7+ дней.")
      }

      // 3. Запрашиваем инсайт у AI
      const result = await generateAIInsight(userData)
      setInsight(result)

      // 4. Сохраняем в кэш (только для реальных данных)
      if (!useMockData && userId) {
        await saveInsightCache(userId, period, result)
      }
    } catch (err) {
      console.error("AI Error:", err)
      setError(err.message || "Не удалось получить инсайт")
    } finally {
      setLoading(false)
    }
  }

  // Если userId ещё не загрузился (для реальных данных)
  if (!useMockData && userId === undefined) {
    return <div className="ai-insights">⏳ Загрузка...</div>
  }

  return (
    <div className="ai-insights">
      <h2 className="ai-title">🤖 AI-Инсайты</h2>

      {/* 🔹 Панель управления: режим + сценарий */}
      <div className="control-panel">
        {/* Тоггл режима */}
        <div className="mode-toggle">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={useMockData}
              onChange={(e) => {
                setUseMockData(e.target.checked)
                setInsight(null) // Сбрасываем результат при смене режима
              }}
            />
            <span className="toggle-text">
              {useMockData ? "🧪 Тестовые данные" : "🔗 Реальные данные"}
            </span>
          </label>
        </div>

        {/* Селектор сценария (только для тестового режима) */}
        {useMockData && (
          <div className="scenario-selector">
            <label>Сценарий: </label>
            <select
              value={mockScenario} // ← Используем mockScenario
              onChange={(e) => {
                setMockScenario(e.target.value) // ← Используем setMockScenario
                setInsight(null) // Сбрасываем при смене сценария
              }}
            >
              <option value="balanced">🟢 Сбалансированный</option>
              <option value="highPerformer">🚀 Высокий перформанс</option>
              <option value="burnout">📉 Выгорание</option>
              <option value="athlete">🏃 Атлет</option>
              <option value="mentalHealth">🧘 Ментальное здоровье</option>
              <option value="sedentary">💼 Офисный работник</option>
              <option value="sleepIssues">🌙 Проблемы со сном</option>
              <option value="experimenter">🎯 Экспериментатор</option>
            </select>
          </div>
        )}

        {/* Индикатор источника данных */}
        <div className="data-source-indicator">
          {useMockData
            ? `📊 Сценарий: ${mockScenario}` // ← Используем mockScenario
            : `👤 Пользователь: ${userId?.slice(0, 8)}...`}
        </div>
      </div>

      {/* Переключатель периода */}
      <div className="period-switch">
        {["week", "month", "year"].map((p) => (
          <button
            key={p}
            className={`period ${period === p ? "active" : ""}`}
            onClick={() => {
              setPeriod(p)
              setInsight(null) // Сбрасываем при смене периода
            }}
          >
            {p === "week" ? "Неделя" : p === "month" ? "Месяц" : "Год"}
          </button>
        ))}
      </div>

      {/* Кнопка генерации */}
      {!insight && !loading && (
        <button onClick={handleGenerate} className="btn-primary">
          {useMockData ? "🧪 Сгенерировать тест" : "🔍 Получить анализ"}
        </button>
      )}

      {/* Загрузка */}
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>
            {useMockData
              ? "🤖 Генерирую ответ с использованием базы знаний..."
              : "🔍 Анализирую твои данные + ищу в базе знаний..."}
          </p>
        </div>
      )}

      {/* Ошибка */}
      {error && (
        <div className="error">
          <p>⚠️ {error}</p>
          <button onClick={handleGenerate}>Попробовать снова</button>
        </div>
      )}

      {/* Результат */}
      {insight && (
        <div className="insight-card">
          <div className="insight-header">
            <h3>
              📊 {useMockData ? "Тестовый отчёт" : "Твой персональный отчёт"}
            </h3>
            <span className="cached-badge">
              {new Date().toLocaleDateString()}
            </span>
          </div>
          <div className="insight-content">
            {insight.split("\n").map((line, i) => {
              if (line.startsWith("♦"))
                return (
                  <div key={i} className="section">
                    {line}
                  </div>
                )
              if (
                line.startsWith("1.") ||
                line.startsWith("2.") ||
                line.startsWith("3.")
              )
                return (
                  <div key={i} className="recommendation">
                    {line}
                  </div>
                )
              if (line.startsWith("-"))
                return (
                  <div key={i} className="source">
                    {line}
                  </div>
                )
              if (line.startsWith("⚠️"))
                return (
                  <div key={i} className="disclaimer">
                    {line}
                  </div>
                )
              return <p key={i}>{line}</p>
            })}
          </div>
          <button onClick={handleGenerate} className="btn-secondary">
            🔄 {useMockData ? "Сгенерировать заново" : "Обновить анализ"}
          </button>
        </div>
      )}
    </div>
  )
}
