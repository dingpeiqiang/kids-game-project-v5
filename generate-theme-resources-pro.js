#!/usr/bin/env node
/**
 * 主题资源生成器 - 专业版
 * 使用 Node.js + Canvas 生成精美的游戏主题资源
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// 输出目录配置
const OUTPUT_DIR = path.join(__dirname, 'kids-game-frontend', 'dist', 'games');
const ASSETS_DIR = path.join(__dirname, 'kids-game-frontend', 'assets', 'games');

// 主题配置
const THEMES = {
  snake: {
    default: {
      name: '清新绿',
      colors: {
        snakeHead: '#4ade80',
        snakeBody: '#22c55e',
        snakeTail: '#16a34a',
        food: '#ef4444',
        bgStart: '#0f172a',
        bgEnd: '#1e293b'
      }
    },
    retro: {
      name: '经典复古',
      colors: {
        snakeHead: '#22c55e',
        snakeBody: '#16a34a',
        snakeTail: '#15803d',
        food: '#eab308',
        bgStart: '#000000',
        bgEnd: '#1a1a1a'
      }
    },
    orange: {
      name: '活力橙',
      colors: {
        snakeHead: '#f97316',
        snakeBody: '#ea580c',
        snakeTail: '#c2410c',
        food: '#06b6d4',
        bgStart: '#1e1b4b',
        bgEnd: '#312e81'
      }
    }
  },
  pvz: {
    default: {
      name: '阳光活力',
      colors: {
        plant: '#4ade80',
        zombie: '#6b7280',
        sun: '#fbbf24',
        pea: '#22c55e',
        bgGrass: '#166534',
        bgSky: '#1e3a8a'
      }
    },
    moon: {
      name: '月夜幽深',
      colors: {
        plant: '#a78bfa',
        zombie: '#4b5563',
        sun: '#fcd34d',
        pea: '#9333ea',
        bgGrass: '#2e1065',
        bgSky: '#0f172a'
      }
    },
    cute: {
      name: '卡通萌系',
      colors: {
        plant: '#fb7185',
        zombie: '#9ca3af',
        sun: '#fdba74',
        pea: '#f472b6',
        bgGrass: '#fce7f3',
        bgSky: '#fbcfe8'
      }
    }
  }
};

/**
 * 颜色辅助函数
 */
function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
  const B = Math.min(255, (num & 0x0000FF) + amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

function darkenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
  const B = Math.max(0, (num & 0x0000FF) - amt);
  return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
}

/**
 * 保存 Canvas 为 PNG
 */
function saveCanvas(canvas, filePath) {
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(filePath, buffer);
}

/**
 * 创建带渐变的背景
 */
function createGradientBackground(width, height, colorStart, colorEnd) {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');
  
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, colorStart);
  gradient.addColorStop(1, colorEnd);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas;
}

/**
 * 创建蛇头（带眼睛的圆形）
 */
