/**
 * ⚙️ 框架默认配置
 */

import type { GameEngineConfig } from '../types/game.types'

/** 默认游戏引擎配置（竖屏手游） */
export const DEFAULT_ENGINE_CONFIG: Required<GameEngineConfig> = {
  designWidth:  720,
  designHeight: 1280,
  gridCols:     32,
  gridRows:     18,
  baseCellSize: 50
}

/** 横屏游戏配置模板 */
export const LANDSCAPE_ENGINE_CONFIG: Required<GameEngineConfig> = {
  designWidth:  1280,
  designHeight: 720,
  gridCols:     20,
  gridRows:     12,
  baseCellSize: 60
}

/** 正方形游戏区域配置模板 */
export const SQUARE_ENGINE_CONFIG: Required<GameEngineConfig> = {
  designWidth:  800,
  designHeight: 800,
  gridCols:     20,
  gridRows:     20,
  baseCellSize: 40
}
