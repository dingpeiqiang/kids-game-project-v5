# 🤖 AI 快速参考卡片 - Game Template

## ⚡ 30 秒速查

### 核心组件（必须使用）

| 组件 | 用途 | 关键特性 |
|------|------|---------|
| **LoadingView** | 资源加载页 | 10 步进度条 + 失败重试 |
| **StartView** | 游戏首页 | 4 步检测 + BGM + 配置弹窗 |
| **DifficultyView** | 难度选择 | 难度选择器 + GameSettingsPanel |
| **GameSettingsPanel** | 配置面板 | 游戏参数/音频/分数/高级选项 |
| **GameConfigModal** | 配置弹窗 | 全屏遮罩 + 快速调节 |

---

## ✅ 标准实现模式

### 1. 路由配置
```typescript
// ⭐ 必须是 LoadingView 作为默认路由
{ path: '/', name: 'loading', component: LoadingView },
{ path: '/start', name: 'start', component: StartView },
```

### 2. 资源检测流程（StartView）
```typescript
const startGame = async () => {
  // 步骤 1: 登录验证 (10%)
  // 步骤 2: 音频准备 (25%)
  // 步骤 3: GTRS 主题验证 (45%)
  // 步骤 4: 游戏引擎启动 (85%)
  // ✅ 完成跳转 (100%)
}
```

### 3. 主菜单 BGM
```typescript
let gameSceneInstance: ComponentGameScene | null = null
onMounted(() => initMainMenuBGM())
onUnmounted(() => cleanupMainMenuBGM())
```

### 4. 响应式样式
```typescript
const ui = useResponsiveUI()
const SCALE = 1.3  // 或 1.452（贪吃蛇原版）
fontSize: ui.getFontSize(48 * SCALE)
```

---

## 🚨 三大禁忌

### ❌ 禁忌 1: 跳过 LoadingView
```typescript
// ❌ 错误
{ path: '/', name: 'start', component: StartView }

// ✅ 正确
{ path: '/', name: 'loading', component: LoadingView }
```

### ❌ 禁忌 2: 简化检测流程
```typescript
// ❌ 错误（只有简单调用）
await check(); router.push('/game')

// ✅ 正确（4 步骤 + 进度显示）
checkStep.value = 1; checkProgress.value = 10
checkStep.value = 2; checkProgress.value = 25
// ... 依次执行
```

### ❌ 禁忌 3: 滥用 localStorage
```typescript
// ❌ 错误（每次都写入）
localStorage.setItem('config', JSON.stringify(cfg))

// ✅ 正确（临时配置用 store）
gameStore.setCustomConfig(config)
```

---

## 💡 常见场景解决方案

### 场景 1: 创建新游戏
**公式**: 复制模板 + 替换占位符 + 保留流程

```bash
1. 复制 templates/game-template 到 games/your-game
2. 搜索替换所有 __XXX__ 占位符
3. 修改 GameView 中的游戏逻辑
4. 保留所有 UI 组件和检测流程
```

### 场景 2: 添加配置项
**公式**: 使用 GameSettingsPanel + 监听 save 事件

```vue
<GameSettingsPanel @save="handleSave" />
<script setup>
const handleSave = (config) => {
  gameStore.setCustomConfig(config)
}
</script>
```

### 场景 3: 修复白屏
**公式**: 检查路由顺序 + 确认 LoadingView 存在

```typescript
// 检查 router/index.ts
console.log(router.getRoutes().map(r => r.name))
// 确保 loading 在第一位
```

---

## 📋 代码生成检查清单

AI 生成代码后，快速检查：

- [ ] 导入路径正确（@/views/... / @/components/ui/...）
- [ ] 使用了 `useResponsiveUI()`
- [ ] 保留了占位符（__GAME_EMOJI__ 等）
- [ ] LoadingView 在最前端
- [ ] 有错误处理和重试机制
- [ ] 按钮顺序符合规范

---

## 🔗 完整文档

需要详细说明时查看：
- 📄 [AI_PROMPT_GUIDE.md](./AI_PROMPT_GUIDE.md) - 详细提示词指南
- 📄 [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) - 快速上手指南

---

**打印此卡片贴在显示器旁，随时参考！** 📌