function createSnakeHead(size, color) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const radius = size / 2 - 2;
  
  // 绘制头部（圆形渐变）
  const gradient = ctx.createRadialGradient(center - 5, center - 5, 0, center, center, radius);
  gradient.addColorStop(0, lightenColor(color, 20));
  gradient.addColorStop(1, color);
  
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // 添加阴影
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;
  
  // 绘制眼睛（白色）
  const eyeRadius = size / 8;
  const eyeOffset = size / 4;
  
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  
  // 左眼
  ctx.beginPath();
  ctx.arc(center - eyeOffset, center - eyeOffset / 2, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // 右眼
  ctx.beginPath();
  ctx.arc(center + eyeOffset, center - eyeOffset / 2, eyeRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // 绘制瞳孔（黑色）
  ctx.fillStyle = '#000000';
  const pupilRadius = eyeRadius / 2;
  
  ctx.beginPath();
  ctx.arc(center - eyeOffset + 2, center - eyeOffset / 2, pupilRadius, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(center + eyeOffset + 2, center - eyeOffset / 2, pupilRadius, 0, Math.PI * 2);
  ctx.fill();
  
  // 添加高光
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  const highlightSize = pupilRadius / 1.5;
  
  ctx.beginPath();
  ctx.arc(center - eyeOffset + 3, center - eyeOffset / 2 - 1, highlightSize, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.beginPath();
  ctx.arc(center + eyeOffset + 3, center - eyeOffset / 2 - 1, highlightSize, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

/**
 * 创建蛇身（圆角矩形带纹理）
 */
function createSnakeBody(size, color) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const margin = 2;
  const width = size - margin * 2;
  const height = size - margin * 2;
  const radius = Math.min(8, width / 4);
  
  // 渐变填充
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, lightenColor(color, 15));
  gradient.addColorStop(1, color);
  
  ctx.beginPath();
  ctx.roundRect(margin, margin, width, height, radius);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // 添加边框
  ctx.strokeStyle = darkenColor(color, 20);
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // 添加纹理（简单的圆点）
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  const dotSize = 3;
  ctx.beginPath();
  ctx.arc(margin + 8, margin + 8, dotSize, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

/**
 * 创建食物（苹果形状）
 */
function createFood(size, color) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const radius = size / 2 - 3;
  
  // 主体（圆形渐变）
  const gradient = ctx.createRadialGradient(center - 3, center - 3, 0, center, center, radius);
  gradient.addColorStop(0, lightenColor(color, 30));
  gradient.addColorStop(0.7, color);
  gradient.addColorStop(1, darkenColor(color, 20));
  
  ctx.beginPath();
  ctx.arc(center, center + 2, radius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // 添加叶子
  ctx.fillStyle = '#22c55e';
  ctx.beginPath();
  ctx.ellipse(center, center - radius + 3, 4, 8, Math.PI / 6, 0, Math.PI * 2);
  ctx.fill();
  
  // 添加高光
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.arc(center - 4, center - 2, radius / 3, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

/**
 * 创建植物（豌豆射手风格）
 */
function createPlant(size, color, type = 'peashooter') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  
  if (type === 'sunflower') {
    // 向日葵
    const petalCount = 12;
    const petalLength = size / 3;
    const petalWidth = size / 6;
    
    // 花瓣
    for (let i = 0; i < petalCount; i++) {
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate((i * 2 * Math.PI) / petalCount);
      
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.ellipse(0, -petalLength / 2, petalWidth, petalLength / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    }
    
    // 花心
    const centerGradient = ctx.createRadialGradient(center, center, 0, center, center, size / 4);
    centerGradient.addColorStop(0, '#92400e');
    centerGradient.addColorStop(1, '#78350f');
    
    ctx.fillStyle = centerGradient;
    ctx.beginPath();
    ctx.arc(center, center, size / 5, 0, Math.PI * 2);
    ctx.fill();
    
  } else if (type === 'wallnut') {
    // 坚果墙（棕色椭圆形）
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(center, center, size / 2 - 2, size / 2 - 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 纹理
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(center - 5, center - 5, 8, 0, Math.PI * 2);
    ctx.stroke();
    
  } else {
    // 豌豆射手（默认）
    const headGradient = ctx.createRadialGradient(center - 2, center - 2, 0, center, center, size / 3);
    headGradient.addColorStop(0, lightenColor(color, 20));
    headGradient.addColorStop(1, color);
    
    ctx.fillStyle = headGradient;
    ctx.beginPath();
    ctx.arc(center, center, size / 3, 0, Math.PI * 2);
    ctx.fill();
    
    // 嘴巴（炮管）
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(center + 8, center, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(center - 3, center - 4, 5, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(center - 2, center - 4, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  
  return canvas;
}

/**
 * 创建僵尸（简化版）
 */
function createZombie(size, color, type = 'normal') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  
  // 身体
  ctx.fillStyle = color;
  ctx.fillRect(center - 10, center - 5, 20, 25);
  
  // 头部
  ctx.fillStyle = lightenColor(color, 10);
  ctx.beginPath();
  ctx.arc(center, center - 10, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // 眼睛
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(center - 4, center - 12, 4, 0, Math.PI * 2);
  ctx.arc(center + 4, center - 12, 4, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ff0000';
  ctx.beginPath();
  ctx.arc(center - 3, center - 12, 2, 0, Math.PI * 2);
  ctx.arc(center + 5, center - 12, 2, 0, Math.PI * 2);
  ctx.fill();
  
  // 如果是路障僵尸
  if (type === 'conehead') {
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(center - 10, center - 18);
    ctx.lineTo(center + 10, center - 18);
    ctx.lineTo(center, center - 28);
    ctx.closePath();
    ctx.fill();
  }
  
  return canvas;
}

/**
 * 创建子弹（豌豆）
 */
function createPea(size, color) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const radius = size / 2 - 1;
  
  const gradient = ctx.createRadialGradient(center - 1, center - 1, 0, center, center, radius);
  gradient.addColorStop(0, lightenColor(color, 30));
  gradient.addColorStop(1, color);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center, center, radius, 0, Math.PI * 2);
  ctx.fill();
  
  // 高光
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(center - 2, center - 2, radius / 3, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

/**
 * 创建阳光
 */
function createSun(size, color) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  const center = size / 2;
  const rays = 12;
  
  // 绘制光芒
  for (let i = 0; i < rays; i++) {
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((i * 2 * Math.PI) / rays);
    
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -size / 6);
    ctx.lineTo(3, -size / 2);
    ctx.lineTo(-3, -size / 2);
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
  }
  
  // 中心圆
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, size / 3);
  gradient.addColorStop(0, '#fef3c7');
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, darkenColor(color, 20));
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(center, center, size / 3, 0, Math.PI * 2);
  ctx.fill();
  
  return canvas;
}

/**
 * 生成贪吃蛇主题资源
 */
function generateSnakeTheme(themeName, themeConfig) {
  console.log(`🐍 生成贪吃蛇 - ${themeConfig.name} 主题...`);
  
  const outputDir = path.join(OUTPUT_DIR, 'snake-vue3', 'themes', themeName, 'images');
  const assetsDir = path.join(ASSETS_DIR, 'snake-vue3', 'themes', themeName, 'images');
  
  [outputDir, assetsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  const colors = themeConfig.colors;
  
  // 生成蛇头
  const snakeHead = createSnakeHead(64, colors.snakeHead);
  saveCanvas(snakeHead, path.join(outputDir, 'snakeHead.png'));
  saveCanvas(snakeHead, path.join(assetsDir, 'snakeHead.png'));
  
  // 生成蛇身
  const snakeBody = createSnakeBody(48, colors.snakeBody);
  saveCanvas(snakeBody, path.join(outputDir, 'snakeBody.png'));
  saveCanvas(snakeBody, path.join(assetsDir, 'snakeBody.png'));
  
  // 生成蛇尾
  const snakeTail = createSnakeBody(32, colors.snakeTail);
  saveCanvas(snakeTail, path.join(outputDir, 'snakeTail.png'));
  saveCanvas(snakeTail, path.join(assetsDir, 'snakeTail.png'));
  
  // 生成食物
  const food = createFood(32, colors.food);
  saveCanvas(food, path.join(outputDir, 'food.png'));
  saveCanvas(food, path.join(assetsDir, 'food.png'));
  
  // 生成背景
  const background = createGradientBackground(1920, 1080, colors.bgStart, colors.bgEnd);
  saveCanvas(background, path.join(outputDir, 'background.png'));
  saveCanvas(background, path.join(assetsDir, 'background.png'));
  
  console.log(`✅ 贪吃蛇 - ${themeConfig.name} 主题完成`);
}

/**
 * 生成 PVZ 主题资源
 */
function generatePVZTheme(themeName, themeConfig) {
  console.log(`🧟 生成 PVZ - ${themeConfig.name} 主题...`);
  
  const outputDir = path.join(OUTPUT_DIR, 'plants-vs-zombie', 'themes', themeName, 'images');
  const assetsDir = path.join(ASSETS_DIR, 'plants-vs-zombie', 'themes', themeName, 'images');
  
  [outputDir, assetsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  const colors = themeConfig.colors;
  
  // 生成植物
  const peashooter = createPlant(64, colors.plant, 'peashooter');
  saveCanvas(peashooter, path.join(outputDir, 'plant_peashooter.png'));
  saveCanvas(peashooter, path.join(assetsDir, 'plant_peashooter.png'));
  
  const sunflower = createPlant(64, colors.plant, 'sunflower');
  saveCanvas(sunflower, path.join(outputDir, 'plant_sunflower.png'));
  saveCanvas(sunflower, path.join(assetsDir, 'plant_sunflower.png'));
  
  const wallnut = createPlant(64, colors.plant, 'wallnut');
  saveCanvas(wallnut, path.join(outputDir, 'plant_wallnut.png'));
  saveCanvas(wallnut, path.join(assetsDir, 'plant_wallnut.png'));
  
  // 生成僵尸
  const normalZombie = createZombie(64, colors.zombie, 'normal');
  saveCanvas(normalZombie, path.join(outputDir, 'zombie_normal.png'));
  saveCanvas(normalZombie, path.join(assetsDir, 'zombie_normal.png'));
  
  const coneheadZombie = createZombie(64, colors.zombie, 'conehead');
  saveCanvas(coneheadZombie, path.join(outputDir, 'zombie_conehead.png'));
  saveCanvas(coneheadZombie, path.join(assetsDir, 'zombie_conehead.png'));
  
  // 生成阳光
  const sun = createSun(48, colors.sun);
  saveCanvas(sun, path.join(outputDir, 'sun.png'));
  saveCanvas(sun, path.join(assetsDir, 'sun.png'));
  
  // 生成豌豆
  const pea = createPea(16, colors.pea);
  saveCanvas(pea, path.join(outputDir, 'pea.png'));
  saveCanvas(pea, path.join(assetsDir, 'pea.png'));
  
  // 生成背景
  const background = createGradientBackground(800, 600, colors.bgSky, colors.bgGrass);
  saveCanvas(background, path.join(outputDir, 'gameBg.png'));
  saveCanvas(background, path.join(assetsDir, 'gameBg.png'));
  
  console.log(`✅ PVZ - ${themeConfig.name} 主题完成`);
}

/**
 * 主函数
 */
function main() {
  console.log('=' .repeat(60));
  console.log('🎨 开始生成专业版主题资源');
  console.log('=' .repeat(60));
  console.log();
  
  // 检查 canvas 模块
  try {
    require.resolve('canvas');
  } catch (e) {
    console.error('❌ 错误：未找到 canvas 模块，请先运行：npm install canvas');
    process.exit(1);
  }
  
  // 生成贪吃蛇主题
  Object.entries(THEMES.snake).forEach(([name, config]) => {
    generateSnakeTheme(name, config);
  });
  
  console.log();
  
  // 生成 PVZ 主题
  Object.entries(THEMES.pvz).forEach(([name, config]) => {
    generatePVZTheme(name, config);
  });
  
  console.log();
  console.log('=' .repeat(60));
  console.log('✅ 所有主题资源生成完成！');
  console.log('=' .repeat(60));
  console.log();
  console.log('📂 资源位置:');
  console.log(`   - 开发版本：${OUTPUT_DIR}`);
  console.log(`   - 源文件：${ASSETS_DIR}`);
  console.log();
  console.log('下一步操作:');
  console.log('1. 启动前端服务器：cd kids-game-frontend && npm run dev');
  console.log('2. 更新数据库配置：cd kids-game-backend && Get-Content fix-theme-resources-local.sql | mysql -u root -p123456 kids_game');
  console.log();
}

// 运行主函数
main();
