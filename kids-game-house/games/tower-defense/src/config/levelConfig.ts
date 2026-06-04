/**
 * 关卡配置
 * 保留原有 JavaScript 版本的所有数值和设计
 */

import type { LevelConfig } from '../types/GameConfig'

/**
 * 关卡初始配置
 */
const initial: LevelConfig['initial'] = {
  baseHealth: 3,
  numOfTurrets: 2,
  numOfEnemies: 8,
  bulletDamage: 50,
  enemyHealth: 50,
  enemySpeed: 1 / 100000
}

/**
 * 关卡递增配置（每关增加的数值）
 */
const incremental: LevelConfig['incremental'] = {
  numOfEnemies: 2,
  numOfTurrets: 1,
  enemyHealth: 50,
  enemySpeed: 5
}

/**
 * 完整的关卡配置
 */
export const levelConfig: LevelConfig = {
  initial,
  incremental
}

/**
 * 导出兼容原 JS 版本的默认对象
 */
export default {
  initial,
  incremental
}
