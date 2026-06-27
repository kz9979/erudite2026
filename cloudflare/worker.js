const DEFAULT_ORIGINS = [
  "https://erudite26.com",
  "https://www.erudite26.com",
  "https://kz9979.github.io"
];

function allowedOrigins(env) {
  return new Set([
    ...DEFAULT_ORIGINS,
    ...(env.ALLOWED_ORIGINS || "").split(",").map(value => value.trim()).filter(Boolean)
  ]);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  const allowed = allowedOrigins(env);
  return {
    "Access-Control-Allow-Origin": origin && allowed.has(origin) ? origin : DEFAULT_ORIGINS[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  };
}

function json(request, env, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(request, env),
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    if (origin && !allowedOrigins(env).has(origin)) {
      return json(request, env, { error: "Origin not allowed" }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json(request, env, { ok: true });
    }

    if (url.pathname !== "/api/guest" || request.method !== "POST") {
      return json(request, env, { error: "Not found" }, 404);
    }

    if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
      return json(request, env, { error: "Content-Type must be application/json" }, 415);
    }

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json(request, env, { error: "Invalid JSON" }, 400);
    }

    const visitorId = String(payload?.visitorId || "").trim();
    if (!/^erudite_[a-zA-Z0-9-]{16,80}$/.test(visitorId)) {
      return json(request, env, { error: "Invalid visitorId" }, 400);
    }

    const now = new Date().toISOString();

    try {
      const inserted = await env.DB.prepare(
        "INSERT OR IGNORE INTO guests (visitor_id, first_seen, last_seen, visits) VALUES (?, ?, ?, 1)"
      ).bind(visitorId, now, now).run();

      const isNew = Number(inserted.meta?.changes || 0) === 1;

      if (!isNew) {
        await env.DB.prepare(
          "UPDATE guests SET last_seen = ?, visits = visits + 1 WHERE visitor_id = ?"
        ).bind(now, visitorId).run();
      }

      const total = await env.DB.prepare(
        "SELECT COUNT(*) AS count FROM guests"
      ).first();

      return json(request, env, {
        count: Number(total?.count || 0),
        isNew,
        countedAt: now
      });
    } catch (error) {
      console.error("Guest counter D1 error", error);
      return json(request, env, { error: "Counter unavailable" }, 503);
    }
  }
};
