# 🧪 Snake2 实体系统集成测试指南

**创建时间**: 2026-04-05  
**状态**: ✅ 已就绪，待 TypeScript 路径修复

---

## ⚠️ **前置条件**

### TypeScript 路径别名修复

当前 PhaserGame.ts 使用了 `@/` 路径别名，需要在 `tsconfig.json` 中配置：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**临时解决方案**: 使用相对路径
```typescript
// ❌ 当前（可能报错）
import type { SnakeSegment } from '@/types/game'

// ✅ 临时修复（使用相对路径）
import type { SnakeSegment } from '../../types/game'
```

---

## 🎯 **测试目标**

验证实体系统（SnakePhaserGameV2）成功集成到 PhaserGame 中。

---

## 📋 **测试步骤**

### Step 1: 修复 TypeScript 路径（5 分钟）

在 `kids-game-house/games/snake2/tsconfig.json` 中添加：

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

或者修改 PhaserGame.ts 的导入为相对路径：

```typescript
// 第 28-33 行
import type { SnakeSegment, Food, Difficulty } from '../../types/game'
import { FOOD_TYPES } from '../../types/game'
import { initUIParams, updateUIParams } from '../../utils/uiResponsive'
import type { SnakePhaserGameV2 as SnakePhaserGameV2Type } from './SnakePhaserGameV2'
import { validateGTRSTheme, type GTRSTheme as BaseGTRSTheme } from '../../utils/gtrs-validator'
import { useThemeStore } from '../../stores/theme'
import { ItemSystem, type ItemCollectEvent } from './components/ItemSystem'
```

---

### Step 2: 编译检查（2 分钟）

```bash
cd kids-game-house/games/snake2
npm run build

# 或者只检查类型
npx tsc --noEmit
```

**期望结果**: 无 TypeScript 错误

---

### Step 3: 启动开发服务器（1 分钟）

```bash
cd kids-game-house
npm run dev
```

访问：`http://localhost:5173/games/snake2`

---

### Step 4: 控制台测试（5 分钟）

打开浏览器控制台（F12），粘贴以下代码：

```javascript
// === 测试 1: 检查 Phaser 实例 ===
console.log('🔍 测试 1: 检查 Phaser 实例...')
const phaserGame = window.snakeGame?.phaserGame

if (phaserGame) {
  console.log('✅ Phaser 实例存在')
  console.log('   ├─ cellSize:', phaserGame.Adapt?.cellSize)
  console.log('   ├─ grid:', phaserGame.GRID_COLS, 'x', phaserGame.GRID_ROWS)
  console.log('   └─ snakeGameV2:', phaserGame.snakeGameV2 ? '✅ 存在' : '❌ 不存在')
} else {
  console.error('❌ Phaser 实例不存在')
}

// === 测试 2: 初始化实体系统 ===
console.log('\n🐍 测试 2: 初始化实体系统...')
setTimeout(() => {
  if (phaserGame && typeof phaserGame.initializeEntitySystem === 'function') {
    console.log('   🔄 调用 initializeEntitySystem()...')
    phaserGame.initializeEntitySystem()
    console.log('   ✅ 实体系统初始化完成')
  } else {
    console.error('   ❌ initializeEntitySystem 方法不存在')
  }
}, 1000)

// === 测试 3: 检查实体创建 ===
console.log('\n🐍 测试 3: 检查实体创建...')
setTimeout(() => {
  const snakeGameV2 = phaserGame?.snakeGameV2
  
  if (snakeGameV2) {
    console.log('   ✅ SnakePhaserGameV2 实例存在')
    
    const head = snakeGameV2.getSnakeHead()
    console.log('   ├─ 蛇头:', head ? '✅ 存在' : '❌ 不存在')
    
    const length = snakeGameV2.getSnakeLength()
    console.log('   └─ 蛇身长度:', length, '节')
    
    if (head) {
      console.log('       ├─ X 坐标:', head.x.toFixed(2))
      console.log('       └─ Y 坐标:', head.y.toFixed(2))
    }
  } else {
    console.error('   ❌ SnakePhaserGameV2 不存在')
  }
}, 2000)

// === 测试 4: 测试方向控制 ===
console.log('\n⌨️ 测试 4: 测试方向控制...')
setTimeout(() => {
  if (phaserGame && typeof phaserGame.setSnakeDirection === 'function') {
    console.log('   ⬆️ 设置方向：up')
    phaserGame.setSnakeDirection('up')
    
    setTimeout(() => {
      console.log('   ➡️ 设置方向：right')
      phaserGame.setSnakeDirection('right')
      
      setTimeout(() => {
        console.log('   ⬇️ 设置方向：down')
        phaserGame.setSnakeDirection('down')
        
        console.log('   ✅ 方向控制测试完成')
      }, 500)
    }, 500)
  } else {
    console.error('   ❌ setSnakeDirection 方法不存在')
  }
}, 3000)

// === 测试 5: 检查渲染日志 ===
console.log('\n🎨 测试 5: 检查渲染日志...')
console.log('   👀 观察控制台是否输出：🎨 [PhaserGame] 实体渲染完成 {...}')
console.log('   ⏱️ 应该每帧都输出一次（约 60 FPS）')
```

