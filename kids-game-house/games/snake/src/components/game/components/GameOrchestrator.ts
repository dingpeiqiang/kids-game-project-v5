// ============================================================================
// 🎮【可复用框架层】游戏引擎编排器 - 通过组合调用实现功能
// ============================================================================
// 📌 说明：不改变任何业务逻辑，只是编排各个组件按顺序工作
// ============================================================================

import { GTRSLoader } from './GTRSLoader'
import { ScreenAdapter } from './ScreenAdapter'
import { AudioManager } from './AudioManager'

/**
 * ⭐ 游戏引擎编排器
 * 
 * 📌 说明：通过组合和调用各个组件来完成游戏初始化
 * 
 * 架构设计:
 * ```
 * ┌─────────────────────────────────────┐
 * │      GameOrchestrator (编排器)      │
 * ├─────────────────────────────────────┤
 * │  - gtrsLoader: GTRSLoader           │ ← 组件 1
 * │  - screenAdapter: ScreenAdapter     │ ← 组件 2
 * │  - audioManager: AudioManager       │ ← 组件 3
 * │  - backgroundRenderer: ...          │ ← 组件 4
 * │  - snakeRenderer: ...               │ ← 组件 5
 * └─────────────────────────────────────┘
 *                    ↓
 *         编排调用顺序:
 *         1. loadTheme()
 *         2. calculateParams()
 *         3. loadResources()
 *         4. createBackground()
 *         5. renderSnake()
 * ```
 */
export class GameOrchestrator {
  // ⭐ 组件实例（保持原有功能）
  private readonly gtrsLoader: GTRSLoader
  private readonly screenAdapter: ScreenAdapter
  private readonly audioManager: AudioManager
  
  // TODO: 其他组件
  // private readonly audioManager: AudioManager
  // private readonly backgroundRenderer: BackgroundRenderer
  // private readonly snakeRenderer: SnakeRenderer
  
  /**
   * 构造函数
   * @param config 游戏配置（保持原有常量）
   */
  constructor(config: {
    designWidth?: number
    designHeight?: number
    gridCols?: number
    gridRows?: number
    baseCellSize?: number
  } = {}) {
    // ⭐ 创建组件实例
    this.gtrsLoader = new GTRSLoader()
    this.screenAdapter = new ScreenAdapter(
      config.designWidth ?? 720,
      config.designHeight ?? 1280,
      config.gridCols ?? 32,
      config.gridRows ?? 18,
      config.baseCellSize ?? 50
    )
    this.audioManager = new AudioManager()
    
    console.log('🎮 [GameOrchestrator] 游戏引擎编排器已初始化')
  }

  /**
   * ⭐ 获取 GTRS 加载器
   */
  getGTRSLoader(): GTRSLoader {
    return this.gtrsLoader
  }

  /**
   * ⭐ 获取屏幕适配器
   */
  getScreenAdapter(): ScreenAdapter {
    return this.screenAdapter
  }

  /**
   * ⭐ 获取音频管理器
   */
  getAudioManager(): AudioManager {
    return this.audioManager
  }

  /**
   * ⭐ 编排阶段 1: 预加载（preload）
   * 
   * 📌 说明：按顺序调用各个组件的 preload 方法
   * 
   * 执行流程:
   *   1. GTRSLoader.loadTheme() - 加载主题
   *   2. ScreenAdapter.calculateParams() - 计算适配
   *   3. 加载图片资源
   * 
   * @param themeId 主题 ID
   * @param containerElement 容器元素
   */
  async preload(themeId: string, containerElement: HTMLElement): Promise<void> {
    console.log('\n' + '='.repeat(60))
    console.log('🎬 [编排器] 开始预加载阶段...')
    console.log('='.repeat(60))
    
    // Step 1: 加载主题（调用 GTRSLoader 组件）
    console.log('\n[步骤 1/3] 加载 GTRS 主题...')
    await this.gtrsLoader.loadTheme(themeId)
    
    // Step 2: 计算屏幕适配（调用 ScreenAdapter 组件）
    console.log('\n[步骤 2/3] 计算屏幕适配参数...')
    this.screenAdapter.calculateParams(
      containerElement.clientWidth,
      containerElement.clientHeight
    )
    
    // Step 3: 加载图片资源（调用 GTRSLoader 组件）
    console.log('\n[步骤 3/3] 加载图片资源...')
    // TODO: 调用 GTRSLoader 的图片加载方法
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ [编排器] 预加载阶段完成')
    console.log('='.repeat(60) + '\n')
  }

  /**
   * ⭐ 编排阶段 2: 创建场景（create）
   * 
   * 📌 说明：按顺序调用各个渲染组件
   * 
   * 执行流程:
   *   1. 创建背景
   *   2. 创建网格
   *   3. 创建粒子系统
   *   4. 创建蛇
   *   5. 创建食物
   * 
   * @param scene Phaser 场景对象
   */
  async create(scene: Phaser.Scene): Promise<void> {
    console.log('\n' + '='.repeat(60))
    console.log('🎬 [编排器] 开始创建场景阶段...')
    console.log('='.repeat(60))
    
    // TODO: 调用各个渲染组件
    // Step 1: 创建背景
    // Step 2: 创建网格
    // Step 3: 创建粒子系统
    // Step 4: 创建蛇群组
    // Step 5: 创建食物
    
    console.log('\n' + '='.repeat(60))
    console.log('✅ [编排器] 创建场景阶段完成')
    console.log('='.repeat(60) + '\n')
  }

  /**
   * ⭐ 编排阶段 3: 渲染循环（update）
   * 
   * 📌 说明：每帧调用各个更新组件
   * 
   * 执行流程:
   *   1. 更新蛇位置
   *   2. 检测碰撞
   *   3. 渲染蛇
   *   4. 渲染食物
   * 
   * @param time 时间戳
   * @param delta 时间增量
   */
  update(time: number, delta: number): void {
    // TODO: 调用各个更新组件
    // this.snakeRenderer.update(time, delta)
    // this.collisionDetector.check()
  }

  /**
   * ⭐ 编排阶段 4: 处理 resize
   * 
   * @param newWidth 新宽度
   * @param newHeight 新高度
   */
  handleResize(newWidth: number, newHeight: number): void {
    console.log('🔄 [编排器] 屏幕尺寸变化，重新计算适配...')
    
    // 调用屏幕适配组件
    this.screenAdapter.recalculateParams(newWidth, newHeight)
    
    // TODO: 调用各个渲染组件重建
  }
}
