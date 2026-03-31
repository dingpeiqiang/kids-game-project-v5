# 🎮 Snake2 性能监控 - 使用演示

**版本**: v2.1.0-dev  
**创建时间**: 2026-04-05  

---

## 🚀 快速演示（30 秒）

### 第 1 步：启动游戏

```bash
cd kids-game-house/games/snake2
npm install  # 首次运行
npm run dev
```

访问：**http://localhost:3006/**

---

### 第 2 步：查看性能监控

进入游戏后，您会在**右上角**看到性能监控面板：

```
┌─────────────────────┐
│ FPS      60 Hz      │ ← 绿色表示优秀
│ Frame   16.7 ms     │
│ Memory  120.5 MB    │
└─────────────────────┘
```

---

### 第 3 步：交互测试

按 **↑↓←→** 控制蛇移动，观察 FPS 变化：

- ✅ **稳定 60 FPS** - 性能优秀
- ⚠️ **FPS 下降** - 可能有性能问题
- 🔴 **FPS < 30** - 需要优化

---

## 📊 实时监控指标

### 基础指标（默认显示）

| 指标 | 位置 | 说明 | 正常值 |
|------|------|------|--------|
| **FPS** | 第一行 | 每秒帧数 | 60 |
| **Frame Time** | 第二行 | 每帧耗时 | < 16.67ms |
| **Memory** | 第三行 | 内存占用 | < 150MB |

---

### 高级指标（可选）

启用方法：
```vue
<PerformanceMonitor :showAdvanced="true" />
```

| 指标 | 说明 | 正常值 |
|------|------|--------|
| **Render Time** | 渲染耗时 | < 10ms |
| **Update Time** | 逻辑更新耗时 | < 10ms |

---

## 🎨 可视化效果

### FPS 颜色编码

```typescript
🟢 绿色 (>= 55 FPS)  - 性能优秀
🟡 黄色 (30-54 FPS)  - 性能一般
🔴 红色 (< 30 FPS)   - 性能警告
```

---

### 性能警告示例

当检测到问题时，会自动显示警告：

```
┌─────────────────────────────┐
│ FPS      25 Hz      🔴     │
│ Frame   40.0 ms             │
│ Memory  220.5 MB            │
├─────────────────────────────┤
│ ⚠️ FPS 过低：25 (目标：60) │
│ ⚠️ 帧时间过长：40ms         │
│ ⚠️ 内存占用过高：220MB      │
└─────────────────────────────┘
```

---

## 💻 代码集成示例

### 方法 1: 全局添加（推荐）

在 `App.vue` 中添加：

```vue
<template>
  <div id="app">
    <router-view />
    <!-- 性能监控 -->
    <PerformanceMonitor 
      v-if="isDev"
      size="medium"
    />
  </div>
</template>

<script setup lang="ts">
import PerformanceMonitor from '@/components/ui/PerformanceMonitor.vue'

const isDev = import.meta.env.DEV
</script>
```

---

### 方法 2: 条件显示

```vue
<template>
  <button @click="showPerf = !showPerf">
    {{ showPerf ? '隐藏' : '显示' }}性能监控
  </button>
  
  <PerformanceMonitor :visible="showPerf" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PerformanceMonitor from '@/components/ui/PerformanceMonitor.vue'

const showPerf = ref(false)
</script>
```

---

### 方法 3: 快捷键切换

```vue
<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { ref } from 'vue'

const showPerf = ref(false)

onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'p' || e.key === 'P') {
      showPerf.value = !showPerf.value
    }
  })
})
</script>
```

---

## 🔧 浏览器控制台使用

### 直接访问监控器

打开浏览器控制台 (F12)，输入：

```javascript
// 获取监控器实例
const monitor = window.__SNAKE2_PERF_MONITOR__

// 查看当前性能
monitor.getMetrics()

// 打印报告
monitor.printReport()

// 检查问题
const issues = monitor.checkPerformanceIssues()
console.log('性能问题:', issues)
```

---

### 自动注入（开发环境）

在 `main.ts` 中添加：

