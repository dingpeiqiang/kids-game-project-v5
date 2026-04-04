const express = require("express");
const app = express();

// 默认端口
const PORT = process.env.PORT || 8080;

console.log('🚀 Space Invaders - Offline Mode');
console.log('💡 No external dependencies required');

app.use(express.static("public"));

// create a uniqueId for player sessions
const uniqueId = function () {
  return "player-" + Math.random().toString(36).substr(2, 8);
};

app.get("/", (request, response) => {
  response.sendFile(__dirname + "/views/v3.html");
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

const listener = app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
  console.log(`🎮 Open browser to play Space Invaders!`);
});
