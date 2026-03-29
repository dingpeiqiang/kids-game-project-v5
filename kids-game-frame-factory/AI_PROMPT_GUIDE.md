# 🤖 AI 提示词指南 - Game Template 使用规范

## 📋 目的

本指南旨在帮助 AI 助手快速理解 game-template 的结构和使用方式，确保生成的代码与贪吃蛇游戏保持完全一致的用户体验。

---

## 🎯 核心原则

### 1. 模板定位理解
```
game-template = 通用游戏框架 + 贪吃蛇 UX 体验
- 通用框架：可适配任何类型的 H5 游戏（拼图/射击/休闲等）
- 贪吃蛇 UX：加载流程、配置界面、错误处理、响应式布局
```

### 2. 使用优先级
```
P0 (必须): LoadingView → StartView → DifficultyView → GameView → GameOverView
P1 (建议): GameSettingsPanel / GameConfigModal 集成
P2 (可选): 样式统一 / 动画优化
```

---

## 💡 标准提示词模板

### 场景 1: 创建新游戏页面

**用户**: "帮我创建一个飞机大战游戏的开始页面"

**AI 应该这样回应**:

```markdown
好的！我将基于 game-template 为你创建飞机大战游戏的开始页面，保持与贪吃蛇一致的用户体验。

### 步骤 1: 确定占位符替换
- `__GAME_EMOJI__` → ✈️ (飞机 emoji)
- `__GAME_NAME__` → 雷霆战机
- `__GAME_DESCRIPTION__` → 经典射击游戏
- `__GRADIENT_COLORS__` → from-blue-400 to-purple-400 (科技风格)

### 步骤 2: 复制并修改 StartView.vue
[展示修改后的代码，保留资源检测流程、BGM 逻辑、配置弹窗]

### 步骤 3: 检查清单
- [ ] 已替换所有占位符
- [ ] 保留了完整的资源检测流程
- [ ] 集成了主菜单 BGM
- [ ] 响应式样式已适配
```

---

### 场景 2: 添加游戏配置功能

**用户**: "如何让玩家自定义游戏难度？"

**AI 应该这样回应**:

```markdown
推荐使用 GameSettingsPanel 组件，这是 game-template 的标准配置方案。

### 方案 A: 在 DifficultyView 中集成（推荐）

```vue
<template>
  <div class="difficulty-page">
    <!-- 难度选择区 -->
    <DifficultySelector ... />
    
    <!-- 高级设置折叠区 -->
    <button @click="toggleAdvanced">⚙️ 更多设置</button>
    
    <Transition name="slide-down">
      <div v-if="showAdvanced">
        <GameSettingsPanel
          ref="settingsPanelRef"
          :showThemeSelector="false"
          :showDifficultySelector="false"
          :uiScale="ui.uiScale.value"
          @save="handleSaveConfig"
          @reset="handleResetConfig"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
// ⭐ 关键点：配置仅对本次游戏有效，不保存到 localStorage
const handleSaveConfig = (config: GameConfig) => {
  gameStore.setCustomConfig(config)  // 写入 store
  showSaveNotification('✅ 配置已保存！')
}
</script>
```

### 方案对比
| 方案 | 优点 | 适用场景 |
|------|------|----------|
| GameSettingsPanel | 功能完整、UI 统一 | 需要详细配置 |
| 简单滑块 | 代码简洁 | 只需调节 1-2 个参数 |
```

---

### 场景 3: 修复加载问题

**用户**: "我的游戏加载时白屏了 2 秒"

**AI 应该这样回应**:

```markdown
这是典型的缺少 LoadingView 问题。请按以下步骤修复：

### 解决方案：添加 LoadingView

#### 1. 确认文件存在
✅ 检查 `src/views/LoadingView.vue` 是否存在

#### 2. 更新路由配置
```typescript
// src/router/index.ts
const routes = [
  {
    path: '/',
    name: 'loading',  // ⭐ 默认路由改为 loading
    component: LoadingView,
  },
  {
    path: '/start',
    name: 'start',
    component: StartView,
  }
]
```

#### 3. 验证加载流程
```
用户访问 → LoadingView (10 步加载) → StartView (开始按钮)
```

#### 4. 预期效果
- ✅ 不再白屏（有进度条和状态提示）
- ✅ 用户知道发生了什么（实时文本反馈）
- ✅ 失败可重试（错误处理机制）
```

---

## 🔑 关键概念解释

### 1. 资源检测流程（StartView 核心）

```typescript
// ⭐ 必须包含的 4 个步骤
const startGame = async () => {
  // 步骤 1: 登录验证
  checkStep.value = 1
  checkProgress.value = 10
  statusText.value = '验证用户登录状态...'
  const token = localStorage.getItem('token')
  if (!token) { /* 处理未登录 */ }
  
  // 步骤 2: 音频准备
  checkStep.value = 2
  checkProgress.value = 25
  statusText.value = '准备音频系统...'
  await audioStore.initAudio()
  
  // 步骤 3: GTRS 主题验证
  checkStep.value = 3
  checkProgress.value = 45
  statusText.value = '验证 GTRS 主题...'
  const gtrsJson = themeStore.gtrsRawJson
  if (!gtrsJson) { /* 处理主题缺失 */ }
  
  // 步骤 4: 游戏引擎启动
  checkStep.value = 4
  checkProgress.value = 85
  statusText.value = '启动游戏引擎...'
  // 初始化 Phaser 或 ComponentGameScene
  
  // ✅ 完成，跳转到难度选择
  router.push('/difficulty')
}
```

