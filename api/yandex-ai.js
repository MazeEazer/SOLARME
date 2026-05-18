// api/yandex-ai.js
export const config = {
  runtime: "edge",
}

export default async function handler(req) {
  console.log("🔍 ENV CHECK:", {
    hasKey: !!process.env.VITE_YANDEX_AI_KEY,
    hasFolder: !!process.env.VITE_YANDEX_FOLDER_ID,
    hasVector: !!process.env.VITE_YANDEX_VECTOR_STORE_ID,
    folderId: process.env.VITE_YANDEX_FOLDER_ID,
    vectorId: process.env.VITE_YANDEX_VECTOR_STORE_ID,
  })
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

  // Обработка preflight запроса
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  // Только POST запросы
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    })
  }

  try {
    const body = await req.json()

    // Чтение переменных окружения
    const YANDEX_API_KEY = process.env.VITE_YANDEX_AI_KEY
    const YANDEX_FOLDER_ID = process.env.VITE_YANDEX_FOLDER_ID

    // Проверка наличия ключей
    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      console.error("❌ Missing Yandex credentials")
      return new Response(
        JSON.stringify({ error: "Yandex AI credentials not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // 🔧 ИСПРАВЛЕНИЕ: Передаем body как есть, не модифицируя model
    // Yandex Responses API часто требует полный URI модели (gpt://folder/model)
    const yandexBody = { ...body }

    // Логирование для отладки (видно в Vercel Logs)
    console.log("🚀 Sending to Yandex Responses API:", {
      model: yandexBody.model,
      hasInput: !!yandexBody.input,
      hasInstructions: !!yandexBody.instructions,
      hasTools: !!yandexBody.tools,
      toolChoice: yandexBody.tool_choice,
      folderIdInHeader: YANDEX_FOLDER_ID,
    })

    // Отправка запроса к Yandex Responses API
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

    console.log("📥 Yandex Response Status:", yandexResponse.status)

    // Обработка ошибок API
    if (!yandexResponse.ok) {
      const errorText = await yandexResponse.text().catch(() => "")
      console.error("❌ Yandex API Error:", yandexResponse.status, errorText)

      let errorData = {}
      try {
        errorData = JSON.parse(errorText)
      } catch (e) {
        // Если ответ не JSON
      }

      return new Response(
        JSON.stringify({
          error:
            errorData.message ||
            errorData.error ||
            `Yandex API Error: ${yandexResponse.status}`,
          details: errorText.slice(0, 500),
        }),
        {
          status: yandexResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Успешный ответ
    const data = await yandexResponse.json()
    console.log("✅ Success, response length:", JSON.stringify(data).length)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("💥 API Route Error:", error)

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        type: error.name,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
}
