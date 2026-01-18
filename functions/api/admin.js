// 验证 Token 的辅助函数
async function verifyToken(request, env) {
  const token = request.headers.get("Authorization");
  if (!token) return false;
  const user = await env.DB.prepare("SELECT * FROM users WHERE token = ?").bind(token).first();
  return !!user;
}

// GET: 获取【所有】语录 (包括已发布和已隐藏的)
export async function onRequestGet(context) {
  if (!await verifyToken(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 查所有数据，按时间倒序
  const { results } = await context.env.DB.prepare(
    "SELECT * FROM quotes ORDER BY created_at DESC"
  ).all();

  return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
}

// POST: 处理状态切换 (通过=显示，删除=隐藏)
export async function onRequestPost(context) {
  if (!await verifyToken(context.request, context.env)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id, action } = await context.request.json();

  if (action === "approve") {
    // 【通过/恢复】：设为 1
    await context.env.DB.prepare("UPDATE quotes SET is_approved = 1 WHERE id = ?").bind(id).run();
  } else if (action === "delete") {
    // 【删除/隐藏】：设为 0 (软删除，数据还在库里，只是前台不显示)
    await context.env.DB.prepare("UPDATE quotes SET is_approved = 0 WHERE id = ?").bind(id).run();
  }
  // 如果你需要彻底删除的接口，可以加一个 'hard_delete' 动作，这里先按您的需求做软删除

  return new Response(JSON.stringify({ success: true }));
}
