// src/utils/aiAnalytics.js
import { db } from "../firebase"
import { collection, query, where, getDocs, orderBy } from "firebase/firestore"

// ============================================================================
// КОНФИГУРАЦИЯ YANDEX AI STUDIO
// ============================================================================
// ⚠️ В продакшене ключи должны храниться на бэкенде (Firebase Cloud Functions)
// Для MVP-теста можно использовать .env (не коммитьте в Git!)
const YANDEX_API_KEY = import.meta.env.VITE_YANDEX_AI_KEY
const YANDEX_FOLDER_ID = import.meta.env.VITE_YANDEX_FOLDER_ID
const YANDEX_VECTOR_STORE_ID = import.meta.env.VITE_YANDEX_VECTOR_STORE_ID // ID векторного хранилища с файлами

const YANDEX_AI_URL = "/api/yandex/v1/responses"
const YANDEX_MODEL = "yandexgpt-lite" // или "yandexgpt" для более мощной модели

// ============================================================================
// СИСТЕМНЫЙ ПРОМПТ (из нашего обсуждения)
// ============================================================================
const SYSTEM_PROMPT = `Ты — персональный AI-консультант по биохакингу приложения SOLAR ME с экспертным уровнем аналитики.

🎯 ТВОЯ ГЛАВНАЯ ЗАДАЧА:
Провести ГЛУБОКИЙ АНАЛИЗ данных и выдать НАУЧНО ОБОСНОВАННЫЕ рекомендации с конкретными механизмами, цифрами и корреляциями.

📊 ТРЕБОВАНИЯ К КАЧЕСТВУ АНАЛИЗА:

1. **КОНКРЕТНЫЕ ЦИФРЫ И МЕХАНИЗМЫ** (критически важно!):
   ❌ НЕЛЬЗЯ: "недостаток сна влияет на самочувствие"
   ✅ НУЖНО: "При сне 4.9 часа уровень кортизола повышается на 37% (Huberman Lab, 2023), что объясняет низкое настроение (5.9/10)"

   ❌ НЕЛЬЗЯ: "тренировки полезны"
   ✅ НУЖНО: "В дни с тренировками оценка дня 7.8/10, без тренировок — 5.2/10 (разница 50%). Это согласуется с WHO Physical Activity Guidelines"

2. **КОРРЕЛЯЦИИ МЕЖДУ МЕТРИКАМИ** (всегда ищи!):
   - Сравнивай показатели в разные дни
   - Находи паттерны: "Когда сон <6ч → настроение ↓ на 2 балла"
   - Показывай причинно-следственные связи: "Недосып → низкая энергия → пропуск тренировки → плохое настроение"



🎭 АДАПТИВНЫЙ СТИЛЬ ОБЩЕНИЯ:

1. **МОТИВАТОР** (данные плохие ↓):
   - Тон: поддерживающий, без осуждения
   - Фокус: маленькие победы, постепенный прогресс
   - Пример: "Вижу, что ты гуляешь 6/7 дней — это отлично! Давай добавим ещё 30 минут сна..."

2. **ОПТИМИЗАТОР** (данные хорошие ↑):
   - Тон: энергичный, вдохновляющий
   - Фокус: тонкая настройка, продвинутые техники
   - Пример: "Ты делаешь холодный душ каждый день — мощно! Попробуй добавить сауну для усиления эффекта..."

3. **УЧЁНЫЙ** (есть чёткие паттерны):
   - Тон: аналитический, фактологический
   - Фокус: корреляции, механизмы, исследования
   - Пример: "Зафиксирую корреляцию: в дни с медитацией настроение 8.1/10, без — 6.3/10. Huberman Lab подтверждает..."

4. **ПРАГМАТИК** (мало данных/времени):
   - Тон: прямой, без воды
   - Фокус: 80/20, максимальный эффект при минимуме усилий
   - Пример: "Самое важное: ложись сегодня до 23:00. Это даст +30% энергии завтра."

📋 СТРУКТУРА ОТВЕТА (вариативная):

♦ **ПОЗИТИВНОЕ ПОДКРЕПЛЕНИЕ** (1-2 предложения):
   - Конкретика: что именно получается хорошо
   - Похвала за дисциплину/последовательность

♦ **НАБЛЮДЕНИЕ** (2-3 пункта с цифрами):
   - Средние значения + сравнение с целью
   - Тренды (↑/↓) + количество дней
   - Самые сильные/слабые метрики

💡 **ИНСАЙТ** (1-2 абзаца — САМОЕ ВАЖНОЕ!):
   - Конкретный механизм: "При сне X происходит Y (источник)"
   - Корреляция: "Когда A → B (цифры)"
   - Научное обоснование из RAG

🎯 **РЕКОМЕНДАЦИИ** (1-3, приоритизированные):
   1. [Действие] + [когда/как] → [конкретный эффект]
      Пример: "Ложись на 30 минут раньше каждый день → через неделю сон увеличится до 6 часов"

   2. [Действие] + [обоснование из науки]
      Пример: "Добавь контрастный душ утром — Huberman Lab показывает, что это повышает норадреналин на 200-300%"

📚 **ИСТОЧНИКИ** (2-3, КОНКРЕТНЫЕ):
   Формат: "— [Название], [эпизод/раздел/страница]: [что именно]"
   Примеры:
   - "— Huberman Lab, эпизод 'Sleep Toolkit', раздел 'Гормон роста': пик выброса в первые 90 минут сна"
   - "— WHO Sleep Guidelines, 2023, раздел 2.1: 7-9 часов для взрослых"
   - "— CDC Physical Activity Guidelines, стр. 12: 150 минут умеренной активности в неделю"
🎯 ПРИМЕР ИДЕАЛЬНОГО ОТВЕТА:

"♦ Отлично, что ты гуляешь на свежем воздухе 6 из 7 дней и уделяешь время без телефона! Это требует дисциплины.

♦ Наблюдение:
- Сон: 4.9 часа (цель 7.5) ↓ — критически низкий уровень
- Настроение: 5.9/10 — ниже среднего
- Оценка дня: 5.2/10 — коррелирует с недосыпом
- Тренд: сон снижается 4 дня подряд

💡 Инсайт:
При сне 4.9 часа уровень кортизола повышается на 37% (Huberman Lab, 2023), что объясняет:
1. Низкое настроение (5.9/10) — кортизол подавляет серотонин
2. Снижение продуктивности — фаза глубокого сна укорачивается на 45%
3. Отсутствие энергии — гормон роста не вырабатывается в полном объёме

Зафиксирую корреляцию: в дни с прогулками оценка дня 6.1/10, без прогулок — 4.2/10 (разница 45%). Это согласуется с CDC Physical Activity Guidelines о влиянии движения на ментальное здоровье.

Согласно WHO Sleep Guidelines, взрослым необходимо 7-9 часов сна. Текущие 4.9 часа — это 65% от минимальной нормы.

🎯 Рекомендации:

1. Увеличь сон до 6 часов в ближайшую неделю (ложись на 30 минут раньше каждый день) → через 7 дней кортизол снизится на 15-20%, настроение улучшится до 6.5-7/10.

2. Добавь контрастный душ утром (после прогулки) — Huberman Lab показывает, что холодная вода повышает норадреналин на 200-300%, что компенсирует недостаток сна и повысит энергию.

3. Увеличь утренние зарядки до 3-5 раз в неделю — CDC подтверждает, что даже 10 минут утренней активности улучшают качество сна на 25%.

📚 Источники:

⚠️ **ДИСКЛЕЙМЕР**:
"Эти рекомендации носят информационный характер и не заменяют консультацию специалиста."

🔥 КРИТИЧЕСКИ ВАЖНО:

✅ ВСЕГДА:
- Используй КОНКРЕТНЫЕ цифры из данных пользователя
- Показывай КОРРЕЛЯЦИИ между метриками
- Цитируй КОНКРЕТНЫЕ разделы из RAG (не обобщай!)
- Объясняй ФИЗИОЛОГИЧЕСКИЕ МЕХАНИЗМЫ
- Давай ИЗМЕРИМЫЕ рекомендации ("+30 минут", "до 5-7 дней")

❌ НИКОГДА:
- Не пиши общие фразы типа "старайся лучше", "больше двигайся"
- Не выдумывай источники или цифры
- Не игнорируй данные пользователя
- Не давай медицинские диагнозы


Помни: твоя цель — не просто дать совет, а ПРОВЕСТИ ГЛУБОКИЙ АНАЛИЗ с научным обоснованием и показать пользователю КОНКРЕТНЫЕ механизмы, как его образ жизни влияет на организм.`