---

### Step 5: 观察期望输出

**完整的期望日志**:

```
🔍 测试 1: 检查 Phaser 实例...
✅ Phaser 实例存在
   ├─ cellSize: 50
   ├─ grid: 32 x 18
   └─ snakeGameV2: ✅ 存在

🐍 测试 2: 初始化实体系统...
   🔄 调用 initializeEntitySystem()...
🐍 [PhaserGame] 初始化实体系统 { cellSize: 50, grid: "32x18", worldSize: "1600x900" }
🐍 [SnakePhaserGameV2] 初始化完成 { cellSize: 50, grid: "32x18", worldSize: "1600x900" }
🐍 [SnakePhaserGameV2] 游戏启动
🐍 [SnakePhaserGameV2] 蛇创建完成 { headPosition: { x: 800, y: 450 }, bodyLength: 3 }
🧱 [SnakePhaserGameV2] 边界障碍物创建完成 { worldSize: "1600x900" }
🍎 [SnakePhaserGameV2] 食物生成 { position: { x: 325, y: 475 }, type: "normal" }
   ✅ 实体系统初始化完成

🐍 测试 3: 检查实体创建...
   ✅ SnakePhaserGameV2 实例存在
   ├─ 蛇头: ✅ 存在
   └─ 蛇身长度: 4 节
       ├─ X 坐标: 800.00
       └─ Y 坐标: 450.00

⌨️ 测试 4: 测试方向控制...
   ⬆️ 设置方向：up
   ➡️ 设置方向：right
   ⬇️ 设置方向：down
   ✅ 方向控制测试完成

🎨 测试 5: 检查渲染日志...
   👀 观察控制台是否输出：🎨 [PhaserGame] 实体渲染完成 {...}
🎨 [PhaserGame] 实体渲染完成 { textureKey: "entities_texture_v2", size: "1600x900", position: { x: 0, y: 0 } }
🎨 [PhaserGame] 实体渲染完成 { textureKey: "entities_texture_v2", size: "1600x900", position: { x: 0, y: 0 } }
... (持续输出，每帧一次)
```

---

## 🔍 **调试技巧**

### 检查渲染是否正常

```javascript
// 检查纹理是否存在
const scene = phaserGame.scene
if (scene && scene.textures.exists('entities_texture_v2')) {
  console.log('✅ 实体纹理存在')
  
  const texture = scene.textures.get('entities_texture_v2')
  console.log('   ├─ 宽度:', texture.width)
  console.log('   └─ 高度:', texture.height)
} else {
  console.error('❌ 实体纹理不存在')
}
```

---

### 检查游戏循环

```javascript
// 手动触发一次 update
console.log('🔄 手动触发 update...')
const deltaTime = 1 / 60  // 假设 60 FPS
phaserGame.update(Date.now(), deltaTime * 1000)
console.log('✅ update 执行完成')
```

---

### 检查内存泄漏

