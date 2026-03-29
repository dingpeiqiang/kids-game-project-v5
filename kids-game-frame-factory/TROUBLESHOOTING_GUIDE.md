# 🔧 模板使用常见问题及解决方案

## 📌 ComponentGameScene 使用说明

### ✅ 核心原则
**所有游戏都应该有主菜单 BGM！** - ComponentGameScene 是模板框架的标准组件。

### 🎯 标准使用流程

#### 1. 从模板复制 ComponentGameScene.ts
```bash
cp templates/game-template/src/scenes/ComponentGameScene.ts \
   your-game/src/scenes/ComponentGameScene.ts
```

#### 2. 在 StartView.vue 中使用
```typescript
import { ComponentGameScene } from '@/scenes/ComponentGameScene'

// 创建隐藏的容器
const container = document.createElement('div')
container.style.display = 'none'
document.body.appendChild(container)

// 初始化 BGM 场景
const gameSceneInstance = new ComponentGameScene(container, {
  themeId: themeStore.currentThemeId
})

await gameSceneInstance.start({ themeId })
console.log('✅ 主菜单 BGM 已就绪')
```

#### 3. 清理资源
```typescript
onUnmounted(() => {
  if (gameSceneInstance) {
    gameSceneInstance.stop()
    gameSceneInstance = null
  }
})
```

---

## ❌ 问题 1: ComponentGameScene 导入失败

### 错误信息
```
Failed to resolve import "@/scenes/ComponentGameScene" from "src/views/StartView.vue"
```

### 原因分析
当从 game-template 复制 StartView.vue 到其他游戏项目时，如果目标项目没有 `ComponentGameScene` 组件，会导致导入失败。

### 解决方案

#### 方案 A: 移除 BGM 功能（推荐 - 适用于不需要主菜单 BGM 的游戏）

**修改 StartView.vue**:

```vue
<script setup lang="ts">
// 1. 移除 ComponentGameScene 导入
import GameButton from '@/components/ui/GameButton.vue'
import SoundToggle from '@/components/ui/SoundToggle.vue'
import ThemeSelector from '@/components/ui/ThemeSelector.vue'
import GameConfigModal from '@/components/ui/GameConfigModal.vue'
// ❌ 删除这行
// import { ComponentGameScene } from '@/scenes/ComponentGameScene'

// 2. 移除实例声明
const router = useRouter()
const gameStore = useGameStore()
const themeStore = useThemeStore()
const audioStore = useAudioStore()
const ui = useResponsiveUI()

// ❌ 删除这行
// let gameSceneInstance: ComponentGameScene | null = null

// 3. 简化 BGM 函数
const initMainMenuBGM = () => {
  // 如果需要添加主菜单 BGM，可以参考贪吃蛇的实现
  console.log('🎵 主菜单 BGM：暂未实现')
}

const cleanupMainMenuBGM = () => {
  // 无需清理
}

// 4. 简化配置处理
const handleConfigApply = (config: any) => {
  const validatedConfig = validateGameConfig(config)
  localStorage.setItem('game_config', JSON.stringify(validatedConfig))
  alert('✅ 配置已保存！下次启动游戏时生效。')
}
</script>
```

**适用场景**: 
- 飞机大战等射击游戏
- 拼图等休闲游戏
- 不需要主菜单背景音乐的游戏类型

---

#### 方案 B: 添加 ComponentGameScene 支持（适用于需要 BGM 的游戏）

**步骤 1**: 从贪吃蛇复制 ComponentGameScene.ts
```bash
cp kids-game-house/games/snake/src/scenes/ComponentGameScene.ts \
   your-game/src/scenes/ComponentGameScene.ts
```

**步骤 2**: 确保依赖完整
```typescript
// 检查以下文件是否存在
- src/scenes/ComponentGameScene.ts
- src/stores/game.ts
- src/stores/audio.ts
- src/stores/theme.ts
```

**步骤 3**: 保留 StartView.vue 中的完整代码
```typescript
import { ComponentGameScene } from '@/scenes/ComponentGameScene'

let gameSceneInstance: ComponentGameScene | null = null

const initMainMenuBGM = async () => {
  // ... 完整实现
}
```

**适用场景**:
- 需要主菜单背景音乐的游戏
- 与贪吃蛇类似的游戏类型

---

## ❌ 问题 2: 占位符未替换

### 错误信息
页面显示 `__GAME_EMOJI__`、`__GAME_NAME__` 等占位符文本

### 解决方案

**批量替换命令** (PowerShell):
```powershell
cd your-game
(Get-Content src/views/StartView.vue) -replace '__GAME_EMOJI__', '✈️' | Set-Content src/views/StartView.vue
(Get-Content src/views/StartView.vue) -replace '__GAME_NAME__', '雷霆战机' | Set-Content src/views/StartView.vue
(Get-Content src/views/StartView.vue) -replace '__GAME_DESCRIPTION__', '经典射击游戏' | Set-Content src/views/StartView.vue
```

**或使用 VS Code**:
1. `Ctrl + Shift + H` 打开全局替换
2. 搜索：`__GAME_EMOJI__`
3. 替换为：`✈️`
4. 全部替换

---

## ❌ 问题 3: 路由配置错误

### 错误信息
```
No match found for location with path "/loading"
```

### 解决方案

