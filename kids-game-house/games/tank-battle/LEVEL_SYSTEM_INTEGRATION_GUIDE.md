# 🔌 关卡系统集成指南

## 📋 集成目标

将当前的 `TankGameScene` 与新创建的关卡系统（Orchestrator、Parser、Spawner）集成，实现标准化的关卡流程。

---

## 🎯 当前状态 vs 目标状态

### **当前架构** (需重构)

```typescript
class TankGameScene {
  create() {
    this.createMap()      // ❌ 硬编码墙壁生成
    this.createPlayer()   // ✅ 保留
    this.setupCollisions()// ✅ 保留
    this.loadLevel(1)     // ❌ 需要迁移到 Orchestrator
    this.startEnemySpawning() // ❌ 需要迁移到 Spawner
  }
  
  loadLevel(level: number) {
    // 手动创建敌人、设置属性
    // 耦合了太多细节
  }
}
```

### **目标架构** (标准化)

```typescript
class TankGameScene {
  protected orchestrator: TankGameOrchestrator
  protected parser: TankConfigParser
  protected spawner: TankSpawner
  
  async create() {
    // 1. 初始化编排器
    this.orchestrator = new TankGameOrchestrator(this)
    this.parser = new TankConfigParser(this)
    this.spawner = new TankSpawner(this)
    
    // 2. 加载关卡配置
    const config = await this.loadLevelConfig('tank_level_1')
    
    // 3. 运行完整关卡流程
    this.orchestrator.onProgress((event) => {
      this.updateUI(event.progress, event.message)
    })
    
    const result = await this.orchestrator.runLevel(config)
    
    // 4. 显示结果
    this.showLevelResult(result)
  }
}
```

---

## 📝 集成步骤

### **Step 1: 扩展 TankGameOrchestrator**

需要在编排器中注入 Scene 的引用，以便调用实际的游戏逻辑：

```typescript
// src/core/TankGameOrchestrator.ts
export class TankGameOrchestrator {
  protected scene: Phaser.Scene
  
  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }
  
  /**
   * 阶段 4: 关卡动态生成（增强版）
   */
  protected async phase4_LevelSpawning(parsedData: ITankLevelData): Promise<void> {
    console.log('🏗️ [阶段 4] 关卡生成...')
    this.emitProgress(0.6, '生成游戏实体...')
    
    // ✅ 使用 TankSpawner 生成实体
    const spawner = new TankSpawner(this.scene)
    await spawner.spawn(parsedData)
    
    console.log('✅ [阶段 4] 完成')
  }
  
  /**
   * 阶段 5: 关卡运行（增强版）
   */
  protected async phase5_LevelRunning(): Promise<ILevelResult> {
    console.log('🎮 [阶段 5] 关卡运行中...')
    this.emitProgress(0.8, '关卡进行中...')
    
    // ✅ 返回一个 Promise，等待游戏结束
    return new Promise((resolve) => {
      // 监听游戏结束事件
      const gameScene = this.scene as TankGameScene
      gameScene.onLevelComplete = (result: ILevelResult) => {
        resolve(result)
      }
    })
  }
}
```

---

### **Step 2: 实现 TankSpawner 的实际生成逻辑**

```typescript
// src/core/TankSpawner.ts
export class TankSpawner implements ILevelSpawner {
  protected scene: Phaser.Scene
  
  async spawn(data: ITankLevelData): Promise<void> {
    // 获取 EntityManager
    const entityManager = (this.scene as any).entityManager
    
    // 1. 生成墙壁
    data.walls.forEach(wall => {
      entityManager.createWall(
        wall.x, 
        wall.y, 
        wall.type === 'brick' ? 'wall_brick' : 'wall_steel'
      )
    })
    
    // 2. 生成敌人
    data.enemies.forEach(group => {
      group.spawnPoints.forEach((point, index) => {
        const texture = `enemy_${group.type}_up`
        entityManager.createEnemy(point.x, point.y, group.type, texture, {
          health: group.type === 'light' ? 1 : group.type === 'medium' ? 2 : 3,
          speed: group.type === 'light' ? 150 : group.type === 'medium' ? 100 : 50,
          damage: group.type === 'light' ? 10 : group.type === 'medium' ? 20 : 30
        })
      })
    })
    
    // 3. 生成道具
    data.powerUps.forEach(prop => {
      entityManager.createPowerUp(prop.x, prop.y, prop.type)
    })
    
    // 4. 设置基地（已在 createMap 中创建，这里只需保存引用）
    console.log('✅ 关卡实体生成完成')
  }
}
```

---

### **Step 3: 修改 TankGameScene 支持回调**

```typescript
// src/scenes/TankGameScene.ts
export class TankGameScene extends Phaser.Scene {
  // ✅ 添加回调函数
  public onLevelComplete?: (result: ILevelResult) => void
  
  // ✅ 添加关卡统计
  protected levelStatistics = {
    shotsFired: 0,
    accuracy: 0,
    damageTaken: 0,
    maxCombo: 0,
    enemiesDestroyed: 0
  }
  
  /**
   * 完成关卡（调用此方法触发结算）
   */
  completeLevel(success: boolean): void {
    if (!this.onLevelComplete) return
    
    const gameStore = useGameStore()
    
    const result: ILevelResult = {
      success,
      completion: success ? 1.0 : 0.0,
      score: gameStore.score,
      stars: this.calculateStars(),
      rewards: {
        score: gameStore.score,
        currency: Math.floor(gameStore.score / 10)
      },
      timeUsed: this.timeLeft ? (120 - this.timeLeft) : 0,
      statistics: this.levelStatistics
    }
    
    this.onLevelComplete(result)
  }
  
  /**
   * 计算星级
   */
  protected calculateStars(): 0 | 1 | 2 | 3 {
    const score = useGameStore().score
    if (score >= 1000) return 3
    if (score >= 800) return 2
    if (score >= 500) return 1
    return 0
  }
}
```

