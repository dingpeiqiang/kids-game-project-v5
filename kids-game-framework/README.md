# 🎮 Kids Game Framework

**版本**: v1.0.0  
**路径**: `kids-game-framework/`  
**说明**: 儿童游戏开发通用框架，从 `kids-game-house/shared/game-framework` 重构提取，作为独立子工程维护。

---

## 📦 技术栈

| 层次 | 技术 |
|------|------|
| 游戏引擎 | Phaser 3 |
| UI 框架 | Vue 3 + Composition API |
| 状态管理 | Pinia |
| 类型系统 | TypeScript 5 |
| 构建工具 | Vite 5 |
| 主题规范 | GTRS v1.0.0 |

---

## 🚀 快速开始

### 1. 在游戏项目中引用

在游戏的 `package.json` 中添加本地依赖：

```json
{
  "dependencies": {
    "@kids-game/framework": "file:../../kids-game-framework"
  }
}
```

### 2. 基础用法

```typescript
import { GameEngine } from '@kids-game/framework'

// 直接使用引擎
const game = new GameEngine(containerElement, () => console.log('游戏完成'), {
  designWidth:  720,
  designHeight: 1280,
  gridCols: 32,
  gridRows: 18,
  baseCellSize: 50
})

// 必须提供 themeId
await game.start('medium', 'theme_id_123')
```

### 3. 继承扩展（推荐方式）

```typescript
import { GameEngine } from '@kids-game/framework'
import type { GameEngineConfig } from '@kids-game/framework'

export class MyGameEngine extends GameEngine {

  constructor(element: HTMLElement, onComplete?: () => void) {
    super(element, onComplete, {
      designWidth:  720,
      designHeight: 1280,
      gridCols:     20,
      gridRows:     15,
      baseCellSize: 60
    })
  }

  // ⭐ 重写 preload：加载游戏特定资源
  protected override preload(scene: any): void {
    super.preload(scene)  // 必须调用，初始化屏幕适配 + 加载 GTRS 资源
    scene.load.image('player', '/assets/player.png')
  }

  // ⭐ 重写 create：创建游戏对象
  protected override create(scene: any): void {
    super.create(scene)
    // this.Adapt.cellSize 已可用
    const x = scene.scale.width / 2
    const y = scene.scale.height / 2
    scene.add.image(x, y, 'scene_bg_main')
  }

  // ⭐ 重写 update：游戏循环逻辑
  protected override update(time: number, delta: number): void {
    super.update(time, delta)
    // 游戏更新逻辑（delta 单位：毫秒）
  }
}
```

### 4. 在 Vue 组件中使用

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { MyGameEngine } from './MyGameEngine'
import { useGameStore, useThemeStore } from '@kids-game/framework'

const gameStore  = useGameStore()
const themeStore = useThemeStore()
const container  = ref<HTMLDivElement>()
let engine: MyGameEngine | null = null

onMounted(async () => {
  // 1. 加载主题（themeStore 负责 GTRS 校验和缓存）
  await themeStore.init()
  
  // 2. 创建引擎
  engine = new MyGameEngine(container.value!, () => {
    gameStore.endGame()
  })
  
  // 3. ⭐ 注入道具效果回调（避免在 Phaser 内调用 Pinia）
  engine.setItemEffectCallback((type) => {
    gameStore.applyItemEffect(type)
  })
  
  // 4. 启动（传入 themeStore 缓存的 GTRS JSON，避免重复请求）
  await engine.start('medium', themeStore.currentThemeId, themeStore.gtrsRawJson)
})

onUnmounted(() => {
  engine?.destroy()
})
</script>
```

---

## 📚 核心模块

### 🎯 GameEngine — 游戏引擎

核心功能：
- ✅ Phaser 初始化（响应式画布）
- ✅ GTRS 主题加载与校验
- ✅ 屏幕自适应（自动计算 cellSize）
- ✅ GTRS 图片资源批量加载
- ✅ 道具效果回调注入机制

```typescript
import { GameEngine } from '@kids-game/framework'

const engine = new GameEngine(container, callback, config)
await engine.start('medium', themeId, gtrsRawJson)
engine.getCellSize()   // 获取当前 cellSize
engine.getGTRS()       // 获取 GTRS 主题对象
engine.setSoundEnabled(false)  // 静音
engine.destroy()       // 销毁
```

---

### 📐 ScreenAdapter — 屏幕适配器

```typescript
import { ScreenAdapter } from '@kids-game/framework'

