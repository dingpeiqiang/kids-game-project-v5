/**
 * ⚙️ 默认配置常量
 */

import { DIFFICULTY_CONFIGS, DEFAULT_GAME_CONFIG, AUDIO_CONFIG, THEME_MODE_CONFIG } from './game.config'

// ============================================================================
// 🎯 导出所有配置（方便统一访问）
// ============================================================================

export const DEFAULT_CONFIG = {
  // 游戏配置
  game: DEFAULT_GAME_CONFIG,
  
  // 难度配置
  difficulty: DIFFICULTY_CONFIGS,
  
  // 音频配置
  audio: AUDIO_CONFIG,
  
  // 主题模式配置
  themeMode: THEME_MODE_CONFIG
} as const

// ============================================================================
// 📝 配置说明
// ============================================================================

/**
 * 框架设计理念：
 * 1. 提供合理的默认值
 * 2. 支持通过配置对象自定义
 * 3. 所有配置都是类型安全的
 * 
 * 使用示例：
 * ```typescript
 * import { DEFAULT_CONFIG } from '@kids-game/framework/config'
 * 
 * console.log(DEFAULT_CONFIG.game.cellSize) // 50
 * console.log(DEFAULT_CONFIG.audio.defaultBgmVolume) // 0.6
 * ```
 */
