import type { GTRSTheme } from '../types/gtrs-theme'
import { getCachedGTRSTheme } from '../services/gtrsThemeLoader'
import { darkenHex } from './gtrsColor'
import { readGtrsSceneList, readGtrsSceneMeta } from './gtrsSceneMeta'

/** Canvas 2D 游戏常用调色板（从 GTRS globalStyle + scene 元数据推导） */
export interface CanvasGamePalette {
  primary: string
  secondary: string
  background: string
  backgroundDark: string
  text: string
  accent: string
  grid: string
  border: string
  snakeHead: [string, string]
  snakeBody: string
  foodColors: string[]
  bonusColor: string
  speedColor: string
  star: string
}

const DEFAULT_PALETTE: CanvasGamePalette = {
  primary: '#2ECC71',
  secondary: '#6BCB77',
  background: '#0d2818',
  backgroundDark: '#061208',
  text: '#FFFFFF',
  accent: '#FFD700',
  grid: 'rgba(46, 204, 113, 0.08)',
  border: 'rgba(46, 204, 113, 0.3)',
  snakeHead: ['#6BCB77', '#27AE60'],
  snakeBody: '#2ECC71',
  foodColors: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4ECDC4', '#FF8E53', '#DDA0DD', '#87CEEB', '#FF69B4'],
  bonusColor: '#FFD700',
  speedColor: '#00E5FF',
  star: '#A8E6CF',
}

export function paletteFromGTRS(theme: GTRSTheme | undefined, fallback = DEFAULT_PALETTE): CanvasGamePalette {
  if (!theme) return { ...fallback }

  const g = theme.globalStyle
  const primary = g.primaryColor ?? fallback.primary
  const secondary = g.secondaryColor ?? fallback.secondary
  const bg = g.bgColor ?? fallback.background

  const head0 = readGtrsSceneMeta(theme, 'snake_head_light') ?? secondary
  const head1 = readGtrsSceneMeta(theme, 'snake_head_dark') ?? darkenHex(primary, 0.15)
  const body = readGtrsSceneMeta(theme, 'snake_body') ?? primary

  return {
    primary,
    secondary,
    background: bg,
    backgroundDark: darkenHex(bg, 0.35),
    text: g.textColor ?? fallback.text,
    accent: readGtrsSceneMeta(theme, 'accent') ?? g.secondaryColor ?? fallback.accent,
    grid: readGtrsSceneMeta(theme, 'grid') ?? fallback.grid,
    border: readGtrsSceneMeta(theme, 'border') ?? fallback.border,
    snakeHead: [head0, head1],
    snakeBody: body,
    foodColors: readGtrsSceneList(theme, 'food_palette') ?? fallback.foodColors,
    bonusColor: readGtrsSceneMeta(theme, 'food_bonus') ?? fallback.bonusColor,
    speedColor: readGtrsSceneMeta(theme, 'food_speed') ?? fallback.speedColor,
    star: readGtrsSceneMeta(theme, 'star') ?? fallback.star,
  }
}

export function getCanvasPaletteForGame(gameId: string): CanvasGamePalette {
  return paletteFromGTRS(getCachedGTRSTheme(gameId))
}

/** 将 GTRS 全局样式写到 document（大厅 / UI 壳） */
export function applyGlobalStyleToDocument(theme: GTRSTheme): void {
  const root = document.documentElement
  const g = theme.globalStyle
  if (g.primaryColor) root.style.setProperty('--gtrs-primary', g.primaryColor)
  if (g.secondaryColor) root.style.setProperty('--gtrs-secondary', g.secondaryColor)
  if (g.bgColor) root.style.setProperty('--gtrs-bg', g.bgColor)
  if (g.textColor) root.style.setProperty('--gtrs-text', g.textColor)
  if (g.fontFamily) root.style.setProperty('--gtrs-font', g.fontFamily)
}

export function applyCachedThemeToDocument(gameId: string): void {
  const theme = getCachedGTRSTheme(gameId)
  if (theme) applyGlobalStyleToDocument(theme)
}