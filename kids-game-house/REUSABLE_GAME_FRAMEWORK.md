# 🎮 可复用游戏开发框架

**版本**: v1.0  
**基于**: 贪吃蛇游戏项目  
**目标**: 提取通用游戏框架，支持快速开发新游戏

---

## 📋 目录

1. [框架概述](#框架概述)
2. [核心架构](#核心架构)
3. [可复用组件](#可复用组件)
4. [游戏特定代码](#游戏特定代码)
5. [新游戏开发指南](#新游戏开发指南)
6. [代码参考示例](#代码参考示例)

---

## 框架概述

### 🎯 设计目标

- ✅ **高度可复用**: 80% 代码可直接用于其他游戏
- ✅ **组件化**: 清晰的职责分离，易于维护和扩展
- ✅ **屏幕适配**: 自动适配所有设备和屏幕尺寸
- ✅ **主题系统**: 支持 GTRS 主题配置
- ✅ **音频管理**: 统一的音频播放控制
- ✅ **道具系统**: 通用道具引擎（可选）

### 📊 代码复用率

```
┌─────────────────────────────────────┐
│  可复用框架层 (80%)                 │ ← 所有游戏通用
│  ├─ Phaser 引擎封装                 │
│  ├─ GTRS 主题加载系统               │
│  ├─ 屏幕自适应系统                  │
│  ├─ 音频管理系统                    │
│  ├─ 资源管理系统                    │
│  └─ 道具系统                        │
├─────────────────────────────────────┤
│  游戏特定层 (20%)                   │ ← 需要根据新游戏修改
│  ├─ 游戏对象渲染                    │
│  ├─ 游戏逻辑                        │
│  └─ 特定规则                        │
└─────────────────────────────────────┘
```

---

## 核心架构

### 三层架构模型

```
┌──────────────────────────────────────────┐
│  Vue 组件层 (SnakeGame.vue)              │ 
│  ├─ 游戏状态管理                         │
│  ├─ UI 渲染                              │
│  └─ 用户交互                             │
├──────────────────────────────────────────┤
│  Phaser 游戏层 (PhaserGame.ts)           │
│  ├─ 【可复用框架层】(1-600 行)            │ ← 直接复制
│  │  ├─ GTRS 加载、屏幕适配、音频管理     │
│  │  └─ Phaser 初始化、资源加载           │
│  ├─ 【游戏特定层】(600 行以后)            │ ← 修改这部分
│  │  ├─ renderSnake() → renderXXX()       │
│  │  ├─ renderFood()  → renderYYY()       │
│  │  └─ 其他游戏特定渲染逻辑              │
│  └───────────────────────────────────────┘
├──────────────────────────────────────────┤
│  组件库层 (components/)                  │
│  ├─ GTRSLoader.ts    - 主题加载          │
│  ├─ ScreenAdapter.ts - 屏幕适配          │
│  ├─ AudioManager.ts  - 音频管理          │
│  ├─ ItemSystem.ts    - 道具系统          │
│  └─ XXXRenderer.ts   - 渲染器 (按需创建)  │
└──────────────────────────────────────────┘
```

### 执行流程

```
启动游戏
  ↓
1. Vue 组件创建 SnakePhaserGame 实例
  ↓
2. 调用 game.start(difficulty, themeId)
  ↓
3. loadTheme(themeId) - 加载主题
  ↓
4. Phaser.Game 初始化
  ↓
5. Phaser 场景生命周期:
   ├─ preload() - 计算适配、加载资源
   ├─ create()  - 创建游戏对象
   └─ update()  - 游戏循环更新
```

---

## 可复用组件

### ✅ 完全可复用（无需修改）

#### 1. GTRSLoader - 主题加载器

**文件**: `components/GTRSLoader.ts`  
**职责**: 从后端加载 GTRS 主题并校验

```typescript
const loader = new GTRSLoader()
await loader.loadTheme('theme_id')
const theme = loader.assertGTRS()
```

**核心方法**:
- `loadTheme(themeId: string)` - 加载主题
- `assertGTRS()` - 获取主题对象
- `getThemeAssetKey(assetName)` - 获取主题资源 key

---

#### 2. ScreenAdapter - 屏幕适配器

**文件**: `components/ScreenAdapter.ts`  
**职责**: 计算屏幕适配参数，保证游戏在所有设备上正常显示

```typescript
const adapter = new ScreenAdapter(
  720,   // 设计宽度
  1280,  // 设计高度
  32,    // 网格列数
  18,    // 网格行数
  50     // 基础单元格大小
)

adapter.calculateParams(containerWidth, containerHeight)
// 输出：adapt.cellSize, adapt.safeTop, adapt.safeBottom 等
```

**核心参数**:
- `adapt.cellSize` - 动态计算的单元格大小
- `adapt.safeTop` - 顶部安全区（避开刘海屏）
- `adapt.safeBottom` - 底部安全区（避开手势条）
- `adapt.scale` - 全局缩放比

---

#### 3. AudioManager - 音频管理器

**文件**: `components/AudioManager.ts`  
**职责**: 使用 HTML5 Audio 管理背景音乐和音效

```typescript
const audio = new AudioManager()

// 播放 BGM
audio.playBgm('main', {
  src: assertGTRS().bgm?.main?.src,
  volume: 0.6,
  loop: true
})

// 播放音效
audio.playSound('eat', {
  src: assertGTRS().sound?.eat?.src,
  volume: 0.8
})

// 静音控制
audio.setSoundEnabled(false)
```

---

#### 4. ItemSystem - 道具系统

**文件**: `components/ItemSystem.ts`  
**职责**: 通用道具生成、渲染、碰撞检测

```typescript
const itemSystem = new ItemSystem({
  enabled: true,
  spawnInterval: 10000,    // 10 秒生成一个
  maxActiveItems: 3,       // 最多 3 个活跃道具
  itemLifetime: 10000,     // 道具存活 10 秒
  debugMode: true
})

itemSystem.initialize(adaptParams, GRID_COLS, GRID_ROWS)
itemSystem.setScene(scene)
itemSystem.update(snake, food)
```

**特性**:
- ✅ 自动定时生成道具
- ✅ 道具渲染（文本 + 图标）
- ✅ 碰撞检测
- ✅ 道具效果触发
- ✅ 道具消失倒计时

---

#### 5. PhaserGame 框架部分

**文件**: `PhaserGame.ts` (第 1-600 行)  
**职责**: Phaser 引擎封装、主题加载、屏幕适配、资源管理

**可复用方法**:
- `start(difficulty, themeId)` - 启动游戏
- `loadTheme(themeId)` - 加载主题
- `preload(scene)` - 预加载资源
- `create(scene)` - 创建场景
- `update(time, delta)` - 游戏循环
- `getCellSize()` - 获取单元格大小
- `setSoundEnabled(enabled)` - 设置声音

---

### ⚠️ 需要修改的部分

#### 1. 游戏配置常量

在 `PhaserGame.ts` 中修改这些配置:

```typescript
// 👉 设计基准（根据游戏类型调整）
private readonly DESIGN_WIDTH = 720      // 竖屏游戏
private readonly DESIGN_HEIGHT = 1280

// 👉 游戏网格配置（⚠️ 根据具体游戏玩法修改）
private readonly GRID_COLS = 32          // ⚠️ 修改为游戏的列数
private readonly GRID_ROWS = 18          // ⚠️ 修改为游戏的行数

// 👉 基础单元格大小（像素）
private readonly BASE_CELL_SIZE = 50     // ⚠️ 根据游戏需求调整
```

---

#### 2. 游戏对象引用

在 `PhaserGame.ts` 中定义游戏特定的对象:

```typescript
// ============================================================================
// 🎨【游戏特定层】游戏对象引用（根据具体游戏修改）
// ============================================================================

// 👉 贪吃蛇示例（⚠️ 其他游戏替换为自己的对象）
private snakeGroup: Phaser.GameObjects.Group | null = null    // ⚠️ 蛇群组
private foodSprite: Phaser.GameObjects.Graphics | null = null // ⚠️ 食物精灵
private obstacleGroup: Phaser.GameObjects.Group | null = null // ⚠️ 障碍物
private particles: Phaser.GameObjects.Particles.ParticleEmitter | null = null

// 👉 新游戏示例（飞机大战）:
// private playerShip: Phaser.GameObjects.Sprite | null = null
// private enemyGroup: Phaser.GameObjects.Group | null = null
// private bulletGroup: Phaser.GameObjects.Group | null = null
// private powerupGroup: Phaser.GameObjects.Group | null = null
```

---

#### 3. 渲染方法

在 `PhaserGame.ts` 中实现游戏特定的渲染方法:

```typescript
// ============================================================================
// 🎨【游戏特定层】渲染方法（每个游戏都不同）
// ============================================================================

/**
 * ⭐ 渲染玩家角色 - 游戏特定方法
 * ⚠️ 注意：这是游戏特定的，其他游戏需要实现自己的渲染逻辑
 */
private renderPlayer(playerData: any): void {
  if (!this.scene || !this.playerShip) return
  
  // 👉 实现你的玩家渲染逻辑
  // 例如：飞机、坦克、角色等
}

/**
 * ⭐ 渲染敌人 - 游戏特定方法
 */
private renderEnemy(enemyData: any): void {
  if (!this.scene) return
  
  // 👉 实现你的敌人渲染逻辑
}

/**
 * ⭐ 渲染子弹 - 游戏特定方法
 */
private renderBullet(bulletData: any): void {
  if (!this.scene) return
  
  // 👉 实现你的子弹渲染逻辑
}
```

---

## 新游戏开发指南

### 步骤 1: 复制框架文件

```bash
# 1. 复制 PhaserGame.ts 到新游戏目录
cp games/snake/src/components/game/PhaserGame.ts \
   games/your-game/src/components/game/YourGamePhaser.ts

# 2. 复制组件库（可选，如果需要使用）
cp games/snake/src/components/game/components/*.ts \
   games/your-game/src/components/game/components/
```

---

### 步骤 2: 修改类名和配置

打开 `YourGamePhaser.ts`:

```typescript
// 1. 修改类名
export class YourGamePhaserGame {  // 👈 改为你的游戏名
  
  // 2. 修改游戏配置
  private readonly DESIGN_WIDTH = 720
  private readonly DESIGN_HEIGHT = 1280
  private readonly GRID_COLS = 20      // 👈 修改为你的网格列数
  private readonly GRID_ROWS = 15      // 👈 修改为你的网格行数
  private readonly BASE_CELL_SIZE = 60 // 👈 修改为你的单元格大小
  
  // 3. 修改游戏对象引用
  private player: Phaser.GameObjects.Sprite | null = null    // 👈 你的对象
  private enemies: Phaser.GameObjects.Group | null = null    // 👈 你的对象
  
  // 4. 实现渲染方法
  private renderPlayer(data: any): void {
    // 👈 实现你的渲染逻辑
  }
  
  private renderEnemies(data: any): void {
    // 👈 实现你的渲染逻辑
  }
}
```

---

### 步骤 3: 创建 Vue 组件

创建 `YourGame.vue`:

```vue
<template>
  <div class="your-game-container">
    <!-- 游戏画布 -->
    <div ref="gameContainer" class="game-canvas"></div>
    
    <!-- 游戏 UI -->
    <div class="game-ui">
      <ScorePanel :score="gameStore.score" />
      <ControlButtons />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { YourGamePhaserGame } from './YourGamePhaser'
import { useGameStore } from '@/stores/game'

const gameContainer = ref<HTMLElement | null>(null)
const gameStore = useGameStore()

let phaserGame: YourGamePhaserGame | null = null

onMounted(async () => {
  // 1. 创建游戏实例
  phaserGame = new YourGamePhaserGame(
    gameContainer.value!,
    () => {
      console.log('游戏完成!')
      gameStore.setGameOver()
    }
  )
  
  // 2. 启动游戏
  await phaserGame.start('medium', 'your_theme_id')
  
  // 3. 开始游戏循环（如果需要）
  // phaserGame.update(...)
})
</script>
```

---

### 步骤 4: 实现游戏逻辑

在游戏主类中添加游戏特定逻辑:

```typescript
export class YourGamePhaserGame {
  // ... 前面的代码 ...
  
  /**
   * ⭐ 游戏循环 - 每帧调用
   */
  private update(time: number, delta: number): void {
    if (!this.scene) return
    
    // 1. 更新玩家位置
    this.updatePlayer()
    
    // 2. 更新敌人位置
    this.updateEnemies()
    
    // 3. 碰撞检测
    this.checkCollisions()
    
    // 4. 更新分数
    this.updateScore()
  }
  
  /**
   * ⭐ 处理键盘输入
   */
  private handleInput(key: string): void {
    switch(key) {
      case 'ArrowUp':
      case 'W':
        // 👉 实现你的控制逻辑
        break
      case 'ArrowDown':
      case 'S':
        // 👉 实现你的控制逻辑
        break
    }
  }
}
```

---

### 步骤 5: 集成道具系统（可选）

如果需要使用道具系统:

```typescript
export class YourGamePhaserGame {
  private itemSystem: ItemSystem
  
  constructor(element: HTMLElement, onGameComplete?: () => void) {
    // 1. 初始化道具系统
    this.itemSystem = new ItemSystem({
      enabled: true,
      spawnInterval: 10000,
      maxActiveItems: 3,
      itemLifetime: 10000,
      debugMode: true
    })
  }
  
  private preload(scene: Phaser.Scene): void {
    // ... 原有代码 ...
    
    // 2. 初始化道具系统
    this.itemSystem.initialize(this.Adapt, this.GRID_COLS, this.GRID_ROWS)
  }
  
  private create(scene: Phaser.Scene): void {
    // ... 原有代码 ...
    
    // 3. 设置道具系统场景
    this.itemSystem.setScene(scene)
  }
  
  private update(time: number, delta: number): void {
    // ... 原有代码 ...
    
    // 4. 更新道具系统
    this.itemSystem.update(this.player, this.enemies)
  }
  
  /**
   * 🎁 道具收集回调（由外部注入）
   */
  setItemEffectCallback(callback: (type: string) => void): void {
    this.itemSystem.setItemCollectedCallback((event) => {
      callback(event.item.type)
    })
  }
}
```

---

## 代码参考示例

### 示例 1: 屏幕适配计算

```typescript
// ============================================================================
// 📐【可复用框架层】屏幕适配计算 - 所有游戏通用
// ============================================================================
// 📌 说明：这段代码保证游戏在任何设备上都能正确显示
// ⚠️ 参考：直接复制到新游戏，无需修改
// ============================================================================

/**
 * ⭐ 计算屏幕适配参数
 */
private calculateAdaptParams(containerWidth: number, containerHeight: number): void {
  // 1. 获取设备真实尺寸
  this.Adapt.screenW = containerWidth
  this.Adapt.screenH = containerHeight
  
  // 2. 计算安全区域（手机刘海/底部手势条）
  this.Adapt.safeTop = Math.max(44, this.Adapt.screenH * 0.05)
  this.Adapt.safeBottom = Math.max(34, this.Adapt.screenH * 0.08)
  
  // 3. 计算动态单元格大小（保证游戏区域完全显示）
  const baseCellSize = 50
  const gameAreaWidth = this.GRID_COLS * baseCellSize
  const gameAreaHeight = this.GRID_ROWS * baseCellSize
  
  // 可用空间（减去安全区域和边距）
  const availableWidth = (this.Adapt.screenW - 20) * 0.95
  const availableHeight = (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom) * 0.9
  
  // 计算缩放系数
  const scaleByWidth = availableWidth / gameAreaWidth
  const scaleByHeight = availableHeight / gameAreaHeight
  
  // 取最小值，保证游戏区域完全显示
  const finalScale = Math.min(scaleByWidth, scaleByHeight, 1.5)  // 最大放大 1.5 倍
  this.Adapt.cellSize = baseCellSize * finalScale
  
  const actualGameWidth = this.GRID_COLS * this.Adapt.cellSize
  const actualGameHeight = this.GRID_ROWS * this.Adapt.cellSize
  
  console.log('🎯 最终游戏区域:', {
    cellSize: this.Adapt.cellSize.toFixed(2),
    size: `${actualGameWidth.toFixed(0)} × ${actualGameHeight.toFixed(0)}`,
    fitsInScreen: actualGameWidth <= this.Adapt.screenW && 
                  actualGameHeight <= (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom)
  })
}

// 💡 使用提示:
// 1. 这段代码保证游戏区域始终居中显示
// 2. 自动适配手机、平板、电脑所有尺寸
// 3. 安全区域避开刘海屏和底部手势条
// 4. cellSize 会根据屏幕大小自动调整
```

---

### 示例 2: GTRS 主题加载

```typescript
// ============================================================================
// 🎨【可复用框架层】GTRS 主题加载系统 - 所有游戏通用
// ============================================================================
// 📌 说明：从后端加载主题配置，包含严格的 GTRS 校验
// ⚠️ 参考：直接复制到新游戏，无需修改
// ============================================================================

/**
 * ⭐ 加载主题并赋值 GTRS（含严格 GTRS 校验）
 * 
 * @param themeId 主题 ID
 * @throws Error 主题未登录 / 加载失败 / GTRS 校验不通过时
 */
private async loadTheme(themeId: string): Promise<void> {
  const themeStore = useThemeStore()
  let configJsonStr: string

  // ⭐ 优先复用 themeStore 已加载的 GTRS（避免重复请求）
  if (themeStore.gtrsRawJson) {
    console.log('[PhaserGame] ♻️ 复用 themeStore 已加载的 GTRS 主题')
    configJsonStr = themeStore.gtrsRawJson
  } else {
    // ⭐ gtrsRawJson 为空，从后端获取
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('[PhaserGame] 用户未登录，无法加载主题。请先登录后再启动游戏。')
    }

    console.log('[PhaserGame] 🔄 从后端加载 GTRS 主题')
    const response = await fetch(
      `http://localhost:8080/api/theme/download?id=${themeId}`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )

    if (!response.ok) {
      throw new Error(`[PhaserGame] 主题加载失败：HTTP ${response.status}`)
    }

    const result = await response.json()
    if (result.code !== 200 || !result.data) {
      throw new Error(
        `[PhaserGame] 主题加载失败：服务端 code=${result.code}, message=${result.message}`
      )
    }

    // ⭐ 提取 configJson（支持后端多种包装格式）
    const raw = result.data
    if (typeof raw === 'string') {
      configJsonStr = raw
    } else if (raw.configJson !== undefined) {
      configJsonStr = typeof raw.configJson === 'string'
        ? raw.configJson
        : JSON.stringify(raw.configJson)
    } else {
      configJsonStr = JSON.stringify(raw)
    }
  }

  // ⭐ GTRS 严格校验（无论从哪里获取都需要校验）
  const validationResult = validateGTRSTheme(configJsonStr)
  if (!validationResult.valid) {
    throw new Error(
      `[PhaserGame] 主题 ${themeId} GTRS 校验失败，游戏无法启动：\n${validationResult.message}`
    )
  }

  // 校验通过，直接赋值（不兜底合并）
  const themeConfig: GTRSTheme = JSON.parse(configJsonStr)
  applyGTRS(themeConfig)
  console.log(
    `[PhaserGame] ✅ GTRS 主题已加载：${GTRS!.themeInfo?.themeName || '未命名'} (id=${themeId})`
  )
}

// 💡 使用提示:
// 1. 优先从 themeStore 缓存读取，避免重复请求
// 2. 仅当缓存为空时才从后端获取
// 3. 无论来源都必须通过 GTRS 校验
// 4. 校验失败直接抛出错误，游戏无法启动
// 5. 支持后端多种数据包装格式
```

---

### 示例 3: 蛇渲染（游戏特定示例）

```typescript
// ============================================================================
// 🎨【游戏特定层】蛇渲染组件 - 贪吃蛇游戏示例
// ============================================================================
// 📌 说明：这是贪吃蛇游戏特定的渲染逻辑，其他游戏需要实现自己的渲染
// ⚠️ 参考：学习如何将渲染逻辑封装到独立方法
// ============================================================================

/**
 * ⭐ 渲染蛇 - 贪吃蛇游戏核心渲染方法
 * 
 * @param snake 蛇身数组
 * @param headRotation 蛇头旋转角度（弧度）
 */
private renderSnake(snake: SnakeSegment[], headRotation: number = 0): void {
  if (!this.scene || !this.snakeGroup) return

  const scene = this.scene
  const group = this.snakeGroup
  const cellSize = this.Adapt.cellSize

  // 计算游戏区域偏移（居中显示）
  const gameWidth = 32 * cellSize   // GRID_COLS = 32
  const gameHeight = 18 * cellSize  // GRID_ROWS = 18
  const offsetX = (this.Adapt.screenW - gameWidth) / 2
  const offsetY = this.Adapt.safeTop + 
    (this.Adapt.screenH - this.Adapt.safeTop - this.Adapt.safeBottom - gameHeight) / 2

  // 清除旧的蛇
  group.clear(true, true)

  // 绘制蛇身（遍历每一段）
  snake.forEach((segment, index) => {
    const x = offsetX + segment.x
    const y = offsetY + segment.y
    const size = cellSize * 0.70  // 蛇身大小 = cellSize 的 70%

    if (index === 0) {
      // 🐍 蛇头 - 优先使用主题资源
      const headKey = this.getThemeAssetKey('snake_head')
      if (headKey) {
        const sprite = scene.add.image(x, y, headKey)
        const displaySize = Math.max(size, 16)
        sprite.setDisplaySize(displaySize, displaySize)
        sprite.setRotation(headRotation)  // 👈 应用旋转角度
        group.add(sprite)
      } else {
        // 降级方案：绘制圆形头部
        this.createSnakeHead(scene, x, y, size)
      }
      
    } else if (index === snake.length - 1) {
      // 🐍 蛇尾 - 优先使用主题资源
      const tailKey = this.getThemeAssetKey('snake_tail')
      if (tailKey) {
        const sprite = scene.add.image(x, y, tailKey)
        const displaySize = Math.max(size * 0.7, 16)  // 蛇尾更小
        sprite.setDisplaySize(displaySize, displaySize)
        group.add(sprite)
      } else {
        // 降级方案：渐变透明圆形
        const alpha = 1 - (index / snake.length) * 0.5
        const color = this.themeColors.snakeBody
        const circle = scene.add.circle(x, y, size / 2 * 0.9, color, alpha)
        group.add(circle)
      }
      
    } else {
      // 🐍 蛇身 - 优先使用主题资源
      const bodyKey = this.getThemeAssetKey('snake_body')
      if (bodyKey) {
        const sprite = scene.add.image(x, y, bodyKey)
        const displaySize = Math.max(size * 0.9, 16)
        sprite.setDisplaySize(displaySize, displaySize)
        group.add(sprite)
      } else {
        // 降级方案：渐变透明圆形
        const alpha = 1 - (index / snake.length) * 0.5
        const color = this.themeColors.snakeBody
        const circle = scene.add.circle(x, y, size / 2, color, alpha)
        group.add(circle)
      }
    }
  })
}

// 💡 参考要点:
// 1. 优先使用主题资源（GTRS 配置）
// 2. 提供降级方案（无主题资源时的备选）
// 3. 使用 group.clear() 清除旧对象，避免重叠
// 4. 蛇头、蛇身、蛇尾分别处理，视觉效果更好
// 5. 支持旋转角度（蛇头朝向）
// 6. 渐变透明效果（蛇身透明度递减）

// 🔧 新游戏参考:
// - 飞机大战：renderPlayerShip(), renderEnemy(), renderBullet()
// - 坦克大战：renderTank(), renderBullet(), renderWall()
// - 俄罗斯方块：renderBlock(), renderGrid(), renderNextPiece()
```

---

### 示例 4: 道具系统集成

```typescript
// ============================================================================
// 🎁【框架层】道具系统集成 - 所有游戏通用
// ============================================================================
// 📌 说明：道具系统是完全通用的，可以直接复用到任何游戏
// ⚠️ 参考：学习如何集成第三方系统
// ============================================================================

// 👉 在构造函数中初始化
constructor(element: HTMLElement, onGameComplete?: () => void) {
  // ... 其他代码 ...
  
  // 🎁 初始化道具系统
  this.itemSystem = new ItemSystem({
    enabled: true,
    spawnInterval: 10000,    // 10 秒生成一个道具
    maxActiveItems: 3,       // 最多 3 个活跃道具
    itemLifetime: 10000,     // 道具存活 10 秒
    debugMode: true          // 调试模式
  })
}

// 👉 在 preload 中初始化
private preload(scene: Phaser.Scene): void {
  // ... 其他代码 ...
  
  // 🎁 初始化道具系统（确保 cellSize 已计算）
  if (this.Adapt.cellSize <= 0) {
    console.warn('⚠️ cellSize 未正确计算，重新执行适配...')
    // 重新计算适配参数...
  }
  
  console.log('🎁 初始化道具系统，cellSize:', this.Adapt.cellSize.toFixed(2))
  this.itemSystem.initialize(this.Adapt, this.GRID_COLS, this.GRID_ROWS)
  console.log('🎁 道具系统已初始化')
}

// 👉 在 create 中设置场景
private create(scene: Phaser.Scene): void {
  // ... 其他代码 ...
  
  // 🎁 设置道具系统的场景（用于渲染）
  if (this.itemSystem && this.itemSystem.getIsInitialized()) {
    this.itemSystem.setScene(scene)
    console.log('🎁 道具系统场景已设置')
  }
}

// 👉 在 update 中更新道具系统
private update(time: number, delta: number): void {
  // ... 其他代码 ...
  
  // 🎁 更新道具系统（生成道具、碰撞检测）
  if (this.itemSystem && this.itemSystem.getIsInitialized()) {
    this.itemSystem.update(this.currentSnake, [])
  }
}

// 💡 使用提示:
// 1. 道具系统是完全通用的，可以直接复制到其他游戏
// 2. 需要在三个地方调用：initialize(), setScene(), update()
// 3. 道具效果回调由外部 Vue 组件注入（避免在 Phaser 中调用 Pinia）
// 4. 支持自定义配置：生成间隔、最大数量、存活时间等
// 5. 调试模式会输出详细日志，方便排查问题
```

---

### 示例 5: 资源加载进度监听

```typescript
// ============================================================================
// 📥【可复用框架层】资源加载进度监听 - 所有游戏通用
// ============================================================================
// 📌 说明：监听 Phaser 资源加载进度，用于显示 Loading UI
// ⚠️ 参考：直接复制到新游戏，无需修改
// ============================================================================

/**
 * ⭐ 预加载阶段 - 包含资源加载进度监听
 */
private preload(scene: Phaser.Scene): void {
  this.scene = scene
  
  if (!this.containerElement) {
    console.warn('⚠️ 容器元素未设置')
    return
  }
  
  // ⭐ 添加资源加载进度监听
  const totalResourcesToLoad = this.countResourcesToLoad()
  let loadedResources = 0
  
  scene.load.on('filecomplete', () => {
    loadedResources++
    const progress = (loadedResources / totalResourcesToLoad) * 100
    console.log(`📥 资源加载进度：${loadedResources}/${totalResourcesToLoad} (${progress.toFixed(1)}%)`)
    
    // 📥 回调给外部 UI（Vue 组件可以显示进度条）
    this.onProgress?.(progress)
  })
  
  scene.load.on('complete', () => {
    console.log('✅ 所有资源加载完成')
    // 📥 确保最终进度为 100%
    this.onProgress?.(100)
  })
  
  scene.load.on('error', (key: string, type: string, message: string) => {
    console.warn(`⚠️ 资源加载失败：${key} (${type}) - ${message}`)
  })
  
  // 加载 GTRS 中配置的所有图片资源
  this.loadGTRSImages(scene)
  
  // ... 其他代码 ...
}

// 💡 使用提示:
// 1. 在 Vue 组件中设置进度回调
// 2. 进度值范围：0-100
// 3. 可以用于显示进度条、百分比等
// 4. 加载失败时会触发 error 事件
// 5. 最终 complete 事件确保进度为 100%

// 🔧 Vue 组件使用示例:
// const progress = ref(0)
// const game = new SnakePhaserGame(container, () => {})
// game.setProgressCallback((p) => {
//   progress.value = p
// })
// await game.start('medium', 'theme_id')
```

---

## 最佳实践

### ✅ 推荐做法

1. **保持框架层不变**
   - 不要修改 `PhaserGame.ts` 的前 600 行
   - 只修改游戏特定层的渲染方法
   - 组件库尽量复用，避免重复造轮子

2. **使用组件化架构**
   - 每个组件职责单一（GTRS 加载、屏幕适配、音频管理等）
   - 通过编排器组合调用
   - 便于单元测试和维护

3. **遵循现有编码规范**
   - 使用 TypeScript 强类型
   - 详细的注释和文档
   - 统一的命名规范

4. **优先使用主题资源**
   - 优先从 GTRS 读取资源配置
   - 提供降级方案（无主题时的备选）
   - 支持热切换主题

---

### ❌ 避免的做法

1. **硬编码资源配置**
   ```typescript
   // ❌ 错误：硬编码颜色值
   const color = 0x4ade80
   
   // ✅ 正确：从主题读取
   const color = this.themeColors.snakeBody
   ```

2. **忽略屏幕适配**
   ```typescript
   // ❌ 错误：固定像素值
   const size = 50
   
   // ✅ 正确：使用动态 cellSize
   const size = this.Adapt.cellSize * 0.7
   ```

3. **在 Phaser 中直接调用 Pinia**
   ```typescript
   // ❌ 错误：在 Phaser class 内部调用 useGameStore()
   const gameStore = useGameStore()
   
   // ✅ 正确：通过回调注入
   this.setItemEffectCallback((type) => {
     gameStore.applyItemEffect(type)
   })
   ```

---

## 总结

### 🎯 核心思想

- **80% 可复用**: 框架层代码完全通用
- **20% 定制化**: 只需修改游戏特定的渲染和逻辑
- **组件化**: 清晰的职责分离，易于维护
- **渐进式**: 可以逐步添加功能，不需要一步到位

### 📚 相关文档

- [GAME_DEVELOPMENT_STANDARD.md](./GAME_DEVELOPMENT_STANDARD.md) - 游戏开发标准
- [COMPONENT_USAGE_GUIDE.md](./games/snake/src/components/game/components/COMPONENT_USAGE_GUIDE.md) - 组件使用指南
- [GTRS_VALIDATION_GUIDE.md](./shared/game-framework/GTRS_VALIDATION_GUIDE.md) - GTRS 校验指南

### 🚀 下一步

1. 选择一个想做的游戏
2. 复制本框架
3. 按照指南修改配置
4. 实现游戏特定逻辑
5. 测试运行

---

**最后更新**: 2026-03-27  
**状态**: ✅ 框架已提取完成  
**适用版本**: Phaser 3.x + Vue 3.x + TypeScript
