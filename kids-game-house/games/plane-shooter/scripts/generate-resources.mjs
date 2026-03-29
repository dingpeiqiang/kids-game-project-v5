// ============================================================================
// 飞机大战游戏资源生成脚本
// ============================================================================
// 使用 Sharp 库程序化生成所有游戏资源
// 运行：node generate-resources.mjs
// ============================================================================

import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 输出目录
const OUTPUT_DIR = path.join(__dirname, 'public', 'themes', 'plane_shooter_default')
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images')
const AUDIO_DIR = path.join(OUTPUT_DIR, 'audio')

// 确保目录存在
if (!fs.existsSync(IMAGES_DIR)) {
  fs.mkdirSync(IMAGES_DIR, { recursive: true })
}
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true })
}

console.log('🎨 开始生成飞机大战资源...\n')

// ============================================================================
// 1. 生成背景：深蓝色星空渐变
// ============================================================================
async function generateBackground() {
  const width = 1920
  const height = 1080
  const buffer = Buffer.alloc(width * height * 4)
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 从上到下的渐变：深蓝 → 更深蓝
      const ratio = y / height
      const r = Math.floor(15 * (1 - ratio) + 30 * ratio)
      const g = Math.floor(23 * (1 - ratio) + 41 * ratio)
      const b = Math.floor(77 * (1 - ratio) + 116 * ratio)
      
      const idx = (y * width + x) * 4
      buffer[idx] = r
      buffer[idx + 1] = g
      buffer[idx + 2] = b
      buffer[idx + 3] = 255
    }
  }
  
  // 添加一些星星
  const starBuffer = Buffer.alloc(width * height * 4, 0)
  for (let i = 0; i < 200; i++) {
    const starX = Math.floor(Math.random() * width)
    const starY = Math.floor(Math.random() * height / 2) // 只在上半部分
    const starSize = Math.floor(Math.random() * 2) + 1
    const brightness = Math.floor(Math.random() * 100) + 155
    
    for (let dy = -starSize; dy <= starSize; dy++) {
      for (let dx = -starSize; dx <= starSize; dx++) {
        const idx = ((starY + dy) * width + (starX + dx)) * 4
        if (idx >= 0 && idx < starBuffer.length) {
          starBuffer[idx] = brightness
          starBuffer[idx + 1] = brightness
          starBuffer[idx + 2] = brightness
          starBuffer[idx + 3] = 255
        }
      }
    }
  }
  
  // 合并背景和星星
  await sharp(buffer, { raw: { width, height, channels: 4 } })
    .composite([{
      input: starBuffer,
      raw: { width, height, channels: 4 },
      blend: 'screen'
    }])
    .png()
    .toFile(path.join(IMAGES_DIR, 'bg_main.png'))
  
  console.log('✅ 生成背景：bg_main.png')
}

// ============================================================================
// 2. 生成玩家飞机：蓝白色战斗机
// ============================================================================
async function generatePlayer() {
  const size = 256
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 机身主体 -->
      <ellipse cx="128" cy="128" rx="40" ry="100" fill="#3b82f6" stroke="#1e40af" stroke-width="3"/>
      
      <!-- 机翼 -->
      <polygon points="128,20 40,180 216,180" fill="#60a5fa" stroke="#1e40af" stroke-width="2"/>
      
      <!-- 驾驶舱 -->
      <ellipse cx="128" cy="100" rx="20" ry="40" fill="#93c5fd" stroke="#1e3a8a" stroke-width="2"/>
      
      <!-- 尾部火焰 -->
      <polygon points="128,220 108,180 148,180" fill="#f97316" opacity="0.8"/>
      <polygon points="128,210 116,180 140,180" fill="#fbbf24" opacity="0.9"/>
      
      <!-- 装饰线条 -->
      <line x1="128" y1="60" x2="128" y2="180" stroke="#1e3a8a" stroke-width="2"/>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(IMAGES_DIR, 'player.png'))
  
  console.log('✅ 生成玩家飞机：player.png')
}

// ============================================================================
// 3-5. 生成敌机（小型、中型、大型）
// ============================================================================
async function generateEnemySmall() {
  const size = 128
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 小型敌机：红色三角战机 -->
      <polygon points="64,100 20,20 108,20" fill="#ef4444" stroke="#991b1b" stroke-width="2"/>
      <polygon points="64,80 40,40 88,40" fill="#fca5a5"/>
      <!-- 引擎火焰 -->
      <polygon points="64,100 54,80 74,80" fill="#f97316" opacity="0.8"/>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(IMAGES_DIR, 'enemy_small.png'))
  
  console.log('✅ 生成小型敌机：enemy_small.png')
}

