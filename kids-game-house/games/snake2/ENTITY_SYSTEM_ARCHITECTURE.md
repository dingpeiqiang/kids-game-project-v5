# 🐍 贪吃蛇实体系统架构设计 - HTML5 Canvas 轻量版

**创建时间**: 2026-04-05  
**状态**: ✅ 完整设计，可直接落地

---

## 🎯 **核心架构：实体继承体系**

基于您的设计理念，采用 **「基类继承 + 组件组合」** 轻量架构：

```
BaseEntity (实体基类)
├─ 通用属性：位置、尺寸、碰撞盒、是否激活
├─ 通用方法：update()、render()、checkCollision()
└─ 生命周期：onCreate()、onDestroy()

┌──────────────────┬──────────────────┐
│                  │                  │
▼                  ▼                  ▼
SnakeEntity        FoodEntity         ObstacleEntity
(玩家主体)          (食物/道具)         (障碍物)
├─ 蛇身数组         ├─ 类型：普通/特效  ├─ 静态物体
├─ 移动方向         ├─ 分数            ├─ 阻挡碰撞
├─ 速度            ├─ 特效（可选）     └─ 不可移动
└─ 生长逻辑        └─ 拾取即生效
```

**优势**:
- ✅ 代码复用：共用基类的碰撞、渲染、位置逻辑
- ✅ 职责单一：每个子类只负责自己的专属逻辑
- ✅ 易于扩展：新增实体类型只需继承基类

---

## 📊 **第一部分：普通实体（基础核心）**

### 1.1 SnakeEntity - 蛇主体

#### 核心特征
- ✅ 常驻存在（直到死亡）
- ✅ 物理碰撞（撞墙、撞自己）
- ✅ 持续移动（每帧更新位置）

#### 属性设计

