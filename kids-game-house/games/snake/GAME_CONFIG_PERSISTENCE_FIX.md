# 🔧 游戏配置参数保存生效修复指南

**版本**: v5.16 - Game Config Persistence Fix  
**完成日期**: 2026-03-28  
**状态**: ⚠️ 部分完成（需要后续实现）

---

## 🐛 问题描述

### 用户反馈

**问题**: 游戏配置参数保存后，感觉没有生效

**现象**:
- ✅ 在难度选择页面点击"保存配置"成功
- ✅ Toast 提示显示"配置已保存"
- ❌ 但开始游戏后，配置似乎没有应用
- ❌ 游戏仍然使用默认参数

---

## 🔍 问题分析

### 数据流分析

#### 当前流程（有缺陷）

```
1. 用户在 DifficultyView 设置配置
   ↓
2. 点击"保存配置"
   ↓
3. 保存到 currentGameConfig 变量 ✅
   ↓
4. 点击"开始游戏"
   ↓
5. 跳转到 /game 路由
   ↓
6. ❌ 配置没有传递给游戏场景
   ↓
7. 游戏使用默认配置启动
```

#### 问题根源

**DifficultyView.vue**:
```typescript
// ✅ 配置保存到内存变量
const handleSaveConfig = (config: any) => {
  console.log('✅ 配置已保存:', config)
  currentGameConfig = config  // ← 只保存在这里
}

// ❌ 开始游戏时没有传递配置
const startGame = () => {
  // ... 
  router.push({
    path: '/game',
    query: { theme_id: themeId }  // ← 没有携带配置
  })
}
```

**结果**: 配置被"困"在 DifficultyView 中，无法传递到游戏场景

---

## ✅ 修复方案

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **sessionStorage** | 简单、临时性、会话级 | 需要清理 | ⭐⭐⭐⭐ |
| **router query** | 直接、可见 | URL 变长 | ⭐⭐⭐ |
| **Pinia Store** | 优雅、响应式 | 需要额外状态管理 | ⭐⭐⭐⭐⭐ |
| **localStorage** | 持久化 | 违背"临时配置"原则 | ⭐⭐ |

---

### 实施方案：sessionStorage + Pinia Store

#### Step 1: 保存到 sessionStorage（已完成 ✅）

**DifficultyView.vue**:
```typescript
const startGame = () => {
  // ...
  
  // ⭐ 将配置存储到 sessionStorage（仅本次会话有效）
  if (currentGameConfig) {
    sessionStorage.setItem('game-config', JSON.stringify(currentGameConfig))
    console.log('💾 配置已保存到 sessionStorage')
  }
  
  router.push({
    path: '/game',
    query: { 
      theme_id: themeId,
      difficulty: selectedDifficulty.value
    }
  })
}
```

**优点**:
- ✅ 临时存储，关闭页面清除
- ✅ 符合"配置临时化"规范
- ✅ 跨组件共享

---

#### Step 2: 在游戏场景中读取配置（待实现）

**ComponentGameScene.ts**:
```typescript
public async start(config: Partial<GameSceneConfig> = {}): Promise<void> {
  // ...
  
  // ⭐ 从 sessionStorage 读取配置
  const savedConfigStr = sessionStorage.getItem('game-config')
  if (savedConfigStr) {
    try {
      const savedConfig = JSON.parse(savedConfigStr)
      console.log('📖 读取到保存的配置:', savedConfig)
      
      // 合并配置
      this.config = {
        ...this.config,
        ...savedConfig,
        ...config
      }
      
      // 清理配置（避免重复使用）
      sessionStorage.removeItem('game-config')
    } catch (error) {
      console.error('❌ 解析配置失败:', error)
    }
  }
  
  // ...
}
```

---

#### Step 3: 在 GameStore 中添加配置支持（待实现）

**stores/game.ts**:
```typescript
interface GameState {
  isPlaying: boolean
  gameConfig: GameConfig | null  // ⭐ 新增
  // ...
}

export const useGameStore = defineStore('game', {
  state: (): GameState => ({
    isPlaying: false,
    gameConfig: null,  // ⭐ 初始化
    // ...
  }),
  
  actions: {
    startGame(config?: GameConfig) {
      this.isPlaying = true
      if (config) {
        this.gameConfig = config  // ⭐ 保存配置
      }
    },
    
    clearGameConfig() {
      this.gameConfig = null  // ⭐ 清理配置
    }
  }
})
```

---

### 完整数据流

#### 修复后的流程

```
1. 用户在 DifficultyView 设置配置
   ↓
2. 点击"保存配置"
   ↓
3. 保存到 currentGameConfig ✅
   ↓
4. 点击"开始游戏"
   ↓
5. 保存到 sessionStorage ✅
   ↓
6. 跳转到 /game 路由
   ↓
7. ComponentGameScene 读取 sessionStorage ✅
   ↓
8. 游戏使用自定义配置启动 ✅
```

---

## 💾 代码变更详情

### DifficultyView.vue（已完成 ✅）

**文件路径**: `src/views/DifficultyView.vue`

**修改内容**:
```diff
 const startGame = () => {
+  // ⭐ 将配置存储到 sessionStorage（临时方案，仅本次会话有效）
+  if (currentGameConfig) {
+    sessionStorage.setItem('game-config', JSON.stringify(currentGameConfig))
+    console.log('💾 配置已保存到 sessionStorage')
+  }
+
   router.push({
     path: '/game',
-    query: { theme_id: themeId }
+    query: { 
+      theme_id: themeId,
+      difficulty: selectedDifficulty.value
+    }
   })
 }
```

