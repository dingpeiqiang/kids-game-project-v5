# Simple-Game 移动端优化快速参考

## 🚀 5分钟快速优化任何游戏

### Step 1: 导入工具（文件顶部）

```typescript
import { bindCanvasEvents, getPointerPos, resizeCanvasForMobile } from '../utils/mobileHelper'
```

### Step 2: 初始化 Canvas（游戏开始处）

```typescript
const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
resizeCanvasForMobile(canvas)
```

### Step 3: 修改事件处理函数

**原来的代码：**
```typescript
canvas.onclick = (e: MouseEvent) => {
  const rect = canvas.getBoundingClientRect()
  const mx = (e.clientX - rect.left) * (W / rect.width)
  const my = (e.clientY - rect.top) * (H / rect.height)
  // ... 游戏逻辑
}
```

**优化后的代码：**
```typescript
const handleClick = (e: MouseEvent | TouchEvent) => {
  const pos = getPointerPos(e, canvas)
  const mx = pos.x
  const my = pos.y
  // ... 游戏逻辑（保持不变）
}
```

### Step 4: 绑定事件（文件末尾，loop() 之前）

```typescript
// 清除旧的事件监听器
canvas.onclick = null
canvas.onmousedown = null

// 绑定鼠标和触摸事件
bindCanvasEvents(canvas, handleClick)

loop()
```

---

## 📋 检查清单

优化完成后，确认以下事项：

- [ ] 导入了 mobileHelper
- [ ] 调用了 resizeCanvasForMobile(canvas)
- [ ] 创建了统一的事件处理函数
- [ ] 使用 getPointerPos 获取坐标
- [ ] 清除了旧的事件监听器
- [ ] 使用 bindCanvasEvents 绑定事件
- [ ] 在真机上测试通过

---

## 🔍 常见问题

### Q: 游戏有多个事件处理函数怎么办？

A: 为每个事件创建独立的处理函数：

```typescript
const handleClick = (e: MouseEvent | TouchEvent) => { /* ... */ }
const handleMove = (e: MouseEvent | TouchEvent) => { /* ... */ }

bindCanvasEvents(canvas, handleClick)
canvas.addEventListener('mousemove', handleMove)
canvas.addEventListener('touchmove', handleMove, { passive: false })
```

### Q: 需要同时支持拖拽怎么办？

A: 参考 dodge.ts 的实现：

```typescript
let dragging = false
let lastX = 0

const handleStart = (e: MouseEvent | TouchEvent) => {
  dragging = true
  const pos = getPointerPos(e, canvas)
  lastX = pos.x
}

const handleMove = (e: MouseEvent | TouchEvent) => {
  if (!dragging) return
  const pos = getPointerPos(e, canvas)
  const dx = pos.x - lastX
  player.x += dx
  lastX = pos.x
}

const handleEnd = () => {
  dragging = false
}

canvas.addEventListener('mousedown', handleStart)
canvas.addEventListener('touchstart', handleStart, { passive: false })
canvas.addEventListener('mousemove', handleMove)
canvas.addEventListener('touchmove', handleMove, { passive: false })
canvas.addEventListener('mouseup', handleEnd)
canvas.addEventListener('touchend', handleEnd)
```

### Q: 如何添加虚拟摇杆？

A: 参考 mobileHelper 中的 createVirtualJoystick：

```typescript
import { createVirtualJoystick } from '../utils/mobileHelper'

if (isMobile()) {
  const container = document.getElementById('game-container')!
  const joystick = createVirtualJoystick(container)
  
  function update() {
    const dir = joystick.getDirection()
    player.x += dir.x * speed
    player.y += dir.y * speed
  }
  
  // 游戏结束时清理
  function cleanup() {
    joystick.destroy()
  }
}
```

---

## 💡 优化技巧

### 1. 减少粒子数量（移动端）

```typescript
import { isMobile } from '../utils/mobileHelper'

const PARTICLE_COUNT = isMobile() ? 10 : 20
```

### 2. 调整 UI 元素大小

```typescript
const SCALE_RATIO = isMobile() ? 0.8 : 1.0
const BUTTON_SIZE = 44 * SCALE_RATIO
const FONT_SIZE = 16 * SCALE_RATIO
```

### 3. 检测横屏/竖屏

```typescript
function isLandscape(): boolean {
  return window.innerWidth > window.innerHeight
}

// 根据方向调整布局
if (isLandscape()) {
  // 横屏布局
} else {
  // 竖屏布局
}
```

---

## 📱 真机测试要点

在手机上测试时，重点检查：

1. **触摸响应**
   - 点击是否灵敏
   - 是否有延迟
   - 多指触摸是否会误触

2. **显示效果**
   - Canvas 是否清晰
   - UI 元素是否可见
   - 文字是否可读

3. **性能表现**
   - 是否流畅（60fps）
   - 是否发热
   - 电池消耗

4. **交互体验**
   - 操作是否自然
   - 是否需要频繁缩放页面
   - 横竖屏切换是否正常

---

## 🎯 示例：完整优化流程

以 jewelMatch 为例：

```typescript
// ====== 文件顶部 ======
import type { GameEngine } from '../services/gameEngine'
import { audioService } from '../services/audio'
import { bindCanvasEvents, getPointerPos, resizeCanvasForMobile } from '../utils/mobileHelper'

export function initJewelMatch(engine: GameEngine, onEnd: () => void) {
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  
  const W = 400, H = 600
  
  // ====== 初始化 Canvas ======
  resizeCanvasForMobile(canvas)
  
  // ... 游戏初始化代码 ...
  
  // ====== 事件处理函数 ======
  const handleClick = (e: MouseEvent | TouchEvent) => {
    const pos = getPointerPos(e, canvas)
    const mx = pos.x
    const my = pos.y
    
    // ... 原有的游戏逻辑（保持不变）...
    const col = Math.floor((mx - offsetX) / cellSize)
    const row = Math.floor((my - offsetY) / cellSize)
    
    // 处理点击
    handleGemClick(row, col)
  }
  
  // ... 游戏主循环 ...
  
  // ====== 绑定事件 ======
  canvas.onclick = null
  canvas.onmousedown = null
  bindCanvasEvents(canvas, handleClick)
  
  loop()
}
```

---

## 📚 相关文档

- [移动端优化指南](./MOBILE_OPTIMIZATION_GUIDE.md) - 详细说明
- [支持状态跟踪](./MOBILE_SUPPORT_STATUS.md) - 进度跟踪
- [完成报告](./MOBILE_OPTIMIZATION_COMPLETE.md) - 工作总结
- [mobileHelper 源码](../src/utils/mobileHelper.ts) - 工具库实现

---

**最后更新**: 2026-05-16  
**维护者**: AI Assistant