**AI 注意事项**:
- ❌ 不要简化这个流程（影响用户体验）
- ❌ 不要移除步骤指示器
- ✅ 可以调整延迟时间（但要保证 UI 流畅）

---

### 2. 主菜单 BGM 支持

```typescript
// ⭐ 标准实现模式
let gameSceneInstance: ComponentGameScene | null = null

const initMainMenuBGM = async () => {
  const themeId = themeStore.currentThemeId
  if (!themeId) return
  
  // 创建隐藏容器
  const container = document.createElement('div')
  container.style.display = 'none'
  document.body.appendChild(container)
  
  // 初始化 Phaser 游戏（仅用于播放音乐）
  gameSceneInstance = new ComponentGameScene(container, {
    difficulty: 'easy',
    enableDynamicDifficulty: false
  })
  
  await gameSceneInstance.start({ themeId })
  console.log('✅ 主菜单 BGM 已就绪')
}

const cleanupMainMenuBGM = () => {
  if (gameSceneInstance) {
    gameSceneInstance.stop()
    gameSceneInstance = null
  }
}

onMounted(() => initMainMenuBGM())
onUnmounted(() => cleanupMainMenuBGM())
```

**AI 注意事项**:
- ✅ 必须使用隐藏的 Phaser 实例（不能直接播放音频文件）
- ✅ 必须在 onUnmounted 时清理资源
- ✅ 必须检查主题是否已加载

---

### 3. 响应式样式计算

```typescript
// ⭐ 标准模式（使用 useResponsiveUI）
const ui = useResponsiveUI()

// 放大系数选择
const SCALE_FACTOR = 1.3      // 推荐：适中放大
const SCALE_FACTOR = 1.452    // 贪吃蛇原版：最大放大

// 样式计算示例
const titleStyle = computed(() => ({
  fontSize: ui.getFontSize(48 * SCALE_FACTOR),  // 标题字体
  marginBottom: ui.getGap(16 * SCALE_FACTOR),   // 下边距
}))

const buttonStyle = computed(() => ({
  paddingLeft: ui.getPadding(48 * SCALE_FACTOR),
  paddingTop: ui.getPadding(24 * SCALE_FACTOR),
}))
```

**AI 注意事项**:
- ❌ 不要使用硬编码的像素值
- ✅ 必须使用 `ui.getFontSize()` / `ui.getPadding()` 等方法
- ✅ 同一游戏中保持统一的放大系数

---

## 🚨 常见错误及纠正

### 错误 1: 跳过 LoadingView

**错误做法**:
```typescript
// ❌ 直接从 StartView 开始
{
  path: '/',
  name: 'start',
  component: StartView,
}
```

**正确做法**:
```typescript
// ✅ 先经过 LoadingView
{
  path: '/',
  name: 'loading',
  component: LoadingView,
},
{
  path: '/start',
  name: 'start',
  component: StartView,
}
```

---

### 错误 2: 简化资源检测流程

**错误做法**:
```typescript
// ❌ 只有简单的异步调用
const startGame = async () => {
  await someCheck()
  router.push('/game')
}
```

**正确做法**:
```typescript
// ✅ 完整的 4 步检测 + 进度显示
const startGame = async () => {
  isChecking.value = true
  
  // 步骤 1: 登录验证
  checkStep.value = 1
  checkProgress.value = 10
  statusText.value = '验证用户登录状态...'
  // ...
  
  // 步骤 2-4: 依次执行
  
  // ✅ 完成跳转
  router.push('/difficulty')
}
```

---

### 错误 3: 滥用 localStorage

**错误做法**:
```typescript
// ❌ 每次配置都写入 localStorage
localStorage.setItem('game_config', JSON.stringify(config))
```

**正确做法**:
```typescript
// ✅ 仅临时配置（本次游戏有效）
const tempConfig = ref<GameConfig | null>(null)
tempConfig.value = config
gameStore.setCustomConfig(config)  // 写入 store
```

---

## 📝 AI 生成代码检查清单

当 AI 生成与 game-template 相关的代码时，应该自我检查：

### 基础检查
- [ ] 是否使用了正确的组件路径（@/views/XXX / @/components/ui/XXX）
- [ ] 是否保留了所有占位符（__GAME_EMOJI__ 等）
- [ ] 是否使用了 `useResponsiveUI()` 进行样式计算
- [ ] 是否添加了必要的导入语句

### 功能检查
- [ ] LoadingView 是否在路由最前端
- [ ] StartView 是否有完整的 4 步检测流程
- [ ] 是否有错误处理和重试机制
- [ ] BGM 初始化是否正确（如果适用）

