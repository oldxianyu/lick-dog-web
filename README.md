# 🐶 Lick.Dog - 舔狗日记

> "宝，我今天去输液了，输的什么液？想你的夜。"

## 📖 项目缘起

今天闲逛，发现有 `.dog` 后缀的域名，于是随手输了个“舔狗”：**lick.dog**。
竟然没人注册！马上注册上。

这么有意思的域名，总得给他搞点东西吧？
于是在 AI 大人的帮助下，身为差劲产品经理的我，做出了自己的又一个作品：**舔狗日记**。

这是一个极简的、基于 Serverless 的“舔狗语录”生成器，带有完整的后台审核管理系统。

---

## ✨ 功能特性

### 🟢 游客端 (Public)
* **每日一舔**：随机从数据库抽取一条舔狗语录。
* **一键复制**：点击语录即可复制，方便发送给心中的那个 TA。
* **我要帮舔**：游客可以投稿新的语录（投稿后默认自动上线，无需等待）。
* **极简设计**：暗黑模式，红黑配色，深情又卑微。

### 🔴 管理端 (Admin)
* **安全登录**：基于 Token 的简易登录系统。
* **全权管控**：查看所有语录（包含正在显示的“🟢”和已隐藏的“🔴”）。
* **软删除机制**：
    * **隐藏**：觉得某条不合适，点击隐藏，前台不再显示。
    * **恢复**：后悔了？点击恢复，语录重新上线。
* **状态可视化**：高亮显示当前在线的语录，变暗显示已下架语录。

---

## 🛠️ 技术栈

本项目完全运行在 Cloudflare 的边缘网络上，无需购买服务器。

* **前端**：原生 HTML / CSS / JavaScript (无框架，极致轻量)。
* **后端**：Cloudflare Pages Functions (Serverless API)。
* **数据库**：Cloudflare D1 (基于 SQLite 的边缘数据库)。
* **部署**：Cloudflare Pages 自动部署。

---

## 🚀 快速部署指南

如果你也想部署一套自己的舔狗日记，请参考以下步骤：

### 1. 准备工作
* 拥有一个 Cloudflare 账号。
* 安装 Cloudflare 的 `wrangler` 命令行工具（可选，也可以在网页端操作）。

### 2. 初始化数据库 (D1)
在 Cloudflare 后台创建一个名为 `lickdog-db` 的 D1 数据库，并在 **Console** 中执行以下 SQL 初始化表结构：

```sql
-- 语录表
CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_approved INTEGER DEFAULT 1
);

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    token TEXT
);

-- 初始化管理员 (默认密码 123456)
INSERT INTO users (username, password) VALUES ('admin', '123456');

-- 插入几条初始数据
INSERT INTO quotes (content) VALUES ('以前我只是一只单身狗，自从遇到了你，我变成了一只舔狗。');
3. 配置项目
将本项目 Fork 到你的 GitHub，然后在 Cloudflare Pages 中创建新项目并连接该仓库。

Build command: exit 0 (或者是空)

Build output directory: public

4. 绑定数据库
在 Pages 项目设置 -> Functions -> D1 Database Bindings 中添加绑定：

Variable name: DB (必须大写)

D1 database: 选择刚才创建的 lickdog-db

注意：绑定完成后，请重新部署一次项目以生效。

📂 目录结构
Plaintext

/
├── public/
│   ├── index.html       # 首页 (游客端)
│   └── admin.html       # 后台 (管理端)
└── functions/
    └── api/
        ├── quote.js     # GET:获取随机语录 / POST:投稿
        ├── login.js     # POST:管理员登录
        └── admin.js     # GET:获取所有列表 / POST:修改状态(隐藏/恢复)
📝 默认账号
后台地址：你的域名/admin.html

用户名：admin

密码：123456

(部署后请记得修改数据库中的密码)

🤝 贡献
欢迎提交 PR 修复 Bug 或贡献更卑微的舔狗语录。

"你答应我的，如果不爱我了，就告诉我。可你为什么不说话，是不是怕我难过？你真好。"
