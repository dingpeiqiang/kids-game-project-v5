# 🧪 Snake2 实体系统快速测试指南

**创建时间**: 2026-04-05  
**状态**: ✅ 已就绪

---

## 🎯 **测试目标**

验证新的实体系统（SnakePhaserGameV2）在 PhaserGame 中的集成效果。

---

## 📋 **测试步骤**

### Step 1: 启动游戏并打开控制台

1. 启动开发服务器
```bash
cd kids-game-house
npm run dev
```

2. 访问贪吃蛇游戏页面
```
http://localhost:5173/games/snake2
```

3. 打开浏览器控制台（F12）

---

### Step 2: 初始化实体系统

在控制台中执行以下代码：

```javascript
// 获取当前 Phaser 游戏实例
const phaserGame = window.snakeGame?.phaserGame

if (phaserGame) {
  console.log('✅ Phaser 游戏实例存在')
  console.log('📏 CellSize:', phaserGame.Adapt?.cellSize)
  console.log('📐 Grid:', phaserGame.GRID_COLS, 'x', phaserGame.GRID_ROWS)
} else {
  console.error('❌ Phaser 游戏实例不存在')
}

// 初始化实体系统
setTimeout(() => {
  if (phaserGame && typeof phaserGame.initializeEntitySystem === 'function') {
    console.log('🐍 开始初始化实体系统...')
    phaserGame.initializeEntitySystem()
    console.log('✅ 实体系统初始化完成')
  } else {
    console.error('❌ initializeEntitySystem 方法不存在')
  }
}, 1000)
```

---

### Step 3: 观察日志输出

**期望看到的日志**:

```
🐍 [PhaserGame] 初始化实体系统 { cellSize: 50, grid: "32x18", worldSize: "1600x900" }
🐍 [SnakePhaserGameV2] 初始化完成 { cellSize: 50, grid: "32x18", worldSize: "1600x900" }
🐍 [SnakePhaserGameV2] 游戏启动
🐍 [SnakePhaserGameV2] 蛇创建完成 { headPosition: { x: 800, y: 450 }, bodyLength: 3 }
🧱 [SnakePhaserGameV2] 边界障碍物创建完成 { worldSize: "1600x900" }
🍎 [SnakePhaserGameV2] 食物生成 { position: { x: 325, y: 475 }, type: "normal" }
🎨 [PhaserGame] 实体渲染完成 { textureKey: "entities_texture_v2", size: "1600x900", position: { x: 0, y: 0 } }
```

---

### Step 4: 测试蛇移动

在控制台中执行：

```javascript
// 测试方向控制
const phaserGame = window.snakeGame?.phaserGame

console.log('⌨️ 测试方向控制...')

// 向上移动
phaserGame.setSnakeDirection('up')
console.log('⬆️ 设置方向：up')

// 等待 1 秒后向右移动
setTimeout(() => {
  phaserGame.setSnakeDirection('right')
  console.log('➡️ 设置方向：right')
}, 1000)

// 再等待 1 秒后向下移动
setTimeout(() => {
  phaserGame.setSnakeDirection('down')
  console.log('⬇️ 设置方向：down')
}, 2000)
```

---

### Step 5: 检查渲染效果

**观察要点**:

1. ✅ 蛇头应该显示在游戏区域中央
2. ✅ 蛇身应该有 3 节，呈渐变效果
3. ✅ 食物应该随机出现在某个位置
4. ✅ 边界应该有灰色障碍物
5. ✅ 每帧都应该有 `🎨 [PhaserGame] 实体渲染完成` 日志

---

## 🔍 **调试技巧**

### 检查实体系统状态

```javascript
const phaserGame = window.snakeGame?.phaserGame
const snakeGameV2 = phaserGame?.snakeGameV2

if (snakeGameV2) {
  console.log('🐍 蛇头位置:', snakeGameV2.getSnakeHead())
  console.log('🐍 蛇身长度:', snakeGameV2.getSnakeLength())
  console.log('📊 实体管理器统计:', snakeGameV2.getEntityManager().getStats())
}
```

---

### 手动触发碰撞检测

```javascript
const phaserGame = window.snakeGame?.phaserGame
const snakeGameV2 = phaserGame?.snakeGameV2

if (snakeGameV2) {
  // 强制将蛇头移动到食物位置
  const head = snakeGameV2.getSnakeHead()
  if (head) {
    head.x = 325  // 食物 X 坐标
    head.y = 475  // 食物 Y 坐标
    
    console.log('🐍 蛇头已移动到食物位置')
    
    // 下一帧应该会自动检测到碰撞
  }
}
```

---

### 检查对象池状态

```javascript
const { FoodPoolManager } = await import('@/utils/FoodPoolManager')

const poolManager = FoodPoolManager.getInstance()
const stats = poolManager.getStats()

console.log('🏊 食物池统计:', stats)
// 期望输出：
// {
//   totalAcquired: 1,
//   totalReleased: 0,
//   currentActive: 1,
//   poolSize: 5
// }
```

