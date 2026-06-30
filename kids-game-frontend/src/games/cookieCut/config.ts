/**
 * 切饼干游戏 - 配置常量
 */

import type { CookieTemplate, GameConfig } from './types'

// 饼干模板配置
export const COOKIES: CookieTemplate[] = [
  { shape: 'star', emoji: '⭐', color: '#FFD700' },
  { shape: 'heart', emoji: '❤️', color: '#FF6B6B' },
  { shape: 'circle', emoji: '🍪', color: '#D2691E' },
  { shape: 'moon', emoji: '🌙', color: '#F0E68C' },
  { shape: 'flower', emoji: '🌸', color: '#FF69B4' },
]

// 道具图标映射
export const POWERUP_ICONS: Record<string, string> = {
  'slow': '🐌',       // 减速 - 饼干速度减半
  'score2x': '✨',    // 双倍分数 - 10秒内×2
  'freeze': '❄️',     // 冻结 - 暂停所有饼干3秒
  'magnet': '🧲'      // 磁铁 - 自动吸引附近饼干
}

// 游戏配置（解压版 - 快节奏爽快感）
export const GAME_CONFIG: GameConfig = {
  canvasWidth: 400,
  canvasHeight: 600,
  gameDuration: 60000, // 60秒
  spawnInterval: 600, // 每0.6秒生成一个饼干（更快）
  maxCookies: 8, // 最多8个饼干同时存在（更多）
  cookieSizeMin: 45,
  cookieSizeMax: 75,
  baseVerticalSpeed: 4.5,      // 基础垂直速度（更快）
  verticalSpeedRange: 3,     // 垂直速度随机范围
  baseHorizontalSpeed: 2.5,  // 基础水平速度（更快）
  rotationSpeed: 0.15,       // 旋转速度（更带感）
}

// 粒子颜色
export const PARTICLE_COLORS = ['#D2691E', '#FFD700', '#F4A460', '#8B4513']