const adapter = new ScreenAdapter(720, 1280, 32, 18, 50)
adapter.calculateParams(containerW, containerH)

console.log(adapter.adapt.cellSize)    // 动态计算的单元格大小
console.log(adapter.adapt.safeTop)    // 顶部安全区
adapter.getGameAreaOffset()           // 游戏区域偏移量
```

---

### 🔊 AudioManager — 音频管理器

```typescript
import { AudioManager } from '@kids-game/framework'

const audio = new AudioManager()
audio.playBgm('gameplay', { src: '/audio/bgm.mp3', volume: 0.6, loop: true })
audio.playSound({ src: '/audio/eat.mp3', volume: 0.5 })
audio.stopAllBgm()
audio.setSoundEnabled(false)
```

---

### 🎨 GTRSLoader — GTRS 主题加载器

```typescript
import { GTRSLoader } from '@kids-game/framework'

const loader = new GTRSLoader()
const theme  = await loader.loadTheme('theme_id')
const src    = loader.getImageSrc('scene', 'snake_head')
const bgmSrc = loader.getAudioSrc('bgm', 'bgm_gameplay')
loader.assertGTRS()   // 断言已加载，否则 throw
```

---

### 🎁 ItemSystem — 道具系统

```typescript
import { ItemSystem } from '@kids-game/framework'

const items = new ItemSystem({
  enabled:        true,
  spawnInterval:  10000,   // 每 10 秒生成一个
  maxActiveItems: 3,       // 最多 3 个活跃道具
  itemLifetime:   10000    // 道具存活 10 秒
})

items.initialize(adaptParams, 32, 18)
items.start()   // 启动自动生成

// 在游戏帧循环中调用
const collected = items.update(snake)
```

---

### 📊 Pinia Stores

#### useGameStore — 游戏状态

```typescript
import { useGameStore } from '@kids-game/framework'

const gameStore = useGameStore()

// 状态
gameStore.isPlaying         // 是否游戏中
gameStore.score             // 当前分数
gameStore.itemEffects       // 道具效果状态

// 方法
gameStore.startGameWithInit(cellSize)  // 开始游戏（初始化蛇/食物）
gameStore.endGame()                    // 结束游戏
gameStore.addScore(points)             // 增加分数（自动应用倍率）
gameStore.applyItemEffect('shield')    // 应用道具效果
gameStore.moveSnake(delta, cellSize)   // 移动蛇（带碰撞检测）
```

#### useThemeStore — 主题状态

```typescript
import { useThemeStore } from '@kids-game/framework'

const themeStore = useThemeStore()

// 必须先调用 init() 初始化
await themeStore.init()

// 属性
themeStore.gtrsRawJson      // ⭐ 已校验的 GTRS JSON（供 GameEngine 复用）
themeStore.currentThemeId   // 当前主题 ID
themeStore.currentTheme     // 当前主题配置（UI 层）

// 方法
themeStore.setGameId(gameId)            // 设置游戏 ID（先调用，再加载主题列表）
await themeStore.switchTheme(themeId)   // 切换主题
```

---

### 🛠️ 工具函数

#### 颜色工具

```typescript
import { hexToNumber, lerpColor, adjustBrightness, colorToRgba } from '@kids-game/framework'

hexToNumber('#ff0000')          // → 16711680（Phaser 颜色格式）
lerpColor(0xff0000, 0x0000ff, 0.5) // → 0x7f007f
adjustBrightness(0x4ade80, 0.2)    // → 加亮
colorToRgba(0x4ade80, 0.8)         // → 'rgba(74, 222, 128, 0.8)'
```

#### 数学工具

```typescript
import { lerp, clamp, randomInt, distance, distanceSq } from '@kids-game/framework'

lerp(0, 100, 0.5)        // → 50
clamp(150, 0, 100)       // → 100
randomInt(1, 6)          // → 1~6 随机整数
distance(0, 0, 3, 4)    // → 5
distanceSq(0, 0, 3, 4)  // → 25（性能优化版）
```

#### GTRS 校验

```typescript
import { validateGTRSTheme, quickValidate, isGTRSFormat } from '@kids-game/framework'

