-- 游客留言板（与 temp-mail 共库，全部为新增命名对象）
CREATE TABLE IF NOT EXISTS guest_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL DEFAULT '匿名访客',
  content TEXT NOT NULL,
  ip_hash TEXT,
  is_visible INTEGER NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_guest_messages_visible_id
  ON guest_messages (is_visible, id DESC);

CREATE INDEX IF NOT EXISTS idx_guest_messages_ip_created
  ON guest_messages (ip_hash, created_at DESC);
