// Tetris 游戏快速测试脚本
// 用于验证游戏模块是否正确导入和初始化

import { initTetris } from './index'


// 验证函数签名
if (typeof initTetris === 'function') {
} else {
  console.error('❌ initTetris 不是函数')
}


