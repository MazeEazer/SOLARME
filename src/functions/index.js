// functions/index.js
const functions = require("firebase-functions")
const axios = require("axios")

// Читаем из .env.local
const YANDEX_API_KEY = process.env.YANDEX_AI_KEY
const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID
const YANDEX_VECTOR_STORE_ID = process.env.YANDEX_VECTOR_STORE_ID

exports.generateAIInsight = functions.https.onCall(async (data, context) => {
  // Проверка авторизации (работает с анонимным входом!)
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Требуется вход в систему",
    )
  }

  try {
    const response = await axios.post(
      "https://ai.api.cloud.yandex.net/v1/responses",
      {
        model: `gpt://${YANDEX_FOLDER_ID}/yandexgpt-lite`,
        input: data.input,
        instructions: data.instructions,
        temperature: data.temperature || 0.3,
        max_output_tokens: data.max_output_tokens || 1000,
        // RAG
        ...(data.useRAG !== false && {
          tools: [
            {
              type: "file_search",
              vector_store_ids: [YANDEX_VECTOR_STORE_ID],
              max_num_results: 10,
              ranking_options: {
                ranker: "default",
                score_threshold: 0.2,
              },
            },
          ],
          tool_choice: "auto",
        }),
      },
      {
        headers: {
          Authorization: `Api-Key ${YANDEX_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    return {
      insight: response.data.output?.[0]?.content?.[0]?.text,
      success: true,
    }
  } catch (error) {
    console.error("Yandex AI Error:", error.response?.data || error.message)
    throw new functions.https.HttpsError(
      "internal",
      "Не удалось получить ответ от AI",
    )
  }
})
