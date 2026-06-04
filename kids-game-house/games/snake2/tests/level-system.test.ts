/**
 * 🧪 贪吃蛇关卡系统 - 集成测试
 * 
 * @description
 * 测试关卡配置加载、解析和流程执行
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { SnakeLevelLoader } from '../src/utils/SnakeLevelLoader'
import type { SnakeLevelConfig } from '../src/types/snake-level.types'

describe('关卡系统', () => {
  describe('SnakeLevelLoader', () => {
    it('应该成功加载第 1 关配置', async () => {
      const config = await SnakeLevelLoader.loadFromJSON('snake_level_1')
      
      expect(config).toBeDefined()
      expect(config.info.id).toBe('snake_level_1')
      expect(config.info.name).toBe('初出茅庐')
      expect(config.info.difficulty).toBe('easy')
    })

    it('应该成功加载第 2 关配置', async () => {
      const config = await SnakeLevelLoader.loadFromJSON('snake_level_2')
      
      expect(config).toBeDefined()
      expect(config.info.id).toBe('snake_level_2')
      expect(config.info.name).toBe('沙漠迷宫')
      expect(config.info.difficulty).toBe('normal')
    })

    it('应该成功加载第 3 关配置', async () => {
      const config = await SnakeLevelLoader.loadFromJSON('snake_level_3')
      
      expect(config).toBeDefined()
      expect(config.info.id).toBe('snake_level_3')
      expect(config.info.name).toBe('冰雪世界')
      expect(config.info.difficulty).toBe('hard')
    })

    it('应该批量加载多个关卡', async () => {
      const levels = await SnakeLevelLoader.loadMultiple([
        'snake_level_1',
        'snake_level_2',
        'snake_level_3'
      ])
      
      expect(levels.length).toBe(3)
      expect(levels[0].info.id).toBe('snake_level_1')
      expect(levels[1].info.id).toBe('snake_level_2')
      expect(levels[2].info.id).toBe('snake_level_3')
    })
  })

  describe('关卡配置结构', () => {
    let config: SnakeLevelConfig

    beforeAll(async () => {
      config = await SnakeLevelLoader.loadFromJSON('snake_level_1')
    })

    it('应该包含完整的信息字段', () => {
      expect(config.info).toBeDefined()
      expect(config.info.id).toBeDefined()
      expect(config.info.name).toBeDefined()
      expect(config.info.description).toBeDefined()
      expect(config.info.difficulty).toBeDefined()
      expect(config.info.minPlayerLevel).toBeDefined()
      expect(config.info.unlocked).toBeDefined()
    })

    it('应该包含目标列表', () => {
      expect(config.objectives).toBeDefined()
      expect(Array.isArray(config.objectives)).toBe(true)
      expect(config.objectives.length).toBeGreaterThan(0)
      
      // 检查目标结构
      const firstObjective = config.objectives[0]
      expect(firstObjective.type).toBeDefined()
      expect(firstObjective.targetValue).toBeDefined()
    })

    it('应该包含关卡参数', () => {
      expect(config.params).toBeDefined()
      expect(typeof config.params.gridSize).toBe('number')
      expect(typeof config.params.speed).toBe('number')
      expect(typeof config.params.initialLength).toBe('number')
    })

    it('应该包含胜利条件', () => {
      expect(config.victoryCondition).toBeDefined()
      expect(config.victoryCondition.type).toBeDefined()
      expect(config.victoryCondition.requiredObjectives).toBeDefined()
    })

    it('应该包含资源配置', () => {
      expect(config.resources).toBeDefined()
      expect(Array.isArray(config.resources?.backgrounds)).toBe(true)
      expect(Array.isArray(config.resources?.sprites)).toBe(true)
      expect(Array.isArray(config.resources?.musicTracks)).toBe(true)
    })

    it('应该包含时间限制（可选）', () => {
      // 第 1 关有时间限制
      expect(config.timeLimit).toBeDefined()
      expect(typeof config.timeLimit).toBe('number')
    })

    it('应该包含星级评价标准（可选）', () => {
      // 检查是否有星级标准
      if (config.starCriteria) {
        expect(Array.isArray(config.starCriteria)).toBe(true)
        expect(config.starCriteria.length).toBeGreaterThan(0)
      }
    })

    it('应该包含基础奖励（可选）', () => {
      if (config.baseRewards) {
        expect(config.baseRewards.gold).toBeDefined()
        expect(config.baseRewards.exp).toBeDefined()
      }
    })
  })

  describe('关卡难度递进', () => {
    it('第 2 关应该比第 1 关更难', async () => {
      const level1 = await SnakeLevelLoader.loadFromJSON('snake_level_1')
      const level2 = await SnakeLevelLoader.loadFromJSON('snake_level_2')
      
      // 速度应该更快
      expect(level2.params.speed).toBeGreaterThan(level1.params.speed)
      
      // 障碍物应该更多
      expect(level2.params.obstacleCount).toBeGreaterThan(level1.params.obstacleCount)
    })

    it('第 3 关应该比第 2 关更难', async () => {
      const level2 = await SnakeLevelLoader.loadFromJSON('snake_level_2')
      const level3 = await SnakeLevelLoader.loadFromJSON('snake_level_3')
      
      // 速度应该更快
      expect(level3.params.speed).toBeGreaterThan(level2.params.speed)
      
      // 障碍物应该更多
      expect(level3.params.obstacleCount).toBeGreaterThan(level2.params.obstacleCount)
    })
  })

  describe('资源配置验证', () => {
    it('所有关卡都应该有背景资源', async () => {
      const levels = await SnakeLevelLoader.loadMultiple([
        'snake_level_1',
        'snake_level_2',
        'snake_level_3'
      ])
      
      levels.forEach(level => {
        expect(level.resources?.backgrounds).toBeDefined()
        expect(level.resources?.backgrounds!.length).toBeGreaterThan(0)
      })
    })

    it('所有关卡都应该有精灵资源', async () => {
      const levels = await SnakeLevelLoader.loadMultiple([
        'snake_level_1',
        'snake_level_2',
        'snake_level_3'
      ])
      
      levels.forEach(level => {
        expect(level.resources?.sprites).toBeDefined()
        expect(level.resources?.sprites!.length).toBeGreaterThan(0)
      })
    })

    it('不同关卡应该有不同的主题资源', async () => {
      const level1 = await SnakeLevelLoader.loadFromJSON('snake_level_1')
      const level2 = await SnakeLevelLoader.loadFromJSON('snake_level_2')
      const level3 = await SnakeLevelLoader.loadFromJSON('snake_level_3')
      
      // 第 1 关是森林主题
      expect(level1.resources?.backgrounds).toContain('bg_forest')
      
      // 第 2 关是沙漠主题
      expect(level2.resources?.backgrounds).toContain('bg_desert')
      
      // 第 3 关是冰雪主题
      expect(level3.resources?.backgrounds).toContain('bg_ice')
    })
  })

  describe('目标类型验证', () => {
    it('应该包含得分目标', async () => {
      const levels = await SnakeLevelLoader.loadMultiple([
        'snake_level_1',
        'snake_level_2',
        'snake_level_3'
      ])
      
      levels.forEach(level => {
        const scoreObjective = level.objectives.find(obj => obj.type === 'score')
        expect(scoreObjective).toBeDefined()
      })
    })

    it('应该包含收集食物目标', async () => {
      const levels = await SnakeLevelLoader.loadMultiple([
        'snake_level_1',
        'snake_level_2',
        'snake_level_3'
      ])
      
      levels.forEach(level => {
        const collectObjective = level.objectives.find(obj => obj.type === 'collect_food')
        expect(collectObjective).toBeDefined()
      })
    })

    it('目标分数应该随难度递增', async () => {
      const levels = await SnakeLevelLoader.loadMultiple([
        'snake_level_1',
        'snake_level_2',
        'snake_level_3'
      ])
      
      const scores = levels.map(level => {
        const scoreObj = level.objectives.find(obj => obj.type === 'score')
        return scoreObj ? scoreObj.targetValue : 0
      })
      
      expect(scores[0] < scores[1]).toBe(true)
      expect(scores[1] < scores[2]).toBe(true)
    })
  })

  describe('缓存机制', () => {
    it('第二次加载相同关卡应该更快', async () => {
      // 第一次加载
      const start1 = performance.now()
      await SnakeLevelLoader.loadFromJSON('snake_level_1')
      const end1 = performance.now()
      const time1 = end1 - start1
      
      // 第二次加载（应该使用缓存）
      const start2 = performance.now()
      await SnakeLevelLoader.loadFromJSON('snake_level_1')
      const end2 = performance.now()
      const time2 = end2 - start2
      
      // 第二次应该明显更快（至少快 50%）
      expect(time2).toBeLessThan(time1 * 0.5)
    })
  })
})
