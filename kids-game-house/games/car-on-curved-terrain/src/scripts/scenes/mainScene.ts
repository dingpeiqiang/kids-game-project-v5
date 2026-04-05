import Bridge from '../objects/bridge'
import Terrain from '../objects/terrainDynamic'
import Car from '../objects/car'
import Restart from '../objects/restart'
import ScoreManager from '../objects/scoreManager'
import Speedometer from '../objects/speedometer'
import ParticleEffects from '../objects/particleEffects'
import KeyboardController from '../objects/keyboardController'
import ControlsHint from '../objects/controlsHint'
import LevelManager, { LevelData } from '../objects/levelManager'
import LevelSelectUI from '../objects/levelSelectUI'
import LevelCompleteUI from '../objects/levelCompleteUI'
import { MapDecorator } from '../objects/mapDecorator'
import FinishFlag from '../objects/finishFlag'
import { TerrainGenerator } from '../objects/terrainGenerator'
import { Scene } from 'phaser'

export default class MainScene extends Phaser.Scene {
  car!: Car
  terrains: Terrain[] = []
  scoreManager!: ScoreManager
  speedometer!: Speedometer
  particleEffects!: ParticleEffects
  keyboardController!: KeyboardController
  controlsHint!: ControlsHint
  levelManager!: LevelManager
  levelSelectUI!: LevelSelectUI
  levelCompleteUI!: LevelCompleteUI
  mapDecorator: MapDecorator | null = null
  finishFlag: FinishFlag | null = null
  private carStartX: number = 200
  private currentLevelId: number = 1
  private levelCompleted: boolean = false
  private collisionListenerAdded: boolean = false

  constructor() {
    super({ key: 'MainScene' })
  }

  create() {
    // 初始化关卡管理器
    this.levelManager = new LevelManager()
    this.levelSelectUI = new LevelSelectUI(this, this.levelManager)
    this.levelCompleteUI = new LevelCompleteUI(this)

    // 加载第一关
    this.loadLevel(1)

    // 隐藏加载屏幕
    let loadingScreen = document.getElementById('loading-screen')
    if (loadingScreen) loadingScreen.style.display = 'none'
  }

  /**
   * 加载指定关卡
   */
  loadLevel(levelId: number) {
    const level = this.levelManager.getLevel(levelId)
    if (!level) {
      console.error(`❌ Level ${levelId} not found`)
      return
    }

    console.log(`=== Loading Level ${levelId}: ${level.name} ===`)
    console.log(`   Target Distance: ${level.targetDistance}m`)
    console.log(`   Difficulty: ${level.difficulty}`)
    console.log(`   Terrain Style: ${level.terrainStyle}`)

    // 清理旧对象（仅当已有关卡时）
    if (this.car) {
      this.cleanupLevel()
    }

    // ⚠️ 关键：重置所有状态
    this.currentLevelId = levelId
    this.levelCompleted = false  // ✅ 重置完成标志
    this.carStartX = level.carStartPosition.x
    
    console.log(`   State reset: currentLevelId=${this.currentLevelId}, levelCompleted=${this.levelCompleted}`)

    // 创建桥梁
    level.bridgePositions.forEach(pos => {
      new Bridge(this, pos.x, pos.y, pos.width, pos.height)
    })

    // 创建地形
    const terrain1 = new Terrain(this, level.terrain1Path, level.terrain1Offset.x, level.terrain1Offset.y, 1)
    const terrain2 = new Terrain(this, level.terrain2Path, level.terrain2Offset.x, level.terrain2Offset.y, 2)
    this.terrains = [terrain1, terrain2]

    // 🔍 调试：标记地形连接点
    this.debugTerrainJunction(level)

    // 创建车辆
    this.car = new Car(this, level.carStartPosition.x, level.carStartPosition.y)

    // 初始化游戏系统
    this.scoreManager = new ScoreManager(this, this.carStartX)
    this.speedometer = new Speedometer(this)
    this.particleEffects = new ParticleEffects(this)
    this.keyboardController = new KeyboardController(this, this.car)
    this.controlsHint = new ControlsHint(this)

    // 生成地图装饰
    this.generateDecorations(level)

    // 创建终点旗帜
    this.createFinishFlag(level)

    // 碰撞检测 - 车轮着地状态（只添加一次）
    if (!this.collisionListenerAdded) {
      this.matter.world.on('collisionactive', (collisions: any) => {
        if (this.car) {
          this.car.wheelsDown = { rear: false, front: false }
          collisions.pairs.forEach((pair: any) => {
            const labels: string[] = [pair['bodyA'].label, pair['bodyB'].label]
            if (labels.includes('wheelRear')) this.car.wheelsDown.rear = true
            if (labels.includes('wheelFront')) this.car.wheelsDown.front = true
          })
        }
      })
      this.collisionListenerAdded = true
    }

    // 切换背景风格
    const bgScene = this.scene.get('BackgroundScene')
    if (bgScene && 'switchStyle' in bgScene) {
      (bgScene as any).switchStyle(level.decorStyle)
    }

    console.log(`Loaded Level ${levelId}: ${level.name} (terrain style: ${level.terrainStyle}, decor: ${level.decorStyle})`)
  }

