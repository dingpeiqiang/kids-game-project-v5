/**
 * 🎮 Kids Game Framework
 * 
 * 儿童游戏开发通用框架
 * 基于 Phaser 3 + Vue 3 + Pinia
 * 
 * @version 2.0.0
 * @author Sitech AI Team
 */

// ============================================================================
// 🎯 核心引擎
// ============================================================================
export { GameEngine } from './core/GameEngine'
export type { GameEngineConfig } from './core/GameEngine'

// ============================================================================
// 📦 可复用组件
// ============================================================================
export { ScreenAdapter } from './components/ScreenAdapter'
export type { AdaptParams } from './components/ScreenAdapter'

export { AudioManager } from './components/AudioManager'
export type { BgmType, AudioConfig } from './components/AudioManager'

export { GTRSLoader } from './components/GTRSLoader'
export type { GTRSLoaderConfig } from './components/GTRSLoader'

export { ItemSystem } from './components/ItemSystem'
export type { ItemSystemConfig, ItemCollectEvent } from './components/ItemSystem'

// ============================================================================
// 🎨 UI 组件
// ============================================================================
export { default as GameButton } from './components/ui/GameButton.vue'
export { default as ScorePanel } from './components/ui/ScorePanel.vue'
export { default as ThemeSelector } from './components/ui/ThemeSelector.vue'
export { default as PauseButton } from './components/ui/PauseButton.vue'
export { default as SoundToggle } from './components/ui/SoundToggle.vue'
export { default as DifficultySelector } from './components/ui/DifficultySelector.vue'

// ============================================================================
// 📄 页面级模板组件
// ============================================================================
export { default as StartView } from './components/views/StartView.vue'
export { default as GameOverView } from './components/views/GameOverView.vue'
export { default as LoadingView } from './components/views/LoadingView.vue'
export { default as GameContainer } from './components/views/GameContainer.vue'
export { default as LoadingOverlay } from './components/views/LoadingOverlay.vue'
export { default as ControlsHint } from './components/views/ControlsHint.vue'
export { default as ItemEffectsBar } from './components/views/ItemEffectsBar.vue'

// ============================================================================
// 📊 Pinia Stores
// ============================================================================
export { useGameStore } from './stores/game.store'
export type { GameEventType } from './stores/game.store'

export { useThemeStore } from './stores/theme.store'
export type { ThemeConfig, ThemeColors } from './stores/theme.store'

// ============================================================================
// 📝 类型定义
// ============================================================================
export type {
  Difficulty,
  DifficultyConfig,
  GameState,
  Position,
  Particle,
  GameEngineConfig,
  AdaptParams,
  ItemEffectsState,
  ItemEffect,
  GamePhase,
  GameEventType,
  GameEventHandler,
  GameReportRequest,
  GameReportResponse
} from './types/game.types'

export { DEFAULT_DIFFICULTY_CONFIGS, GamePhase as GamePhaseEnum } from './types/game.types'

export type {
  GTRSTheme,
  GTRSSpecMeta,
  GTRSGlobalStyle,
  GTRSImageResource,
  GTRSAudioResource,
  GTRSResources,
  ValidationResult
} from './types/gtrs.types'

// UI 类型
export type {
  ButtonVariant,
  ButtonSize,
  ButtonConfig,
  DifficultyLevel,
  DifficultyConfig,
  LoadingStep,
  LoadingState,
  GameStatus,
  GameResult,
  HUDConfig,
  ControlHint,
  ControlsConfig,
  StartViewSlots,
  GameOverViewSlots,
  GameContainerProps,
  GameContainerEmits
} from './types/ui.types'

// ============================================================================
// 🛠️ 工具函数
// ============================================================================
export { validateGTRSTheme, quickValidate, isGTRSFormat } from './utils/gtrs-validator'
export * from './utils/color-utils'
export * from './utils/math-utils'
export {
  getPlatformBaseUrl,
  getSessionToken,
  getGameId,
  isStandaloneMode,
  extractAuthFromUrl,
  verifySession,
  reportGameResult
} from './utils/platform-api'

// ============================================================================
// ⚙️ 配置常量
// ============================================================================
export * from './config/game.config'
export * from './config/default.config'