### 体验检查
- [ ] 是否有加载进度可视化
- [ ] 是否有操作反馈（Toast/通知）
- [ ] 按钮顺序是否符合规范
- [ ] 响应式布局是否正常

---

## 🎓 培训示例

### 示例 1: 教 AI 理解模板结构

**提示词**:
```
请分析 game-template 的目录结构，并说明每个文件的作用。

要求：
1. 列出所有 views 目录下的文件
2. 说明每个组件的核心功能
3. 指出哪些是必须的（P0），哪些是可选的（P1/P2）
```

**期望回答**:
```markdown
### game-template 目录结构分析

#### Views 目录（P0 核心）
1. **LoadingView.vue** - 资源加载页（必须）
   - 10 步加载流程
   - 进度条和状态提示
   - 失败重试机制

2. **StartView.vue** - 游戏首页（必须）
   - 游戏标题和最高分展示
   - 资源检测流程（4 步骤）
   - 主菜单 BGM 播放
   - 游戏配置弹窗

3. **DifficultyView.vue** - 难度选择（必须）
   - 难度等级选择器
   - 主题选择器
   - 高级设置面板（GameSettingsPanel）

4. **GameView.vue** - 游戏主界面（必须）
   - Phaser 游戏容器
   - 暂停按钮
   - 分数面板

5. **GameOverView.vue** - 结束页面（必须）
   - 分数展示
   - 再来一局/更改难度/返回首页按钮

#### Components/UI 目录（P1 增强）
1. **GameSettingsPanel.vue** - 游戏设置面板
2. **GameConfigModal.vue** - 配置弹窗
3. **DifficultySelector.vue** - 难度选择器
...
```

---

### 示例 2: 教 AI 生成正确的代码

**提示词**:
```
为贪吃蛇游戏创建一个食物道具系统，需要符合 game-template 规范。

要求：
1. 使用组件化架构
2. 配置可通过 GameSettingsPanel 调节
3. 符合响应式规范
```

**期望回答**:
```typescript
// ✅ 正确的实现方式

// 1. 创建 FoodItem 组件（细粒度、可拔插）
export class FoodItem extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x: number, y: number, type: string) {
    super(scene, x, y)
    // ... 初始化逻辑
  }
}

// 2. 在 ItemSystem 中管理
class ItemSystem implements IComponent {
  private foodItems: FoodItem[] = []
  
  spawnFood(type: string, position: Vector2D) {
    const food = new FoodItem(this.scene, position.x, position.y, type)
    this.foodItems.push(food)
  }
}

// 3. 添加到 GameSettingsPanel 配置项
interface GameConfig {
  // ... 其他配置
  normalFoodScore: number    // 普通食物得分
  bonusFoodScore: number     // 奖励食物得分
  specialFoodScore: number   // 特殊食物得分
}

// 4. 在 DifficultyView 中使用 GameSettingsPanel
<GameSettingsPanel
  @save="(config) => {
    gameStore.setCustomConfig({
      normalFoodScore: config.normalFoodScore,
      bonusFoodScore: config.bonusFoodScore,
      specialFoodScore: config.specialFoodScore
    })
  }"
/>
```

---

## 🔗 相关文档链接

- 📄 [TEMPLATE_GAP_ANALYSIS.md](./TEMPLATE_GAP_ANALYSIS.md) - 详细对比分析
- 📄 [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) - 快速上手指南
- 📄 [SUMMARY_AND_NEXT_STEPS.md](./SUMMARY_AND_NEXT_STEPS.md) - 总结和下一步计划

---

## 💬 快速参考卡片

### 遇到 X 问题时，应该 Y

| 问题场景 (X) | 正确做法 (Y) | 参考文件 |
|-------------|-------------|---------|
| 创建新游戏页面 | 复制模板 → 替换占位符 → 保留检测流程 | QUICK_START_GUIDE.md |
| 添加配置功能 | 使用 GameSettingsPanel，不要自己写 UI | TEMPLATE_UPDATE_STATUS.md |
| 修复加载白屏 | 添加 LoadingView 到路由最前端 | SUMMARY_AND_NEXT_STEPS.md |
| 调整样式大小 | 使用 ui.getXXX(n * scale)，不要用 px | TEMPLATE_GAP_ANALYSIS.md |
| 保存用户配置 | 临时配置用 store，永久配置用 localStorage | 各组件源码注释 |

---

## 🎯 总结

**让 AI 掌握正确使用模板的关键**:

1. ✅ **明确告知优先级**: P0/P1/P2 分级清晰
2. ✅ **提供标准代码模式**: 资源检测/BGM/响应式等都有固定模式
3. ✅ **列举常见错误**: 明确什么不该做
4. ✅ **提供检查清单**: AI 生成代码后自我验证
5. ✅ **示例驱动**: 通过正反例对比加深理解

**使用建议**:
- 将本指南作为 system prompt 的一部分
- 在回答相关问题时引用本文档的章节
- 定期更新常见错误案例

---

**版本**: v1.0  
**更新日期**: 2026-03-29  
**维护者**: AI Assistant Team