  /**
   * 生成地图装饰
   */
  private generateDecorations(level: LevelData) {
    // 清理旧装饰
    if (this.mapDecorator) {
      this.mapDecorator.destroy()
    }

    // 密度适度降低，避免大量 Graphics 顶点
    const densityMap: Record<string, number> = {
      easy:   0.5,
      medium: 0.4,
      hard:   0.3
    }

    // worldWidth 最大 8000，避免绘制过多装饰
    const worldWidth = Math.min(8000, level.worldWidth || level.targetDistance * 10 + 2000)

    this.mapDecorator = new MapDecorator(this, {
      worldWidth,
      style: level.decorStyle,
      density: densityMap[level.difficulty] || 0.4,
      seed: level.seed ?? this.currentLevelId * 137
    })

    this.mapDecorator.generate()
  }

  /**
   * 创建终点旗帜
   */
  private createFinishFlag(level: LevelData) {
    if (this.finishFlag) {
      this.finishFlag.destroy()
    }

    const gen = new TerrainGenerator(level.seed)
    const finishX = gen.getFinishX(level.targetDistance)
    // 估算终点处的地形 Y 值
    const finishY = 400 + finishX * 0.02 + level.targetDistance * 0.3

    this.finishFlag = new FinishFlag(this, finishX, finishY, level.targetDistance)
  }

  /**
   * 清理当前关卡对象
   */
  private cleanupLevel() {
    // 清理关卡完成UI
    if (this.levelCompleteUI) {
      try { this.levelCompleteUI.destroy() } catch (e) { /* ignore */ }
    }

    // 清理粒子效果
    if (this.particleEffects) {
      try { this.particleEffects.destroy() } catch (e) { /* ignore */ }
    }

    // 清理速度表
    if (this.speedometer) {
      try { this.speedometer.destroy() } catch (e) { /* ignore */ }
    }

    // 清理操控提示
    if (this.controlsHint) {
      try { this.controlsHint.destroy() } catch (e) { /* ignore */ }
    }

    // 清理装饰
    if (this.mapDecorator) {
      this.mapDecorator.destroy()
      this.mapDecorator = null
    }

    // 清理终点旗帜
    if (this.finishFlag) {
      this.finishFlag.destroy()
      this.finishFlag = null
    }

    // 清理地形
    this.terrains = []

    // 清理车辆
    if (this.car) {
      try {
        if (this.car.bodies && Array.isArray(this.car.bodies)) {
          this.car.bodies.forEach((body: any) => {
            if (body && typeof body === 'object' && 'destroy' in body) {
              try { body.destroy() } catch (e) { /* ignore */ }
            }
          })
        }
      } catch (e) {
        console.warn('Error cleaning up car bodies:', e)
      }
    }

    // 清理UI
    if (this.scoreManager) {
      try { this.scoreManager.reset() } catch (e) { /* ignore */ }
    }
  }

  /**
   * 🔍 调试：标记地形连接点
   */
  private debugTerrainJunction(level: any) {
    const gen = new TerrainGenerator(level.seed)
    
    let x1 = 0, y1 = 0, x2 = 0, y2 = 0
    
    // 解析terrain1终点
    const points1 = gen.extractPoints(level.terrain1Path)
    if (points1.length > 0) {
      const lastPt = points1[points1.length - 1]
      x1 = lastPt[0] + level.terrain1Offset.x
      y1 = lastPt[1] + level.terrain1Offset.y
      
      // 红色圆点标记terrain1终点
      const point1 = this.add.circle(x1, y1, 20, 0xff0000, 0.6)
      point1.setDepth(100)
      
      const label1 = this.add.text(x1, y1 - 30, 'T1 End', {
        fontSize: '14px',
        color: '#ff0000',
        fontStyle: 'bold'
      })
      label1.setOrigin(0.5, 0.5)
      label1.setDepth(100)
      
      console.log(`🔴 Terrain1 End: (${x1.toFixed(0)}, ${y1.toFixed(0)})`)
    }
    
    // 解析terrain2起点
    const points2 = gen.extractPoints(level.terrain2Path)
    if (points2.length > 0) {
      const firstPt = points2[0]
      x2 = firstPt[0] + level.terrain2Offset.x
      y2 = firstPt[1] + level.terrain2Offset.y
      
      // 绿色圆点标记terrain2起点
      const point2 = this.add.circle(x2, y2, 20, 0x00ff00, 0.6)
      point2.setDepth(100)
      
      const label2 = this.add.text(x2, y2 - 30, 'T2 Start', {
        fontSize: '14px',
        color: '#00ff00',
        fontStyle: 'bold'
      })
      label2.setOrigin(0.5, 0.5)
      label2.setDepth(100)
      
      console.log(`🟢 Terrain2 Start: (${x2.toFixed(0)}, ${y2.toFixed(0)})`)
      
      // 计算距离
      const distance = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
      console.log(`📏 Junction gap: ${distance.toFixed(2)}px`)
      
      if (distance > 5) {
        console.warn(`⚠️ WARNING: Large gap detected at terrain junction!`)
      }
    }
  }