validateGTRSTheme(jsonStr)  // → { valid: boolean, message: string }
quickValidate(jsonStr)      // → boolean（快速检查）
isGTRSFormat(jsonStr)       // → boolean（是否 GTRS 格式）
```

#### 平台 API

```typescript
import { extractAuthFromUrl, getSessionToken, reportGameResult } from '@kids-game/framework'

extractAuthFromUrl()   // 从 URL 参数提取并保存认证信息（main.ts 中调用）
getSessionToken()      // 获取 sessionToken
await reportGameResult({ sessionToken, score, duration })  // 上报成绩
```

---

## ⚙️ 配置常量

```typescript
import { GAME_CODE, AUDIO_CONFIG, DEFAULT_ENGINE_CONFIG, LANDSCAPE_ENGINE_CONFIG } from '@kids-game/framework'

GAME_CODE.SNAKE          // → 'snake'
AUDIO_CONFIG.defaultBgmVolume  // → 0.6
DEFAULT_ENGINE_CONFIG    // 竖屏手游默认配置（720x1280, 32x18格）
LANDSCAPE_ENGINE_CONFIG  // 横屏游戏配置（1280x720, 20x12格）
```

---

## 🏗️ 项目结构

```
kids-game-framework/
├── src/
│   ├── core/
│   │   └── GameEngine.ts      # ⭐ 核心引擎（所有游戏继承此类）
│   ├── components/
│   │   ├── ScreenAdapter.ts   # 屏幕自适应计算
│   │   ├── AudioManager.ts    # 音频管理（BGM + 音效）
│   │   ├── GTRSLoader.ts      # GTRS 主题加载器
│   │   ├── ItemManager.ts     # 道具管理（碰撞/效果）
│   │   └── ItemSystem.ts      # 道具系统（自动生成）
│   ├── stores/
│   │   ├── game.store.ts      # 游戏状态（Pinia）
│   │   └── theme.store.ts     # 主题状态（Pinia）
│   ├── types/
│   │   ├── game.types.ts      # 游戏核心类型
│   │   └── gtrs.types.ts      # GTRS 规范类型
│   ├── utils/
│   │   ├── gtrs-validator.ts  # GTRS 轻量校验
│   │   ├── color-utils.ts     # 颜色工具函数
│   │   ├── math-utils.ts      # 数学工具函数
│   │   └── platform-api.ts   # 平台 API 封装
│   ├── config/
│   │   ├── game.config.ts     # 游戏配置常量
│   │   └── default.config.ts  # 框架默认配置
│   └── index.ts               # 统一导出入口
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## ⚠️ 重要设计原则

### 1. Pinia 必须在 Vue setup 中调用

```typescript
// ❌ 错误：在 Phaser class 中调用 Pinia
export class MyGame extends GameEngine {
  protected create(scene: any) {
    const store = useGameStore()  // ❌ 不要这样做！
  }
}

// ✅ 正确：在 Vue 组件中注入回调
// Vue 组件
engine.setItemEffectCallback(type => gameStore.applyItemEffect(type))

// Phaser class
protected onItemCollect(type: string) {
  this.onItemEffect?.(type)  // ✅ 通过回调委托
}
```

### 2. GTRS 主题必须严格校验

```typescript
// ❌ 不允许：主题加载失败时静默降级
// ✅ 正确：任何加载失败必须 throw，让 Vue 组件显示错误 UI
await themeStore.init()  // 失败会 throw，让上层处理
```

### 3. 资源路径不含 /public/ 前缀

```
正确：/games/snake/themes/default/images/scene_bg.png
错误：/public/games/snake/themes/default/images/scene_bg.png
```

### 4. 使用 themeStore.gtrsRawJson 避免重复请求

```typescript
// ✅ themeStore 加载主题后，将 GTRS JSON 缓存
// GameEngine.start() 第三个参数传入缓存，避免重复下载
await engine.start('medium', themeId, themeStore.gtrsRawJson)
```

---

## 🔗 相关文档

- [GTRS 规范](../kids-game-house/shared/game-framework/ARCHITECTURE.md)
- [贪吃蛇游戏示例](../kids-game-house/games/snake/)
- [主题制作指南](../kids-game-frontend/src/components/GTRSThemeCreatorV2.vue)

---

**维护者**: Sitech AI Team  
**最后更新**: 2026-03-27
