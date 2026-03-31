// ============================================================================
// 🐍 贪吃蛇关卡编排器
// ============================================================================
// 
// 📌 说明:
//   扩展自框架层的 LevelOrchestrator
//   实现贪吃蛇特定的配置解析器和关卡生成器
// ============================================================================

import { LevelOrchestrator } from 'kids-game-frame-factory'
import { SnakeLevelConfig } from '../types/snake-level.types'
// Phaser 通过 CDN 加载，全局变量声明见 global.d.ts

/**
 * ⭐ 配置解析器接口
 */
interface IConfigParser {
  parse(config: any): Promise<any>
}

/**
 * ⭐ 关卡生成器接口
 */
interface ILevelSpawner {
  spawn(data: any): Promise<void>
}

/**
 * ⭐ 贪吃蛇关卡编排器
 */
import type { Scene } from 'phaser'

export class SnakeLevelOrchestrator extends LevelOrchestrator {
  
  constructor(scene: Scene) {
    super(scene)
  }
  
  // ===========================================================================
  // 📌 重写父类方法 - 实现贪吃蛇特定逻辑
  // ===========================================================================
  
  /**
   * ⭐ 重写：创建贪吃蛇配置解析器
   */
  protected createConfigParser(): IConfigParser {
    return new SnakeConfigParser((this as any).scene)
  }
  
  /**
   * ⭐ 重写：创建贪吃蛇关卡生成器
   */
  protected createLevelSpawner(): ILevelSpawner {
    return new SnakeLevelSpawner((this as any).scene)
  }
}

// ============================================================================
// 📦 贪吃蛇配置解析器
// ============================================================================

class SnakeConfigParser implements IConfigParser {
  // private scene: Scene // 暂不需要，保留注释
  
  constructor(scene: any) {
    // this.scene = scene
  }
  
  /**
   * ⭐ 解析贪吃蛇关卡配置
   */
  async parse(config: any): Promise<any> {
    const snakeConfig = config as SnakeLevelConfig
    
    console.log('🐍 [SnakeConfigParser] 开始解析配置:', snakeConfig.info.name)
    
    // 解析为贪吃蛇特定数据
    return {
      // 基础参数
      gridSize: snakeConfig.params.gridSize,
      initialSpeed: snakeConfig.params.speed,
      obstacleCount: snakeConfig.params.obstacleCount,
      specialFoodChance: snakeConfig.params.specialFoodChance,
      
      // 分数配置
      foodScore: snakeConfig.params.foodScore,
      bonusScore: snakeConfig.params.bonusScore,
      coinScore: snakeConfig.params.coinScore,
      
      // 目标列表
      objectives: snakeConfig.objectives.map((obj: any) => ({
        id: obj.id,
        type: obj.type,
        targetValue: obj.targetValue,
        description: obj.description
      })),
      
      // 胜利条件
      victoryCondition: snakeConfig.victoryCondition,
      
      // 时间限制
      timeLimit: snakeConfig.timeLimit,
      
      // 资源配置
      resources: snakeConfig.resources
    }
  }
}

// ============================================================================
// 🏗️ 贪吃蛇关卡生成器
// ============================================================================

class SnakeLevelSpawner implements ILevelSpawner {
  // private scene: Scene // 暂不需要，保留注释
  
  constructor(scene: any) {
    // this.scene = scene
  }
  
  /**
   * ⭐ 生成贪吃蛇关卡
   */
  async spawn(data: any): Promise<void> {
    console.log('🐍 [SnakeLevelSpawner] 开始生成关卡:', data)
    
    // 1. 创建游戏网格
    this.createGrid(data.gridSize)
    
    // 2. 创建蛇
    this.createSnake(data.initialLength || 3)
    
    // 3. 生成障碍物
    if (data.obstacleCount > 0) {
      this.createObstacles(data.obstacleCount)
    }
    
    // 4. 生成第一个食物
    this.spawnFood()
    
    console.log('✅ [SnakeLevelSpawner] 关卡生成完成')
  }
  
  /**
   * ⭐ 创建游戏网格
   */
  private createGrid(gridSize: number): void {
    console.log(`  ├─ 创建网格：${gridSize}x${gridSize}`)
    // TODO: 实际实现网格创建
    // this.scene.add.grid(...)
  }
  
  /**
   * ⭐ 创建蛇
   */
  private createSnake(initialLength: number): void {
    console.log(`  ├─ 创建蛇，初始长度：${initialLength}`)
    // TODO: 实际实现蛇的创建
    // 使用组件或精灵创建蛇身
  }
  
  /**
   * ⭐ 创建障碍物
   */
  private createObstacles(count: number): void {
    console.log(`  ├─ 创建 ${count} 个障碍物`)
    // TODO: 随机生成障碍物位置
    // 确保不阻塞蛇的路径
  }
  
  /**
   * ⭐ 生成食物
   */
  private spawnFood(): void {
    console.log('  └─ 生成第一个食物')
    // TODO: 在随机位置生成食物
    // 确保不在蛇身上
  }
}
