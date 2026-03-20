# GTRS v1.0.0 游戏集成指南

## 📋 概述

本文档提供了将 Phaser3 游戏集成到 GTRS v1.0.0 主题系统的完整指南。

## 🎯 集成目标

1. ✅ 游戏支持 GTRS 主题加载
2. ✅ 游戏支持 GTRS 资源预加载
3. ✅ 游戏支持 GTRS 全局样式应用
4. ✅ 游戏支持 GTRS 资源获取
5. ✅ 游戏支持默认主题兜底

## 📦 集成准备

### 1. 安装依赖

**前端依赖** (package.json):
```json
{
  "ajv": "^8.12.0"
}
```

### 2. 复制必要文件

将以下文件复制到游戏项目：

```bash
# 复制 GTRS 加载器
cp kids-game-house/shared/utils/GTRSThemeLoader.ts <game-project>/src/utils/

# 复制 GTRS 应用器
cp kids-game-house/shared/utils/GTRSThemeApplier.ts <game-project>/src/utils/

# 复制 GTRS 类型定义
cp kids-game-frontend/src/types/gtrs-theme.ts <game-project>/src/types/

# 复制 GTRS Schema
cp kids-game-frontend/src/schemas/gtrs-schema.json <game-project>/src/schemas/
```

## 🚀 集成步骤

### 步骤 1：创建游戏主题模板

在游戏的 `src/config/` 目录下创建 GTRS 主题模板：

**贪吃蛇示例** (`gtrs-theme-snake.json`):
```json
{
  "specMeta": {
    "specName": "GTRS",
    "specVersion": "1.0.0",
    "compatibleVersion": "1.0.0"
  },
  "themeInfo": {
    "themeId": "snake_game_theme_default",
    "gameId": "game_snake_v3",
    "themeName": "贪吃蛇默认主题",
    "isDefault": true
  },
  "globalStyle": {
    "primaryColor": "#4CAF50",
    "bgColor": "#2E7D32",
    "textColor": "#FFFFFF"
  },
  "resources": {
    "images": {
      "login": {},
      "scene": {
        "snake_head": {
          "src": "assets/snake_head.png",
          "type": "png",
          "alias": "蛇头"
        }
      },
      "ui": {},
      "icon": {},
      "effect": {}
    },
    "audio": {
      "bgm": {},
      "effect": {},
      "voice": {}
    },
    "video": {}
  }
}
```

### 步骤 2：集成 GTRS 加载器

在游戏入口文件中集成 GTRS 加载器：

```typescript
// main.ts 或 index.ts
import { loadTheme, loadThemeFromAPI } from './utils/GTRSThemeLoader'

// 加载默认主题
async function initGame() {
  try {
    // 从后端 API 加载主题
    const themeId = localStorage.getItem('selectedThemeId') || 'default'

    const result = await loadThemeFromAPI(
      themeId,
      localStorage.getItem('userToken') || undefined
    )

    if (result.success) {
      console.log(`主题加载成功: ${result.themeName}`)
    } else {
      console.warn('主题加载失败，使用默认主题')
    }

    // 初始化游戏
    // ...
  } catch (error) {
    console.error('游戏初始化失败', error)
  }
}

initGame()
```

### 步骤 3：创建 GTRS 场景基类

使用 GTRS 主题应用器创建游戏场景：

```typescript
// scenes/GameScene.ts
import { GTRSThemeScene } from '../utils/GTRSThemeApplier'

export class MainScene extends GTRSThemeScene {
  constructor() {
    super({ key: 'MainScene' })
  }

  preload() {
    // 使用 GTRS 加载器加载图片
    this.loadThemeImage('scene', 'snake_head')
    this.loadThemeImage('scene', 'food_apple')
    this.loadThemeImage('ui', 'ui_panel_score')

    // 或使用 Phaser 原生加载方式
    const bgSrc = this.getThemeImage('scene', 'scene_bg_main')
    if (bgSrc) {
      this.load.image('background', bgSrc)
    }
  }

  create() {
    // 应用主题样式
    this.applyThemeStyles()

    // 创建蛇头
    const snakeHead = this.add.sprite(
      100,
      100,
      'snake_head'
    )

    // 使用 GTRS 音频
    const audio = this.getThemeAudio('effect', 'effect_eat')
    if (audio) {
      // 播放音效
      // this.sound.play('eat')
    }
  }
}
```

