// api/yandex-ai.js
export const config = {
  runtime: "edge",
}

export default async function handler(req) {
  console.log("🔥 API Route Called")
  console.log("Method:", req.method)
  console.log("Headers:", Object.fromEntries(req.headers))

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
    console.log("📦 Request Body:", JSON.stringify(body, null, 2))

    const YANDEX_API_KEY = process.env.VITE_YANDEX_AI_KEY
    const YANDEX_FOLDER_ID = process.env.VITE_YANDEX_FOLDER_ID

    console.log("🔑 API Key exists:", !!YANDEX_API_KEY)
    console.log("📁 Folder ID exists:", !!YANDEX_FOLDER_ID)

    if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
      console.error("❌ Missing credentials")
      return new Response(
        JSON.stringify({ error: "Yandex AI credentials not configured" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      )
    }

    // Проверяем формат body
    if (!body.input || !body.instructions) {
      console.error("❌ Invalid body format - missing input or instructions")
      return new Response(JSON.stringify({ error: "Invalid request format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    console.log("🚀 Sending to Yandex API...")

    const yandexResponse = await fetch(
      "https://llm.api.cloud.yandex.net/foundationModels/v1/responses",
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

    console.log("📥 Yandex Response Status:", yandexResponse.status)

    if (!yandexResponse.ok) {
      const errorData = await yandexResponse.json().catch(() => ({}))
      console.error("❌ Yandex API Error:", errorData)
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
    console.log("✅ Success:", data)

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("💥 API Error:", error)
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    )
  }
}
