/* Cloudflare Worker: прокси к Claude API, чтобы ключ не хранился в браузере.
   Деплой: npx wrangler deploy (см. worker/README.md). Ключ кладётся в секрет ANTHROPIC_API_KEY. */

export default {
  async fetch(request, env) {
    const cors = {
      "access-control-allow-origin": env.ALLOWED_ORIGIN || "*",
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type, anthropic-version, anthropic-beta"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    if (request.method !== "POST" || new URL(request.url).pathname !== "/v1/messages") {
      return new Response("Not found", { status: 404, headers: cors });
    }
    if (env.ACCESS_TOKEN && request.headers.get("x-access-token") !== env.ACCESS_TOKEN) {
      return new Response("Forbidden", { status: 403, headers: cors });
    }
    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": request.headers.get("anthropic-version") || "2023-06-01",
        "anthropic-beta": request.headers.get("anthropic-beta") || ""
      },
      body: await request.text()
    });
    const headers = new Headers(cors);
    headers.set("content-type", upstream.headers.get("content-type") || "application/json");
    return new Response(upstream.body, { status: upstream.status, headers });
  }
};
