/**
 * 坦克大战资源生成脚本
 * 使用 Sharp 库程序化生成所有游戏图片资源
 */

import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 输出目录
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'themes', 'tank_default', 'assets', 'scene')
const AUDIO_OUTPUT_DIR = path.join(__dirname, '..', 'public', 'themes', 'tank_default', 'assets', 'audio')

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}
if (!fs.existsSync(AUDIO_OUTPUT_DIR)) {
  fs.mkdirSync(AUDIO_OUTPUT_DIR, { recursive: true })
}

console.log('🎨 开始生成坦克大战资源...\n')

// ==================== 背景生成 ====================
async function generateBackground() {
  console.log('生成背景...')
  
  const width = 1920
  const height = 1080
  const buffer = Buffer.alloc(width * height * 4)
  
  // 深绿色军事风格背景，带网格纹理
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4
      
      // 基础深绿色
      let r = 26
      let g = 77
      let b = 46
      
      // 添加网格线（每 64 像素）
      if (x % 64 === 0 || y % 64 === 0) {
        r = Math.min(255, r + 20)
        g = Math.min(255, g + 30)
        b = Math.min(255, b + 20)
      }
      
      // 添加噪点增加质感
      const noise = (Math.random() - 0.5) * 10
      r = Math.max(0, Math.min(255, r + noise))
      g = Math.max(0, Math.min(255, g + noise))
      b = Math.max(0, Math.min(255, b + noise))
      
      buffer[idx] = r
      buffer[idx + 1] = g
      buffer[idx + 2] = b
      buffer[idx + 3] = 255
    }
  }
  
  await sharp(buffer, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'bg_main.png'))
  
  console.log('✅ bg_main.png\n')
}

// ==================== 坦克生成 ====================
async function generateTank(filename, color, direction) {
  const size = 64
  
  // 创建 SVG 坦克
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <!-- 坦克主体 -->
      <rect x="12" y="20" width="40" height="32" rx="4" fill="${color}"/>
      
      <!-- 炮塔 -->
      <circle cx="32" cy="36" r="10" fill="${adjustColor(color, -30)}"/>
      
      <!-- 炮管 -->
      ${direction === 'up' ? `<rect x="28" y="4" width="8" height="24" rx="2" fill="${adjustColor(color, -50)}"/>` : ''}
      ${direction === 'down' ? `<rect x="28" y="36" width="8" height="24" rx="2" fill="${adjustColor(color, -50)}"/>` : ''}
      ${direction === 'left' ? `<rect x="4" y="32" width="24" height="8" rx="2" fill="${adjustColor(color, -50)}"/>` : ''}
      ${direction === 'right' ? `<rect x="32" y="32" width="24" height="8" rx="2" fill="${adjustColor(color, -50)}"/>` : ''}
      
      <!-- 履带 -->
      <rect x="8" y="18" width="8" height="36" rx="2" fill="#2d3748"/>
      <rect x="48" y="18" width="8" height="36" rx="2" fill="#2d3748"/>
      
      <!-- 装饰细节 -->
      <circle cx="32" cy="36" r="4" fill="${adjustColor(color, -70)}"/>
    </svg>
  `
  
  await sharp(Buffer.from(svg))
    .png()
    .toFile(path.join(OUTPUT_DIR, filename))
}

function adjustColor(hex, amount) {
  // 简单调整颜色亮度
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + amount))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount))
  const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount))
  return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`
}

async function generateAllTanks() {
  console.log('生成坦克...')
  
  // 玩家坦克（蓝绿色）
  await generateTank('player_tank_up.png', '#3b82f6', 'up')
  await generateTank('player_tank_down.png', '#3b82f6', 'down')
  await generateTank('player_tank_left.png', '#3b82f6', 'left')
  await generateTank('player_tank_right.png', '#3b82f6', 'right')
  
  // 敌人坦克 1（红色 - 基础型）
  await generateTank('enemy_tank_1.png', '#ef4444', 'down')
  
  // 敌人坦克 2（黄色 - 快速型）
  await generateTank('enemy_tank_2.png', '#eab308', 'down')
  
  // 敌人坦克 3（深红色 - 重型）
  await generateTank('enemy_tank_3.png', '#991b1b', 'down')
  
  console.log('✅ 所有坦克生成完成\n')
}

// ==================== 子弹生成 ====================
async function generateBullets() {
  console.log('生成子弹...')
  
  // 玩家子弹（绿色）
  const playerBulletSvg = `
    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" fill="#4ade80"/>
      <circle cx="8" cy="8" r="3" fill="#86efac"/>
    </svg>
  `
  
  await sharp(Buffer.from(playerBulletSvg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'bullet_player.png'))
  
  // 敌人子弹（红色）
  const enemyBulletSvg = `
    <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" fill="#f97316"/>
      <circle cx="8" cy="8" r="3" fill="#fdba74"/>
    </svg>
  `
  
  await sharp(Buffer.from(enemyBulletSvg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'bullet_enemy.png'))
  
  console.log('✅ 子弹生成完成\n')
}

