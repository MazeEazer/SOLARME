// src/utils/yandexAI.js

// ⚠️ Ключи лучше хранить в .env и не коммитить!
const YANDEX_API_KEY =
  import.meta.env?.VITE_YANDEX_AI_KEY || process.env.VITE_YANDEX_AI_KEY
const YANDEX_FOLDER_ID =
  import.meta.env?.VITE_YANDEX_FOLDER_ID || process.env.VITE_YANDEX_FOLDER_ID
const YANDEX_VECTOR_STORE_ID =
  import.meta.env?.VITE_YANDEX_VECTOR_STORE_ID ||
  process.env.VITE_YANDEX_VECTOR_STORE_ID

const YANDEX_AI_URL = "https://ai.api.cloud.yandex.net/v1/responses"
const YANDEX_MODEL = "yandexgpt-lite"

const SYSTEM_PROMPT = `Ты — персональный AI-консультант по биохакингу приложения SOLAR ME.
[... ваш системный промпт ...]`

const buildPrompt = (userData) => {
  const periodText =
    {
      week: "последние 7 дней",
      month: "последние 30 дней",
      year: "последний год",
    }[userData.period] || "анализируемый период"

  const biohacksText =
    userData.biohacks?.length > 0
      ? userData.biohacks
          .map((h) => `• ${h.title}: ${h.completion} (${h.rate}%)`)
          .join("\n")
      : "Нет отслеживаемых биохаков"

  return `
ДАННЫЕ ПОЛЬЗОВАТЕЛЯ ЗА ${periodText.toUpperCase()}:
• Средний сон: ${userData.metrics?.avgSleep || "N/A"} ч
• Настроение: ${userData.metrics?.avgMood || "N/A"}/10
• Оценка дня: ${userData.metrics?.avgRating || "N/A"}/10
• Шагов в день: ${userData.metrics?.avgSteps || "N/A"}
• Тренировок: ${userData.metrics?.trainingDays || "N/A"}
• Биохаки:
${biohacksText}
• Всего записей: ${userData.dataPoints || 0}

ВОПРОС: Проанализируй данные и дай 2-3 приоритетные рекомендации.
КОНТЕКСТ ИЗ БАЗЫ ЗНАНИЙ (RAG): Используй информацию из подключённых файлов.
`.trim()
}

export const generateAIInsight = async (userData, useRAG = true) => {
  if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
    throw new Error("Yandex AI credentials not configured. Check .env file.")
  }

  const requestBody = {
    model: `gpt://${YANDEX_FOLDER_ID}/${YANDEX_MODEL}`,
    input: [
      { role: "system", content: [{ type: "text", text: SYSTEM_PROMPT }] },
      {
        role: "user",
        content: [{ type: "text", text: buildPrompt(userData) }],
      },
    ],
    temperature: 0.3,
    max_output_tokens: 1000,
    ...(useRAG &&
      YANDEX_VECTOR_STORE_ID && {
        tools: [
          { type: "file_search", vector_store_ids: [YANDEX_VECTOR_STORE_ID] },
        ],
        tool_choice: "auto",
      }),
  }

  const response = await fetch(YANDEX_AI_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Key ${YANDEX_API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.message || `Yandex AI API Error: ${response.status}`,
    )
  }

  const data = await response.json()
  return (
    data.output?.[0]?.content?.[0]?.text ||
    data.output_text ||
    "Не удалось получить ответ"
  )
}
