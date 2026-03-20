/**
 * 游戏主题配置系统
 * 
 * 支持任意游戏的主题定制，包括：
 * - 颜色方案（主色、背景、强调色等）
 * - 角色外观（植物、敌人、道具等）
 * - UI 样式（按钮、面板、字体等）
 * - 音效设置
 * - 特效配置
 * 
 * 使用方式：
 * 1. 在游戏中使用 useTheme() 获取当前主题
 * 2. 通过 themeStore.switchTheme() 切换主题
 * 3. 自定义主题只需修改配置文件的 customTheme
 */

// ==================== 主题基础类型 ====================

export interface ThemeColors {
  primary: string        // 主色
  secondary: string     // 辅助色
  background: string    // 背景色
  surface: string       // 表面色（卡片、面板）
  text: string          // 主文字
  textSecondary: string // 次要文字
  accent: string        // 强调色
  success: string       // 成功色
  warning: string       // 警告色
  error: string         // 错误色
}

export interface ThemeEffects {
  shadow: string        // 阴影
  glow: string          // 发光效果
  border: string        // 边框
  borderRadius: string  // 圆角
}

export interface ThemeAsset {
  type: 'emoji' | 'image' | 'color'
  value: string         // emoji 字符 / 图片路径 / 颜色值
  imagePath?: string   // 自定义图片路径
}

export interface ThemeAssets {
  // 游戏元素
  player?: ThemeAsset              // 玩家角色
  enemy?: ThemeAsset               // 敌人
  teammate?: ThemeAsset            // 队友（多人游戏）
  projectile?: ThemeAsset          // 子弹/投射物
  powerup?: ThemeAsset             // 道具
  obstacle?: ThemeAsset            // 障碍物
  
  // 环境元素
  background?: ThemeAsset          // 背景
  ground?: ThemeAsset              // 地面
  platform?: ThemeAsset            // 平台
  decoration?: ThemeAsset          // 装饰
}

export interface ThemeSound {
  enabled: boolean
  volume: number        // 0-1
}

export interface ThemeSounds {
  bgm: ThemeSound
  shoot: ThemeSound
  hit: ThemeSound
  collect: ThemeSound
  victory: ThemeSound
  defeat: ThemeSound
  ui: ThemeSound
}

export interface ThemeConfig {
  id: string
  name: string
  description: string
  colors: ThemeColors
  effects: ThemeEffects
  assets: ThemeAssets
  sounds: ThemeSounds
  // 游戏特定配置（可选扩展）
  gameSpecific?: Record<string, any>
}

// ==================== 预设主题 ====================