### 步骤 4：使用 GTRS 资源获取器

在游戏逻辑中使用 GTRS 资源获取器：

```typescript
// utils/GameResourceManager.ts
import { getImageResource, getAudioResource } from './GTRSThemeLoader'

export class GameResourceManager {
  /**
   * 获取蛇头图片
   */
  static getSnakeHead(): string {
    return getImageResource('scene', 'snake_head')
  }

  /**
   * 获取食物图片
   */
  static getFood(): string {
    return getImageResource('scene', 'food_apple')
  }

  /**
   * 获取背景音乐
   */
  static getBackgroundMusic(): { src: string; volume: number } | null {
    return getAudioResource('bgm', 'bgm_gameplay')
  }

  /**
   * 获取音效
   */
  static getEatSound(): { src: string; volume: number } | null {
    return getAudioResource('effect', 'effect_eat')
  }
}
```

### 步骤 5：应用全局样式

在游戏 UI 中应用全局样式：

```typescript
// ui/GameUI.ts
export class GameUI {
  private scene: Phaser.Scene

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  createScorePanel() {
    // 获取样式
    const root = document.documentElement
    const primaryColor = root.style.getPropertyValue('--theme-primary-color')
    const textColor = root.style.getPropertyValue('--theme-text-color')

    // 应用样式到 Phaser 文本
    const scoreText = this.scene.add.text(
      20,
      20,
      'Score: 0',
      {
        fontSize: '24px',
        color: textColor,
        backgroundColor: primaryColor
      }
    )

    return scoreText
  }
}
```

### 步骤 6：实现主题切换

创建主题切换功能：

```typescript
// ui/ThemeSelector.ts
import { loadThemeFromAPI, getCurrentTheme } from '../utils/GTRSThemeLoader'

export class ThemeSelector {
  /**
   * 切换主题
   */
  static async switchTheme(themeId: string, token?: string) {
    try {
      const result = await loadThemeFromAPI(themeId, token)

      if (result.success) {
        // 保存选择的主题
        localStorage.setItem('selectedThemeId', themeId)

        // 刷新游戏或重新加载场景
        window.location.reload()

        return true
      } else {
        console.error('主题切换失败:', result.message)
        return false
      }
    } catch (error) {
      console.error('主题切换异常:', error)
      return false
    }
  }

  /**
   * 获取当前主题
   */
  static getCurrentTheme() {
    return getCurrentTheme()
  }
}
```

## 🎨 完整示例：贪吃蛇游戏集成

### 1. 游戏入口 (main.ts)

```typescript
import Phaser from 'phaser'
import { MainScene } from './scenes/MainScene'
import { loadThemeFromAPI } from './utils/GTRSThemeLoader'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#2E7D32',
  scene: [MainScene]
}

// 加载主题并启动游戏
async function startGame() {
  const themeId = localStorage.getItem('selectedThemeId') || 'default'
  const token = localStorage.getItem('userToken') || undefined

  await loadThemeFromAPI(themeId, token)

  new Phaser.Game(config)
}

startGame()
```

### 2. 主场景 (scenes/MainScene.ts)

