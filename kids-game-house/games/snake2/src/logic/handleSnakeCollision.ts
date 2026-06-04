// ============================================================================
// ⚔️ 贪吃蛇碰撞响应规则 - Snake2 专属
// ============================================================================
// 
// 📌 说明:
//   定义贪吃蛇游戏的碰撞响应规则
//   基于「实体类型组合」执行对应的游戏逻辑
// ============================================================================

import type { BaseEntity } from '../components/game/entities/BaseEntity'
import type { SnakeHead } from '../components/game/entities/SnakeHead'
import type { Food } from '../components/game/entities/Food'
import type { SnakeBody } from '../components/game/entities/SnakeBody'
import type { Obstacle } from '../components/game/entities/Obstacle'

/**
 * ⭐ 贪吃蛇碰撞响应规则
 * 
 * @remarks
 * 基于「实体类型组合」执行对应的游戏逻辑：
 * - 蛇头撞墙 → 游戏结束
 * - 蛇头撞蛇身 → 游戏结束
 * - 蛇头吃食物 → 增长 + 加分 + 应用特效
 * 
 * @param a - 实体 A
 * @param b - 实体 B
 */
export function handleSnakeCollision(a: BaseEntity, b: BaseEntity): void {
  // === 规则 1: 蛇头撞障碍物（墙/边界） → 游戏结束 ===
  if (a.type === 'snakeHead' && b.type === 'obstacle') {
    handleHeadHitObstacle(a as SnakeHead, b as Obstacle)
    return
  }
  
  // === 规则 2: 蛇头撞蛇身 → 游戏结束 ===
  if (a.type === 'snakeHead' && b.type === 'snakeBody') {
    handleHeadHitBody(a as SnakeHead, b as SnakeBody)
    return
  }
  
  // === 规则 3: 蛇头吃食物 → 增长 + 加分 + 应用特效 ===
  if (a.type === 'snakeHead' && b.type === 'food') {
    handleEatFood(a as SnakeHead, b as Food)
    return
  }
  
  // === 其他情况：无需处理 ===
  // 例如：蛇身撞食物（无效果）、障碍物撞食物（无效果）等
}

/**
 * 处理蛇头撞击障碍物
 * 
 * @param head - 蛇头
 * @param obstacle - 障碍物
 */
function handleHeadHitObstacle(head: SnakeHead, obstacle: Obstacle): void {
  // 如果蛇头处于无敌状态，则不死亡
  if (head.invincible) {
    // TODO: 可以添加穿墙效果或音效
    return
  }
  
  // 蛇头死亡
  head.die()
  
  // 触发游戏结束事件
  // TODO: 通过 EventBus 或回调通知游戏管理器
  console.log('💥 [Collision] 蛇头撞墙，游戏结束')
  
  // TODO: 调用游戏结束逻辑
  // gameOver()
}

/**
 * 处理蛇头撞击蛇身
 * 
 * @param head - 蛇头
 * @param body - 蛇身
 */
function handleHeadHitBody(head: SnakeHead, body: SnakeBody): void {
  // 如果蛇头处于无敌状态，则不死亡
  if (head.invincible) {
    // TODO: 可以添加特殊效果
    return
  }
  
  // 蛇头死亡
  head.die()
  
  // 触发游戏结束事件
  console.log('💥 [Collision] 蛇头撞蛇身，游戏结束')
  
  // TODO: 调用游戏结束逻辑
  // gameOver()
}

/**
 * 处理蛇头吃食物
 * 
 * @param head - 蛇头
 * @param food - 食物
 */
function handleEatFood(head: SnakeHead, food: Food): void {
  // === Step 1: 增加分数 ===
  addScore(food.score)
  
  // === Step 2: 增长蛇身 ===
  if (food.growsSnake) {
    growSnake(food.lengthIncrease || 1)
  }
  
  // === Step 3: 应用特效（如果有）===
  if (food.hasEffect && food.effectType) {
    applyFoodEffect(food.effectType, food.effectValue, food.effectDuration)
  }
  
  // === Step 4: 销毁食物（回收到对象池）===
  food.destroy()  // 自动触发 onRelease，回收到对象池
  
  // === Step 5: 生成新食物 ===
  spawnNewFood()
  
  // === Step 6: 触发事件和反馈 ===
  console.log(`🍎 [Collision] 吃到食物：类型=${food.foodType}, 分数=${food.score}`)
  
  // TODO: 播放音效、粒子效果等
}

/**
 * 增加分数
 * 
 * @param points - 增加的分数
 */
function addScore(points: number): void {
  // TODO: 从 Store 或游戏管理器获取当前分数并更新
  console.log(`➕ 增加分数：+${points}`)
  
  // 示例：使用 Store
  // const gameStore = useGameStore()
  // gameStore.addScore(points)
}

/**
 * 增长蛇身
 * 
 * @param count - 增长的节数
 */
function growSnake(count: number): void {
  // TODO: 通知蛇管理器增加蛇身节数
  console.log(`🐍 增长蛇身：+${count}节`)
  
  // 示例：通过 EventBus 发送事件
  // EventBus.emit('snake:grow', count)
}

/**
 * 应用食物特效
 * 
 * @param type - 特效类型
 * @param value - 特效值
 * @param duration - 持续时间（毫秒）
 */
function applyFoodEffect(
  type: 'speed_change' | 'invincibility',
  value?: number,
  duration?: number
): void {
  console.log(`⚡ 应用特效：类型=${type}, 值=${value}, 时长=${duration}ms`)
  
  switch (type) {
    case 'speed_change':
      // 改变速度
      // TODO: 修改蛇的速度属性
      console.log(`  → 速度变为原来的 ${value} 倍，持续 ${duration}ms`)
      break
    
    case 'invincibility':
      // 无敌效果
      // TODO: 设置蛇的无敌状态
      console.log(`  → 无敌状态，持续 ${duration}ms`)
      break
  }
  
  // TODO: 在 Store 中添加 Buff 状态
  // const gameStore = useGameStore()
  // gameStore.applyItemEffect({ type, value, duration })
}

/**
 * 生成新食物
 */
function spawnNewFood(): void {
  // TODO: 通知食物生成器生成新食物
  console.log('🔄 生成新食物')
  
  // 示例：通过 EventBus 发送事件
  // EventBus.emit('food:spawn')
}
