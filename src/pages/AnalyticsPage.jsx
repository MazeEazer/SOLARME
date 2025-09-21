// AnalyticsPage.jsx
import { useState, useMemo } from "react"
import { useUserId } from "../App.jsx"
import { loadUserData } from "../utils/cloudStorage.js"

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export default function AnalyticsPage() {
  const userId = useUserId()
  const [hacksList, setHacksList] = useState([])
  const [allData, setAllData] = useState([])

  const hacksList = JSON.parse(localStorage.getItem("trackedHacks") || "[]")
  const [period, setPeriod] = useState("week")

  // Загружаем ВСЕ реальные данные
  useEffect(() => {
    const load = async () => {
      if (!userId) return
      const loadedHacks = (await loadUserData(userId, "trackedHacks")) || []
      const loadedData = (await loadUserData(userId, "trackerData")) || []
      setHacksList(loadedHacks)
      setAllData(
        loadedData
          .filter((item) => item.date && !isNaN(new Date(item.date).getTime()))
          .sort((a, b) => new Date(b.date) - new Date(a.date))
      )
    }
    load()
  }, [userId])

  // Фильтруем данные по периоду — сохраняем date для всех
  const data = useMemo(() => {
    if (allData.length === 0) return []

    if (period === "week") {
      return allData.slice(0, 7).reverse()
    }
    if (period === "month") {
      return allData.slice(0, 30).reverse()
    }
    if (period === "year") {
      // Группируем по месяцам, сохраняя первую запись с датой
      const monthlyMap = {}
      for (let record of allData) {
        const date = new Date(record.date)
        if (isNaN(date.getTime())) continue
        const monthKey = date.getMonth()
        if (!monthlyMap[monthKey] && Object.keys(monthlyMap).length < 12) {
          monthlyMap[monthKey] = {
            ...record,
            month: [
              "Янв",
              "Фев",
              "Мар",
              "Апр",
              "Май",
              "Июн",
              "Июл",
              "Авг",
              "Сен",
              "Окт",
              "Ноя",
              "Дек",
            ][monthKey],
          }
        }
      }
      return Object.values(monthlyMap).reverse()
    }
    return allData.slice(0, 7).reverse()
  }, [allData, period])

  // Вычисляем средние значения
  const stats = useMemo(() => {
    if (data.length === 0) return { avgRating: 0, avgSteps: 0, avgSleep: 0 }

    if (period === "year") {
      const avgMood =
        data.reduce((acc, d) => acc + (d.mood || 0), 0) / data.length
      const avgSteps =
        data.reduce((acc, d) => acc + (d.steps || 0), 0) / data.length
      const avgSleep =
        data.reduce((acc, d) => acc + (d.sleep || 0), 0) / data.length
      const avgRating =
        data.reduce((acc, d) => acc + (d.rating || 0), 0) / data.length
      return {
        avgRating: parseFloat(avgRating.toFixed(1)),
        avgSteps: Math.round(avgSteps),
        avgSleep: parseFloat(avgSleep.toFixed(1)),
      }
    }

    const avgMood =
      data.reduce((acc, d) => acc + (d.mood || 0), 0) / data.length
    const avgSteps =
      data.reduce((acc, d) => acc + (d.steps || 0), 0) / data.length
    const avgSleep =
      data.reduce((acc, d) => acc + (d.sleep || 0), 0) / data.length
    const avgRating =
      data.reduce((acc, d) => acc + (d.rating || 0), 0) / data.length

    return {
      avgRating: parseFloat(avgRating.toFixed(1)),
      avgSteps: Math.round(avgSteps),
      avgSleep: parseFloat(avgSleep.toFixed(1)),
    }
  }, [data, period])

  // Данные для графиков — с fallback и защитой от ошибок
  const chartData = useMemo(() => {
    if (data.length === 0) return []

    return data.map((d, i) => {
      let dayLabel = String(i + 1) // fallback

      try {
        if (period === "week" && d.date) {
          const date = new Date(d.date)
          if (!isNaN(date.getTime())) {
            const dayIndex = date.getDay()
            dayLabel = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"][dayIndex]
          }
        } else if (period === "month") {
          dayLabel = String(i + 1)
        } else if (period === "year") {
          dayLabel = d.month || `М${i + 1}`
        }
      } catch (e) {
        dayLabel = String(i + 1)
      }

      return {
        ...d,
        day: dayLabel,
      }
    })
  }, [data, period])

  // Статистика по биохакам — для всех периодов
  const hackCompletionData = useMemo(() => {
    if (allData.length === 0) return []

    const trackedHacks = hacksList.filter((h) => h.tracked)
    if (trackedHacks.length === 0) return []

    // Определяем, сколько записей брать
    let sliceLength = 7
    if (period === "month") sliceLength = 30
    if (period === "year") sliceLength = allData.length

    const recentData = allData.slice(0, sliceLength)

    return trackedHacks.map((hack) => {
      // Массив выполнений: 1 если выполнен, 0 если нет
      const completionArray = recentData.map((day) =>
        day.hacks?.[hack.id] === true ? 1 : 0
      )

      // Подсчёт общего количества выполнений
      const totalDays = completionArray.reduce((a, b) => a + b, 0)

      // Подсчёт максимальной цепочки подряд
      let currentStreak = 0
      let maxStreak = 0
      for (let val of completionArray) {
        if (val === 1) {
          currentStreak++
          maxStreak = Math.max(maxStreak, currentStreak)
        } else {
          currentStreak = 0
        }
      }

      return {
        name: hack.title,
        streak: maxStreak,
        days: totalDays,
      }
    })
  }, [allData, hacksList, period])

  return (
    <div className="analytics">
      <h2 className="analytics-title">Ваша статистика</h2>

      <div className="period-switch">
        <button
          className={`period ${period === "week" ? "active" : ""}`}
          onClick={() => setPeriod("week")}
        >
          Неделя
        </button>
        <button
          className={`period ${period === "month" ? "active" : ""}`}
          onClick={() => setPeriod("month")}
        >
          Месяц
        </button>
        <button
          className={`period ${period === "year" ? "active" : ""}`}
          onClick={() => setPeriod("year")}
        >
          Год
        </button>
      </div>

      {/* График настроения и оценки дня */}
      <div className="chart-container">
        <h3 className="chart-subtitle">Настроение и оценка дня</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
            <XAxis dataKey="day" stroke="var(--text)" fontSize={12} />
            <YAxis stroke="var(--text)" fontSize={12} domain={[0, 10]} />
            <Tooltip
              contentStyle={{
                background: "var(--bg)",
                border: "1px solid var(--muted)",
                borderRadius: "8px",
                color: "var(--text)",
              }}
              itemStyle={{ color: "var(--text)" }}
              formatter={(value, name) => {
                if (name === "mood") return [value, "Настроение"]
                if (name === "rating") return [value, "Оценка дня"]
                return [value, name]
              }}
            />
            <Legend wrapperStyle={{ color: "var(--text)", fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="mood"
              name="Настроение"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ fill: "#8b5cf6", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="rating"
              name="Оценка дня"
              stroke="#a78bfa"
              strokeWidth={2}
              dot={{ fill: "#a78bfa", strokeWidth: 0 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* График шагов и сна */}
      <div className="chart-container">
        <h3 className="chart-subtitle">Шаги и сон</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
            <XAxis dataKey="day" stroke="var(--text)" fontSize={12} />
            <YAxis yAxisId="left" stroke="var(--text)" fontSize={12} />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="var(--text)"
              fontSize={12}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg)",
                border: "1px solid var(--muted)",
                borderRadius: "8px",
                color: "var(--text)",
              }}
              itemStyle={{ color: "var(--text)" }}
              formatter={(value, name) => {
                if (name === "steps") return [value, "Шаги"]
                if (name === "sleep") return [value, "Сон (ч)"]
                return [value, name]
              }}
            />
            <Legend wrapperStyle={{ color: "var(--text)", fontSize: 12 }} />
            <Bar
              yAxisId="left"
              dataKey="steps"
              name="Шаги"
              fill="#8b5cf6"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              yAxisId="right"
              dataKey="sleep"
              name="Сон (ч)"
              fill="#c4b5fd"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* График биохаков — дни подряд и всего дней */}
      {hackCompletionData.length > 0 && (
        <div className="chart-container">
          <h3 className="chart-subtitle">
            Биохаки (
            {period === "week"
              ? "последняя неделя"
              : period === "month"
              ? "последний месяц"
              : "весь период"}
            )
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={hackCompletionData.map((hack) => ({
                name:
                  hack.name.length > 20
                    ? hack.name.slice(0, 20) + "..."
                    : hack.name,
                streak: hack.streak,
                days: hack.days,
              }))}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="var(--muted)" />
              <XAxis
                dataKey="name"
                stroke="var(--text)"
                fontSize={12}
                angle={-20}
                textAnchor="end"
                height={70}
              />
              <YAxis stroke="var(--text)" fontSize={12} />
              <Tooltip
                content={({ payload, label }) => {
                  if (!payload || payload.length === 0) return null

                  const data = payload[0]

                  return (
                    <div
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--muted)",
                        borderRadius: "8px",
                        padding: "8px",
                        color: "var(--text)",
                      }}
                    >
                      <div>{label}</div>
                      <div>Всего дней: {data.payload.days}</div>
                      <div>Дней подряд: {data.payload.streak}</div>
                    </div>
                  )
                }}
              />
              <Legend
                wrapperStyle={{ color: "var(--text)", fontSize: 12 }}
                verticalAlign="top"
              />
              <Bar
                dataKey="streak"
                name="Дней подряд"
                fill="#8b5cf6"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="days"
                name="Всего дней"
                fill="#a78bfa"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Статистические карточки */}
      <div className="stat-cards">
        <div className="stat-card">
          <div className="stat-number">{stats.avgRating}</div>
          <div className="stat-label">Средняя оценка</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.avgSteps.toLocaleString()}</div>
          <div className="stat-label">Шагов/день</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats.avgSleep}ч</div>
          <div className="stat-label">Сон</div>
        </div>
      </div>
    </div>
  )
}
