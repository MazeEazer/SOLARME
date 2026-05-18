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

    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      console.error("❌ Missing Yandex credentials")
      return new Response(
        JSON.stringify({ error: "Credentials not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // 🔧 ЯВНО ФОРМИРУЕМ ЗАПРОС ДЛЯ YANDEX RESPONSES API
    // Это решает проблему "404 Not Found", связанную с конфликтом ID
    const yandexBody = {
      // 1. Используем полный URI модели (обязательно для RAG)
      model: `gpt://${YANDEX_FOLDER_ID}/yandexgpt-lite`,

      // 2. Данные пользователя и промпт
      input: body.input,
      instructions: body.instructions,

      // 3. Параметры генерации
      temperature: body.temperature || 0.3,
      max_output_tokens: body.max_output_tokens || 1000,
    }

    // 4. Добавляем RAG инструменты ТОЛЬКО если они есть в запросе с фронтенда
    if (body.tools && body.tools.length > 0) {
      yandexBody.tools = body.tools
      yandexBody.tool_choice = body.tool_choice || "auto" // Иногда 'auto' надежнее, чем 'required'
    }

    console.log("🚀 Sending Request to Yandex:", {
      model: yandexBody.model,
      hasTools: !!yandexBody.tools,
      toolChoice: yandexBody.tool_choice,
      folderId: YANDEX_FOLDER_ID,
    })

    // Отправка запроса
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

    // Обработка ответа
    if (!yandexResponse.ok) {
      // 🔥 ЧИТАЕМ ТЕЛО ОШИБКИ ОТ ЯНДЕКСА
      const errorText = await yandexResponse.text()
      console.error("❌ Yandex API Error Status:", yandexResponse.status)
      console.error("❌ Yandex API Error Body:", errorText) // Это покажет, ЧТО ИМЕННО НЕ НАЙДЕНО

      return new Response(
        JSON.stringify({
          error: `Yandex API Error: ${yandexResponse.status}`,
          details: errorText.slice(0, 500), // Обрезаем, чтобы не перегружать
        }),
        {
          status: yandexResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const data = await yandexResponse.json()
    console.log("✅ Success! Response received.")

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("💥 Edge Function Error:", error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
}
