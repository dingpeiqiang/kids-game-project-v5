#!/usr/bin/env node

/**
 * 添加游戏区域调试可视化工具
 * 
 * 功能：
 * 1. 显示实际游戏区域边界
 * 2. 显示网格线辅助对齐
 * 3. 显示坦克中心点位置
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔧 开始添加游戏区域调试工具...\n')

// 读取 TankGameScene.ts
const sceneFile = path.join(__dirname, 'src', 'scenes', 'TankGameScene.ts')
let content = fs.readFileSync(sceneFile, 'utf-8')

console.log('✅ 分析现有代码结构...')

// 在 create() 方法中添加调试绘制
const createMatch = content.match(/create\(\): void \{[\s\S]*?this\.base = this\.physics\.add\.sprite/)
if (createMatch && createMatch.index !== undefined) {
  // 查找 createMap() 调用的位置
  const createMapCall = content.match(/this\.createMap\(\)/)
  if (createMapCall && createMapCall.index !== undefined) {
    const insertPos = createMapCall.index + createMapCall[0].length
    
    const debugCode = `
    
    // 🎯 调试：绘制游戏区域边界（可按需启用）
    // this.drawDebugBoundaries()`
    
    content = content.slice(0, insertPos) + debugCode + content.slice(insertPos)
    console.log('✅ 添加调试边界绘制调用')
  }
}

// 添加调试绘制方法
if (!content.includes('drawDebugBoundaries')) {
  const debugMethod = `

  /**
   * 🎯 调试：绘制游戏区域边界和网格
   */
  private drawDebugBoundaries(): void {
    const graphics = this.add.graphics({ lineStyle: { width: 2, color: 0xff00ff } })
    
    // 绘制游戏区域边界（亮粉色）
    graphics.strokeRect(
      this.offsetX,
      this.offsetY,
      this.gridCols * this.cellSize,
      this.gridRows * this.cellSize
    )
    
    // 绘制网格线（淡粉色）
    graphics.lineStyle(1, 0xff00ff, 0.3)
    
    // 垂直线
    for (let i = 0; i <= this.gridCols; i++) {
      const x = this.offsetX + i * this.cellSize
      graphics.moveTo(x, this.offsetY)
      graphics.lineTo(x, this.offsetY + this.gridRows * this.cellSize)
    }
    
    // 水平线
    for (let i = 0; i <= this.gridRows; i++) {
      const y = this.offsetY + i * this.cellSize
      graphics.moveTo(this.offsetX, y)
      graphics.lineTo(this.offsetX + this.gridCols * this.cellSize, y)
    }
    
    console.log('🎯 调试边界已绘制')
    console.log(`   游戏区域：${this.gridCols * this.cellSize}x${this.gridRows * this.cellSize}`)
    console.log(`   左上角：(${this.offsetX}, ${this.offsetY})`)
    console.log(`   右下角：(${this.offsetX + this.gridCols * this.cellSize}, ${this.offsetY + this.gridRows * this.cellSize})`)
  }`
  
  // 在文件末尾添加（最后一个方法之后）
  const lastMethod = content.match(/\n  \/\*\*\n   \* 基地被摧毁\n   \*\//)
  if (lastMethod && lastMethod.index !== undefined) {
    content = content.slice(0, lastMethod.index) + debugMethod + content.slice(lastMethod.index)
    console.log('✅ 添加调试绘制方法')
  }
}

// 保存修改后的文件
fs.writeFileSync(sceneFile, content, 'utf-8')

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('✨ 调试工具添加完成！')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('📋 新增功能:')
console.log('  🎯 调试边界绘制:')
console.log('    - 亮粉色边框：游戏区域边界')
console.log('    - 淡粉色网格：64x64 单元格')
console.log('    - 控制台输出精确坐标')
console.log()
console.log('  📊 使用方法:')
console.log('    1. 打开 TankGameScene.ts')
console.log('    2. 找到 Line ~156: // this.drawDebugBoundaries()')
console.log('    3. 删除注释符号 // 启用调试')
console.log('    4. 刷新浏览器查看效果')
console.log()
console.log('  🔍 调试信息:')
console.log('    - 游戏区域尺寸')
console.log('    - 左上角坐标')
console.log('    - 右下角坐标')
console.log('    - 网格对齐情况')
console.log()

console.log('📄 下一步操作:')
console.log('  1. 如需查看调试边界，取消注释')
console.log('  2. 验证坦克是否在正确位置')
console.log('  3. 检查碰撞是否准确')
console.log('  4. 确认无误后保持注释状态')
console.log()
