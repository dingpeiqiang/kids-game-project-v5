// ============================================================================
// ⭐ 坦克大战 - 星级评价系统
// ============================================================================
//
// 📌 说明:
//   计算玩家通关后的星级评价，支持多种评价维度
// ============================================================================

import { IStarCriterion, ILevelConfig, ITankLevelParams } from '../types/level-types'

/**
 * ⭐ 星级评价系统
 */
export class StarRatingSystem {
  /**
   * ⭐ 计算星级评价
   */
  static calculateRating(
    levelConfig: ILevelConfig<ITankLevelParams>,
    result: {
      score: number
      completionRate: number
      timeUsed: number
      baseAlive: boolean
      playerDeaths: number
      maxCombo: number
    }
  ): 0 | 1 | 2 | 3 {
    const starCriteria = levelConfig.starCriteria || []

    if (starCriteria.length === 0) {
      return result.score >= 500 ? 1 : 0
    }

    // 从高到低排序：3星 → 2星 → 1星
    const sortedCriteria = [...starCriteria].sort((a, b) => b.stars - a.stars)

    for (const criterion of sortedCriteria) {
      if (this.evaluateCriterion(criterion, result)) {
        return criterion.stars
      }
    }

    return 0
  }

  /**
   * ⭐ 评估单个星级标准
   */
  private static evaluateCriterion(
    criterion: IStarCriterion,
    result: {
      score: number
      completionRate: number
      timeUsed: number
      baseAlive: boolean
      playerDeaths: number
      maxCombo: number
    }
  ): boolean {
    // 分数阈值检查
    if (criterion.scoreThreshold && result.score < criterion.scoreThreshold) {
      return false
    }

    // 完成度阈值检查
    if (criterion.completionThreshold && result.completionRate < criterion.completionThreshold) {
      return false
    }

    // 时间奖励阈值检查
    if (criterion.timeBonusThreshold) {
      const timeRemaining = 360 - result.timeUsed // 假设最长360秒
      if (timeRemaining < criterion.timeBonusThreshold) {
        return false
      }
    }

    // 特殊条件检查（如果有）
    if (criterion.specialCondition) {
      switch (criterion.specialCondition) {
        case 'no_deaths':
          if (result.playerDeaths > 0) return false
          break
        case 'perfect_defense':
          if (!result.baseAlive) return false
          break
        case 'max_combo':
          // 已有 maxCombo 记录
          break
      }
    }

    return true
  }

  /**
   * ⭐ 获取评级详情
   */
  static getRatingDetails(
    levelConfig: ILevelConfig<ITankLevelParams>,
    result: {
      score: number
      completionRate: number
      timeUsed: number
      baseAlive: boolean
      playerDeaths: number
      maxCombo: number
    }
  ): {
    stars: 0 | 1 | 2 | 3
    achievedCriteria: string[]
    failedCriteria: string[]
    nextStarRequirements: Record<string, number> | null
  } {
    const starCriteria = levelConfig.starCriteria || []
    const currentStars = this.calculateRating(levelConfig, result)

    const achievedCriteria: string[] = []
    const failedCriteria: string[] = []
    const nextStarRequirements: Record<string, number> | null = {}

    for (const criterion of starCriteria) {
      if (this.evaluateCriterion(criterion, result)) {
        achievedCriteria.push(`⭐${criterion.stars}星: 通过`)
      } else {
        failedCriteria.push(`⭐${criterion.stars}星: 未达成`)

        if (criterion.scoreThreshold) {
          nextStarRequirements[`需要分数`] = criterion.scoreThreshold - result.score
        }
      }
    }

    return {
      stars: currentStars,
      achievedCriteria,
      failedCriteria,
      nextStarRequirements: Object.keys(nextStarRequirements).length > 0 ? nextStarRequirements : null
    }
  }
}