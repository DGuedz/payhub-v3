import "jsr:@supabase/functions-js/edge-runtime.d.ts"

type ChatRequest = {
  message: string
  model?: string
}

type ChatResponse = {
  ok: boolean
  reply?: string
  error?: string
}

const [REDACTED_OPENAI_KEY] = Deno.env.get("[REDACTED_OPENAI_KEY]")
const DEFAULT_MODEL = "gpt-3.5-turbo"

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ ok: false, error: "Method Not Allowed" } satisfies ChatResponse),
        { status: 405, headers: { "Content-Type": "application/json" } },
      )
    }

    const body = (await req.json()) as ChatRequest
    const userMessage = body?.message?.trim()
    const model = body?.model || DEFAULT_MODEL

    if (!userMessage) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing 'message' in request body" } satisfies ChatResponse),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    if (![REDACTED_OPENAI_KEY]) {
      return new Response(
        JSON.stringify({ ok: true, reply: `Echo: ${userMessage}` } satisfies ChatResponse),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )
    }

    const completionRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${[REDACTED_OPENAI_KEY]}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: userMessage },
        ],
      }),
    })

    if (!completionRes.ok) {
      const errText = await completionRes.text()
      return new Response(
        JSON.stringify({ ok: false, error: `OpenAI error: ${errText}` } satisfies ChatResponse),
        { status: completionRes.status, headers: { "Content-Type": "application/json" } },
      )
    }

    const json = await completionRes.json()
    const reply: string | undefined = json?.choices?.[0]?.message?.content ?? ""

    return new Response(
      JSON.stringify({ ok: true, reply } satisfies ChatResponse),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: (err as Error).message } satisfies ChatResponse),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
})