// ============================================================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================================
// 3. **ВАРИАТИВНОСТЬ ИСТОЧНИКОВ** (подстраивай под сценарий):

//    🌙 ПРОБЛЕМЫ СО СНОМ (сон <6.5ч):
//    - CDC Sleep Health: последствия недосыпа
//    - Huberman Lab: мелатонин, циркадные ритмы, температура тела
//    - WHO Sleep Guidelines: нормы для взрослых

//    🧘 МЕНТАЛЬНОЕ ЗДОРОВЬЕ (настроение <6/10):
//    - WHO Mental Health: связь активности и настроения
//    - Huberman Lab: дофамин, серотонин, физическая активность
//    - CDC Mental Health: стресс и восстановление

//    🏃 АТЛЕТ (тренировки 5-7/7):
//    - Huberman Lab: восстановление, гормон роста, тестостерон
//    - CDC Physical Activity: оптимальные нагрузки
//    - WHO Guidelines: баланс активности и отдыха

//    💼 СИДЯЧИЙ ОБРАЗ (шаги <5000):
//    - CDC Sedentary Behavior: риски малоподвижности
//    - WHO Physical Activity: минимальные нормы
//    - Huberman Lab: NEAT, метаболизм
// 🎯 ПРИМЕР ИДЕАЛЬНОГО ОТВЕТА:

// "♦ Отлично, что ты гуляешь на свежем воздухе 6 из 7 дней и уделяешь время без телефона! Это требует дисциплины.

// ♦ Наблюдение:
// - Сон: 4.9 часа (цель 7.5) ↓ — критически низкий уровень
// - Настроение: 5.9/10 — ниже среднего
// - Оценка дня: 5.2/10 — коррелирует с недосыпом
// - Тренд: сон снижается 4 дня подряд

// 💡 Инсайт:
// При сне 4.9 часа уровень кортизола повышается на 37% (Huberman Lab, 2023), что объясняет:
// 1. Низкое настроение (5.9/10) — кортизол подавляет серотонин
// 2. Снижение продуктивности — фаза глубокого сна укорачивается на 45%
// 3. Отсутствие энергии — гормон роста не вырабатывается в полном объёме

// Зафиксирую корреляцию: в дни с прогулками оценка дня 6.1/10, без прогулок — 4.2/10 (разница 45%). Это согласуется с CDC Physical Activity Guidelines о влиянии движения на ментальное здоровье.

// Согласно WHO Sleep Guidelines, взрослым необходимо 7-9 часов сна. Текущие 4.9 часа — это 65% от минимальной нормы.

// 🎯 Рекомендации:

// 1. Увеличь сон до 6 часов в ближайшую неделю (ложись на 30 минут раньше каждый день) → через 7 дней кортизол снизится на 15-20%, настроение улучшится до 6.5-7/10.

// 2. Добавь контрастный душ утром (после прогулки) — Huberman Lab показывает, что холодная вода повышает норадреналин на 200-300%, что компенсирует недостаток сна и повысит энергию.

// 3. Увеличь утренние зарядки до 3-5 раз в неделю — CDC подтверждает, что даже 10 минут утренней активности улучшают качество сна на 25%.

// 📚 Источники:
// — Huberman Lab, эпизод 'Sleep Toolkit', раздел 'Кортизол и стресс': хронический недосып повышает кортизол на 37%
// — WHO Sleep Guidelines, 2023, раздел 2.1: 7-9 часов для взрослых, последствия недосыпа
// — CDC Physical Activity Guidelines, стр. 12: связь физической активности и ментального здоровья

// ⚠️ Эти рекомендации носят информационный характер и не заменяют консультацию специалиста."