// 经典植物大战僵尸主题
const classicTheme: ThemeConfig = {
  id: 'classic',
  name: '经典植物大战僵尸',
  description: '原版植物大战僵尸风格',
  colors: {
    primary: '#2d5a3d',
    secondary: '#1a472a',
    background: '#1a472a',
    surface: '#2d5a3d',
    text: '#ffffff',
    textSecondary: '#a0d8a0',
    accent: '#fbbf24',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  effects: {
    shadow: '0 4px 6px rgba(0,0,0,0.3)',
    glow: '0 0 10px rgba(251,191,36,0.5)',
    border: '2px solid #4a7c59',
    borderRadius: '8px'
  },
  assets: {
    player: { type: 'emoji', value: '🌻' },
    enemy: { type: 'emoji', value: '🧟' },
    projectile: { type: 'emoji', value: '🟢' },
    background: { type: 'color', value: '#1a472a' },
    ground: { type: 'color', value: '#2d5a3d' }
  },
  sounds: {
    bgm: { enabled: true, volume: 0.15 },
    shoot: { enabled: true, volume: 0.1 },
    hit: { enabled: true, volume: 0.1 },
    collect: { enabled: true, volume: 0.15 },
    victory: { enabled: true, volume: 0.2 },
    defeat: { enabled: true, volume: 0.2 },
    ui: { enabled: true, volume: 0.1 }
  }
}

// 糖果主题
const candyTheme: ThemeConfig = {
  id: 'candy',
  name: '糖果乐园',
  description: '甜美可爱的糖果风格',
  colors: {
    primary: '#ff69b4',
    secondary: '#ffb6c1',
    background: '#ffe4e9',
    surface: '#ffffff',
    text: '#8b4557',
    textSecondary: '#c9788e',
    accent: '#ffd700',
    success: '#98fb98',
    warning: '#ffa500',
    error: '#ff6b6b'
  },
  effects: {
    shadow: '0 4px 15px rgba(255,105,180,0.3)',
    glow: '0 0 15px rgba(255,182,193,0.6)',
    border: '2px solid #ffb6c1',
    borderRadius: '16px'
  },
  assets: {
    player: { type: 'emoji', value: '🍬' },
    enemy: { type: 'emoji', value: '👾' },
    projectile: { type: 'emoji', value: '⭐' },
    background: { type: 'color', value: '#ffe4e9' },
    ground: { type: 'color', value: '#ffb6c1' }
  },
  sounds: {
    bgm: { enabled: true, volume: 0.12 },
    shoot: { enabled: true, volume: 0.08 },
    hit: { enabled: true, volume: 0.08 },
    collect: { enabled: true, volume: 0.12 },
    victory: { enabled: true, volume: 0.15 },
    defeat: { enabled: true, volume: 0.15 },
    ui: { enabled: true, volume: 0.08 }
  }
}

// 太空主题
const spaceTheme: ThemeConfig = {
  id: 'space',
  name: '太空探索',
  description: '未来科技太空风格',
  colors: {
    primary: '#1e3a5f',
    secondary: '#0d1b2a',
    background: '#0b0d17',
    surface: '#1e3a5f',
    text: '#e0e7ff',
    textSecondary: '#818cf8',
    accent: '#22d3ee',
    success: '#34d399',
    warning: '#fbbf24',
    error: '#f87171'
  },
  effects: {
    shadow: '0 0 20px rgba(34,211,238,0.4)',
    glow: '0 0 25px rgba(129,140,248,0.5)',
    border: '2px solid #22d3ee',
    borderRadius: '4px'
  },
  assets: {
    player: { type: 'emoji', value: '🚀' },
    enemy: { type: 'emoji', value: '👽' },
    projectile: { type: 'emoji', value: '💫' },
    background: { type: 'color', value: '#0b0d17' },
    ground: { type: 'color', value: '#1e3a5f' }
  },
  sounds: {
    bgm: { enabled: true, volume: 0.1 },
    shoot: { enabled: true, volume: 0.12 },
    hit: { enabled: true, volume: 0.1 },
    collect: { enabled: true, volume: 0.1 },
    victory: { enabled: true, volume: 0.18 },
    defeat: { enabled: true, volume: 0.18 },
    ui: { enabled: true, volume: 0.08 }
  }
}

// 海洋主题
const oceanTheme: ThemeConfig = {
  id: 'ocean',
  name: '海洋世界',
  description: '海底世界风格',
  colors: {
    primary: '#0ea5e9',
    secondary: '#0369a1',
    background: '#0c4a6e',
    surface: '#164e63',
    text: '#e0f2fe',
    textSecondary: '#7dd3fc',
    accent: '#fbbf24',
    success: '#22d3ee',
    warning: '#fbbf24',
    error: '#f87171'
  },
  effects: {
    shadow: '0 4px 12px rgba(14,165,233,0.4)',
    glow: '0 0 15px rgba(34,211,238,0.5)',
    border: '2px solid #0ea5e9',
    borderRadius: '12px'
  },
  assets: {
    player: { type: 'emoji', value: '🐠' },
    enemy: { type: 'emoji', value: '🦈' },
    projectile: { type: 'emoji', value: '🫧' },
    background: { type: 'color', value: '#0c4a6e' },
    ground: { type: 'color', value: '#164e63' }
  },
  sounds: {
    bgm: { enabled: true, volume: 0.12 },
    shoot: { enabled: true, volume: 0.08 },
    hit: { enabled: true, volume: 0.08 },
    collect: { enabled: true, volume: 0.12 },
    victory: { enabled: true, volume: 0.15 },
    defeat: { enabled: true, volume: 0.15 },
    ui: { enabled: true, volume: 0.08 }
  }
}

// 暗黑主题
const darkTheme: ThemeConfig = {
  id: 'dark',
  name: '暗黑之地',
  description: '黑暗神秘风格',
  colors: {
    primary: '#4a044e',
    secondary: '#2e1065',
    background: '#0f0216',
    surface: '#1e1b4b',
    text: '#e9d5ff',
    textSecondary: '#c4b5fd',
    accent: '#a855f7',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444'
  },
  effects: {
    shadow: '0 0 30px rgba(168,85,247,0.5)',
    glow: '0 0 20px rgba(196,181,253,0.6)',
    border: '2px solid #a855f7',
    borderRadius: '8px'
  },
  assets: {
    player: { type: 'emoji', value: '🦇' },
    enemy: { type: 'emoji', value: '👻' },
    projectile: { type: 'emoji', value: '🔮' },
    background: { type: 'color', value: '#0f0216' },
    ground: { type: 'color', value: '#2e1065' }
  },
  sounds: {
    bgm: { enabled: true, volume: 0.1 },
    shoot: { enabled: true, volume: 0.1 },
    hit: { enabled: true, volume: 0.12 },
    collect: { enabled: true, volume: 0.1 },
    victory: { enabled: true, volume: 0.18 },
    defeat: { enabled: true, volume: 0.2 },
    ui: { enabled: true, volume: 0.08 }
  }
}

// ==================== 导出 ====================

export const PRESET_THEMES: ThemeConfig[] = [
  classicTheme,
  candyTheme,
  spaceTheme,
  oceanTheme,
  darkTheme
]

export const DEFAULT_THEME = classicTheme

// 获取主题列表（用于UI显示）
export function getThemeList(): Array<{id: string, name: string, description: string, colors: ThemeColors}> {
  return PRESET_THEMES.map(theme => ({
    id: theme.id,
    name: theme.name,
    description: theme.description,
    colors: theme.colors
  }))
}

// 根据ID获取主题
export function getThemeById(id: string): ThemeConfig {
  return PRESET_THEMES.find(t => t.id === id) || DEFAULT_THEME
}

// ==================== 游戏适配器 ====================

// 植物大战僵尸特定的主题适配
export interface PvZThemeAssets {
  plants: Record<string, ThemeAsset>
  zombies: Record<string, ThemeAsset>
  projectile: ThemeAsset
  sun: ThemeAsset
  background: ThemeAsset
  lawn: ThemeAsset
}

// 默认植物大战僵尸资源
export const PVZ_DEFAULT_ASSETS: PvZThemeAssets = {
  plants: {
    sunflower: { type: 'emoji', value: '🌻' },
    peashooter: { type: 'emoji', value: '🌱' },
    wallnut: { type: 'emoji', value: '🥔' },
    cherrybomb: { type: 'emoji', value: '🍒' },
    snowpea: { type: 'emoji', value: '❄️' }
  },
  zombies: {
    normal: { type: 'emoji', value: '🧟' },
    cone: { type: 'emoji', value: '🧟' },
    bucket: { type: 'emoji', value: '🧟' },
    imp: { type: 'emoji', value: '👶' }
  },
  projectile: { type: 'emoji', value: '🟢' },
  sun: { type: 'emoji', value: '☀️' },
  background: { type: 'color', value: '#1a472a' },
  lawn: { type: 'color', value: '#2d5a3d' }
}

// 为主题扩展植物大战僵尸资源
export function extendPvZTheme(baseTheme: ThemeConfig): ThemeConfig {
  return {
    ...baseTheme,
    assets: {
      ...baseTheme.assets,
      ...PVZ_DEFAULT_ASSETS
    },
    gameSpecific: {
      ...baseTheme.gameSpecific,
      pvz: PVZ_DEFAULT_ASSETS
    }
  }
}
