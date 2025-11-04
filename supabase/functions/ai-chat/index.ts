// Declarações ambient para Deno global
declare global {
  var Deno: {
    env: {
      get(key: string): string | undefined;
    };
    serve(handler: (req: Request) => Response | Promise<Response>): void;
  };
}

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req: Request) => {
  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    let body: any = {};
    try { body = await req.json(); } catch { body = {}; }

    const message = (body && (body.message || body.prompt)) || "";
    if (!message) {
      return new Response(JSON.stringify({ ok:false, error: "empty_message" }), { status:400, headers:{ "Content-Type":"application/json" }});
    }

    if (!OPENAI_API_KEY) {
      return new Response(JSON.stringify({ ok:true, mode:"sandbox", reply: `Simulação: ${message}` }), { headers:{ "Content-Type":"application/json" }});
    }

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: "Assistente PAYHUB_V3." }, { role: "user", content: message }],
      }),
    });

    const text = await resp.text();
    let data: any;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!resp.ok) {
      // log remote error and return sanitized message
      console.error("OpenAI error:", resp.status, data);
      return new Response(JSON.stringify({ ok:false, error: "openai_error", status: resp.status, detail: data }), { status: 502, headers:{ "Content-Type":"application/json" }});
    }

    const reply = data.choices?.[0]?.message?.content || data.result || data.raw || "empty_reply";
    return new Response(JSON.stringify({ ok:true, reply }), { headers:{ "Content-Type":"application/json" }});
  } catch (err) {
    console.error("handler_ex", err);
    return new Response(JSON.stringify({ ok:false, error: "internal", message: String(err) }), { status:500, headers:{ "Content-Type":"application/json" }});
  }
});
