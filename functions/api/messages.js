const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

const MAX_PER_MINUTE = 5;
const LIST_LIMIT = 80;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function validPayload(body) {
  const nickname = typeof body?.nickname === "string" && body.nickname.trim()
    ? body.nickname.trim().slice(0, 24)
    : "匿名访客";
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  if (content.length < 1 || content.length > 180) {
    return { error: "留言请控制在 1–180 个字符。" };
  }
  return { nickname, content };
}

// Only a salted one-way hash of the visitor IP is stored, never the IP itself.
async function visitorBucket(request, secret) {
  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret || "lickdog-guestbook"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ip));
  return Array.from(new Uint8Array(mac).slice(0, 16), b => b.toString(16).padStart(2, "0")).join("");
}

async function tableExists(db, name) {
  const row = await db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .bind(name)
    .first();
  return !!row;
}

export async function onRequestGet(context) {
  try {
    if (!await tableExists(context.env.DB, "guest_messages")) return json({ messages: [] });
    const { results } = await context.env.DB.prepare(
      "SELECT id, nickname, content, created_at FROM guest_messages WHERE is_visible = 1 ORDER BY id DESC LIMIT ?"
    ).bind(LIST_LIMIT).all();
    return json({ messages: results || [] });
  } catch (error) {
    return json({ error: "留言暂时加载失败，请稍后刷新。" }, 500);
  }
}

export async function onRequestPost(context) {
  try {
    const payload = validPayload(await context.request.json());
    if (payload.error) return json({ error: payload.error }, 400);

    const bucket = await visitorBucket(context.request, context.env.GUESTBOOK_SECRET);
    const recent = await context.env.DB.prepare(
      "SELECT COUNT(*) AS total FROM guest_messages WHERE ip_hash = ? AND created_at >= datetime('now', '-1 minute')"
    ).bind(bucket).first();
    if (Number(recent?.total || 0) >= MAX_PER_MINUTE) {
      return json({ error: "留言太快啦，请稍等一分钟再试。" }, 429);
    }

    await context.env.DB.prepare(
      "INSERT INTO guest_messages (nickname, content, ip_hash) VALUES (?, ?, ?)"
    ).bind(payload.nickname, payload.content, bucket).run();

    return json({ success: true, message: "留言成功，已经贴到留言板上了。" }, 201);
  } catch (error) {
    return json({ error: "留言没能送达，请稍后再试。" }, 500);
  }
}