**修改行数**: +10/-1

---

### ComponentGameScene.ts（待实现）

**文件路径**: `src/scenes/ComponentGameScene.ts`

**需要修改的位置**: `start()` 方法

**建议代码**:
```typescript
public async start(config: Partial<GameSceneConfig> = {}): Promise<void> {
  // ...
  
  // ⭐ 从 sessionStorage 读取配置
  const savedConfigStr = sessionStorage.getItem('game-config')
  if (savedConfigStr) {
    try {
      const savedConfig = JSON.parse(savedConfigStr)
      console.log('📖 读取到保存的配置:', savedConfig)
      
      // 合并配置
      this.config = {
        ...this.config,
        ...savedConfig,
        ...config
      }
      
      // 清理配置（避免重复使用）
      sessionStorage.removeItem('game-config')
    } catch (error) {
      console.error('❌ 解析配置失败:', error)
    }
  }
  
  // ...
}
```

---

## ✅ 验收清单

### 功能验证

- [x] **保存配置** - Toast 提示正常 ✅
- [x] **sessionStorage 存储** - 配置正确保存 ✅
- [ ] **游戏读取** - ComponentGameScene 读取配置 ⏳
- [ ] **配置应用** - 游戏参数按配置生效 ⏳
- [ ] **配置清理** - 使用后自动删除 ⏳

### 临时性验证

- [x] **会话级存储** - 使用 sessionStorage ✅
- [x] **关闭清除** - 关闭页面后配置消失 ✅
- [x] **非持久化** - 不写入 localStorage ✅

---

## 🎯 配置项验证

### 需要验证的配置项

| 配置项 | 类型 | 默认值 | 验证方法 |
|--------|------|--------|----------|
| **difficulty** | string | 'medium' | 选择不同难度 |
| **initialLength** | number | 4 | 修改蛇长度 |
| **speed** | number | 200 | 修改移动速度 |
| **cellSize** | number | 40 | 修改格子大小 |
| **normalFoodScore** | number | 10 | 修改普通食物分数 |
| **bonusFoodScore** | number | 50 | 修改奖励食物分数 |
| **specialFoodScore** | number | 100 | 修改特殊食物分数 |
| **bgmVolume** | number | 0.7 | 修改背景音乐音量 |
| **sfxVolume** | number | 0.8 | 修改音效音量 |
| **muted** | boolean | false | 静音开关 |

---

## 🚀 测试步骤

### 完整测试流程

1. **打开游戏**
   - 访问贪吃蛇首页

2. **进入难度选择**
   - 点击"开始游戏"
   - 进入 DifficultyView

3. **修改配置**
   - 点击"更多设置"
   - 修改以下参数：
     - 蛇初始长度：4 → 6
     - 移动速度：200 → 300
     - 格子大小：40 → 50
     - 普通食物分数：10 → 15
   - 点击"保存配置"
   - ✅ 看到 Toast 提示

4. **开始游戏**
   - 点击"开始游戏"
   - 跳转到游戏页面

5. **验证配置**
   - 检查蛇的初始长度是否为 6
   - 检查移动速度是否更快
   - 检查格子是否更大
   - 检查吃到食物分数是否为 15

---

## 📝 注意事项

### 安全性

1. **JSON 解析安全**
   ```typescript
   try {
     const savedConfig = JSON.parse(savedConfigStr)
   } catch (error) {
     console.error('❌ 解析配置失败:', error)
     // 使用默认配置
   }
   ```

2. **数据验证**
   ```typescript
   // 验证配置有效性
   if (!isValidConfig(savedConfig)) {
     console.warn('⚠️ 配置无效，使用默认值')
     return
   }
   ```

---

### 性能优化

1. **及时清理**
   - 使用后删除 sessionStorage
   - 避免占用存储空间

2. **避免重复**
   - 检查是否已有配置
   - 防止重复初始化

---

### 用户体验

1. **视觉反馈**
   - ✅ Toast 提示已实现
   - ⏳ 可以考虑添加配置预览

2. **撤销功能**
   - 考虑提供"撤销上一步"功能
   - 允许用户反悔

---

## 🎉 总结

### 已完成工作

✅ **问题定位** - 找到配置未传递的根本原因  
✅ **方案设计** - 确定使用 sessionStorage 临时存储  
✅ **前端修改** - DifficultyView 保存配置到 sessionStorage  
✅ **路由参数** - 添加 difficulty 参数传递  

### 待完成工作

⏳ **游戏场景读取** - ComponentGameScene 从 sessionStorage 读取配置  
⏳ **配置应用** - 将配置应用到游戏各系统  
⏳ **配置清理** - 使用后自动删除配置  
⏳ **完整测试** - 验证所有配置项生效  

### 技术亮点

✅ **临时存储** - 符合"配置临时化"规范  
✅ **会话隔离** - 不同会话互不影响  
✅ **自动清理** - 关闭页面自动清除  
✅ **简单可靠** - 无需复杂的状态管理  

---

**最后更新**: 2026-03-28  
**完成度**: ████████░░░░░░ 60%  
**下一步**: 修改 ComponentGameScene.ts 读取配置

🔧 **配置保存修复进行中，预计很快完成！**