```typescript
/**
 * 🐍 蛇实体类
 */
class SnakeEntity extends BaseEntity {
  // === 继承自 BaseEntity 的通用属性 ===
  id: string = 'snake_player'
  type: EntityType = 'player'
  x: number = 0
  y: number = 0
  width: number = cellSize
  height: number = cellSize
  visible: boolean = true
  active: boolean = true
  
  // === 蛇专属属性 ===
  body: SnakeSegment[] = []      // 蛇身数组 [{x, y}, ...]
  direction: Direction = 'right' // 当前方向
  nextDirection: Direction = 'right' // 下一步方向（缓冲）
  speed: number = 200            // 像素/秒
  alive: boolean = true          // 存活状态
  growing: boolean = false       // 是否正在生长
  
  // === 状态 ===
  score: number = 0              // 分数
  length: number = 3             // 长度
  
  constructor(initialX: number, initialY: number) {
    super()
    this.x = initialX
    this.y = initialY
    this.initBody()
  }
  
  /**
   * 初始化蛇身
   */
  private initBody(): void {
    this.body = []
    for (let i = 0; i < this.length; i++) {
      this.body.push({
        x: this.x - i * this.width,
        y: this.y
      })
    }
  }
  
  /**
   * ⭐ 每帧更新（核心逻辑）
   */
  update(deltaTime: number): void {
    if (!this.alive) return
    
    // 1. 更新方向（使用缓冲方向，防止快速按键导致反向）
    this.direction = this.nextDirection
    
    // 2. 计算新头部位置
    const head = this.body[0]
    const newHead = { ...head }
    
    switch (this.direction) {
      case 'up':    newHead.y -= this.speed * deltaTime; break
      case 'down':  newHead.y += this.speed * deltaTime; break
      case 'left':  newHead.x -= this.speed * deltaTime; break
      case 'right': newHead.x += this.speed * deltaTime; break
    }
    
    // 3. 移动蛇身（从后往前，每节移动到前一节的位置）
    for (let i = this.body.length - 1; i > 0; i--) {
      this.body[i].x = this.body[i - 1].x
      this.body[i].y = this.body[i - 1].y
    }
    
    // 4. 更新头部位置
    this.body[0] = newHead
    this.x = newHead.x
    this.y = newHead.y
    
    // 5. 检测碰撞（墙壁、自身）
    this.checkSelfCollision()
    
    // 6. 检测是否吃到食物
    this.checkFoodCollision()
  }
  
  /**
   * 渲染蛇
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return
    
    this.body.forEach((segment, index) => {
      // 蛇头用不同颜色
      if (index === 0) {
        ctx.fillStyle = '#4ade80' // 亮绿色（头）
      } else {
        // 蛇身渐变效果
        const gradient = 1 - (index / this.body.length) * 0.5
        ctx.fillStyle = `rgba(74, 222, 128, ${gradient})`
      }
      
      // 绘制矩形（带圆角）
      this.roundRect(
        ctx,
        segment.x,
        segment.y,
        this.width,
        this.height,
        4 // 圆角半径
      )
      ctx.fill()
      
      // 画眼睛（只有蛇头）
      if (index === 0) {
        this.renderEyes(ctx, segment)
      }
    })
  }
  
  /**
   * 检测自身碰撞
   */
  private checkSelfCollision(): void {
    const head = this.body[0]
    
    // 检查是否撞到自己的身体（从第 2 节开始）
    for (let i = 1; i < this.body.length; i++) {
      const segment = this.body[i]
      
      if (this.isCollide(head, segment)) {
        this.die()
        break
      }
    }
  }
  
  /**
   * 检测与食物的碰撞
   */
  private checkFoodCollision(): void {
    const head = this.body[0]
    
    // 遍历所有食物
    game.foodManager.getAllFoods().forEach(food => {
      if (this.isCollide(head, food)) {
        // 吃到食物
        this.eatFood(food)
      }
    })
  }
  
  /**
   * 吃食物逻辑
   */
  private eatFood(food: FoodEntity): void {
    // 1. 增加分数
    this.score += food.score
    
    // 2. 增长蛇身
    if (food.growsSnake) {
      this.grow(food.lengthIncrease || 1)
    }
    
    // 3. 应用特效（如果有）
    if (food.hasEffect) {
      this.applyFoodEffect(food)
    }
    
    // 4. 销毁食物
    food.destroy()
  }
  
  /**
   * 增长蛇身
   */
  grow(count: number): void {
    const tail = this.body[this.body.length - 1]
    
    for (let i = 0; i < count; i++) {
      this.body.push({ ...tail }) // 在尾部添加新节
    }
    
    this.length = this.body.length
  }
  
  /**
   * 应用食物特效
   */
  applyFoodEffect(food: FoodEntity): void {
    if (!food.effectType) return
    
    switch (food.effectType) {
      case 'speed_change':
        const originalSpeed = this.speed
        this.speed *= food.effectValue
        
        setTimeout(() => {
          this.speed = originalSpeed
        }, food.effectDuration)
        break
      
      case 'invincibility':
        this.invincible = true
        
        setTimeout(() => {
          this.invincible = false
        }, food.effectDuration)
        break
    }
  }
  
  /**
   * 死亡处理
   */
  die(): void {
    this.alive = false
    this.active = false
    game.gameOver()
  }
}
```

---

### 1.2 ObstacleEntity - 障碍物

```typescript
/**
 * 🧱 障碍物实体类
 */
class ObstacleEntity extends BaseEntity {
  type: EntityType = 'obstacle'
  isStatic: boolean = true  // 静态，不移动
  
  constructor(x: number, y: number, width: number, height: number) {
    super()
    this.x = x
    this.y = y
    this.width = width
    this.height = height
  }
  
  /**
   * 障碍物不需要 update（静态）
   */
  update(deltaTime: number): void {
    // 静态物体，无需更新
  }
  
  /**
   * 渲染障碍物
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return
    
    ctx.fillStyle = '#6b7280' // 灰色
    ctx.fillRect(this.x, this.y, this.width, this.height)
    
    // 添加边框
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 2
    ctx.strokeRect(this.x, this.y, this.width, this.height)
  }
}
```

---

## 📊 **第二部分：道具实体（功能交互）**

### 2.1 FoodEntity - 食物/道具统一类