```typescript
// 开发环境暴露监控器
if (import.meta.env.DEV) {
  const monitor = PerformanceMonitor.getInstance()
  ;(window as any).__SNAKE2_PERF_MONITOR__ = monitor
}
```

---

## 📈 性能分析场景

### 场景 1: 游戏启动

观察加载过程中的性能：

```
初始状态 → Loading → 游戏开始
Memory: 50MB → 80MB → 120MB
FPS: N/A → 30 → 60
```

---

### 场景 2: 大量食物生成

测试对象池效果：

```javascript
// 生成 100 个食物
for (let i = 0; i < 100; i++) {
  spawnFood()
}

// 观察内存变化
// 使用对象池：+10MB
// 不使用对象池：+50MB
```

---

### 场景 3: 复杂碰撞检测

测试四叉树优化：

```
蛇长度：10 → 50 → 100
碰撞检测时间：1ms → 2ms → 3ms
（使用四叉树优化）

对比未优化：
碰撞检测时间：1ms → 10ms → 40ms
```

---

## 🎯 最佳实践

### ✅ 推荐做法

1. **开发环境始终开启**
   - 实时发现问题
   - 不影响用户体验

2. **定期打印报告**
   ```javascript
   // 每分钟打印一次
   setInterval(() => {
     monitor.printReport()
   }, 60000)
   ```

3. **设置性能基线**
   ```javascript
   const baseline = {
     fps: 60,
     memory: 120,
     frameTime: 16
   }
   ```

---

### ❌ 避免的做法

1. **生产环境开启**
   - 增加不必要的开销
   - 暴露内部数据

2. **过度监控**
   - 不要同时开启多个监控
   - 选择合适的采样频率

3. **忽略警告**
   - 发现警告立即排查
   - 不要习惯性忽略

---

## 🐛 故障排查

### 问题 1: 监控不显示

**检查清单**:
- [ ] 组件是否正确导入
- [ ] visible 是否为 true
- [ ] z-index 是否被遮挡
- [ ] 浏览器是否支持

**解决方案**:
```vue
<PerformanceMonitor 
  :visible="true"
  size="large"
/>
```

---

### 问题 2: FPS 显示为 0

**可能原因**:
- 游戏未运行
- 监控循环未启动
- 浏览器后台运行

**解决方案**:
```javascript
// 确保游戏在前台运行
// 检查 requestAnimationFrame 是否正常
```

---

### 问题 3: 内存数据不准确

**说明**: 
- 依赖浏览器 API
- Safari 不支持
- 数据仅供参考

**替代方案**:
```javascript
// 使用 Chrome DevTools Memory 面板
performance.memory.usedJSHeapSize
```

---

## 📚 进阶使用

### 自定义监控指标

```typescript
// 扩展 PerformanceMonitor
class CustomMonitor extends PerformanceMonitor {
  setCustomMetric(name: string, value: number) {
    this.metrics[name] = value
  }
}

// 使用
monitor.setCustomMetric('foodCount', 50)
```

---

### 性能数据持久化

```typescript
// 保存性能数据
const saveMetrics = () => {
  const metrics = monitor.getMetrics()
  localStorage.setItem('perf_metrics', JSON.stringify(metrics))
}

// 定时保存
setInterval(saveMetrics, 5000)
```

---

### 性能报告导出

```typescript
// 导出为 JSON
const exportReport = () => {
  const report = {
    timestamp: Date.now(),
    metrics: monitor.getMetrics(),
    issues: monitor.checkPerformanceIssues()
  }
  
  const blob = new Blob([JSON.stringify(report)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `perf-report-${Date.now()}.json`
  a.click()
}
```

---

## 🎉 总结

### 核心价值

✅ **实时可见** - 性能问题一目了然  
✅ **即时反馈** - 修改后立即看到效果  
✅ **数据驱动** - 用数据指导优化  
✅ **预防为主** - 在问题出现前发现  

---

### 立即尝试

```bash
cd snake2
npm run dev
# 访问 http://localhost:3006/
# 按 P 键切换性能监控显示
```

---

**让性能监控成为您的开发利器！** 🚀

**最后更新**: 2026-04-05  
**维护者**: GCRS 开发团队  
**版本**: v2.1.0-dev