```typescript
import { GTRSThemeScene, createThemeButton, applyThemeBackground } from '../utils/GTRSThemeApplier'
import { getImageResource, getAudioResource } from '../utils/GTRSThemeLoader'

export class MainScene extends GTRSThemeScene {
  private snake: Phaser.GameObjects.Sprite[] = []
  private food: Phaser.GameObjects.Sprite | null = null
  private score: number = 0
  private scoreText: Phaser.GameObjects.Text | null = null

  constructor() {
    super({ key: 'MainScene' })
  }

  preload() {
    // 加载 GTRS 主题资源
    this.loadThemeImage('scene', 'snake_head')
    this.loadThemeImage('scene', 'snake_body')
    this.loadThemeImage('scene', 'food_apple')

    // 加载背景
    const bgSrc = this.getThemeImage('scene', 'scene_bg_main')
    if (bgSrc) {
      this.load.image('background', bgSrc)
    }

    // 加载音效
    const eatAudio = this.getThemeAudio('effect', 'effect_eat')
    if (eatAudio) {
      this.load.audio('eat', eatAudio.src)
    }
  }

  create() {
    // 应用背景
    applyThemeBackground(this, 'scene', 'scene_bg_main')

    // 应用主题样式
    this.applyThemeStyles()

    // 创建蛇
    this.createSnake()

    // 创建食物
    this.createFood()

    // 创建分数显示
    this.createScoreDisplay()

    // 创建按钮
    this.createButtons()

    // 开始游戏循环
    this.game.events.on('step', this.update, this)
  }

  createSnake() {
    // 使用 GTRS 资源
    const headKey = 'snake_head'
    this.snake.push(this.add.sprite(100, 100, headKey))
  }

  createFood() {
    // 使用 GTRS 资源
    const foodKey = 'food_apple'
    this.food = this.add.sprite(200, 200, foodKey)
  }

  createScoreDisplay() {
    // 使用全局样式
    const root = document.documentElement
    const textColor = root.style.getPropertyValue('--theme-text-color')

    this.scoreText = this.add.text(
      20,
      20,
      `Score: ${this.score}`,
      {
        fontSize: '24px',
        color: textColor || '#FFFFFF',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: { x: 10, y: 5 }
      }
    )
  }

  createButtons() {
    // 使用 GTRS 按钮组件
    createThemeButton(this, 680, 50, '暂停', () => {
      this.scene.pause()
    })

    createThemeButton(this, 680, 100, '设置', () => {
      // 打开设置
    })
  }

  update() {
    // 游戏逻辑
  }
}
```

## ✅ 验证集成

### 1. 功能验证

- [ ] 游戏可以加载 GTRS 主题
- [ ] 游戏可以正确显示图片资源
- [ ] 游戏可以正确播放音频资源
- [ ] 全局样式正确应用到游戏 UI
- [ ] 主题切换功能正常工作
- [ ] 默认主题兜底机制正常

### 2. 性能验证

- [ ] 资源预加载不影响游戏启动速度
- [ ] 主题切换响应时间小于 1 秒
- [ ] 内存占用在合理范围内

### 3. 兼容性验证

- [ ] 旧版主题可以正常迁移
- [ ] GTRS 主题可以正常加载
- [ ] 游戏在所有浏览器中正常运行

## 📚 相关文档

- [GTRS v1.0.0 官方规范](./GTRS_V1_SPECIFICATION.md)
- [GTRS 加载器源码](./kids-game-house/shared/utils/GTRSThemeLoader.ts)
- [GTRS 应用器源码](./kids-game-house/shared/utils/GTRSThemeApplier.ts)
- [贪吃蛇 GTRS 主题模板](./kids-game-house/snake-vue3/src/config/gtrs-theme-snake.json)
- [植物大战僵尸 GTRS 主题模板](./kids-game-house/plants-vs-zombie/src/config/gtrs-theme-pvz.json)

## 🎯 最佳实践

1. **资源预加载**：在 `preload()` 阶段预加载所有 GTRS 资源
2. **样式应用**：使用 CSS 变量存储全局样式，便于动态切换
3. **错误处理**：始终提供默认资源作为兜底
4. **性能优化**：避免频繁调用 `getImageResource` 和 `getAudioResource`
5. **类型安全**：使用 TypeScript 类型定义确保代码健壮性

## 📞 技术支持

如遇到集成问题，请提供以下信息：
1. 游戏名称和版本
2. 集成的 GTRS 版本
3. 错误日志
4. 复现步骤
5. 浏览器和版本

---

**集成成功标准：**
- ✅ 游戏可以加载 GTRS 主题
- ✅ 游戏可以正确显示所有资源
- ✅ 游戏可以正确播放所有音频
- ✅ 主题切换功能正常工作
- ✅ 游戏性能不受影响