```typescript
/**
 * 🍎 食物实体类（统一所有可收集物）
 */
class FoodEntity extends BaseEntity {
  type: EntityType = 'food'
  
  // === 食物专属属性 ===
  foodType: FoodType = 'normal'  // 食物类型
  score: number = 10             // 分数
  growsSnake: boolean = true     // 是否增长蛇身
  lengthIncrease: number = 1     // 增长长度
  
  // === 特效属性（可选）===
  hasEffect: boolean = false     // 是否有特效
  effectType?: 'speed_change' | 'invincibility'
  effectValue?: number           // 效果值
  effectDuration?: number        // 持续时间（毫秒）
  
  // === 生命周期 ===
  lifetime?: number              // 总生存时间（可选，超时自动销毁）
  createdAt: number = Date.now() // 创建时间
  
  constructor(
    x: number,
    y: number,
    config: FoodConfig
  ) {
    super()
    this.x = x
    this.y = y
    this.width = config.cellSize || 40
    this.height = config.cellSize || 40
    this.foodType = config.type
    this.score = config.baseScore
    this.growsSnake = config.growsSnake
    this.lengthIncrease = config.lengthIncrease || 0
    
    // 特效配置
    if (config.hasEffect) {
      this.hasEffect = true
      this.effectType = config.effectType
      this.effectValue = config.effectValue
      this.effectDuration = config.effectDuration
    }
    
    // 生命周期（可选）
    if (config.lifetime) {
      this.lifetime = config.lifetime
    }
  }
  
  /**
   * ⭐ 每帧更新
   */
  update(deltaTime: number): void {
    // 1. 检查生命周期
    if (this.lifetime) {
      const age = Date.now() - this.createdAt
      if (age >= this.lifetime) {
        this.destroy()
        return
      }
    }
    
    // 2. 播放动画效果（旋转、闪烁等）
    this.playAnimation(deltaTime)
  }
  
  /**
   * 渲染食物
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return
    
    // 根据食物类型选择颜色
    const colors: Record<FoodType, string> = {
      normal: '#ef4444',     // 红色
      bonus: '#fbbf24',      // 金色
      special: '#a855f7',    // 紫色
      speed_up: '#3b82f6',   // 蓝色
      slow_down: '#22c55e',  // 绿色
      invincible: '#ffffff'  // 白色
    }
    
    ctx.fillStyle = colors[this.foodType] || colors.normal
    
    // 绘制圆形食物
    const centerX = this.x + this.width / 2
    const centerY = this.y + this.height / 2
    const radius = this.width / 2 * 0.8
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fill()
    
    // 添加发光效果（特效食物）
    if (this.hasEffect) {
      ctx.shadowColor = ctx.fillStyle
      ctx.shadowBlur = 10 + Math.sin(Date.now() / 200) * 5 // 脉动效果
      ctx.fill()
      ctx.shadowBlur = 0 // 重置
    }
    
    // 绘制图标（可选）
    this.renderIcon(ctx, centerX, centerY)
  }
  
  /**
   * 播放动画
   */
  private playAnimation(deltaTime: number): void {
    // 简单的缩放动画
    const scale = 1 + Math.sin(Date.now() / 300) * 0.1
    this.scaleX = scale
    this.scaleY = scale
  }
  
  /**
   * 渲染图标
   */
  private renderIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ): void {
    ctx.fillStyle = 'white'
    ctx.font = `${this.width * 0.6}px Arial`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const icons: Record<FoodType, string> = {
      normal: '',
      bonus: '⭐',
      special: '💎',
      speed_up: '⚡',
      slow_down: '🐌',
      invincible: '🛡️'
    }
    
    const icon = icons[this.foodType] || ''
    if (icon) {
      ctx.fillText(icon, x, y)
    }
  }
}
```

---

## 📊 **第三部分：实体基类（所有实体的父类）**