async function generateEnemyMedium() {
  const size = 256
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 中型敌机：绿色轰炸机 -->
      <ellipse cx="128" cy="128" rx="60" ry="100" fill="#22c55e" stroke="#14532d" stroke-width="3"/>
      
      <!-- 机翼 -->
      <rect x="40" y="100" width="176" height="40" rx="10" fill="#4ade80" stroke="#14532d" stroke-width="2"/>
      
      <!-- 驾驶舱 -->
      <circle cx="128" cy="100" r="30" fill="#86efac" stroke="#14532d" stroke-width="2"/>
      
      <!-- 炸弹挂架 -->
      <circle cx="80" cy="160" r="15" fill="#1f2937"/>
      <circle cx="176" cy="160" r="15" fill="#1f2937"/>
      
      <!-- 引擎 -->
      <rect x="108" y="200" width="20" height="30" fill="#6b7280"/>
      <rect x="128" y="200" width="20" height="30" fill="#6b7280"/>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(IMAGES_DIR, 'enemy_medium.png'))
  
  console.log('✅ 生成中型敌机：enemy_medium.png')
}

async function generateEnemyLarge() {
  const size = 384
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 大型敌机：紫色战舰 -->
      <ellipse cx="192" cy="192" rx="100" ry="140" fill="#a855f7" stroke="#581c87" stroke-width="4"/>
      
      <!-- 巨大机翼 -->
      <polygon points="192,50 40,250 344,250" fill="#c084fc" stroke="#581c87" stroke-width="3"/>
      
      <!-- 主炮塔 -->
      <rect x="152" y="80" width="80" height="120" rx="20" fill="#7e22ce" stroke="#581c87" stroke-width="3"/>
      
      <!-- 多个小炮塔 -->
      <circle cx="100" cy="180" r="30" fill="#9333ea" stroke="#581c87" stroke-width="2"/>
      <circle cx="284" cy="180" r="30" fill="#9333ea" stroke="#581c87" stroke-width="2"/>
      
      <!-- 能量核心 -->
      <circle cx="192" cy="192" r="40" fill="#e879f9" opacity="0.6"/>
      
      <!-- 引擎组 -->
      <rect x="142" y="300" width="30" height="50" fill="#4b5563"/>
      <rect x="177" y="300" width="30" height="50" fill="#4b5563"/>
      <rect x="212" y="300" width="30" height="50" fill="#4b5563"/>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(IMAGES_DIR, 'enemy_large.png'))
  
  console.log('✅ 生成大型敌机：enemy_large.png')
}

// ============================================================================
// 6-7. 生成子弹（玩家和敌机）
// ============================================================================
async function generateBulletPlayer() {
  const width = 64
  const height = 128
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- 玩家子弹：蓝色光弹 -->
      <ellipse cx="32" cy="64" rx="12" ry="40" fill="#3b82f6" opacity="0.8"/>
      <ellipse cx="32" cy="64" rx="6" ry="25" fill="#93c5fd"/>
      <!-- 尾迹 -->
      <polygon points="32,104 24,120 40,120" fill="#60a5fa" opacity="0.6"/>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(IMAGES_DIR, 'bullet_player.png'))
  
  console.log('✅ 生成玩家子弹：bullet_player.png')
}

async function generateBulletEnemy() {
  const width = 64
  const height = 128
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <!-- 敌机子弹：红色光弹 -->
      <ellipse cx="32" cy="64" rx="14" ry="45" fill="#ef4444" opacity="0.8"/>
      <ellipse cx="32" cy="64" rx="8" ry="30" fill="#fca5a5"/>
      <!-- 火焰效果 -->
      <polygon points="32,109 26,124 38,124" fill="#f97316" opacity="0.7"/>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(IMAGES_DIR, 'bullet_enemy.png'))
  
  console.log('✅ 生成敌机子弹：bullet_enemy.png')
}

// ============================================================================
// 8-11. 生成道具
// ============================================================================
async function generatePropDouble() {
  const size = 128
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 圆形底座 -->
      <circle cx="64" cy="64" r="50" fill="#f97316" stroke="#c2410c" stroke-width="3"/>
      
      <!-- "2X" 文字 -->
      <text x="64" y="80" text-anchor="middle" fill="white" font-size="48" font-weight="bold" font-family="Arial">2X</text>
      
      <!-- 高光 -->
      <ellipse cx="48" cy="48" rx="15" ry="10" fill="#fdba74" opacity="0.6"/>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(IMAGES_DIR, 'prop_double.png'))
  
  console.log('✅ 生成双发子弹道具：prop_double.png')
}