// ==================== 障碍物生成 ====================
async function generateWalls() {
  console.log('生成障碍物...')
  
  // 砖墙
  const brickWallSvg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="#92400e"/>
      ${Array.from({ length: 4 }).map((_, i) => `
        <rect x="0" y="${i * 16}" width="64" height="2" fill="#78350f"/>
        ${i % 2 === 0 ? '<rect x="32" y="' + (i * 16) + '" width="2" height="16" fill="#78350f"/>' : ''}
      `).join('')}
      <rect x="0" y="0" width="64" height="64" fill="none" stroke="#78350f" stroke-width="2"/>
    </svg>
  `
  
  await sharp(Buffer.from(brickWallSvg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'wall_brick.png'))
  
  // 钢墙
  const steelWallSvg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="#4b5563"/>
      ${Array.from({ length: 3 }).map((_, i) => `
        <rect x="${i * 32}" y="0" width="2" height="64" fill="#374151"/>
        <rect x="0" y="${i * 32}" width="64" height="2" fill="#374151"/>
      `).join('')}
      <rect x="0" y="0" width="64" height="64" fill="none" stroke="#1f2937" stroke-width="3"/>
      <circle cx="32" cy="32" r="8" fill="#6b7280"/>
    </svg>
  `
  
  await sharp(Buffer.from(steelWallSvg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'wall_steel.png'))
  
  console.log('✅ 障碍物生成完成\n')
}

// ==================== 基地生成 ====================
async function generateBase() {
  console.log('生成基地...')
  
  // 正常基地（金色鹰徽）
  const baseHomeSvg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="#1e3a8a"/>
      <!-- 鹰形状 -->
      <path d="M32 8 L40 24 L56 24 L44 36 L48 56 L32 44 L16 56 L20 36 L8 24 L24 24 Z" fill="#fbbf24"/>
      <circle cx="32" cy="32" r="6" fill="#f59e0b"/>
    </svg>
  `
  
  await sharp(Buffer.from(baseHomeSvg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'base_home.png'))
  
  // 被摧毁的基地
  const baseDestroyedSvg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" fill="#1e3a8a"/>
      <!-- 破碎的鹰 -->
      <path d="M20 20 L32 32 M44 20 L32 32 M16 44 L28 36 M48 44 L36 36" stroke="#9ca3af" stroke-width="3"/>
      <circle cx="32" cy="32" r="8" fill="none" stroke="#6b7280" stroke-width="2"/>
    </svg>
  `
  
  await sharp(Buffer.from(baseDestroyedSvg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'base_destroyed.png'))
  
  console.log('✅ 基地生成完成\n')
}