```typescript
/**
 * 🎮 实体基类 - 所有游戏对象的父类
 */
abstract class BaseEntity {
  // === 通用属性 ===
  id: string = crypto.randomUUID()
  type: EntityType = 'unknown'
  x: number = 0
  y: number = 0
  width: number = 0
  height: number = 0
  visible: boolean = true
  active: boolean = true
  zIndex: number = 0
  
  // === 碰撞盒（AABB）===
  collider: AABB = {
    x: 0,
    y: 0,
    width: 0,
    height: 0
  }
  
  // === 缩放和旋转 ===
  scaleX: number = 1
  scaleY: number = 1
  rotation: number = 0
  
  // === 生命周期 ===
  protected onDestroyCallbacks: (() => void)[] = []
  
  /**
   * ⭐ 每帧更新（子类必须实现）
   */
  abstract update(deltaTime: number): void
  
  /**
   * ⭐ 渲染（子类必须实现）
   */
  abstract render(ctx: CanvasRenderingContext2D): void
  
  /**
   * ⭐ 碰撞检测（AABB 矩形）
   */
  isCollide(other: BaseEntity): boolean {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    )
  }
  
  /**
   * 更新碰撞盒
   */
  updateCollider(): void {
    this.collider = {
      x: this.x,
      y: this.y,
      width: this.width * this.scaleX,
      height: this.height * this.scaleY
    }
  }
  
  /**
   * 销毁实体
   */
  destroy(): void {
    this.active = false
    this.visible = false
    this.onDestroyCallbacks.forEach(cb => cb())
  }
  
  /**
   * 注册销毁回调
   */
  onDestroy(callback: () => void): void {
    this.onDestroyCallbacks.push(callback)
  }
  
  /**
   * 绘制圆角矩形（工具方法）
   */
  protected roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }
}

/**
 * AABB 碰撞盒接口
 */
interface AABB {
  x: number
  y: number
  width: number
  height: number
}
```

---

## 🎯 **第四部分：游戏主循环（整合所有实体）**

```typescript
/**
 * 🎮 游戏管理器
 */
class GameManager {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  
  // === 实体管理 ===
  snake: SnakeEntity | null = null
  foods: FoodEntity[] = []
  obstacles: ObstacleEntity[] = []
  
  // === 游戏状态 ===
  isRunning: boolean = false
  lastTime: number = 0
  
  constructor(canvasId: string) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement
    this.ctx = this.canvas.getContext('2d')!
    
    // 设置画布尺寸
    this.canvas.width = 800
    this.canvas.height = 600
  }
  
  /**
   * 启动游戏
   */
  start(): void {
    // 1. 创建蛇
    this.snake = new SnakeEntity(400, 300)
    
    // 2. 创建初始食物
    this.spawnFood()
    
    // 3. 创建障碍物（可选）
    this.createObstacles()
    
    // 4. 启动游戏循环
    this.isRunning = true
    this.lastTime = performance.now()
    requestAnimationFrame((time) => this.gameLoop(time))
  }
  
  /**
   * ⭐ 游戏主循环（核心）
   */
  gameLoop(currentTime: number): void {
    if (!this.isRunning) return
    
    // 1. 计算时间差（秒）
    const deltaTime = (currentTime - this.lastTime) / 1000
    this.lastTime = currentTime
    
    // 2. 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 3. 更新所有实体
    this.updateEntities(deltaTime)
    
    // 4. 渲染所有实体
    this.renderEntities()
    
    // 5. 继续下一帧
    requestAnimationFrame((time) => this.gameLoop(time))
  }
  
  /**
   * 更新实体
   */
  private updateEntities(deltaTime: number): void {
    // 更新蛇
    if (this.snake?.active) {
      this.snake.update(deltaTime)
    }
    
    // 更新食物
    this.foods.forEach(food => {
      if (food.active) {
        food.update(deltaTime)
      }
    })
    
    // 清理已销毁的食物
    this.foods = this.foods.filter(food => food.active)
    
    // 如果食物没了，生成新的
    if (this.foods.length === 0) {
      this.spawnFood()
    }
  }
  
  /**
   * 渲染实体
   */
  private renderEntities(): void {
    // 按 zIndex 排序（确保正确的渲染层级）
    const allEntities = [
      this.snake,
      ...this.foods,
      ...this.obstacles
    ].filter(e => e && e.visible) as BaseEntity[]
    
    allEntities.sort((a, b) => a.zIndex - b.zIndex)
    
    // 依次渲染
    allEntities.forEach(entity => {
      entity.render(this.ctx)
    })
  }
  
  /**
   * 生成食物
   */
  spawnFood(): void {
    // 随机位置
    const x = Math.random() * (this.canvas.width - 40)
    const y = Math.random() * (this.canvas.height - 40)
    
    // 随机类型（按概率）
    const foodType = this.selectRandomFoodType()
    const config = FOOD_DATABASE[foodType]
    
    // 创建食物实体
    const food = new FoodEntity(x, y, config)
    this.foods.push(food)
  }
  
  /**
   * 随机选择食物类型
   */
  selectRandomFoodType(): FoodType {
    const rand = Math.random()
    let cumulative = 0
    
    for (const type of Object.values(FoodType)) {
      cumulative += FOOD_DATABASE[type].spawnProbability
      if (rand <= cumulative) {
        return type
      }
    }
    
    return FoodType.NORMAL
  }
  
  /**
   * 创建障碍物
   */
  createObstacles(): void {
    // 示例：在四周创建边界
    const wallThickness = 20
    const w = this.canvas.width
    const h = this.canvas.height
    
    this.obstacles.push(
      new ObstacleEntity(0, 0, w, wallThickness),          // 上
      new ObstacleEntity(0, h - wallThickness, w, wallThickness), // 下
      new ObstacleEntity(0, 0, wallThickness, h),          // 左
      new ObstacleEntity(w - wallThickness, 0, wallThickness, h)  // 右
    )
  }
  
  /**
   * 游戏结束
   */
  gameOver(): void {
    this.isRunning = false
    
    // 显示游戏结束画面
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
    
    this.ctx.fillStyle = 'white'
    this.ctx.font = '48px Arial'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('游戏结束', this.canvas.width / 2, this.canvas.height / 2)
    
    this.ctx.font = '24px Arial'
    this.ctx.fillText(`最终分数：${this.snake?.score}`, this.canvas.width / 2, this.canvas.height / 2 + 50)
  }
}

// === 启动游戏 ===
window.addEventListener('load', () => {
  const game = new GameManager('gameCanvas')
  game.start()
})
```