async function generatePropShield() {
  const size = 128
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 护盾图标 -->
      <path d="M64,10 L110,30 L110,70 Q110,100 64,118 Q18,100 18,70 L18,30 Z" 
            fill="#3b82f6" stroke="#1e40af" stroke-width="3"/>
      
      <!-- 内部光泽 -->
      <path d="M64,20 L100,35 L100,65 Q100,90 64,108 Q28,90 28,65 L28,35 Z" 
            fill="#60a5fa" opacity="0.6"/>
      
      <!-- 十字标记 -->
      <line x1="64" y1="40" x2="64" y2="88" stroke="white" stroke-width="6"/>
      <line x1="44" y1="64" x2="84" y2="64" stroke="white" stroke-width="6"/>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(IMAGES_DIR, 'prop_shield.png'))
  
  console.log('✅ 生成护盾道具：prop_shield.png')
}

async function generatePropHeart() {
  const size = 128
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 爱心 -->
      <path d="M64,110 C20,70 10,40 30,25 C45,15 58,25 64,35 C70,25 83,15 98,25 C118,40 108,70 64,110 Z" 
            fill="#ef4444" stroke="#991b1b" stroke-width="3"/>
      
      <!-- 高光 -->
      <ellipse cx="45" cy="45" rx="12" ry="10" fill="#fca5a5" opacity="0.7"/>
      <ellipse cx="83" cy="45" rx="12" ry="10" fill="#fca5a5" opacity="0.7"/>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(IMAGES_DIR, 'prop_heart.png'))
  
  console.log('✅ 生成生命道具：prop_heart.png')
}

async function generatePropBomb() {
  const size = 128
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 炸弹主体 -->
      <circle cx="64" cy="70" r="40" fill="#1f2937" stroke="#000000" stroke-width="3"/>
      
      <!-- 引信 -->
      <rect x="58" y="20" width="12" height="30" fill="#4b5563"/>
      <circle cx="64" cy="20" r="8" fill="#ef4444"/>
      
      <!-- 骷髅标记 -->
      <circle cx="50" cy="60" r="8" fill="#fbbf24"/>
      <circle cx="78" cy="60" r="8" fill="#fbbf24"/>
      <path d="M50,80 Q64,90 78,80" stroke="#fbbf24" stroke-width="4" fill="none"/>
      
      <!-- 爆炸效果 -->
      <path d="M64,10 L70,25 L85,20 L75,35 L90,45 L75,50 L80,65 L64,55 L48,65 L53,50 L38,45 L53,35 L43,20 L58,25 Z" 
            fill="#f97316" opacity="0.3"/>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(IMAGES_DIR, 'prop_bomb.png'))
  
  console.log('✅ 生成炸弹道具：prop_bomb.png')
}

// ============================================================================
// 12. 生成爆炸特效
// ============================================================================
async function generateExplosion() {
  const size = 256
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 外层火焰 -->
      <circle cx="128" cy="128" r="100" fill="#f97316" opacity="0.6"/>
      
      <!-- 中层火焰 -->
      <circle cx="128" cy="128" r="70" fill="#fbbf24" opacity="0.7"/>
      
      <!-- 内层核心 -->
      <circle cx="128" cy="128" r="40" fill="#fef3c7" opacity="0.8"/>
      
      <!-- 白色高温核心 -->
      <circle cx="128" cy="128" r="20" fill="#ffffff"/>
      
      <!-- 火花四溅 -->
      <line x1="128" y1="28" x2="128" y2="18" stroke="#f97316" stroke-width="3"/>
      <line x1="128" y1="228" x2="128" y2="238" stroke="#f97316" stroke-width="3"/>
      <line x1="28" y1="128" x2="18" y2="128" stroke="#f97316" stroke-width="3"/>
      <line x1="238" y1="128" x2="248" y2="128" stroke="#f97316" stroke-width="3"/>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(IMAGES_DIR, 'explosion.png'))
  
  console.log('✅ 生成爆炸特效：explosion.png')
}

