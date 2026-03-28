# game-dev - 儿童游戏开发指南

## 定位

这是一个游戏开发 Skill，帮你基于现有游戏快速创建新游戏。

**核心理念**：不要从零开始，参考真实游戏 + 修改参数 = 新游戏

## 快速开始

### 1. 选择参考游戏

| 游戏 | 特点 | 适合做 |
|------|------|--------|
| `kids-game-house/games/snake/` | 完整示例，包含道具系统、难度选择、GTRS 主题 | 网格移动类游戏 |
| `kids-game-house/games/tank-battle/` | 俯视角射击 | 射击类游戏 |

### 2. 克隆步骤（以贪吃蛇为例）

```bash
# 1. 复制游戏目录
cp -r kids-game-house/games/snake kids-game-house/games/my-game

# 2. 重命名（用 IDE 的全局重命名功能）
# - 目录名
# - package.json 中的 name
# - TypeScript 文件中的类名
# - Vue 文件中的组件名

# 3. 修改游戏逻辑
# - 编辑 src/phaser/game.ts 中的游戏规则
# - 编辑 src/config/GTRS.json 配置资源
# - 编辑 src/config/difficulty.json 配置难度

# 4. 注册游戏
# - 执行 register-game.sql 插入数据库
```

### 3. 详细开发规范

参考文档：
- **[游戏开发指南](./docs/GAME_DEV_GUIDE.md)** - 完整的开发流程
- **[GTRS 资源配置](./docs/GTRS_GUIDE.md)** - 主题资源规范
- **[模板文件](./templates/)** - 可复用的配置模板

## 项目结构

```
kids-game-house/games/snake/     # 参考游戏
├── src/
│   ├── components/             # Vue 组件
│   │   ├── core/               # 核心组件（IComponent 等）
│   │   ├── game/               # 游戏组件（PhaserGame 等）
│   │   └── ui/                 # UI 组件（GameButton 等）
│   ├── config/
│   │   ├── GTRS.json           # GTRS 资源配置
│   │   └── difficulty.json     # 难度配置
│   ├── phaser/                 # Phaser 游戏逻辑
│   │   ├── PhaserGame.ts       # 游戏主类
│   │   └── game.ts             # 游戏配置
│   ├── scenes/                 # Phaser 场景
│   │   └── ComponentGameScene.ts
│   ├── stores/                 # Pinia 状态
│   └── utils/                  # 工具函数
├── register-game.sql          # 数据库注册
└── generate-resources.mjs      # 资源生成脚本
```

## 关键开发指南

### 屏幕适配（4 层配合）

1. **index.html**: `viewport-fit=cover` + `env(safe-area-inset-*)` body padding
2. **App.vue**: `100vw × 100vh` + `overflow: hidden`
3. **GameView.vue**: `h-screen w-full overflow-hidden` + `touch-action: none`
4. **Phaser config**: `mode: RESIZE` + `width: '100%', height: '100%'`

### GTRS 资源规范（v1.0.0）

**4个顶级字段**：`specMeta` / `themeInfo` / `globalStyle` / `resources`

**资源结构**：
```json
{
  "resources": {
    "images": {
      "scene": { "background": "xxx.png" },
      "items": { "food": "xxx.png" }
    },
    "audio": {
      "bgm": { "main": "xxx.mp3" },
      "effect": { "eat": "xxx.mp3" }
    }
  }
}
```

### UI 缩放工具

使用 `useResponsiveUI()` 工具函数（设计基准 720×1280）：
```typescript
import { useResponsiveUI } from '@/utils/uiResponsive'

const { uiScaleRef } = useResponsiveUI()
```

### Pinia Store 集成

游戏 store 需要同时维护 Phaser 内部状态和 UI 状态：
- `gameStore`: 游戏核心状态（分数、生命、道具效果）
- 通过 `onScoreChange`、`onGameOver` 等回调与 Phaser 通信

### UI 组件使用

```vue
<GameButton 
  text="开始游戏" 
  :fontSize="26"
  :width="200"
  :height="60"
  @click="handleStart"
/>

<DifficultySelector 
  :difficulties="difficulties"
  v-model="selectedDifficulty"
/>
```

## 常见任务

### 创建新游戏

1. 参考 `snake` 游戏复制目录
2. 修改 `package.json` 的 name 和版本
3. 修改 `GTRS.json` 的 `specMeta.gameId` 和 `themeInfo.themeName`
4. 编辑游戏逻辑文件
5. 执行 `register-game.sql` 注册

### 添加新难度

编辑 `src/config/difficulty.json`：
```json
{
  "difficulties": [
    { "id": "easy", "label": "简单", "gridCols": 20, "gridRows": 15, "speed": 200 },
    { "id": "normal", "label": "普通", "gridCols": 25, "gridRows": 18, "speed": 150 }
  ]
}
```

### 添加道具效果

在 `src/phaser/game.ts` 的 `ItemEffects` 接口中添加新效果，然后在 `ComponentGameScene.ts` 的碰撞处理中调用。

### 修改 GTRS 主题

编辑 `src/config/GTRS.json`，参考 `kids-game-house/shared/schemas/gtrs-schema.json` 验证格式。

## 技术规范

- **IDE 沙箱**：禁止原生 `confirm()`/`alert()`，用 ElMessageBox/ElMessage
- **音频格式**：统一 `.mp3`
- **类型检查**：用 `npx tsc --noEmit`（非 vue-tsc）
- **组件导入**：游戏 UI 组件用 `@/components/ui/` 本地导入

## 更多信息

- 游戏开发完整指南：[docs/GAME_DEV_GUIDE.md](./docs/GAME_DEV_GUIDE.md)
- GTRS 资源规范：[docs/GTRS_GUIDE.md](./docs/GTRS_GUIDE.md)
- 贪吃蛇游戏源码：`kids-game-house/games/snake/`