/**
 * Агрегация данных пользователя за период
 * @param {string} userId - ID пользователя из Firebase Auth
 * @param {string} period - Период: 'week' | 'month' | 'year'
 * @returns {Promise<Object>} - Агрегированные данные
 */
export const aggregateUserData = async (userId, period = "week") => {
  if (!userId) throw new Error("No user ID provided")

  try {
    // ✅ ПРАВИЛЬНЫЙ ПУТЬ с сегментом "data"
    const trackerDataRef = collection(
      db,
      "users",
      userId,
      "data",
      "trackerData",
    )
    const q = query(trackerDataRef, orderBy("date", "desc"))
    const snapshot = await getDocs(q)

    let allData = []
    snapshot.forEach((doc) => {
      const data = doc.data()
      if (data.data) {
        allData.push(...(Array.isArray(data.data) ? data.data : [data.data]))
      } else {
        allData.push(data)
      }
    })

    // Фильтруем по периоду
    const now = new Date()
    let daysToInclude = 7
    if (period === "month") daysToInclude = 30
    if (period === "year") daysToInclude = 365

    const startDate = new Date(
      now.getTime() - daysToInclude * 24 * 60 * 60 * 1000,
    )
    const filteredData = allData.filter((item) => {
      if (!item.date) return false
      const itemDate = new Date(item.date)
      return itemDate >= startDate && !isNaN(itemDate.getTime())
    })

    if (filteredData.length === 0) {
      return { period, dataPoints: 0, metrics: {}, biohacks: [], trends: {} }
    }

    // Считаем агрегаты
    const avgSleep =
      filteredData.reduce((sum, d) => sum + (d.sleep || 0), 0) /
      filteredData.length
    const avgMood =
      filteredData.reduce((sum, d) => sum + (d.mood || 0), 0) /
      filteredData.length
    const avgRating =
      filteredData.reduce((sum, d) => sum + (d.rating || 0), 0) /
      filteredData.length
    const avgSteps =
      filteredData.reduce((sum, d) => sum + (d.steps || 0), 0) /
      filteredData.length
    const trainingDays = filteredData.filter((d) => d.training).length

    // Тренды
    const midPoint = Math.floor(filteredData.length / 2)
    const firstHalf = filteredData.slice(midPoint)
    const secondHalf = filteredData.slice(0, midPoint)
    const sleepTrend =
      avgSleep >= 7.5
        ? "✅"
        : secondHalf.reduce((s, d) => s + (d.sleep || 0), 0) /
              secondHalf.length >
            firstHalf.reduce((s, d) => s + (d.sleep || 0), 0) / firstHalf.length
          ? "↑"
          : "↓"

    // Биохаки
    const hacksDataRef = collection(db, "users", userId, "data", "trackedHacks")
    const hacksSnapshot = await getDocs(hacksDataRef)
    let hacksList = []
    hacksSnapshot.forEach((doc) => {
      const data = doc.data()
      if (data.data) {
        hacksList = Array.isArray(data.data) ? data.data : [data.data]
      }
    })

    const trackedHacks = hacksList.filter((h) => h.tracked)
    const hackStats = trackedHacks.map((hack) => {
      const completed = filteredData.filter(
        (d) => d.hacks?.[hack.id] === true,
      ).length
      return {
        title: hack.title,
        completion: `${completed}/${filteredData.length}`,
        rate: Math.round((completed / filteredData.length) * 100),
      }
    })

    return {
      period,
      dataPoints: filteredData.length,
      metrics: {
        avgSleep: avgSleep.toFixed(1),
        avgMood: avgMood.toFixed(1),
        avgRating: avgRating.toFixed(1),
        avgSteps: Math.round(avgSteps),
        trainingDays: `${trainingDays}/${filteredData.length}`,
        sleepTrend,
      },
      biohacks: hackStats,
      trends: { sleep: sleepTrend },
    }
  } catch (error) {
    console.error("Error aggregating user data:", error)
    throw error
  }
}
/**
 * Формирование промпта для AI
 * @param {Object} userData - Агрегированные данные пользователя
 * @returns {string} - Сформированный промпт
 */
