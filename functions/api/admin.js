// 验证 Token 的辅助函数
async function verifyToken(request, env) {
  const token = request.headers.get("Authorization");
  if (!token) return false;
  const user = await env.DB.prepare("SELECT * FROM users WHERE token = ?").bind(token).first();
  return !!user;
}

// GET: 获取所有待审核的语录
export async function onRequestGet(context) {
  if (!await verifyToken(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 获取所有 is_approved = 0 的
  const { results } = await context.env.DB.prepare(
    "SELECT * FROM quotes WHERE is_approved = 0 ORDER BY created_at DESC"
  ).all();

  return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
}

// POST: 处理审核操作 (通过/删除)
export async function onRequestPost(context) {
  if (!await verifyToken(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id, action } = await context.request.json();

  if (action === "approve") {
    // 通过审核
    await context.env.DB.prepare("UPDATE quotes SET is_approved = 1 WHERE id = ?").bind(id).run();
  } else if (action === "delete") {
    // 删除
    await context.env.DB.prepare("DELETE FROM quotes WHERE id = ?").bind(id).run();
  }

  return new Response(JSON.stringify({ success: true }));
}
