// 主入口文件
import { FruitSliceGame } from './game'

// 初始化游戏
window.addEventListener('load', () => {
  console.log('🍉 Fruit Slice Game Starting...')
  const game = new FruitSliceGame('mainGameCanvas')
})
