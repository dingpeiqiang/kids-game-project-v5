# GTRS 资源配置规范 (v1.0.0)

GTRS（Game Theme Resource Specification）是游戏主题资源配置规范。

## 概述

GTRS.json 是游戏资源的结构化定义，包含：
- 元数据（游戏 ID、名称、版本）
- 主题信息（主题名称、作者）
- 全局样式（颜色、字体）
- 资源引用（图片、音频）

## 完整示例

```json
{
  "specMeta": {
    "gameId": "snake",
    "gameName": "贪吃蛇",
    "version": "1.0.0",
    "ownerType": "GAME",
    "ownerId": "snake"
  },
  "themeInfo": {
    "themeName": "森林主题",
    "themeAuthor": "小开发者",
    "description": "绿色森林风格"
  },
  "globalStyle": {
    "primaryColor": "#4CAF50",
    "secondaryColor": "#8BC34A",
    "backgroundColor": "#E8F5E9",
    "textColor": "#2E7D32",
    "accentColor": "#FF5722",
    "fontFamily": "Arial, sans-serif"
  },
  "resources": {
    "images": {
      "scene": {
        "background": "forest-bg.png",
        "ground": "grass.png"
      },
      "items": {
        "food": "apple.png",
        "speedBoost": "lightning.png",
        "shield": "shield.png"
      },
      "characters": {
        "snakeHead": "snake-head.png",
        "snakeBody": "snake-body.png"
      },
      "effects": {
        "explosion": "explosion.png",
        "sparkle": "sparkle.png"
      }
    },
    "audio": {
      "bgm": {
        "main": "forest-bgm.mp3",
        "gameOver": "sad-music.mp3"
      },
      "effect": {
        "eat": "chomp.mp3",
        "powerUp": "power-up.mp3",
        "hit": "hit.mp3",
        "gameOver": "game-over.mp3"
      }
    }
  }
}
```

## 字段说明

### specMeta - 元数据

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| gameId | string | 是 | 游戏唯一标识（英文、数字、下划线） |
| gameName | string | 是 | 游戏显示名称 |
| version | string | 是 | 版本号（语义化版本） |
| ownerType | string | 是 | 所有者类型：`GAME` |
| ownerId | string | 是 | 所有者ID，通常与gameId相同 |

### themeInfo - 主题信息

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| themeName | string | 是 | 主题名称 |
| themeAuthor | string | 否 | 主题作者 |
| description | string | 否 | 主题描述 |

### globalStyle - 全局样式

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| primaryColor | string | 是 | 主色调（十六进制） |
| secondaryColor | string | 否 | 次要色 |
| backgroundColor | string | 是 | 背景色 |
| textColor | string | 是 | 文字颜色 |
| accentColor | string | 否 | 强调色 |
| fontFamily | string | 否 | 字体 |

### resources - 资源引用

#### images 分类

| 分类 | 说明 |
|------|------|
| scene | 场景资源（背景、地面、墙壁） |
| items | 道具资源（食物、增益道具） |
| characters | 角色资源（玩家、敌人） |
| effects | 特效资源（爆炸、粒子） |
| ui | UI 资源（按钮、图标） |

#### audio 分类

| 分类 | 说明 |
|------|------|
| bgm | 背景音乐 |
| effect | 音效 |

## 资源路径规则

### 路径格式

```
{resourceBaseUrl}/games/{gameId}/resources/{category}/{filename}
```

示例：
```
https://cdn.example.com/games/snake/resources/scene/forest-bg.png
```

### 开发环境

开发环境下，资源放在 `public/resources/` 目录：
```
public/resources/snake/scene/forest-bg.png
```

## GTRS 加载

### 使用 GTRSThemeLoader

```typescript
import { GTRSThemeLoader } from '@/utils/GTRSThemeLoader'
import type { IThemeStoreAdapter } from '@/types/gtrs'

const loader = new GTRSThemeLoader(themeStoreAdapter)

// 加载主题
const theme = await loader.loadTheme('snake', 'forest-theme-id')

// 应用到游戏
game.scene.textures.addImage('background', theme.resources.images.scene.background)
```

### 使用 Pinia Store

```typescript
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()

// 下载主题
await themeStore.downloadTheme(themeId)

// 获取资源 URL
const bgUrl = themeStore.getResourceUrl('scene', 'background')
```

## 资源生成脚本

使用 `generate-resources.mjs` 生成占位资源：

```javascript
const GAME_CONFIG = {
  gameId: 'my-game',
  gameName: '我的游戏',
  resources: {
    background: { type: 'color', color: '#87CEEB', width: 800, height: 600 },
    food: { type: 'emoji', emoji: '🍎', size: 40 },
    snakeHead: { type: 'emoji', emoji: '🐍', size: 40 }
  }
}
```

运行：
```bash
node generate-resources.mjs
```

## 验证 GTRS 格式

```typescript
import { validateGTRS } from '@/utils/gtrs-validator'

const errors = validateGTRS(gtrsJson)
if (errors.length > 0) {
  console.error('GTRS 验证失败:', errors)
}
```

## 最佳实践

1. **资源压缩**：生产环境使用压缩后的资源
2. **懒加载**：非关键资源延迟加载
3. **缓存**：合理设置缓存策略
4. **回退**：为每个资源提供默认回退
5. **验证**：发布前验证 GTRS 格式

## 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|----------|
| 资源加载失败 | 路径错误 | 检查 `resourceBaseUrl` 配置 |
| 纹理未找到 | 资源未预加载 | 在 Phaser 的 `preload` 中加载 |
| JSON 解析错误 | 格式不正确 | 验证 JSON 语法 |
| 主题加载失败 | 缺少必填字段 | 检查 `specMeta` 和 `themeInfo` |

## 更多信息

- 完整 Schema：[kids-game-house/shared/schemas/gtrs-schema.json](kids-game-house/shared/schemas/gtrs-schema.json)
- 示例游戏：[kids-game-house/games/snake/src/config/GTRS.json](kids-game-house/games/snake/src/config/GTRS.json)