// ==================== 爆炸特效生成 ====================
async function generateExplosions() {
  console.log('生成爆炸特效...')
  
  // 爆炸帧 1（小火球）
  const explosion1Svg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="12" fill="#f97316"/>
      <circle cx="32" cy="32" r="8" fill="#fbbf24"/>
      <circle cx="32" cy="32" r="4" fill="#fef3c7"/>
    </svg>
  `
  
  await sharp(Buffer.from(explosion1Svg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'explosion_1.png'))
  
  // 爆炸帧 2（中等火球）
  const explosion2Svg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="20" fill="#ea580c"/>
      <circle cx="32" cy="32" r="14" fill="#f97316"/>
      <circle cx="32" cy="32" r="8" fill="#fbbf24"/>
      <circle cx="24" cy="24" r="4" fill="#fef3c7"/>
      <circle cx="40" cy="28" r="3" fill="#fef3c7"/>
    </svg>
  `
  
  await sharp(Buffer.from(explosion2Svg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'explosion_2.png'))
  
  // 爆炸帧 3（大火球）
  const explosion3Svg = `
    <svg width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="#c2410c"/>
      <circle cx="32" cy="32" r="20" fill="#ea580c"/>
      <circle cx="32" cy="32" r="12" fill="#f97316"/>
      <circle cx="32" cy="32" r="6" fill="#fbbf24"/>
      ${[0, 72, 144, 216, 288].map(angle => {
        const rad = angle * Math.PI / 180
        const x = 32 + 18 * Math.cos(rad)
        const y = 32 + 18 * Math.sin(rad)
        return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="#fef3c7"/>`
      }).join('\n')}
    </svg>
  `
  
  await sharp(Buffer.from(explosion3Svg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'explosion_3.png'))
  
  console.log('✅ 爆炸特效生成完成\n')
}

// ==================== 道具生成 ====================
async function generateProps() {
  console.log('生成道具...')
  
  // 星级道具
  const starSvg = `
    <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="starGrad">
          <stop offset="0%" stop-color="#fef3c7"/>
          <stop offset="100%" stop-color="#fbbf24"/>
        </radialGradient>
      </defs>
      <polygon points="24,2 30,18 46,18 33,28 38,44 24,34 10,44 15,28 2,18 18,18" 
               fill="url(#starGrad)" stroke="#f59e0b" stroke-width="2"/>
      <circle cx="24" cy="24" r="6" fill="#f59e0b" opacity="0.3"/>
    </svg>
  `
  
  await sharp(Buffer.from(starSvg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'prop_star.png'))
  
  // 时钟道具
  const clockSvg = `
    <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="clockGrad">
          <stop offset="0%" stop-color="#93c5fd"/>
          <stop offset="100%" stop-color="#3b82f6"/>
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="20" fill="url(#clockGrad)" stroke="#1d4ed8" stroke-width="2"/>
      <circle cx="24" cy="24" r="16" fill="none" stroke="#dbeafe" stroke-width="1"/>
      <line x1="24" y1="24" x2="24" y2="14" stroke="#1e40af" stroke-width="2"/>
      <line x1="24" y1="24" x2="32" y2="24" stroke="#1e40af" stroke-width="2"/>
    </svg>
  `
  
  await sharp(Buffer.from(clockSvg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'prop_clock.png'))
  
  // 护盾道具
  const shieldSvg = `
    <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="shieldGrad">
          <stop offset="0%" stop-color="#ddd6fe"/>
          <stop offset="100%" stop-color="#8b5cf6"/>
        </radialGradient>
      </defs>
      <path d="M24 4 L40 12 L40 28 Q40 40 24 44 Q8 40 8 28 L8 12 Z" 
            fill="url(#shieldGrad)" stroke="#6d28d9" stroke-width="2"/>
      <path d="M24 12 L24 36 M16 20 L32 20" stroke="#5b21b6" stroke-width="2"/>
    </svg>
  `
  
  await sharp(Buffer.from(shieldSvg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'prop_shield.png'))
  
  console.log('✅ 道具生成完成\n')
}

// ==================== UI 元素生成 ====================
async function generateUI() {
  console.log('生成 UI 元素...')
  
  // 生命值图标（爱心）
  const heartSvg = `
    <svg width="32" height="32" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 28 C16 28 4 18 4 10 A6 6 0 0 1 16 10 A6 6 0 0 1 28 10 C28 18 16 28 16 28 Z" 
            fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
    </svg>
  `
  
  await sharp(Buffer.from(heartSvg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'ui_heart.png'))
  
  // 暂停图标
  const pauseSvg = `
    <svg width="48" height="48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="#1f2937" opacity="0.9"/>
      <rect x="16" y="12" width="6" height="24" rx="2" fill="#ffffff"/>
      <rect x="26" y="12" width="6" height="24" rx="2" fill="#ffffff"/>
    </svg>
  `
  
  await sharp(Buffer.from(pauseSvg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'ui_pause.png'))
  
  // 重新开始按钮
  const restartBtnSvg = `
    <svg width="200" height="60" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="200" height="60" rx="10" ry="10" 
            fill="#4ade80" stroke="#22c55e" stroke-width="2"/>
      <text x="100" y="35" text-anchor="middle" fill="white" 
            font-size="24" font-family="Arial" font-weight="bold">
        重新开始
      </text>
    </svg>
  `
  
  await sharp(Buffer.from(restartBtnSvg))
    .png()
    .toFile(path.join(OUTPUT_DIR, 'btn_restart.png'))
  
  console.log('✅ UI 元素生成完成\n')
}

// ==================== 音频占位文件 ====================
function generateAudioPlaceholders() {
  console.log('生成音频占位文件说明...')
  
  const audioFiles = [
    'bgm_main.mp3',
    'sfx_shot.wav',
    'sfx_explosion.wav',
    'sfx_hit.wav',
    'sfx_start.wav',
    'sfx_gameover.wav',
    'sfx_prop.wav'
  ]
  
  const readmeContent = `# 音频资源说明

当前目录包含以下音频资源的占位符：

${audioFiles.map(f => `- ${f}`).join('\n')}

## 开发阶段

使用 WebAudio API 实时合成音效，无需实际文件。

## 生产阶段

请替换为真实的音频文件：
- BGM: MP3 格式，128kbps，循环播放
- SFX: WAV 格式，短促音效

## WebAudio 实现示例

\`\`\`javascript
// 射击音效
function playShootSound() {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  
  osc.connect(gain)
  gain.connect(ctx.destination)
  
  osc.frequency.setValueAtTime(800, ctx.currentTime)
  osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)
  
  gain.gain.setValueAtTime(0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3)
  
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 0.3)
}
\`\`\`
`
  
  fs.writeFileSync(path.join(AUDIO_OUTPUT_DIR, 'README.md'), readmeContent)
  console.log('✅ 音频说明文档已生成\n')
}

// ==================== 主函数 ====================
async function main() {
  try {
    await generateBackground()
    await generateAllTanks()
    await generateBullets()
    await generateWalls()
    await generateBase()
    await generateExplosions()
    await generateProps()
    await generateUI()
    generateAudioPlaceholders()
    
    console.log('🎉 所有资源生成完成！')
    console.log(`📁 输出目录：${OUTPUT_DIR}`)
    console.log(`📁 音频目录：${AUDIO_OUTPUT_DIR}`)
  } catch (error) {
    console.error('❌ 资源生成失败:', error)
    process.exit(1)
  }
}

main()