// ============================================================================
// 13. 生成 GTRS.json 配置文件
// ============================================================================
async function generateGTRSConfig() {
  const gtrsConfig = {
    specMeta: {
      specName: 'GTRS',
      specVersion: '1.0.0',
      compatibleVersion: '1.0.0'
    },
    themeInfo: {
      themeCode: 'plane_shooter_default',
      themeName: '飞机大战默认主题',
      gameId: 'plane-shooter',
      ownerType: 'GAME',
      ownerId: 'plane-shooter',
      isDefault: true,
      author: 'AI Assistant',
      version: '1.0.0'
    },
    globalStyle: {
      primaryColor: '#3b82f6',
      secondaryColor: '#1e40af',
      bgColor: '#0f172a',
      textColor: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      borderRadius: '8px'
    },
    resources: {
      images: {
        scene: {
          bg_main: { alias: '游戏背景', src: '/themes/plane_shooter_default/images/bg_main.png', type: 'png' },
          player: { alias: '玩家飞机', src: '/themes/plane_shooter_default/images/player.png', type: 'png' },
          enemy_small: { alias: '小型敌机', src: '/themes/plane_shooter_default/images/enemy_small.png', type: 'png' },
          enemy_medium: { alias: '中型敌机', src: '/themes/plane_shooter_default/images/enemy_medium.png', type: 'png' },
          enemy_large: { alias: '大型敌机', src: '/themes/plane_shooter_default/images/enemy_large.png', type: 'png' },
          bullet_player: { alias: '玩家子弹', src: '/themes/plane_shooter_default/images/bullet_player.png', type: 'png' },
          bullet_enemy: { alias: '敌机子弹', src: '/themes/plane_shooter_default/images/bullet_enemy.png', type: 'png' },
          prop_double: { alias: '双发子弹', src: '/themes/plane_shooter_default/images/prop_double.png', type: 'png' },
          prop_shield: { alias: '护盾', src: '/themes/plane_shooter_default/images/prop_shield.png', type: 'png' },
          prop_heart: { alias: '生命恢复', src: '/themes/plane_shooter_default/images/prop_heart.png', type: 'png' },
          prop_bomb: { alias: '炸弹', src: '/themes/plane_shooter_default/images/prop_bomb.png', type: 'png' }
        },
        ui: {},
        icon: {},
        effect: {
          explosion: { alias: '爆炸特效', src: '/themes/plane_shooter_default/images/explosion.png', type: 'png' }
        }
      },
      audio: {
        bgm: {
          bgm_main: { alias: '背景音乐', src: '/themes/plane_shooter_default/audio/bgm_main.mp3', type: 'mp3', volume: 0.6 }
        },
        effect: {
          sfx_shoot: { alias: '射击音效', src: '/themes/plane_shooter_default/audio/sfx_shoot.mp3', type: 'mp3', volume: 0.8 },
          sfx_explosion: { alias: '爆炸音效', src: '/themes/plane_shooter_default/audio/sfx_explosion.mp3', type: 'mp3', volume: 0.8 },
          sfx_hit: { alias: '被击中音效', src: '/themes/plane_shooter_default/audio/sfx_hit.mp3', type: 'mp3', volume: 0.8 },
          sfx_prop: { alias: '拾取道具音效', src: '/themes/plane_shooter_default/audio/sfx_prop.mp3', type: 'mp3', volume: 0.8 },
          sfx_gameover: { alias: '游戏结束音效', src: '/themes/plane_shooter_default/audio/sfx_gameover.mp3', type: 'mp3', volume: 0.8 }
        },
        voice: {}
      },
      video: {}
    }
  }
  
  const gtrsPath = path.join(OUTPUT_DIR, 'GTRS.json')
  fs.writeFileSync(gtrsPath, JSON.stringify(gtrsConfig, null, 2), 'utf-8')
  
  console.log('✅ 生成 GTRS 配置文件：GTRS.json')
}

// ============================================================================
// 主函数
// ============================================================================
async function main() {
  try {
    console.log('🎮 飞机大战资源生成器启动\n')
    
    // 生成图片资源
    await generateBackground()
    await generatePlayer()
    await generateEnemySmall()
    await generateEnemyMedium()
    await generateEnemyLarge()
    await generateBulletPlayer()
    await generateBulletEnemy()
    await generatePropDouble()
    await generatePropShield()
    await generatePropHeart()
    await generatePropBomb()
    await generateExplosion()
    
    // 生成配置文件
    await generateGTRSConfig()
    
    console.log('\n✅ 所有资源生成完成！')
    console.log(`📁 输出目录：${OUTPUT_DIR}`)
    console.log('\n生成的文件列表:')
    console.log('  📷 图片：12 个')
    console.log('  📄 配置：GTRS.json')
    console.log('\n💡 提示：音频文件需要单独准备或使用框架内置合成音')
    
  } catch (error) {
    console.error('❌ 资源生成失败:', error)
    process.exit(1)
  }
}

main()
