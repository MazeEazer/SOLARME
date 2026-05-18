// api/yandex-ai.js
export const config = {
  runtime: "edge",
}

export default async function handler(req) {
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

    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      return new Response(JSON.stringify({ error: "Credentials missing" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    // 🔧 ФОРМИРУЕМ ЗАПРОС БЕЗ tool_choice: 'required'
    const yandexBody = {
      modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt-lite`,
      input: body.input,
      instructions: body.instructions,
      temperature: body.temperature || 0.3,
      max_output_tokens: body.max_output_tokens || 1000,
    }

    // Добавляем инструменты ТОЛЬКО если ID хранилища существует
    if (YANDEX_VECTOR_STORE_ID && body.tools && body.tools.length > 0) {
      // Упрощаем структуру tools для совместимости
      yandexBody.tools = [
        {
          type: "file_search",
          vector_store_ids: [YANDEX_VECTOR_STORE_ID],
          max_num_results: body.tools[0].max_num_results || 5,
        },
      ]
      // Убираем tool_choice или ставим 'auto'
      // yandexBody.tool_choice = "auto"
    }

    console.log("🚀 Sending to Yandex:", {
      modelUri: yandexBody.modelUri,
      hasTools: !!yandexBody.tools,
      vectorStoreId: YANDEX_VECTOR_STORE_ID,
    })

    const yandexResponse = await fetch(
      "https://llm.api.cloud.yandex.net/foundationModels/v1/responses",
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

    if (!yandexResponse.ok) {
      const errorText = await yandexResponse.text()
      console.error("❌ Yandex Error:", yandexResponse.status, errorText)

      return new Response(
        JSON.stringify({
          error: `Yandex API: ${yandexResponse.status}`,
          details: errorText,
        }),
        {
          status: yandexResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const data = await yandexResponse.json()
    console.log("✅ Success!")

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("💥 Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
}
