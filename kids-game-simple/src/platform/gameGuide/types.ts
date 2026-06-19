import type { Component } from 'vue'
import type { GameGuide } from '../../types'

/** 各游戏在玩法目录内实现的引导模块 */
export interface GameGuideModule {
  /** 结构化引导数据（默认壳层展示） */
  guide: GameGuide
  /**
   * 可选：自定义介绍页组件；未提供时使用平台默认 `GameGuideDefaultPanel`
   */
  GuidePage?: Component
}

export type GameGuideLoader = () => Promise<GameGuideModule>