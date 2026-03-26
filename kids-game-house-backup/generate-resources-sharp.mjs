/**
 * 坦克大战资源生成器 - Sharp 专业版
 * 使用 sharp 库生成高质量 PNG 图片
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 基础路径
const PUBLIC_DIR = path.join(__dirname, 'public', 'themes', 'default');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'images');
const AUDIO_DIR = path.join(PUBLIC_DIR, 'audio');

// 游戏设计参数
const GAME_WIDTH = 720;
const GAME_HEIGHT = 1280;
const GRID_SIZE = 30;

// ==================== Sharp 绘图工具 ====================

/**
 * 创建带渐变的矩形
 */
async function createGradientRect(width, height, color1, color2, vertical = true) {
  // 创建渐变 SVG
  const gradientId = `gradient-${Date.now()}`;
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${gradientId}" ${vertical ? 'x1="0%" y1="0%" x2="0%" y2="100%"' : 'x1="0%" y1="0%" x2="100%" y2="0%"'}>
          <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#${gradientId})"/>
    </svg>
  `;
  
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * 创建圆形
 */
async function createCircle(size, color, withGradient = false) {
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" 
              fill="${withGradient ? `url(#grad-${Date.now()})` : color}"/>
      ${withGradient ? `
        <defs>
          <radialGradient id="grad-${Date.now()}">
            <stop offset="30%" style="stop-color:#fff;stop-opacity:0.6" />
            <stop offset="100%" style="stop-color:${color};stop-opacity:1" />
          </radialGradient>
        </defs>
      ` : ''}
    </svg>
  `;
  
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * 创建矩形
 */
async function createRectangle(width, height, color, borderRadius = 0) {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}" ${borderRadius > 0 ? `rx="${borderRadius}" ry="${borderRadius}"` : ''}/>
    </svg>
  `;
  
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * 保存 PNG 图片
 */
async function savePNG(buffer, filename, category = 'scene') {
  const dir = path.join(IMAGES_DIR, category);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 创建目录：${dir}`);
  }
  
  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, buffer);
  console.log(`🖼️  生成图片：${category}/${filename}`);
}

// ==================== 精美图片绘制函数 ====================

/**
 * 绘制玩家坦克 - 使用 SVG 组合
 */
async function drawPlayerTank(direction = 'up') {
  const size = 48;
  const rotation = direction === 'down' ? 180 : direction === 'left' ? -90 : direction === 'right' ? 90 : 0;
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${rotation} ${size/2} ${size/2})">
        <!-- 履带 -->
        <rect x="4" y="8" width="8" height="32" rx="2" fill="#15803d"/>
        <rect x="36" y="8" width="8" height="32" rx="2" fill="#15803d"/>
        
        <!-- 履带细节 -->
        ${Array.from({length: 8}).map((_, i) => `
          <line x1="4" y1="${12 + i*4}" x2="12" y2="${12 + i*4}" stroke="#166534" stroke-width="2"/>
          <line x1="36" y1="${12 + i*4}" x2="44" y2="${12 + i*4}" stroke="#166534" stroke-width="2"/>
        `).join('')}
        
        <!-- 主体装甲 -->
        <rect x="14" y="12" width="20" height="24" rx="3" fill="#4ade80"/>
        <rect x="16" y="14" width="16" height="20" rx="2" fill="#22c55e"/>
        
        <!-- 炮管 -->
        <rect x="20" y="2" width="8" height="16" rx="2" fill="#16a34a"/>
        <rect x="21" y="3" width="6" height="14" rx="1" fill="#15803d"/>
        
        <!-- 炮塔装饰 -->
        <circle cx="24" cy="22" r="4" fill="#166534"/>
        <circle cx="24" cy="22" r="2" fill="#4ade80"/>
      </g>
    </svg>
  `;
  
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * 绘制敌方坦克
 */
async function drawEnemyTank(type = 'basic', direction = 'up') {
  const size = type === 'heavy' ? 54 : type === 'fast' ? 42 : 48;
  const rotation = direction === 'down' ? 180 : direction === 'left' ? -90 : direction === 'right' ? 90 : 0;
  
  let colors;
  switch (type) {
    case 'fast':
      colors = { track: '#b45309', body: '#fbbf24', armor: '#d97706', detail: '#92400e' };
      break;
    case 'heavy':
      colors = { track: '#374151', body: '#9ca3af', armor: '#6b7280', detail: '#1f2937' };
      break;
    default: // basic
      colors = { track: '#991b1b', body: '#ef4444', armor: '#dc2626', detail: '#7f1d1d' };
  }
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <g transform="rotate(${rotation} ${size/2} ${size/2})">
        <!-- 履带 -->
        <rect x="${size*0.05}" y="${size*0.2}" width="${size*0.15}" height="${size*0.6}" rx="2" fill="${colors.track}"/>
        <rect x="${size*0.8}" y="${size*0.2}" width="${size*0.15}" height="${size*0.6}" rx="2" fill="${colors.track}"/>
        
        <!-- 主体 -->
        <rect x="${size*0.2}" y="${size*0.25}" width="${size*0.6}" height="${size*0.5}" rx="3" fill="${colors.body}"/>
        <rect x="${size*0.23}" y="${size*0.28}" width="${size*0.54}" height="${size*0.44}" rx="2" fill="${colors.armor}"/>
        
        <!-- 炮管 -->
        <rect x="${size*0.42}" y="${size*0.05}" width="${size*0.16}" height="${size*0.25}" rx="2" fill="${colors.detail}"/>
        
        <!-- 装饰细节 -->
        <circle cx="${size/2}" cy="${size*0.45}" r="${size*0.08}" fill="${colors.track}"/>
      </g>
    </svg>
  `;
  
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * 绘制子弹
 */
async function drawBullet(isPlayer = true) {
  const size = 12;
  
  if (isPlayer) {
    // 玩家子弹 - 金色渐变
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="bulletGrad">
            <stop offset="30%" style="stop-color:#fef3c7;stop-opacity:1" />
            <stop offset="70%" style="stop-color:#fbbf24;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#f97316;stop-opacity:1" />
          </radialGradient>
        </defs>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="url(#bulletGrad)"/>
      </svg>
    `;
    return await sharp(Buffer.from(svg)).png().toBuffer();
  } else {
    // 敌人子弹 - 红色渐变
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="enemyBulletGrad">
            <stop offset="30%" style="stop-color:#fecaca;stop-opacity:1" />
            <stop offset="70%" style="stop-color:#ef4444;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#b91c1c;stop-opacity:1" />
          </radialGradient>
        </defs>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" fill="url(#enemyBulletGrad)"/>
      </svg>
    `;
    return await sharp(Buffer.from(svg)).png().toBuffer();
  }
}

/**
 * 绘制砖墙
 */
async function drawBrickWall() {
  const size = GRID_SIZE;
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 背景 -->
      <rect width="100%" height="100%" fill="#78350f"/>
      
      <!-- 砖块层 1 -->
      <rect x="1" y="1" width="13" height="8" rx="1" fill="#b45309"/>
      <rect x="16" y="1" width="13" height="8" rx="1" fill="#92400e"/>
      
      <!-- 砖块层 2 -->
      <rect x="1" y="11" width="13" height="8" rx="1" fill="#a16207"/>
      <rect x="16" y="11" width="13" height="8" rx="1" fill="#b45309"/>
      
      <!-- 砖块层 3 -->
      <rect x="1" y="21" width="13" height="8" rx="1" fill="#92400e"/>
      <rect x="16" y="21" width="13" height="8" rx="1" fill="#a16207"/>
      
      <!-- 灰缝高光 -->
      <line x1="1" y1="10" x2="29" y2="10" stroke="#78350f" stroke-width="1"/>
      <line x1="1" y1="20" x2="29" y2="20" stroke="#78350f" stroke-width="1"/>
    </svg>
  `;
  
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * 绘制钢墙
 */
async function drawSteelWall() {
  const size = GRID_SIZE;
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 金属底板 -->
      <rect width="100%" height="100%" fill="#6b7280"/>
      
      <!-- 横向拉丝纹理 -->
      ${Array.from({length: 10}).map((_, i) => `
        <line x1="0" y1="${i*3}" x2="${size}" y2="${i*3}" stroke="#9ca3af" stroke-width="1" opacity="0.3"/>
      `).join('')}
      
      <!-- 四个铆钉 -->
      ${[[6, 6], [24, 6], [6, 24], [24, 24]].map(([cx, cy]) => `
        <circle cx="${cx}" cy="${cy}" r="3" fill="#d1d5db"/>
        <circle cx="${cx}" cy="${cy}" r="1.5" fill="#6b7280"/>
      `).join('')}
      
      <!-- 边框 -->
      <rect x="0" y="0" width="${size}" height="${size}" fill="none" stroke="#4b5563" stroke-width="2"/>
    </svg>
  `;
  
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * 绘制爆炸效果
 */
async function drawExplosion(frame) {
  const size = 60;
  
  const colors = {
    1: { inner: '#fef3c7', middle: '#fbbf24', outer: '#f97316' },
    2: { inner: '#fde68a', middle: '#f97316', outer: '#ea580c' },
    3: { inner: '#fdba74', middle: '#ea580c', outer: '#c2410c' },
    4: { inner: '#fb923c', middle: '#c2410c', outer: '#9a3412' }
  };
  
  const c = colors[frame];
  const scale = 0.7 + (frame - 1) * 0.2;
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="explosionGrad${frame}">
          <stop offset="20%" style="stop-color:${c.inner};stop-opacity:1" />
          <stop offset="60%" style="stop-color:${c.middle};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${c.outer};stop-opacity:0.8" />
        </radialGradient>
      </defs>
      
      <!-- 爆炸核心 -->
      <circle cx="${size/2}" cy="${size/2}" r="${15 * scale}" fill="url(#explosionGrad${frame})"/>
      
      <!-- 火花粒子 -->
      ${Array.from({length: 8}).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        const dist = 20 * scale + Math.random() * 10;
        const x = size/2 + Math.cos(angle) * dist;
        const y = size/2 + Math.sin(angle) * dist;
        const s = 2 + Math.random() * 3;
        return `<circle cx="${x}" cy="${y}" r="${s}" fill="${c.outer}" opacity="0.6"/>`;
      }).join('')}
    </svg>
  `;
  
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

/**
 * 绘制道具
 */
async function drawPowerUp(type) {
  const size = 30;
  
  const configs = {
    star: { 
      color: '#fbbf24', 
      shape: `<polygon points="${size/2},${size*0.1} ${size*0.65},${size*0.35} ${size*0.9},${size*0.35} ${size*0.7},${size*0.55} ${size*0.75},${size*0.85} ${size/2},${size*0.65} ${size*0.25},${size*0.85} ${size*0.3},${size*0.55} ${size*0.1},${size*0.35} ${size*0.35},${size*0.35}" fill="#fbbf24" stroke="#b45309" stroke-width="1"/>`
    },
    clock: {
      color: '#3b82f6',
      shape: `
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="#3b82f6" stroke="#1e40af" stroke-width="2"/>
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 4}" fill="none" stroke="#93c5fd" stroke-width="1"/>
        <line x1="${size/2}" y1="${size/2}" x2="${size/2}" y2="${size*0.3}" stroke="#dbeafe" stroke-width="2"/>
        <line x1="${size/2}" y1="${size/2}" x2="${size*0.7}" y2="${size/2}" stroke="#dbeafe" stroke-width="2"/>
      `
    },
    shovel: {
      color: '#a855f7',
      shape: `
        <rect x="${size*0.4}" y="${size*0.2}" width="${size*0.2}" height="${size*0.5}" fill="#a855f7" rx="1"/>
        <rect x="${size*0.25}" y="${size*0.7}" width="${size*0.5}" height="${size*0.15}" fill="#7e22ce" rx="1"/>
      `
    },
    life: {
      color: '#ef4444',
      shape: `
        <path d="M ${size/2} ${size*0.8} 
                 C ${size/2} ${size*0.8} ${size*0.1} ${size*0.5} ${size*0.1} ${size*0.35} 
                 A ${size*0.15} ${size*0.15} 0 0 1 ${size/2} ${size*0.35} 
                 A ${size*0.15} ${size*0.15} 0 0 1 ${size*0.9} ${size*0.35} 
                 C ${size*0.9} ${size*0.5} ${size/2} ${size*0.8} ${size/2} ${size*0.8} Z" 
              fill="#ef4444" stroke="#b91c1c" stroke-width="1"/>
        <path d="M ${size*0.35} ${size*0.4} Q ${size/2} ${size*0.3} ${size*0.65} ${size*0.4}" 
              fill="none" stroke="#fca5a5" stroke-width="1.5" stroke-linecap="round"/>
      `
    }
  };
  
  const config = configs[type];
  
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="powerupGrad${type}">
          <stop offset="30%" style="stop-color:#fff;stop-opacity:0.4" />
          <stop offset="100%" style="stop-color:${config.color};stop-opacity:1" />
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="transparent"/>
      ${config.shape.replace(config.color, `url(#powerupGrad${type})`)}
    </svg>
  `;
  
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

// ==================== 主函数 ====================

async function main() {
  console.log('='.repeat(60));
  console.log('🎨 坦克大战 资源生成器 (Sharp 专业版)');
  console.log('='.repeat(60));
  
  try {
    // ========== 生成图片资源 ==========
    console.log('\n=== 生成图片资源 ===\n');
    
    // 场景图片
    console.log('🏞️  生成场景图片...');
    const bgBuffer = await createGradientRect(GAME_WIDTH, GAME_HEIGHT, '#1a1a2e', '#1e293b');
    await savePNG(bgBuffer, 'background.png', 'scene');
    
    // 网格 SVG
    const gridSvg = `
      <svg width="${GAME_WIDTH}" height="${GAME_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a2e;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1e293b;stop-opacity:1" />
          </linearGradient>
          <pattern id="grid" width="${GRID_SIZE}" height="${GRID_SIZE}" patternUnits="userSpaceOnUse">
            <path d="M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}" fill="none" stroke="rgba(100,100,100,0.3)" stroke-width="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#bgGrad)"/>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>
    `;
    
    const gridBuffer = await sharp(Buffer.from(gridSvg)).png().toBuffer();
    await savePNG(gridBuffer, 'grid.png', 'scene');
    
    console.log('🧱 生成地形...');
    const brickBuffer = await drawBrickWall();
    await savePNG(brickBuffer, 'wall_brick.png', 'scene');
    
    const steelBuffer = await drawSteelWall();
    await savePNG(steelBuffer, 'wall_steel.png', 'scene');
    
    const grassBuffer = await createGradientRect(GRID_SIZE, GRID_SIZE, '#166534', '#15803d');
    await savePNG(grassBuffer, 'grass.png', 'scene');
    
    const waterBuffer = await createGradientRect(GRID_SIZE, GRID_SIZE, '#2563eb', '#1d4ed8');
    await savePNG(waterBuffer, 'water.png', 'scene');
    
    console.log('🏰 生成基地...');
    const baseSvg = `
      <svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="baseGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#fbbf24;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#d97706;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#baseGrad)"/>
        <text x="30" y="40" text-anchor="middle" font-size="30" fill="#78350f">🦅</text>
      </svg>
    `;
    const baseBuffer = await sharp(Buffer.from(baseSvg)).png().toBuffer();
    await savePNG(baseBuffer, 'base.png', 'scene');
    
    const destroyedBaseBuffer = await createGradientRect(60, 60, '#4b5563', '#1f2937');
    await savePNG(destroyedBaseBuffer, 'base_destroyed.png', 'scene');
    
    // 精灵图片
    console.log('\n🎮 生成玩家坦克...');
    for (const dir of ['up', 'down', 'left', 'right']) {
      const tankBuffer = await drawPlayerTank(dir);
      await savePNG(tankBuffer, `player_tank_${dir}.png`, 'sprite');
    }
    
    console.log('\n🤖 生成敌方坦克...');
    for (const type of ['basic', 'fast', 'heavy']) {
      for (const dir of ['up', 'down', 'left', 'right']) {
        const tankBuffer = await drawEnemyTank(type, dir);
        await savePNG(tankBuffer, `enemy_${type}_${dir}.png`, 'sprite');
      }
    }
    
    console.log('\n💫 生成子弹...');
    const playerBulletBuffer = await drawBullet(true);
    await savePNG(playerBulletBuffer, 'bullet_player.png', 'sprite');
    
    const enemyBulletBuffer = await drawBullet(false);
    await savePNG(enemyBulletBuffer, 'bullet_enemy.png', 'sprite');
    
    // 道具
    console.log('\n🎁 生成道具图标...');
    for (const type of ['star', 'clock', 'shovel', 'life']) {
      const powerBuffer = await drawPowerUp(type);
      await savePNG(powerBuffer, `powerup_${type}.png`, 'icon');
    }
    
    // 爆炸特效
    console.log('\n💥 生成爆炸特效...');
    for (let i = 1; i <= 4; i++) {
      const expBuffer = await drawExplosion(i);
      await savePNG(expBuffer, `explosion_${i}.png`, 'effect');
    }
    
    console.log('\n✅ 所有图片生成完成!');
    console.log(`📂 输出目录：${IMAGES_DIR}`);
  } catch (error) {
    console.error('\n❌ 生成失败:', error.message);
    throw error;
  }
}

main();
