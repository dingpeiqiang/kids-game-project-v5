/**
 * 资源生成脚本
 * 使用 Sharp 库程序化生成游戏资源
 */

import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OUTPUT_DIR = path.join(__dirname, '../public/themes/tower_default/assets/scene')

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })
}

console.log('🎨 开始生成塔防游戏资源...\n')

// 1. 生成敌人：红色圆形
async function generateEnemy() {
  const buffer = Buffer.alloc(32 * 32 * 4)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const dx = x - 16
      const dy = y - 16
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      const idx = (y * 32 + x) * 4
      if (distance <= 16) {
        buffer[idx] = 255     // R
        buffer[idx + 1] = 68   // G
        buffer[idx + 2] = 68   // B
        buffer[idx + 3] = 255  // A
      } else {
        buffer[idx + 3] = 0  // 透明
      }
    }
  }
  
  await sharp(buffer, { raw: { width: 32, height: 32, channels: 4 } })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'enemy.png'))
  
  console.log('✅ 生成敌人：enemy.png')
}

// 2. 生成炮塔：蓝色圆形
async function generateTurret() {
  const buffer = Buffer.alloc(32 * 32 * 4)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const dx = x - 16
      const dy = y - 16
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      const idx = (y * 32 + x) * 4
      if (distance <= 16) {
        buffer[idx] = 102    // R
        buffer[idx + 1] = 126 // G
        buffer[idx + 2] = 234 // B
        buffer[idx + 3] = 255 // A
      } else {
        buffer[idx + 3] = 0  // 透明
      }
    }
  }
  
  await sharp(buffer, { raw: { width: 32, height: 32, channels: 4 } })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'turret.png'))
  
  console.log('✅ 生成炮塔：turret.png')
}

// 3. 生成基地：红色大圆形
async function generateBase() {
  const buffer = Buffer.alloc(64 * 64 * 4)
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const dx = x - 32
      const dy = y - 32
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      const idx = (y * 64 + x) * 4
      if (distance <= 32) {
        buffer[idx] = 255    // R
        buffer[idx + 1] = 0   // G
        buffer[idx + 2] = 0   // B
        buffer[idx + 3] = 255 // A
      } else {
        buffer[idx + 3] = 0  // 透明
      }
    }
  }
  
  await sharp(buffer, { raw: { width: 64, height: 64, channels: 4 } })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'base.png'))
  
  console.log('✅ 生成基地：base.png')
}

// 4. 生成子弹：黄色小圆点
async function generateBullet() {
  const buffer = Buffer.alloc(12 * 12 * 4)
  for (let y = 0; y < 12; y++) {
    for (let x = 0; x < 12; x++) {
      const dx = x - 6
      const dy = y - 6
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      const idx = (y * 12 + x) * 4
      if (distance <= 6) {
        buffer[idx] = 255    // R
        buffer[idx + 1] = 255 // G
        buffer[idx + 2] = 0   // B
        buffer[idx + 3] = 255 // A
      } else {
        buffer[idx + 3] = 0  // 透明
      }
    }
  }
  
  await sharp(buffer, { raw: { width: 12, height: 12, channels: 4 } })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'bullet.png'))
  
  console.log('✅ 生成子弹：bullet.png')
}

// 5. 生成光标：绿色半透明方块
async function generateCursor() {
  const buffer = Buffer.alloc(32 * 32 * 4)
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 32; x++) {
      const idx = (y * 32 + x) * 4
      buffer[idx] = 0      // R
      buffer[idx + 1] = 255 // G
      buffer[idx + 2] = 0   // B
      buffer[idx + 3] = 128 // A (半透明)
    }
  }
  
  await sharp(buffer, { raw: { width: 32, height: 32, channels: 4 } })
    .png()
    .toFile(path.join(OUTPUT_DIR, 'cursor.png'))
  
  console.log('✅ 生成光标：cursor.png')
}

// 主函数
async function main() {
  try {
    await generateEnemy()
    await generateTurret()
    await generateBase()
    await generateBullet()
    await generateCursor()
    
    console.log('\n✅ 所有资源生成完成！')
  } catch (error) {
    console.error('❌ 资源生成失败:', error)
    process.exit(1)
  }
}

main()