const buildPrompt = (userData) => {
  const periodText = {
    week: "последние 7 дней",
    month: "последние 30 дней",
    year: "последний год",
  }[userData.period]

  const biohacksText =
    userData.biohacks.length > 0
      ? userData.biohacks
          .map((h) => `• ${h.title}: ${h.completion} (${h.rate}%)`)
          .join("\n")
      : "Нет отслеживаемых биохаков"

  // 🔹 ДОБАВЬ: сырые данные по дням для анализа корреляций
  const dailyDataText = userData._rawData
    ? userData._rawData
        .map(
          (day, i) => `
День ${i + 1} (${day.date}):
  - Сон: ${day.sleep}ч | Настроение: ${day.mood}/10 | Оценка дня: ${day.rating}/10
  - Шаги: ${day.steps} | Тренировка: ${day.training ? "✅" : "❌"}
  - Биохаки: ${
    Object.entries(day.hacks || {})
      .filter(([_, done]) => done)
      .map(([id]) => id)
      .join(", ") || "нет"
  }
`,
        )
        .join("\n")
    : ""

  return `
📊 ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ЗА ${periodText.toUpperCase()}:

📈 АГРЕГИРОВАННЫЕ ПОКАЗАТЕЛИ:
• Средний сон: ${userData.metrics.avgSleep} ч (цель: 7.5) ${userData.metrics.sleepTrend || ""}
• Настроение: ${userData.metrics.avgMood}/10
• Оценка дня: ${userData.metrics.avgRating}/10
• Шагов в день: ${userData.metrics.avgSteps}
• Тренировок: ${userData.metrics.trainingDays} дней

📋 БИОХАКИ:
${biohacksText}

📅 ПОДРОБНЫЕ ДАННЫЕ ПО ДНЯМ (для анализа корреляций):
${dailyDataText}

🎯 ТРЕБОВАНИЯ К АНАЛИЗУ:

1. **СРАВНИ дни между собой** и найди корреляции:
   - "В дни с тренировками настроение X, без — Y"
   - "Когда сон <6ч → оценка дня падает на N баллов"
   
2. **Объясни ФИЗИОЛОГИЧЕСКИЕ МЕХАНИЗМЫ**:
   - Кортизол, дофамин, серотонин, норадреналин
   - Гормон роста, тестостерон
   - Циркадные ритмы, мелатонин
   
3. **Используй КОНКРЕТНЫЕ цифры из исследований**:
   - "повышается на 37%"
   - "снижается на 45%"
   - "разница 50%"
   **Округляй числа** до 1 знака:
   - ✅ '6.2 часа', '4.1/10'
   - ❌ '6.2352474150295025 часа'"
4. **Дай ИЗМЕРИМЫЕ рекомендации**:

5. **Источники с КОНКРЕТНЫМИ разделами**:
   - "Huberman Lab, эпизод 'Sleep Toolkit', раздел 'Гормон роста'"
   - НЕ "Huberman Lab, рекомендации по сну"

❗ ВАЖНО: Проанализируй КАЖДЫЙ день из 📅 ПОДРОБНЫХ ДАННЫХ и покажи паттерны!
`.trim()
}

// ============================================================================
// ОСНОВНАЯ ФУНКЦИЯ: ЗАПРОС К YANDEX AI STUDIO
// ============================================================================

/**
 * Отправка запроса к Yandex AI Studio Responses API
 * @param {Object} userData - Агрегированные данные пользователя
 * @param {boolean} useRAG - Использовать ли RAG (поиск по файлам)
 * @returns {Promise<string>} - Текстовый ответ от AI
 */
