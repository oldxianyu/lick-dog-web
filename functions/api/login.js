export async function onRequestPost(context) {
  const { username, password } = await context.request.json();

  // 1. 查库验证密码
  const user = await context.env.DB.prepare(
    "SELECT * FROM users WHERE username = ? AND password = ?"
  ).bind(username, password).first();

  if (!user) {
    return new Response(JSON.stringify({ error: "账号或密码错误" }), { status: 401 });
  }

  // 2. 生成一个简单的 Token (用随机数模拟)
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);

  // 3. 把 Token 存入数据库，作为这次登录的凭证
  await context.env.DB.prepare(
    "UPDATE users SET token = ? WHERE id = ?"
  ).bind(token, user.id).run();

  // 4. 返回 Token 给前端
  return new Response(JSON.stringify({ success: true, token }), {
    headers: { "Content-Type": "application/json" }
  });
}