---

### **Step 4: 创建关卡配置文件加载器**

```typescript
// src/utils/LevelConfigLoader.ts
export class LevelConfigLoader {
  /**
   * 从 JSON 文件加载关卡配置
   */
  static async loadLevelConfig(levelId: string): Promise<ILevelConfig> {
    try {
      const response = await fetch(`/games/tank-battle/config/levels/${levelId}.json`)
      if (!response.ok) {
        throw new Error(`Failed to load level config: ${response.status}`)
      }
      const config: ILevelConfig = await response.json()
      console.log('✅ 关卡配置加载成功:', config.info.name)
      return config
    } catch (error) {
      console.error('❌ 关卡配置加载失败:', error)
      throw error
    }
  }
}
```

---

### **Step 5: 修改 TankGameScene.create() 方法**

```typescript
// src/scenes/TankGameScene.ts
async create() {
  console.log('🎮 坦克大战启动（关卡系统版本）')
  
  // 1. 重置所有状态
  this.resetGameState()
  
  // 2. 初始化基础元素
  this.initBasicElements()
  
  // 3. 创建编排器
  this.orchestrator = new TankGameOrchestrator(this)
  this.parser = new TankConfigParser(this)
  this.spawner = new TankSpawner(this)
  
  // 4. 设置进度回调
  this.orchestrator.onProgress((event) => {
    this.updateLoadingUI(event.progress, event.message)
  })
  
  // 5. 加载并运行关卡
  try {
    const config = await LevelConfigLoader.loadLevelConfig('tank_level_1')
    const result = await this.orchestrator.runLevel(config)
    
    // 6. 显示结果
    this.showLevelResult(result)
  } catch (error) {
    console.error('❌ 关卡运行失败:', error)
    this.showError(error)
  }
}

/**
 * 初始化基础元素（背景、UI、音效等）
 */
protected initBasicElements(): void {
  // 背景
  this.add.tileSprite(this.screenW / 2, this.screenH / 2, this.screenW, this.screenH, 'bg_main')
  
  // 设置物理世界边界
  this.physics.world.setBounds(
    this.offsetX, 
    this.offsetY, 
    this.gridCols * this.cellSize, 
    this.gridRows * this.cellSize
  )
  
  // UI
  this.createUI()
  
  // 碰撞检测
  this.setupCollisions()
}
```

---

## 🔄 完整数据流

```
1. 加载配置
   ↓
2. TankGameOrchestrator.runLevel()
   ├─→ Phase 1: 解锁验证
   ├─→ Phase 2: 资源加载
   ├─→ Phase 3: TankConfigParser.parse()
   │              └─→ 解析为 ITankLevelData
   ├─→ Phase 4: TankSpawner.spawn()
   │              └─→ 调用 EntityManager 创建实体
   ├─→ Phase 5: 等待游戏结束
   │              └─→ TankGameScene.completeLevel()
   └─→ Phase 6: 关卡结算
                  └─→ 计算星级、奖励
```

---

## 📊 UI 进度条示例

```typescript
// src/scenes/TankGameScene.ts
protected updateLoadingUI(progress: number, message: string): void {
  // 更新进度条
  this.loadingBar.setFillStyle(0x00ff00)
  this.loadingBar.fillRect(
    this.screenW / 2 - 200,
    this.screenH / 2,
    400 * progress,
    20
  )
  
  // 更新文字
  this.loadingText.setText(message)
  this.loadingText.setPosition(this.screenW / 2, this.screenH / 2 + 40)
  this.loadingText.setOrigin(0.5)
}
```

---

## ✅ 集成检查清单

- [ ] ✅ 创建类型定义 (`level-types.ts`)
- [ ] ✅ 创建编排器 (`TankGameOrchestrator.ts`)
- [ ] ✅ 创建解析器 (`TankConfigParser.ts`)
- [ ] ✅ 创建生成器 (`TankSpawner.ts`)
- [ ] ⏳ 扩展编排器支持 Scene 引用
- [ ] ⏳ 实现 Spawner 的实际生成逻辑
- [ ] ⏳ 添加 Scene 的回调函数
- [ ] ⏳ 创建配置加载器
- [ ] ⏳ 重构 `create()` 方法
- [ ] ⏳ 添加 UI 进度条
- [ ] ⏳ 集成测试

---

## 🎯 下一步

1. **实现 Step 1-5** - 完成核心集成
2. **创建更多关卡** - `tank_level_2.json`, `tank_level_3.json`
3. **完善 UI** - 进度条、结果界面
4. **测试优化** - 确保流程顺畅无 bug

---

**当前优先级**: 先保持游戏可玩，逐步替换，不要一次性重构所有代码！

🎮 **小步快跑，边玩边优化！** 🚀
