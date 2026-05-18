// api/yandex-ai.js
export const config = {
  runtime: "edge",
}

export default async function handler(req) {
  // Разрешаем CORS только для твоего домена
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
      return new Response(
        JSON.stringify({ error: "Yandex AI credentials not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Запрос к Yandex AI API
    const yandexResponse = await fetch(
      "https://llm.api.cloud.yandex.net/foundationModels/v1/completion",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Api-Key ${YANDEX_API_KEY}`,
          "x-folder-id": YANDEX_FOLDER_ID,
        },
        body: JSON.stringify(body),
      },
    )

    if (!yandexResponse.ok) {
      const errorData = await yandexResponse.json().catch(() => ({}))
      console.error("Yandex API Error:", errorData)
      return new Response(
        JSON.stringify({
          error:
            errorData.message || `Yandex API Error: ${yandexResponse.status}`,
        }),
        {
          status: yandexResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    const data = await yandexResponse.json()
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("API Error:", error)
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
}