---

## ⚠️ **常见问题排查**

### 问题 1: 看不到蛇

**可能原因**:
- 实体系统未初始化
- 渲染桥接层未调用
- 蛇的坐标超出屏幕范围

**解决方法**:
```javascript
// 检查实体系统是否存在
console.log(window.snakeGame?.phaserGame?.snakeGameV2)

// 检查蛇头位置
const head = window.snakeGame?.phaserGame?.snakeGameV2?.getSnakeHead()
console.log('🐍 蛇头坐标:', head)

// 应该在游戏区域内（0 <= x <= 1600, 0 <= y <= 900）
```

---

### 问题 2: 没有渲染日志

**可能原因**:
- update() 方法未被调用
- 游戏处于暂停状态
- renderEntitiesToPhaser() 方法有错误

**解决方法**:
```javascript
// 检查是否暂停
console.log('⏸️ 暂停状态:', window.snakeGame?.phaserGame?._isPaused)

// 手动调用一次渲染
window.snakeGame?.phaserGame?.renderEntitiesToPhaser()
```

---

### 问题 3: TypeScript 编译错误

**错误信息**:
```
Cannot find module './SnakePhaserGameV2'
Property 'snakeGameV2' does not exist on type 'PhaserGame'
```

**解决方法**:
1. 检查文件路径是否正确
2. 重启 TypeScript 服务器（VSCode: Ctrl+Shift+P → "TypeScript: Restart TS Server"）
3. 清理缓存重新编译
```bash
npm run build
```

---

## 📊 **性能基准测试**

### 内存占用测试

```javascript
// 初始内存
console.log('💾 初始内存:', performance.memory?.usedJSHeapSize / 1048576, 'MB')

// 运行 10 秒后
setTimeout(() => {
  console.log('💾 10 秒后内存:', performance.memory?.usedJSHeapSize / 1048576, 'MB')
  console.log('📈 内存增长:', 
    (performance.memory?.usedJSHeapSize - initialMemory) / 1048576, 'MB')
}, 10000)
```

---

### GC 频率测试

```javascript
let gcCount = 0
let lastGCTime = Date.now()

// 监听 GC 事件（需要 Chrome DevTools Performance 面板）
// 或者观察帧率稳定性

setInterval(() => {
  const now = Date.now()
  const delta = now - lastGCTime
  
  if (delta > 1000) {
    console.log('🗑️ GC 间隔:', delta / 1000, '秒')
    lastGCTime = now
  }
}, 100)
```

---

### 帧率测试

```javascript
let frameCount = 0
let lastTime = performance.now()

function measureFPS() {
  frameCount++
  const now = performance.now()
  const delta = now - lastTime
  
  if (delta >= 1000) {
    console.log('🎬 FPS:', frameCount)
    frameCount = 0
    lastTime = now
  }
  
  requestAnimationFrame(measureFPS)
}

measureFPS()
```

**期望结果**:
- ✅ FPS 稳定在 60 左右
- ✅ 波动不超过 ±5

---

## ✅ **成功标准**

### 基础功能测试

- [ ] ✅ 实体系统成功初始化
- [ ] ✅ 蛇创建成功（蛇头 + 3 节蛇身）
- [ ] ✅ 食物生成成功
- [ ] ✅ 边界障碍物创建成功
- [ ] ✅ 蛇可以响应方向控制
- [ ] ✅ 每帧都有渲染日志

---

### 渲染质量测试

- [ ] ✅ 蛇头显示正确（带眼睛和舌头）
- [ ] ✅ 蛇身渐变效果正常
- [ ] ✅ 食物有缩放动画
- [ ] ✅ 障碍物有斜线纹理
- [ ] ✅ 所有实体都在游戏区域内

---

### 性能测试

- [ ] ✅ FPS 稳定在 60
- [ ] ✅ 内存增长缓慢（<10MB/分钟）
- [ ] ✅ GC 频率低（>10 秒一次）
- [ ] ✅ 无明显卡顿

---

## 📝 **测试报告模板**

```markdown
## 测试结果

**测试时间**: 2026-04-05 XX:XX
**测试环境**: Chrome XX, Windows 11

### 基础功能
- [ ] 实体系统初始化：✅ / ❌
- [ ] 蛇创建：✅ / ❌
- [ ] 食物生成：✅ / ❌
- [ ] 方向控制：✅ / ❌

### 渲染质量
- [ ] 蛇头渲染：✅ / ❌
- [ ] 蛇身渐变：✅ / ❌
- [ ] 食物动画：✅ / ❌
- [ ] 障碍物纹理：✅ / ❌

### 性能指标
- FPS: XX (期望 60)
- 内存增长: XX MB/分钟 (期望 <10)
- GC 频率: XX 秒一次 (期望 >10)

### 发现的问题
1. ...
2. ...

### 建议
1. ...
2. ...
```

---

**准备好开始测试了吗？** 🤖
