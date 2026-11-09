function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

function readVisitorId(request) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)lick_visitor_id=([^;]+)/);
  const value = match?.[1] || "";
  return /^[A-Za-z0-9-]{12,80}$/.test(value) ? value : "";
}

function createVisitorId() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost(context) {
  try {
    let visitorId = readVisitorId(context.request);
    const isNewVisitor = !visitorId;
    if (isNewVisitor) visitorId = createVisitorId();

    await context.env.DB.prepare(
      "INSERT OR IGNORE INTO site_visitors (visitor_id) VALUES (?)"
    ).bind(visitorId).run();

    const row = await context.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM site_visitors"
    ).first();

    const headers = isNewVisitor
      ? { "Set-Cookie": `lick_visitor_id=${visitorId}; Max-Age=31536000; Path=/; SameSite=Lax; Secure` }
      : {};

    return json({ total: Number(row?.total || 0) }, 200, headers);
  } catch {
    return json({ error: "统计服务暂时不可用" }, 500);
  }
}
