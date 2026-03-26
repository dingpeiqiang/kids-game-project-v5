/**
 * 生成贪吃蛇游戏资源 - 更好看的像素风格
 * 运行: node generate-better-resources.js
 */

// 检查并安装 canvas
let canvas;
try {
  canvas = require('canvas');
} catch (e) {
  console.log('正在安装 canvas 依赖...');
  const { execSync } = require('child_process');
  execSync('npm install canvas', { stdio: 'inherit' });
  canvas = require('canvas');
}

const fs = require('fs');
const path = require('path');

const IMAGE_DIR = path.join(__dirname, 'public/themes/default/images/scene');
const AUDIO_DIR = path.join(__dirname, 'public/themes/default/audio');

// 确保目录存在
[IMAGE_DIR, AUDIO_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ============ 图片生成函数 ============

// 绘制像素风格圆角方块
function drawRoundedRect(ctx, x, y, w, h, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}

// 生成蛇头 - 可爱绿色蛇头，带眼睛
function createSnakeHead() {
  const c = canvas.createCanvas(50, 50);
  const ctx = c.getContext('2d');
  
  // 身体颜色渐变
  const gradient = ctx.createRadialGradient(25, 25, 5, 25, 25, 25);
  gradient.addColorStop(0, '#5cb85c');
  gradient.addColorStop(1, '#2d5a27');
  ctx.fillStyle = gradient;
  
  // 圆角方块身体
  drawRoundedRect(ctx, 2, 2, 46, 46, 12, gradient);
  
  // 眼睛
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.arc(15, 18, 8, 0, Math.PI * 2);
  ctx.arc(35, 18, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // 眼珠
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(17, 18, 4, 0, Math.PI * 2);
  ctx.arc(37, 18, 4, 0, Math.PI * 2);
  ctx.fill();
  
  // 鼻子/舌头小装饰
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(25, 32, 3, 0, Math.PI * 2);
  ctx.fill();
  
  return c;
}

// 生成蛇身 - 绿色分段
function createSnakeBody() {
  const c = canvas.createCanvas(50, 50);
  const ctx = c.getContext('2d');
  
  const gradient = ctx.createLinearGradient(0, 0, 50, 50);
  gradient.addColorStop(0, '#3d8b3d');
  gradient.addColorStop(1, '#2d5a27');
  
  drawRoundedRect(ctx, 2, 2, 46, 46, 8, gradient);
  
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.ellipse(15, 15, 8, 5, -0.5, 0, Math.PI * 2);
  ctx.fill();
  
  return c;
}

// 生成蛇尾 - 渐变收窄
function createSnakeTail() {
  const c = canvas.createCanvas(50, 50);
  const ctx = c.getContext('2d');
  
  const gradient = ctx.createLinearGradient(0, 0, 50, 50);
  gradient.addColorStop(0, '#2d5a27');
  gradient.addColorStop(1, '#1a3d15');
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(10, 25);
  ctx.lineTo(40, 10);
  ctx.lineTo(45, 25);
  ctx.lineTo(40, 40);
  ctx.closePath();
  ctx.fill();
  
  return c;
}

// 生成食物 - 苹果
function createFoodApple() {
  const c = canvas.createCanvas(50, 50);
  const ctx = c.getContext('2d');
  
  // 苹果主体
  const gradient = ctx.createRadialGradient(25, 28, 5, 25, 28, 20);
  gradient.addColorStop(0, '#ff6b6b');
  gradient.addColorStop(1, '#c0392b');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(25, 28, 18, 0, Math.PI * 2);
  ctx.fill();
  
  // 叶子
  ctx.fillStyle = '#27ae60';
  ctx.beginPath();
  ctx.ellipse(28, 8, 8, 4, 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath();
  ctx.ellipse(18, 22, 5, 3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  
  return c;
}

// 生成食物 - 香蕉
function createFoodBanana() {
  const c = canvas.createCanvas(50, 50);
  const ctx = c.getContext('2d');
  
  ctx.fillStyle = '#f1c40f';
  ctx.strokeStyle = '#d4a00a';
  ctx.lineWidth = 2;
  
  // 香蕉形状
  ctx.beginPath();
  ctx.moveTo(8, 40);
  ctx.quadraticCurveTo(25, 10, 42, 40);
  ctx.quadraticCurveTo(25, 25, 8, 40);
  ctx.fill();
  ctx.stroke();
  
  // 柄
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(20, 3, 10, 5);
  
  return c;
}

// 生成食物 - 樱桃
function createFoodCherry() {
  const c = canvas.createCanvas(50, 50);
  const ctx = c.getContext('2d');
  
  // 梗
  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(25, 10);
  ctx.quadraticCurveTo(30, 5, 35, 8);
  ctx.stroke();
  
  // 叶子
  ctx.fillStyle = '#27ae60';
  ctx.beginPath();
  ctx.ellipse(28, 10, 6, 3, 0.5, 0, Math.PI * 2);
  ctx.fill();
  
  // 樱桃1
  const grad1 = ctx.createRadialGradient(18, 30, 3, 18, 30, 12);
  grad1.addColorStop(0, '#e74c3c');
  grad1.addColorStop(1, '#c0392b');
  ctx.fillStyle = grad1;
  ctx.beginPath();
  ctx.arc(18, 30, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // 樱桃2
  const grad2 = ctx.createRadialGradient(32, 30, 3, 32, 30, 12);
  grad2.addColorStop(0, '#e74c3c');
  grad2.addColorStop(1, '#c0392b');
  ctx.fillStyle = grad2;
  ctx.beginPath();
  ctx.arc(32, 30, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(14, 26, 3, 0, Math.PI * 2);
  ctx.arc(28, 26, 3, 0, Math.PI * 2);
  ctx.fill();
  
  return c;
}

// 生成障碍物 - 石头
function createObstacleRock() {
  const c = canvas.createCanvas(50, 50);
  const ctx = c.getContext('2d');
  
  // 石头主体
  const gradient = ctx.createLinearGradient(5, 5, 45, 45);
  gradient.addColorStop(0, '#7f8c8d');
  gradient.addColorStop(0.5, '#636e72');
  gradient.addColorStop(1, '#2c3e50');
  ctx.fillStyle = gradient;
  
  ctx.beginPath();
  ctx.moveTo(10, 40);
  ctx.lineTo(5, 25);
  ctx.lineTo(15, 10);
  ctx.lineTo(35, 8);
  ctx.lineTo(45, 20);
  ctx.lineTo(42, 38);
  ctx.lineTo(30, 45);
  ctx.closePath();
  ctx.fill();
  
  // 纹理斑点
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.arc(20, 25, 5, 0, Math.PI * 2);
  ctx.arc(30, 35, 4, 0, Math.PI * 2);
  ctx.arc(15, 30, 3, 0, Math.PI * 2);
  ctx.fill();
  
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.beginPath();
  ctx.ellipse(18, 18, 6, 4, -0.5, 0, Math.PI * 2);
  ctx.fill();
  
  return c;
}

// 生成障碍物 - 墙壁
function createObstacleWall() {
  const c = canvas.createCanvas(50, 50);
  const ctx = c.getContext('2d');
  
  // 砖块背景
  ctx.fillStyle = '#8b4513';
  ctx.fillRect(0, 0, 50, 50);
  
  // 砖缝
  ctx.strokeStyle = '#5d3a1a';
  ctx.lineWidth = 2;
  
  // 水平缝
  for (let y = 12; y < 50; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(50, y);
    ctx.stroke();
  }
  
  // 竖直缝 (交错)
  for (let x = 12; x < 50; x += 25) {
    ctx.beginPath();
    ctx.moveTo(x, 12);
    ctx.lineTo(x, 24);
    ctx.stroke();
  }
  for (let x = -1; x < 50; x += 25) {
    ctx.beginPath();
    ctx.moveTo(x + 12, 24);
    ctx.lineTo(x + 12, 36);
    ctx.stroke();
  }
  for (let x = 12; x < 50; x += 25) {
    ctx.beginPath();
    ctx.moveTo(x, 36);
    ctx.lineTo(x, 48);
    ctx.stroke();
  }
  
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.fillRect(0, 0, 50, 6);
  
  return c;
}

// 生成背景 - 主背景 (使用更小的尺寸，Phaser 会自动缩放)
function createSceneBgMain() {
  const c = canvas.createCanvas(360, 640);
  const ctx = c.getContext('2d');
  
  // 渐变背景
  const gradient = ctx.createLinearGradient(0, 0, 0, 1280);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(0.5, '#16213e');
  gradient.addColorStop(1, '#0f3460');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 720, 1280);
  
  // 星星效果
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (let i = 0; i < 50; i++) {
    const x = Math.random() * 720;
    const y = Math.random() * 1280;
    const size = Math.random() * 2 + 1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  return c;
}

// 生成背景 - 网格 (使用更小的尺寸，Phaser 会自动缩放)
function createSceneBgGrid() {
  const c = canvas.createCanvas(360, 640);
  const ctx = c.getContext('2d');
  
  // 深色背景
  ctx.fillStyle = '#0a0a15';
  ctx.fillRect(0, 0, 360, 640);
  
  // 网格线
  ctx.strokeStyle = 'rgba(100, 200, 100, 0.15)';
  ctx.lineWidth = 1;
  
  const cellSize = 20;
  
  // 竖线
  for (let x = 0; x <= 360; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 640);
    ctx.stroke();
  }
  
  // 横线
  for (let y = 0; y <= 640; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(360, y);
    ctx.stroke();
  }
  
  // 十字交叉点高光
  ctx.fillStyle = 'rgba(100, 200, 100, 0.3)';
  for (let x = 0; x <= 360; x += cellSize) {
    for (let y = 0; y <= 640; y += cellSize) {
      ctx.fillRect(x - 1, y - 1, 2, 2);
    }
  }
  
  return c;
}

// 保存图片
function saveImage(canvas, filename) {
  const filepath = path.join(IMAGE_DIR, filename);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filepath, buffer);
  console.log(`✓ 生成图片: ${filename}`);
}

// ============ 主程序 ============

console.log('🎨 开始生成游戏资源...\n');

// 生成所有图片
console.log('📷 生成图片资源:');
saveImage(createSnakeHead(), 'snake_head.png');
saveImage(createSnakeBody(), 'snake_body.png');
saveImage(createSnakeTail(), 'snake_tail.png');
saveImage(createFoodApple(), 'food_apple.png');
saveImage(createFoodBanana(), 'food_banana.png');
saveImage(createFoodCherry(), 'food_cherry.png');
saveImage(createObstacleRock(), 'obstacle_rock.png');
saveImage(createObstacleWall(), 'obstacle_wall.png');
saveImage(createSceneBgMain(), 'scene_bg_main.png');
saveImage(createSceneBgGrid(), 'scene_bg_grid.png');

console.log('\n✅ 所有图片生成完成！');
console.log('📁 图片目录:', IMAGE_DIR);
