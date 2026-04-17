const express = require("express");
const fs = require("fs");
const path = require("path");
const app = express();

// 默认端口
const PORT = process.env.PORT || 8080;

console.log('🚀 Space Invaders - Offline Mode');
console.log('💡 No external dependencies required');

app.use(express.static("public"));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// create a uniqueId for player sessions
const uniqueId = function () {
  return "player-" + Math.random().toString(36).substr(2, 8);
};

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/v3.html");
});

app.get("/resource-manager", (request, response) => {
  response.sendFile(__dirname + "/public/resource-manager.html");
});

app.get("/v2", (request, response) => {
  response.sendFile(__dirname + "/views/offline.html");
});

app.get("/gameplay", (request, response) => {
  response.redirect('/');
});

app.get("/winner", (request, response) => {
  response.sendFile(__dirname + "/views/winner.html");
});

app.get("/gameover", (request, response) => {
  response.sendFile(__dirname + "/views/gameover.html");
});

app.get("/single", (request, response) => {
  response.redirect('/');
});

// GTRS.json 读取路由
app.get("/api/gtrs", (request, response) => {
  const gtrsPath = path.join(__dirname, "public", "themes", "space-invaders", "GTRS.json");
  if (fs.existsSync(gtrsPath)) {
    const gtrsData = fs.readFileSync(gtrsPath, "utf8");
    response.json(JSON.parse(gtrsData));
  } else {
    response.status(404).json({ error: "GTRS.json not found" });
  }
});

// GTRS.json 写入路由
app.post("/api/gtrs", (request, response) => {
  const gtrsPath = path.join(__dirname, "public", "themes", "space-invaders", "GTRS.json");
  try {
    const gtrsData = JSON.stringify(request.body, null, 2);
    fs.writeFileSync(gtrsPath, gtrsData, "utf8");
    response.json({ success: true, message: "GTRS.json updated successfully" });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

// 保存资源文件路由
app.post("/api/save-resource", (request, response) => {
  try {
    const { resourceType, resourceKey, data, filename } = request.body;
    let savePath;
    
    if (resourceType === "image") {
      savePath = path.join(__dirname, "public", "themes", "space-invaders", "assets", "images", filename);
    } else if (resourceType === "audio") {
      savePath = path.join(__dirname, "public", "themes", "space-invaders", "assets", "audio", filename);
    } else if (resourceType === "script") {
      savePath = path.join(__dirname, "public", "themes", "space-invaders", "assets", "scripts", filename);
    } else {
      return response.status(400).json({ error: "Invalid resource type" });
    }
    
    // 处理 base64 数据
    if (data.startsWith("data:")) {
      const base64Data = data.replace(/^data:[a-zA-Z0-9]+\/[a-zA-Z0-9]+;base64,/, "");
      fs.writeFileSync(savePath, base64Data, "base64");
    } else {
      fs.writeFileSync(savePath, data, "utf8");
    }
    
    response.json({ success: true, path: savePath });
  } catch (error) {
    response.status(500).json({ error: error.message });
  }
});

const listener = app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🎮 Open browser to play Space Invaders!`);
});
