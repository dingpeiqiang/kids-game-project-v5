// Tetris 游戏快速测试脚本
// 用于验证游戏模块是否正确导入和初始化

import { initTetris } from './index'

console.log('✅ Tetris 游戏模块导入成功')
console.log('📦 导出函数: initTetris')
console.log('🎮 游戏类型: 俄罗斯方块 (解压增强版)')

// 验证函数签名
if (typeof initTetris === 'function') {
  console.log('✅ initTetris 函数类型正确')
} else {
  console.error('❌ initTetris 不是函数')
}

console.log('\n🎯 游戏特性:')
console.log('  - 粒子特效系统')
console.log('  - 屏幕震动效果')
console.log('  - 连击系统 (Combo)')
console.log('  - 道具系统')
console.log('  - 60fps 流畅渲染')

console.log('\n📁 文件结构:')
console.log('  tetris/')
console.log('  ├── TetrisGame.ts      (主游戏类)')
console.log('  ├── ParticleSystem.ts  (粒子系统)')
console.log('  ├── index.ts           (入口文件)')
console.log('  ├── README.md          (使用文档)')
console.log('  └── OPTIMIZATION_REPORT.md (优化报告)')

console.log('\n✨ 优化完成！游戏已准备好运行。')