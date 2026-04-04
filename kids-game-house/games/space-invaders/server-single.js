const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// 提供静态文件
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "views")));

// 主页路由 - 直接跳转到单机版
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index-single.html"));
});

// 游戏页面路由
app.get("/gameplay", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

// 胜利页面
app.get("/winner", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "winner.html"));
});

// 游戏结束页面
app.get("/gameover", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "gameover.html"));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  🎮 Space Invaders - Single Player    ║
║  🚀 Server running on port ${PORT}           ║
║  🌐 Open http://localhost:${PORT}          ║
╚════════════════════════════════════════╝
  `);
});
