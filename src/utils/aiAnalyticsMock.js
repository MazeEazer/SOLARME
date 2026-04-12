// src/utils/aiAnalyticsMock.js
// ============================================================================
// MOCK-ВЕРСИЯ для тестирования AI без Firebase
// ============================================================================

const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_AI_KEY
const YANDEX_FOLDER_ID = import.meta.env.VITE_YANDEX_FOLDER_ID
const YANDEX_VECTOR_STORE_ID = import.meta.env.VITE_YANDEX_VECTOR_STORE_ID
const YANDEX_AI_URL = "/api/yandex/v1/responses"

// 🔹 MOCK-данные для теста
export const getMockUserData = (scenario = "balanced", period = "week") => {
  // ID биохаков как в TrackerPage
  const HACKS = {
    walk: { id: 1, title: "Прогулка на свежем воздухе" },
    water: { id: 2, title: "Вода после пробуждения" },
    workout: { id: 3, title: "Зарядка утром" },
    cold: { id: 4, title: "Контрастный душ" },
    nodigit: { id: 5, title: "1 час без телефона" },
    fasting: { id: 6, title: "Интервальное голодание 16/8" },
    noscreen: { id: 7, title: "Без синего света вечером" },
  }

  // Генератор данных за период
  const generateDailyData = (base, noise = 0.5) => {
    const days = period === "week" ? 7 : period === "month" ? 30 : 365
    const data = []

    for (let i = 0; i < days; i++) {
      data.push({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        mood: Math.min(
          10,
          Math.max(1, base.mood + (Math.random() - 0.5) * noise * 3),
        ),
        work:
          Math.random() > 0.7 ? "work+" : Math.random() > 0.4 ? "work" : "0",
        social: Math.min(
          10,
          Math.max(1, base.social + (Math.random() - 0.5) * noise * 2),
        ),
        steps: Math.max(
          0,
          Math.round(base.steps + (Math.random() - 0.5) * noise * 3000),
        ),
        sleep: Math.max(
          3,
          Math.min(12, base.sleep + (Math.random() - 0.5) * noise * 2),
        ),
        training: Math.random() < base.trainingRate,
        rating: Math.min(
          10,
          Math.max(1, base.rating + (Math.random() - 0.5) * noise * 2),
        ),
        hacks: {
          [HACKS.walk.id]: Math.random() < base.hacks.walk,
          [HACKS.water.id]: Math.random() < base.hacks.water,
          [HACKS.workout.id]: Math.random() < base.hacks.workout,
          [HACKS.cold.id]: Math.random() < base.hacks.cold,
          [HACKS.nodigit.id]: Math.random() < base.hacks.nodigit,
          [HACKS.fasting.id]: Math.random() < base.hacks.fasting,
          [HACKS.noscreen.id]: Math.random() < base.hacks.noscreen,
        },
      })
    }
    return data
  }
  // Сценарии с реалистичными корреляциями
  const scenarios = {
    // 🟢 1. Сбалансированный прогресс
    balanced: {
      base: {
        mood: 7.5,
        social: 6.5,
        steps: 9000,
        sleep: 7.2,
        trainingRate: 0.57, // 4/7 дней
        rating: 8.0,
        hacks: {
          walk: 0.86, // 6/7
          water: 0.71, // 5/7
          workout: 0.57, // 4/7
          cold: 0.43, // 3/7
          nodigit: 0.57, // 4/7
          fasting: 0.29, // 2/7
          noscreen: 0.43, // 3/7
        },
      },
      sleepTrend: "↑",
      focus: "поддержание прогресса",
    },

    // 🚀 2. Высокий перформанс (оптимизированная жизнь)
    highPerformer: {
      base: {
        mood: 9.0,
        social: 7.5,
        steps: 12500,
        sleep: 8.1,
        trainingRate: 0.86, // 6/7 дней
        rating: 9.2,
        hacks: {
          walk: 1.0,
          water: 1.0,
          workout: 1.0,
          cold: 0.86,
          nodigit: 1.0,
          fasting: 0.71,
          noscreen: 0.86,
        },
      },
      sleepTrend: "✅",
      focus: "предотвращение перетрена и выгорания",
    },

    // 📉 3. Выгорание / хронический стресс
    burnout: {
      base: {
        mood: 4.2,
        social: 3.5,
        steps: 3200,
        sleep: 5.1,
        trainingRate: 0.14, // 1/7 дней
        rating: 4.8,
        hacks: {
          walk: 0.14,
          water: 0.29,
          workout: 0.14,
          cold: 0.0,
          nodigit: 0.0,
          fasting: 0.0,
          noscreen: 0.14,
        },
      },
      sleepTrend: "↓",
      focus: "восстановление базовых ритмов",
    },

    // 🏃 4. Атлет / фокус на физическую форму
    athlete: {
      base: {
        mood: 8.1,
        social: 6.0,
        steps: 15200,
        sleep: 7.8,
        trainingRate: 1.0, // 7/7 дней
        rating: 8.5,
        hacks: {
          walk: 0.86,
          water: 1.0,
          workout: 1.0,
          cold: 1.0,
          nodigit: 0.43,
          fasting: 0.57,
          noscreen: 0.57,
        },
      },
      sleepTrend: "↑",
      focus: "восстановление между тренировками",
    },

    // 🧘 5. Ментальное здоровье / антистресс
    mentalHealth: {
      base: {
        mood: 6.8,
        social: 7.5,
        steps: 6800,
        sleep: 6.9,
        trainingRate: 0.43, // 3/7 дней
        rating: 7.2,
        hacks: {
          walk: 0.71,
          water: 0.86,
          workout: 0.29,
          cold: 0.43,
          nodigit: 0.86,
          fasting: 0.14,
          noscreen: 0.71,
        },
      },
      sleepTrend: "↑",
      focus: "техники снижения тревожности",
    },

    // 💼 6. Офисный работник / сидячий образ
    sedentary: {
      base: {
        mood: 6.1,
        social: 5.0,
        steps: 4100,
        sleep: 6.4,
        trainingRate: 0.29, // 2/7 дней
        rating: 6.5,
        hacks: {
          walk: 0.29,
          water: 0.57,
          workout: 0.14,
          cold: 0.14,
          nodigit: 0.14,
          fasting: 0.0,
          noscreen: 0.29,
        },
      },
      sleepTrend: "↓",
      focus: "микро-привычки для активного дня",
    },

    // 🌙 7. Проблемы со сном / инсомния
    sleepIssues: {
      base: {
        mood: 5.9,
        social: 5.5,
        steps: 7200,
        sleep: 4.8,
        trainingRate: 0.43, // 3/7 дней
        rating: 5.2,
        hacks: {
          walk: 0.43,
          water: 0.57,
          workout: 0.29,
          cold: 0.14,
          nodigit: 0.43,
          fasting: 0.0,
          noscreen: 0.57,
        },
      },
      sleepTrend: "↓",
      focus: "гигиена сна и вечерние ритуалы",
    },

    // 🎯 8. Экспериментатор / продвинутый биохакинг
    experimenter: {
      base: {
        mood: 7.9,
        social: 6.5,
        steps: 8900,
        sleep: 7.0,
        trainingRate: 0.57, // 4/7 дней
        rating: 8.3,
        hacks: {
          walk: 0.71,
          water: 0.86,
          workout: 0.57,
          cold: 0.86,
          nodigit: 0.71,
          fasting: 0.57,
          noscreen: 0.71,
        },
      },
      sleepTrend: "↑",
      focus: "анализ эффективности экспериментов",
    },
  }

  const selectedScenario = scenarios[scenario] || scenarios.balanced
  const dailyData = generateDailyData(selectedScenario.base)
  // Агрегация данных (как в aggregateUserData)
  const avg = (arr, key) =>
    arr.reduce((s, d) => s + (d[key] || 0), 0) / arr.length

  const avgSleep = avg(dailyData, "sleep")
  const avgMood = avg(dailyData, "mood")
  const avgRating = avg(dailyData, "rating")
  const avgSteps = avg(dailyData, "steps")
  const trainingDays = dailyData.filter((d) => d.training).length
  // Подсчёт выполнения биохаков
  const hackStats = Object.values(HACKS).map((hack) => {
    const completed = dailyData.filter(
      (d) => d.hacks?.[hack.id] === true,
    ).length
    return {
      title: hack.title,
      completion: `${completed}/${dailyData.length}`,
      rate: Math.round((completed / dailyData.length) * 100),
    }
  })

  return {
    period,
    dataPoints: dailyData.length,
    metrics: {
      avgSleep: avgSleep.toFixed(1),
      avgMood: avgMood.toFixed(1),
      avgRating: avgRating.toFixed(1),
      avgSteps: Math.round(avgSteps),
      trainingDays: `${trainingDays}/${dailyData.length}`,
      sleepTrend: selectedScenario.sleepTrend, // ← здесь тоже
    },
    biohacks: hackStats,
    trends: {
      sleep: selectedScenario.sleepTrend, // ← и здесь
      focus: selectedScenario.focus, // и здесь
    },
    _rawData: period === "week" ? dailyData : dailyData.slice(0, 7),
  }
}

// 🔹 Заглушки для кэша (не нужны для теста)
export const checkInsightCache = async () => null
export const saveInsightCache = async () => {}