```javascript
// 监控纹理数量
setInterval(() => {
  const scene = phaserGame.scene
  if (scene) {
    const textures = scene.textures.getTextureKeys()
    console.log('📊 当前纹理数量:', textures.length)
    console.log('   └─ 纹理列表:', textures)
  }
}, 5000)
```

**期望**: 纹理数量保持稳定（不会持续增长）

---

## ⚠️ **常见问题排查**

### 问题 1: `initializeEntitySystem is not a function`

**原因**: PhaserGame.ts 未正确保存方法

**解决**:
```javascript
// 检查方法是否存在
console.log(typeof phaserGame.initializeEntitySystem)
// 应该输出 "function"

// 如果输出 "undefined"，检查 PhaserGame.ts 第 439-457 行
```

---

### 问题 2: 看不到渲染日志

**原因**: 
- update() 方法未被调用
- 游戏处于暂停状态
- renderEntitiesToPhaser() 有错误

**解决**:
```javascript
// 检查暂停状态
console.log('暂停状态:', phaserGame._isPaused)

// 手动调用渲染
phaserGame.renderEntitiesToPhaser()
```

---

### 问题 3: TypeScript 编译错误

**错误信息**:
```
Cannot find module '@/types/game'
```

**解决**: 参考 Step 1 修复路径别名

---

## 📊 **性能基准测试**

### FPS 测试

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

**期望**: 稳定在 60 FPS 左右

---

### 内存测试

```javascript
// 初始内存
const initialMemory = performance.memory?.usedJSHeapSize || 0
console.log('💾 初始内存:', (initialMemory / 1048576).toFixed(2), 'MB')

// 30 秒后检查
setTimeout(() => {
  const currentMemory = performance.memory?.usedJSHeapSize || 0
  const growth = (currentMemory - initialMemory) / 1048576
  
  console.log('💾 30 秒后内存:', (currentMemory / 1048576).toFixed(2), 'MB')
  console.log('📈 内存增长:', growth.toFixed(2), 'MB')
  console.log('📊 平均每秒增长:', (growth / 30).toFixed(2), 'MB/s')
}, 30000)
```

**期望**: 内存增长 < 10 MB/分钟

---

## ✅ **成功标准**

### 基础功能测试

- [ ] ✅ Phaser 实例存在
- [ ] ✅ snakeGameV2 字段存在
- [ ] ✅ initializeEntitySystem() 方法存在
- [ ] ✅ setSnakeDirection() 方法存在
- [ ] ✅ renderEntitiesToPhaser() 方法存在
- [ ] ✅ 蛇头实体创建成功
- [ ] ✅ 蛇身长度正确（4 节：1 头 +3 身）
- [ ] ✅ 食物生成成功
- [ ] ✅ 边界障碍物创建成功
- [ ] ✅ 方向控制响应正常

---

### 渲染质量测试

- [ ] ✅ 每帧都有渲染日志
- [ ] ✅ 纹理正常生成
- [ ] ✅ 蛇头显示正确
- [ ] ✅ 蛇身渐变效果正常
- [ ] ✅ 食物有缩放动画
- [ ] ✅ 障碍物纹理清晰

---

### 性能指标

- [ ] ✅ FPS 稳定在 60 左右（波动 <±5）
- [ ] ✅ 内存增长 < 10 MB/分钟
- [ ] ✅ GC 频率 > 10 秒一次
- [ ] ✅ 无明显卡顿或延迟

---

## 📝 **测试报告模板**

```markdown
## 测试结果

**测试时间**: 2026-04-05 XX:XX
**测试环境**: Chrome XX, Windows 11, Node.js XX

### 基础功能
- [ ] Phaser 实例：✅ / ❌
- [ ] 实体系统初始化：✅ / ❌
- [ ] 蛇创建：✅ / ❌
- [ ] 食物生成：✅ / ❌
- [ ] 方向控制：✅ / ❌

### 渲染质量
- [ ] 蛇头渲染：✅ / ❌
- [ ] 蛇身渐变：✅ / ❌
- [ ] 食物动画：✅ / ❌
- [ ] 障碍物纹理：✅ / ❌
- [ ] 每帧渲染日志：✅ / ❌

### 性能指标
- FPS: XX (期望 60±5)
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