**更新 router/index.ts**:
```typescript
import { createRouter, createWebHistory } from 'vue-router'
import LoadingView from '@/views/LoadingView.vue'  // ✅ 添加导入
import StartView from '@/views/StartView.vue'
import DifficultyView from '@/views/DifficultyView.vue'
import GameView from '@/views/GameView.vue'
import GameOverView from '@/views/GameOverView.vue'

const routes = [
  {
    path: '/',
    name: 'loading',  // ✅ 默认路由改为 loading
    component: LoadingView,
  },
  {
    path: '/loading',
    name: 'loading',
    component: LoadingView,
  },
  {
    path: '/start',
    name: 'start',
    component: StartView,
  },
  // ... 其他路由
]
```

---

## ❌ 问题 4: 缺少 UI 组件

### 错误信息
```
Failed to resolve import "@/components/ui/GameConfigModal"
```

### 解决方案

**从模板复制缺失的组件**:
```bash
# 复制所有 UI 组件
cp -r ../kids-game-frame-factory/templates/game-template/src/components/ui/* \
      your-game/src/components/ui/

# 或单独复制某个组件
cp ../kids-game-frame-factory/templates/game-template/src/components/ui/GameConfigModal.vue \
   your-game/src/components/ui/
```

**必需组件清单**:
- ✅ GameButton.vue
- ✅ SoundToggle.vue
- ✅ ThemeSelector.vue
- ✅ DifficultySelector.vue
- ✅ GameSettingsPanel.vue
- ✅ GameConfigModal.vue
- ✅ Toast.vue (如果使用)

---

## ❌ 问题 5: Store 配置不完整

### 错误信息
```
Property "setCustomConfig" does not exist on store
```

### 解决方案

**验证 game.ts 中有以下方法**:
```typescript
// src/stores/game.ts

export const useGameStore = defineStore('game', () => {
  const customConfig = ref<CustomGameConfig | null>(null)

  /** 设置自定义配置 */
  const setCustomConfig = (cfg: CustomGameConfig | null) => {
    customConfig.value = cfg
  }

  return {
    customConfig,
    setCustomConfig,
    // ... 其他方法
  }
})
```

---

## 📋 快速检查清单

当从模板创建新游戏后，按此清单检查：

### 基础检查
- [ ] 替换所有 `__XXX__` 占位符
- [ ] 确认路由配置正确（LoadingView 为默认路由）
- [ ] 确认所有 UI 组件存在
- [ ] 确认 Store 配置完整

### 功能检查
- [ ] LoadingView 可以正常显示进度条
- [ ] StartView 资源检测流程完整
- [ ] DifficultyView 可以保存配置
- [ ] GameView 游戏逻辑正常
- [ ] GameOverView 按钮功能正常

### 可选检查
- [ ] 是否需要主菜单 BGM？
  - 是 → 添加 ComponentGameScene
  - 否 → 移除相关代码（如方案 A）

---

## 🎯 最佳实践

### 1. 创建新游戏的标准流程

```bash
# 1. 复制模板
cp -r templates/game-template games/your-game

# 2. 批量替换占位符
# (使用脚本或 IDE 批量替换)

# 3. 移除不需要的功能
# - 如不需要 BGM，移除 ComponentGameScene 相关代码
# - 如不需要复杂配置，简化 GameSettingsPanel

# 4. 添加游戏特有逻辑
# - 修改 GameView 中的游戏场景
# - 添加游戏特有的组件和系统

# 5. 测试验证
npm run dev
```

### 2. 代码复用原则

**可以复用的**:
- ✅ UI 组件（GameButton / ThemeSelector 等）
- ✅ 视图框架（StartView / DifficultyView 等）
- ✅ 工具函数（useResponsiveUI / errorHandler 等）
- ✅ Store 配置（game.ts / theme.ts 等）

**需要重写的**:
- ❌ 游戏核心逻辑（GameScene）
- ❌ 游戏特有配置（难度定义、得分规则等）
- ❌ 游戏资源（图片、音频、GTRS 主题等）

---

## 💡 示例：飞机大战游戏适配

### 修改后的 StartView.vue（精简版）

```vue
<script setup lang="ts">
// 只导入必需的组件
import GameButton from '@/components/ui/GameButton.vue'
import SoundToggle from '@/components/ui/SoundToggle.vue'
import ThemeSelector from '@/components/ui/ThemeSelector.vue'

// 移除 ComponentGameScene 相关代码
// 专注于游戏启动流程

// 保留完整的资源检测流程
const startGame = async () => {
  // 4 步检测流程保持不变
  // 1. 登录验证
  // 2. 音频准备
  // 3. GTRS 主题验证
  // 4. 游戏引擎就绪
}
</script>
```

### 特点
- ✅ 保留了完整的用户体验（加载流程、错误处理等）
- ✅ 移除了不必要的 BGM 功能
- ✅ 代码更简洁（减少约 50 行）
- ✅ 不影响游戏核心功能

---

## 🔗 相关文档

- 📄 [AI_QUICK_REFERENCE.md](./AI_QUICK_REFERENCE.md) - AI 速查卡片
- 📄 [AI_PROMPT_GUIDE.md](./AI_PROMPT_GUIDE.md) - AI 详细指南
- 📄 [P0_COMPLETION_REPORT.md](./P0_COMPLETION_REPORT.md) - P0 任务报告
- 📄 [P1_P2_COMPLETION_REPORT.md](./P1_P2_COMPLETION_REPORT.md) - P1/P2 任务报告

---

**最后更新**: 2026-03-29  
**维护者**: AI Assistant Team
