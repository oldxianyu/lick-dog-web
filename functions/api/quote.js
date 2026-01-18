export async function onRequestGet(context) {
  // 获取随机一条已发布的语录
  const { results } = await context.env.DB.prepare(
    "SELECT content FROM quotes WHERE is_approved = 1 ORDER BY RANDOM() LIMIT 1"
  ).all();

  if (!results || results.length === 0) {
    return new Response(JSON.stringify({ content: "还没人舔，你快来舔第一口！" }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify(results[0]), {
    headers: { "Content-Type": "application/json" }
  });
}

export async function onRequestPost(context) {
  try {
    const { content } = await context.request.json();
    if (!content || content.length < 5 || content.length > 100) {
      return new Response(JSON.stringify({ error: "字数太少没诚意，太多太啰嗦（5-100字）" }), { status: 400 });
    }

    // 【关键修改】这里 is_approved 改回 1 (直接通过，无需审核)
    await context.env.DB.prepare(
      "INSERT INTO quotes (content, is_approved) VALUES (?, 1)"
    ).bind(content).run();

    return new Response(JSON.stringify({ success: true, message: "投稿成功！你真是个极品舔狗！" }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "服务器炸了，可能是舔得太用力了!" }), { status: 500 });
  }
}
