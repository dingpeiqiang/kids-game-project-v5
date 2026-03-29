# 🎯 Game Template 快速使用指南

## 📦 新增组件说明

本次更新为 game-template 添加了 3 个核心组件，完全复刻贪吃蛇游戏的用户体验。

### 1. LoadingView.vue - 资源加载页面
**位置**: `templates/game-template/src/views/LoadingView.vue`

**功能特点**:
- ✅ 10 步加载进度条（屏幕检测 → 音频初始化 → 配置加载 → 数据生成）
- ✅ 实时状态提示和进度百分比
- ✅ 加载失败处理和重试按钮
- ✅ 响应式适配（所有尺寸使用 ui.getXXX 动态计算）

**占位符**: `__GAME_EMOJI__` (使用时替换为你的游戏 emoji，如 🐍🎮🧩)

---

### 2. GameSettingsPanel.vue - 游戏设置面板
**位置**: `templates/game-template/src/components/ui/GameSettingsPanel.vue`

**功能特点**:
- ✅ 游戏参数配置（蛇长度/速度/格子大小）
- ✅ 音频设置（BGM/SFX/静音开关）
- ✅ 分数配置（普通/奖励/特殊食物）
- ✅ 高级选项（动态难度/自动暂停/粒子效果）
- ✅ 可选显示主题选择器和难度选择器
- ✅ 网格布局自适应（支持 1/2/4 列）

**使用示例**:
```vue
<GameSettingsPanel
  :showThemeSelector="false"
  :showDifficultySelector="false"
  :uiScale="1.3"
  @save="handleSave"
  @reset="handleReset"
/>
```

---

### 3. GameConfigModal.vue - 游戏配置弹窗
**位置**: `templates/game-template/src/components/ui/GameConfigModal.vue`

**功能特点**:
- ✅ 全屏遮罩弹窗样式
- ✅ 难度快速选择（4 个等级带速度预览）
- ✅ 详细参数调节（滑块 + 数字输入）
- ✅ 配置验证和默认值恢复
- ✅ 应用按钮触发父组件事件

**使用示例**:
```vue
<GameConfigModal
  v-model="showConfigModal"
  @apply="handleConfigApply"
/>
```

---

## 🔧 集成步骤

### 步骤 1: 更新路由配置

修改 `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import LoadingView from '@/views/LoadingView.vue'  // ⭐ 新增
import StartView from '@/views/StartView.vue'
import DifficultyView from '@/views/DifficultyView.vue'
import GameView from '@/views/GameView.vue'
import GameOverView from '@/views/GameOverView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'loading',  // ⭐ 默认路由改为 loading
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
    // ... 其他路由保持不变
  ],
})
```

---

### 步骤 2: 替换占位符

在所有模板文件中搜索并替换以下占位符：

| 占位符 | 替换为 | 示例 |
|--------|--------|------|
| `__GAME_EMOJI__` | 游戏 emoji | 🐍 / 🎮 / 🧩 |
| `__GAME_NAME__` | 游戏名称 | 快乐贪吃蛇 |
| `__GAME_DESCRIPTION__` | 副标题 | 儿童益智小游戏 |
| `__GRADIENT_COLORS__` | 渐变色 | from-green-400 to-yellow-400 |

---

### 步骤 3: 测试验证

启动开发服务器后，你应该看到：

1. **LoadingView** (首页) → 自动执行 10 步加载流程 → 跳转到 StartView
2. **StartView** → 显示游戏标题、最高分、开始按钮
3. **DifficultyView** → 选择难度和主题 → 点击"开始游戏"
4. **GameView** → 实际游戏画面
5. **GameOverView** → 游戏结束后显示分数和按钮

---

## 💡 常见问题

### Q1: Loading 页面一闪而过？
**A**: 这是正常的！加载步骤中有模拟延迟（80-120ms），实际项目中会根据真实资源加载时间调整。

### Q2: 如何自定义加载步骤？
**A**: 修改 LoadingView.vue 中的 `loadingSteps` 数组：
```typescript
const loadingSteps = [
  { percent: 10, text: '你的自定义文本...' },
  // ... 更多步骤
]
```

### Q3: GameSettingsPanel 如何保存配置？
**A**: 监听 `@save` 事件获取配置对象：
```typescript
const handleSave = (config: GameConfig) => {
  console.log('保存的配置:', config)
  // 这里可以保存到 localStorage 或发送给后端
}
```

### Q4: 如何禁用某些高级选项？
**A**: GameSettingsPanel 支持条件显示，通过 props 控制：
```vue
<GameSettingsPanel
  :showThemeSelector="false"
  :showDifficultySelector="false"
/>
```

---

## 🎨 样式定制建议

### 统一响应式比例
所有新增组件都使用 `useResponsiveUI()`，建议保持统一的放大系数：

```typescript
const ui = useResponsiveUI()

// 推荐放大系数
const TITLE_SIZE = ui.getFontSize(48 * 1.3)     // 标题放大 30%
const BUTTON_PADDING = ui.getPadding(20 * 1.3)   // 按钮内边距放大 30%
const GAP = ui.getGap(16 * 1.3)                  // 间距放大 30%
```

### 颜色主题匹配
修改渐变色时，确保与你的游戏主题一致：

```vue
<!-- StartView 标题 -->
<h2 class="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
  __GAME_NAME__
</h2>

<!-- GameButton 主色调 -->
<GameButton variant="primary">开始游戏</GameButton>
```

---

## 📋 检查清单

使用前请确认：

- [ ] 已复制 3 个新组件到项目
- [ ] 已更新路由配置
- [ ] 已替换所有占位符
- [ ] 已测试加载流程
- [ ] 已验证配置保存功能
- [ ] 已检查响应式布局

---

## 🚀 下一步优化

### P1 - 增强 StartView
添加完整的资源检测流程和主菜单 BGM 支持（参考贪吃蛇 StartView.vue 247-447 行）

### P1 - 增强 DifficultyView  
集成 GameSettingsPanel 并提供折叠式高级设置（参考贪吃蛇 DifficultyView.vue 63-94 行）

### P2 - 完善 GameOverView
调整按钮顺序为：再来一局 → 更改难度 → 返回首页（与贪吃蛇一致）

---

## 📞 技术支持

遇到问题时的排查顺序：

1. **检查控制台错误** - 查看是否有模块导入错误或类型错误
2. **验证文件路径** - 确认组件文件已正确复制到目标目录
3. **检查依赖版本** - 确保 Vue 3、TypeScript、Phaser 版本兼容
4. **清理缓存** - 删除 `node_modules` 并重新 `npm install`

---

**祝你开发顺利！🎮✨**