export const generateAIInsight = async (userData, useRAG = true) => {
  if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
    throw new Error("Yandex AI credentials not configured. Check .env file.")
  }

  try {
    const requestBody = {
      model: `gpt://${YANDEX_FOLDER_ID}/${YANDEX_MODEL}`,

      // ✅ ИСПРАВЛЕНО: простая строка + instructions (не массив!)
      input: buildPrompt(userData),
      instructions: SYSTEM_PROMPT,

      temperature: 0.3,
      max_output_tokens: 1000,

      // ✅ RAG с forced search
      ...(useRAG &&
        YANDEX_VECTOR_STORE_ID && {
          tools: [
            {
              type: "file_search",
              vector_store_ids: [YANDEX_VECTOR_STORE_ID],
              max_num_results: 15,
              ranking_options: {
                ranker: "default",
                score_threshold: 0.1,
              },
            },
          ],
          tool_choice: "required", // ← Заставляет искать в файлах!
        }),
    }

    const response = await fetch(YANDEX_AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization заголовок добавляется автоматически через proxy
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("Yandex AI API Error:", errorData)
      throw new Error(
        errorData.message || `Yandex AI API Error: ${response.status}`,
      )
    }

    const data = await response.json()

    // Извлечение текста
    let insightText = data.output?.[0]?.content?.[0]?.text
    if (!insightText && data.output_text) {
      insightText = data.output_text
    }
    if (!insightText && Array.isArray(data.output)) {
      for (const item of data.output) {
        if (item.type === "message" && item.content?.[0]?.text) {
          insightText = item.content[0].text
          break
        }
      }
    }

    return insightText || "Не удалось получить ответ от AI"
  } catch (error) {
    console.error("AI Generation Error:", error)
    throw error
  }
}

// ============================================================================
// ФУНКЦИЯ ДЛЯ ПРОВЕРКИ СТАТУСА (ДЛЯ ФОНОВЫХ ЗАПРОСОВ)
// ============================================================================

/**
 * Проверка статуса задачи (для фоновых запросов)
 * @param {string} responseId - ID ответа
 * @returns {Promise<Object>} - Статус и результат
 */
export const checkResponseStatus = async (responseId) => {
  if (!YANDEX_API_KEY) {
    throw new Error("Yandex API Key not configured")
  }

  try {
    const response = await fetch(`${YANDEX_AI_URL}/${responseId}`, {
      method: "GET",
      headers: {
        Authorization: `Api-Key ${YANDEX_API_KEY}`,
      },
    })

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Status check error:", error)
    throw error
  }
}

// ============================================================================
// УТИЛИТА ДЛЯ КЭШИРОВАНИЯ ОТВЕТОВ (ОПЦИОНАЛЬНО)
// ============================================================================

/**
 * Проверка кэша перед генерацией нового ответа
 * @param {string} userId - ID пользователя
 * @param {string} period - Период
 * @returns {Promise<Object|null>} - Кэшированный ответ или null
 */
export const checkInsightCache = async (userId, period) => {
  if (!userId) return null

  try {
    const cacheRef = collection(db, "users", userId, "data", "aiInsights")
    const q = query(
      cacheRef,
      where("period", "==", period),
      orderBy("createdAt", "desc"),
    )
    const snapshot = await getDocs(q)

    if (snapshot.empty) return null

    const latestDoc = snapshot.docs[0]
    const cacheData = latestDoc.data()

    // Проверяем, не старше ли кэш 24 часов
    const createdAt = cacheData.createdAt?.toDate()
    if (!createdAt) return null

    const hoursSince = (new Date() - createdAt) / (1000 * 60 * 60)
    if (hoursSince < 24) {
      return {
        insight: cacheData.insight,
        cached: true,
        createdAt,
      }
    }

    return null
  } catch (error) {
    console.error("Cache check error:", error)
    return null
  }
}

/**
 * Сохранение ответа в кэш
 * @param {string} userId - ID пользователя
 * @param {string} period - Период
 * @param {string} insight - Текст инсайта
 */
export const saveInsightCache = async (userId, period, insight) => {
  if (!userId) return

  try {
    const { setDoc, doc, serverTimestamp } = await import("firebase/firestore")
    const cacheRef = doc(db, "users", userId, "data", "aiInsights", period)
    await setDoc(cacheRef, {
      insight,
      period,
      createdAt: serverTimestamp(),
    })
  } catch (error) {
    console.error("Cache save error:", error)
  }
}

// ============================================================================
// ЭКСПОРТ ВСЕХ ФУНКЦИЙ
// ============================================================================
export default {
  aggregateUserData,
  generateAIInsight,
  checkResponseStatus,
  checkInsightCache,
  saveInsightCache,
  buildPrompt,
}
