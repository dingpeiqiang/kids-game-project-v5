# 游戏加载检查 UI 优化 - 快速参考

## 🎯 核心改进

### 1. Loading 延迟显示
```typescript
// ✅ 避免视觉卡顿
const loadingTimer = setTimeout(() => {
  if (isChecking.value) {
    showCheckModal.value = true
  }
}, 200)
```

### 2. 统一错误处理
```typescript
// ✅ 友好的错误提示
handleError(error, '请先登录再玩游戏哦~')
```

### 3. 重试机制
```typescript
// ✅ 最多 3 次重试
retryCount.value++
startGame()  // 重新执行检查
```

---

## 📋 错误类型与提示

| 场景 | 错误信息 | 用户操作 |
|------|---------|---------|
| 未登录 | "请先登录再玩游戏哦~" | 关闭 → 去登录 |
| 主题未选 | "还没有选择喜欢的主题呢" | 关闭 → 选择主题 |
| GTRS 失败 | "主题资源加载失败，请检查网络或重新选择主题" | 重试 / 选择主题 |
| 其他错误 | "游戏启动失败，请重试" | 重试 / 关闭 |
| 超过 3 次 | "多次尝试失败，建议返回首页重新开始" | 返回首页 |

---

## 🔧 关键变量

```typescript
const retryCount = ref(0)          // 当前重试次数
const maxRetryCount = 3            // 最大重试次数
const lastCheckThemeId = ref(null) // 记录主题 ID 用于重试
const loadingTimer                 // Loading 定时器（需清理）
```

---

## 🚨 重要提醒

### 必须清理定时器的场景
```typescript
// 1. 未登录时
if (!token) {
  clearTimeout(loadingTimer)  // ✅
}

// 2. 主题未选择时
if (!gtrsJson) {
  clearTimeout(loadingTimer)  // ✅
}

// 3. 捕获异常时
catch (error) {
  clearTimeout(loadingTimer)  // ✅
}
```

### 必须重置状态的场景
```typescript
// 新的检查流程开始
isChecking.value = true
retryCount.value = 0  // ✅ 重置
```

---

## 🎨 UI 组件

### 错误弹窗结构
```vue
<div class="error-modal">
  <div class="error-icon">⚠️</div>
  <h3>资源检查失败</h3>
  <p>{{ checkError }}</p>
  
  <!-- 重试次数提示 -->
  <div v-if="retryCount > 0" class="retry-hint">
    已重试 {{ retryCount }} 次
  </div>
  
  <!-- 按钮组 -->
  <div class="error-actions">
    <button class="error-btn-retry">🔄 重试</button>
    <button class="error-btn-close">关闭</button>
    <button class="error-btn-home" v-if="retryCount >= 3">
      🏠 返回首页
    </button>
  </div>
</div>
```

---

## 💡 最佳实践

### ✅ 推荐做法
```typescript
// 1. 延迟显示 loading
setTimeout(() => showCheckModal.value = true, 200)

// 2. 友好的错误提示
handleError(error, '请先登录再玩游戏哦~')

// 3. 提供重试机会
if (retryCount < maxRetryCount) {
  retryCheck()
}

// 4. 超过次数建议返回
if (retryCount >= maxRetryCount) {
  goToUserHome()
}
```

### ❌ 不推荐做法
```typescript
// 1. 立即显示 loading（卡顿感）
showCheckModal.value = true

// 2. 技术化错误信息
checkError.value = 'GTRS theme validation failed'

// 3. 不提供重试
showErrorModal.value = true  // 只能关闭

// 4. 忘记清理定时器
// clearTimeout(loadingTimer) ❌
```

---

## 📊 流程图

```
用户点击"开始游戏"
       ↓
   重置状态 (retryCount=0)
       ↓
   延迟 200ms 显示 Loading
       ↓
   步骤 1: 检查登录
   ├─ 未登录 → 显示错误 → 结束
   └─ 已登录 → 继续
       ↓
   步骤 2: 检查主题
   ├─ 未选择 → 显示错误 → 结束
   └─ 已选择 → 继续
       ↓
   步骤 3: 验证 GTRS
   ├─ 失败 → handleError → 可重试
   └─ 成功 → 继续
       ↓
   步骤 4: 启动引擎
       ↓
   进入游戏页面
```

---

**打印此卡片作为开发参考！** 📇
