/**
 * Canvas 2D 游戏 GTRS 通用读取（与 snake 专用 palette 并存）
 */
import type { GTRSTheme } from '../types/gtrs-theme'
import { getCachedGTRSTheme } from '../services/gtrsThemeLoader'
import { darkenHex } from './gtrsColor'
import { readGtrsSceneList, readGtrsSceneMeta } from './gtrsSceneMeta'

/** 多数竖屏 Canvas 游戏共用的样式槽位 */
export interface GtrsCanvasStyle {
  primary: string
  background: string
  backgroundDark: string
  /** 三色渐变中间停（可选，竖屏背景） */
  bgGradMid?: string
  text: string
  accent: string
  hudBg: string
  danger: string
  muted: string
  /** 玩法用色板（按钮、方块、食物等） */
  palette: string[]
}

const DEFAULT_CANVAS_STYLE: GtrsCanvasStyle = {
  primary: '#6BCB77',
  background: '#1a1a2e',
  backgroundDark: '#0f0f1a',
  text: '#FFFFFF',
  accent: '#FFD700',
  hudBg: 'rgba(0,0,0,0.45)',
  danger: '#FF4444',
  muted: '#666666',
  palette: ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCB77', '#9B59B6', '#FF9F43'],
}

export function canvasStyleFromGTRS(
  theme: GTRSTheme | undefined,
  fallback: GtrsCanvasStyle = DEFAULT_CANVAS_STYLE,
): GtrsCanvasStyle {
  if (!theme) {
    return { ...fallback, palette: [...fallback.palette], bgGradMid: fallback.bgGradMid }
  }

  const g = theme.globalStyle
  const bg = g.bgColor ?? fallback.background
  const accent = readGtrsSceneMeta(theme, 'accent') ?? g.secondaryColor ?? fallback.accent

  const primary = g.primaryColor ?? fallback.primary
  return {
    primary,
    background: bg,
    backgroundDark: readGtrsSceneMeta(theme, 'background_dark') ?? darkenHex(bg, 0.35),
    bgGradMid: readGtrsSceneMeta(theme, 'bg_grad_mid'),
    text: g.textColor ?? fallback.text,
    accent,
    hudBg: readGtrsSceneMeta(theme, 'hud_bg') ?? fallback.hudBg,
    danger: readGtrsSceneMeta(theme, 'danger') ?? fallback.danger,
    muted: readGtrsSceneMeta(theme, 'muted') ?? fallback.muted,
    palette: readGtrsSceneList(theme, 'game_palette') ?? [...fallback.palette],
  }
}

export function getGtrsCanvasStyleForGame(
  gameId: string,
  fallback?: GtrsCanvasStyle,
): GtrsCanvasStyle {
  return canvasStyleFromGTRS(getCachedGTRSTheme(gameId), fallback)
}

/** 进入 onInit 时调用；initGame 已 loadThemeGTRS，此处仅取缓存 */
export function resolveGtrsCanvasStyle(gameId: string, fallback?: GtrsCanvasStyle): GtrsCanvasStyle {
  return getGtrsCanvasStyleForGame(gameId, fallback)
}