// api/yandex-ai.js
export const config = {
  runtime: "edge",
}

export default async function handler(req) {
  // CORS настройки
  const allowedOrigins = ["https://solarme.vercel.app", "http://localhost:5173"]
  const origin = req.headers.get("origin")
  const corsHeaders = {
    "Access-Control-Allow-Origin": allowedOrigins.includes(origin)
      ? origin
      : allowedOrigins[0],
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    const body = await req.json()
    const YANDEX_API_KEY = process.env.VITE_YANDEX_AI_KEY
    const YANDEX_FOLDER_ID = process.env.VITE_YANDEX_FOLDER_ID
    const YANDEX_VECTOR_STORE_ID = process.env.VITE_YANDEX_VECTOR_STORE_ID

    console.log("🔍 ENV CHECK:", {
      hasKey: !!YANDEX_API_KEY,
      hasFolder: !!YANDEX_FOLDER_ID,
      hasVector: !!YANDEX_VECTOR_STORE_ID,
    })

    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      return new Response(JSON.stringify({ error: "Credentials missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // 🔥 ФОРМИРУЕМ ЗАПРОС ДЛЯ YANDEX COMPLETION API
    const yandexBody = {
      modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt-lite`,
      completionOptions: {
        temperature: body.temperature || 0.3,
        maxTokens: body.max_output_tokens || 1000,
      },
      messages: [
        { role: "system", text: body.instructions || "" },
        { role: "user", text: body.input || "" },
      ],
    }

    // 🔧 ИСПРАВЛЕНИЕ: Правильная структура tools для Search Index
    if (YANDEX_VECTOR_STORE_ID) {
      yandexBody.tools = [
        {
          type: "search", // <-- ВАЖНО: именно "search", а не "file_search"
          search: {
            index_id: YANDEX_VECTOR_STORE_ID,
            max_num_results: 5,
          },
        },
      ]
    }

    console.log("🚀 Sending to Yandex:", JSON.stringify(yandexBody, null, 2))

    const yandexResponse = await fetch(
      "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Api-Key ${YANDEX_API_KEY}`,
          "x-folder-id": YANDEX_FOLDER_ID,
        },
        body: JSON.stringify(yandexBody),
      },
    )

    console.log("📥 Yandex Response Status:", yandexResponse.status)

    if (!yandexResponse.ok) {
      const errorText = await yandexResponse.text()
      console.error("❌ Yandex Error:", yandexResponse.status, errorText)

      return new Response(
        JSON.stringify({
          error: `Yandex API: ${yandexResponse.status}`,
          details: errorText.slice(0, 500),
        }),
        {
          status: yandexResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const data = await yandexResponse.json()
    console.log("✅ Success! Raw response keys:", Object.keys(data))

    // Извлекаем текст из стандартного ответа Completion API
    const resultText =
      data.result?.alternatives?.[0]?.message?.text ||
      data.result?.text ||
      "Ответ получен, но текст не найден в стандартном поле."

    return new Response(
      JSON.stringify({
        output: [{ content: [{ text: resultText }] }],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("💥 Edge Function Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
}
