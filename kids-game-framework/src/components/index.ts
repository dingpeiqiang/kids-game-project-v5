/**
 * 📦 组件模块统一导出
 */

// 屏幕适配
export { ScreenAdapter } from './ScreenAdapter'
export type { AdaptParams } from './ScreenAdapter'

// 音频
export { AudioManager } from './AudioManager'
export type { BgmType, AudioConfig } from './AudioManager'

// 资源加载
export { GTRSLoader } from './GTRSLoader'
export type { GTRSLoaderConfig } from './GTRSLoader'

// 道具系统
export { ItemManager } from './ItemManager'
export type { ItemType, GameItem, ItemEffect } from './ItemManager'

export { ItemSystem } from './ItemSystem'
export type { ItemSystemConfig } from './ItemSystem'

// 粒子系统
export { ParticleSystem } from './ParticleSystem'
export type { ParticleConfig } from './ParticleSystem'

// 动画系统
export { AnimationSystem } from './AnimationSystem'
export type { FrameAnimationConfig, TweenConfig } from './AnimationSystem'

// 存档系统
export { SaveSystem } from './SaveSystem'
export type { SaveData, GameSave } from './SaveSystem'

// 排行榜
export { LeaderboardSystem } from './LeaderboardSystem'
export type { LeaderboardEntry, LeaderboardConfig } from './LeaderboardSystem'

// 教学系统
export { TutorialSystem } from './TutorialSystem'
export type { TutorialStep, TutorialConfig } from './TutorialSystem'

// 成就系统
export { AchievementSystem } from './AchievementSystem'
export type { Achievement, AchievementProgress, AchievementUnlockedEvent } from './AchievementSystem'
