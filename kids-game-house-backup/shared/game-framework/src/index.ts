/**
 * Kids Game Framework
 * 儿童游戏通用框架 - 统一导出
 */

// 类型定义
export * from './types/game.types'

// 核心 Store
export { useGameStore } from './stores/game.store'

// 工具函数
export {
  getSessionToken,
  getGameId,
  verifySession,
  reportGameResult,
  isStandaloneMode
} from './utils/platformApi'
export { default as platformApi } from './utils/platformApi'

// 应用初始化
export { initGame } from './utils/initGame'

// 配置常量
export { GAME_CODE, GAME_ID_MAP, DIFFICULTY_CONFIGS, DEFAULT_GAME_CONFIG } from './config/game.config'