  /**
   * 重试当前关卡
   */
  retryLevel() {
    this.loadLevel(this.currentLevelId)
  }

  /**
   * 下一关
   */
  nextLevel() {
    const nextLevelId = this.currentLevelId + 1
    const nextLevel = this.levelManager.getLevel(nextLevelId)
    
    console.log(`🔍 Checking next level: ${nextLevelId}`)
    console.log(`   Level exists: ${!!nextLevel}`)
    console.log(`   Is unlocked: ${this.levelManager.isLevelUnlocked(nextLevelId)}`)
    
    if (nextLevel && this.levelManager.isLevelUnlocked(nextLevelId)) {
      console.log(`✅ Loading next level: ${nextLevelId} - ${nextLevel.name}`)
      this.loadLevel(nextLevelId)
    } else if (!nextLevel) {
      console.log('🎊 No more levels - showing congratulations')
      this.showCongratulations()
    } else {
      console.log('⚠️ Next level exists but not unlocked')
    }
  }

  /**
   * 显示通关祝贺
   */
  private showCongratulations() {
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    
    const congratsText = this.add.text(width / 2, height / 2, 
      '🎊 恭喜通关所有关卡！\n\n你是真正的驾驶大师！', {
      fontSize: '32px',
      color: '#ffdd00',
      fontStyle: 'bold',
      align: 'center'
    })
    congratsText.setOrigin(0.5, 0.5)
    congratsText.setDepth(500)
    
    // 添加闪烁动画
    this.tweens.add({
      targets: congratsText,
      alpha: 0.5,
      duration: 500,
      yoyo: true,
      repeat: 3
    })
    
    // 5秒后消失
    this.time.delayedCall(5000, () => {
      this.tweens.add({
        targets: congratsText,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          congratsText.destroy()
        }
      })
    }, [], this)
  }

  /**
   * 打开关卡选择界面
   */
  openLevelSelect() {
    this.levelSelectUI.show((levelId: number) => {
      this.loadLevel(levelId)
    })
  }

  update() {
    this.terrains.forEach(terrain => {
      terrain.update()
    })

    // 更新键盘控制
    this.keyboardController.update()

    // 相机跟随车辆
    const carBody = this.car.bodies[0]
    this.cameras.main.centerOn(carBody.position.x + 300, carBody.position.y - 100)

    // 平滑缩放
    const wheelRear = this.car.bodies[1]
    const currentZoom = this.cameras.main.zoom
    let zoom = 1 - wheelRear.angularVelocity / 1.65
    if (zoom > currentZoom + currentZoom * 0.0022) zoom = currentZoom + currentZoom * 0.0022
    else if (zoom < currentZoom - currentZoom * 0.0022) zoom = currentZoom - currentZoom * 0.0022
    if (zoom > 1) zoom = 1
    if (zoom < 0.6) zoom = 0.6
    this.cameras.main.setZoom(zoom)

    this.car.update()

    // 更新游戏系统
    this.scoreManager.update(carBody.position.x)
    this.speedometer.update(wheelRear.angularVelocity)

    // 更新粒子效果
    const wheelFront = this.car.bodies[2]
    this.particleEffects.update(
      wheelRear.position.x,
      wheelRear.position.y,
      wheelFront.position.x,
      wheelFront.position.y,
      this.car.wheelsDown,
      this.car.gas.right
    )

    // 检测关卡完成
    if (!this.levelCompleted) {
      const currentLevel = this.levelManager.getCurrentLevel()
      if (currentLevel) {
        const distance = this.scoreManager.getScore()
        if (distance >= currentLevel.targetDistance) {
          console.log('🎉 Level completed!')
          console.log(`   Distance: ${distance}m / ${currentLevel.targetDistance}m`)
          
          this.levelCompleted = true
          const stars = this.levelManager.calculateStars(distance, currentLevel)
          this.levelManager.saveLevelStars(currentLevel.id, stars)
          
          console.log(`   Stars earned: ${stars}/3`)
          
          // 解锁下一关
          const nextLevelId = this.levelManager.unlockNextLevel()
          console.log(`   Next level unlocked: ${nextLevelId || 'None (last level)'}`)
          
          // 显示完成界面
          this.levelCompleteUI.show(
            distance,
            stars,
            currentLevel.name,
            () => {
              console.log('➡️ Next level button clicked')
              this.nextLevel()
            },
            () => {
              console.log('🔄 Retry button clicked')
              this.retryLevel()
            },
            nextLevelId ? 3 : 0
          )
        }
      }
    }
  }
}