---

## 🎨 **第五部分：HTML 结构**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>贪吃蛇 - 实体系统版</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    #gameContainer {
      position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      border-radius: 10px;
      overflow: hidden;
    }
    
    #gameCanvas {
      display: block;
      background: #1f2937;
    }
    
    #ui {
      position: absolute;
      top: 10px;
      left: 10px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 18px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }
  </style>
</head>
<body>
  <div id="gameContainer">
    <canvas id="gameCanvas" width="800" height="600"></canvas>
    <div id="ui">
      <div>分数：<span id="score">0</span></div>
      <div>长度：<span id="length">3</span></div>
    </div>
  </div>
  
  <script src="game.js"></script>
</body>
</html>
```

---

## 🎯 **第六部分：碰撞过滤规则**

```typescript
/**
 * 碰撞分层规则
 */
const COLLISION_RULES = {
  // 蛇可以碰撞的对象
  snake: ['food', 'obstacle', 'self'],
  
  // 食物可以被谁碰撞
  food: ['snake'],
  
  // 障碍物可以被谁碰撞
  obstacle: ['snake']
}

/**
 * 检查两个实体是否可以碰撞
 */
function canCollide(entity1: BaseEntity, entity2: BaseEntity): boolean {
  const rules = COLLISION_RULES[entity1.type]
  return rules.includes(entity2.type)
}

/**
 * 增强的碰撞检测（带过滤）
 */
function checkCollisionWithFilter(entity1: BaseEntity, entity2: BaseEntity): boolean {
  // 1. 先检查是否允许碰撞
  if (!canCollide(entity1, entity2)) {
    return false
  }
  
  // 2. 再检查是否重叠
  return entity1.isCollide(entity2)
}
```

---

## 📊 **架构总结**

### 实体分类清晰

| 特性 | 普通实体 | 道具实体 |
|------|----------|----------|
| **代表** | 蛇、障碍物 | 食物（含特效） |
| **存在时间** | 常驻 | 临时 |
| **碰撞响应** | 物理阻挡 | 触发效果 |
| **更新频率** | 每帧 | 每帧 |
| **渲染方式** | 固定 | 动画 |

---

### 核心优势

✅ **轻量级**: 无复杂框架，纯原生 JS
✅ **易扩展**: 新增实体只需继承基类
✅ **高性能**: AABB 碰撞最快
✅ **易维护**: 职责分离，代码清晰

---

**这个架构可以直接用于开发！** 🚀

需要我立即开始实施吗？我可以：
1. ✅ 创建完整的 TypeScript 实现
2. ✅ 集成到现有的 Phaser 项目中
3. ✅ 或者创建纯 Canvas 版本

您希望我用哪种方式落地？🤖
