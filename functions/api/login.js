function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
      "Cache-Control": "no-store"
    }
  });
}

function createToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const username = typeof body?.username === "string" ? body.username.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!username || !password) return json({ error: "请输入账号和密码" }, 400);

    // 管理员使用隔离表，避免误读邮件系统的 users 表。
    const user = await context.env.DB.prepare(
      "SELECT id FROM lickdog_admin_users WHERE username = ? AND password = ? LIMIT 1"
    ).bind(username, password).first();

    if (!user) return json({ error: "账号或密码错误" }, 401);

    const token = createToken();
    await context.env.DB.prepare(
      "UPDATE lickdog_admin_users SET token = ? WHERE id = ?"
    ).bind(token, user.id).run();

    return json({ success: true, token });
  } catch {
    return json({ error: "登录服务暂时不可用，请稍后再试" }, 500);
  }
}
