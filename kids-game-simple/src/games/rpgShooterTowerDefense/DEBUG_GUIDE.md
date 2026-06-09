# RPG塔防射击游戏 - 调试指南

## 🔍 问题诊断

如果游戏只显示深色背景，请按以下步骤排查：

---

## 📋 检查清单

### 1. 打开浏览器控制台
按 F12 或右键 → 检查 → Console 标签

### 2. 查看启动日志

**应该看到的日志**：
```
🏰 启动RPG塔防射击游戏...
Canvas 尺寸: 400x600
游戏状态已创建 {...}
初始渲染完成
渲染帧 - gameStarted: false gameEnded: false
✅ RPG塔防射击游戏已启动！
📝 操作说明：
  - 鼠标移动：控制角色
  - 按B键：进入/退出建造模式
  ...
```

**如果看不到这些日志**：
- ❌ 游戏未正确启动
- 检查App.ts是否正确调用initRpgShooterTD
- 检查是否有JavaScript错误

### 3. 检查Canvas元素

在Console中运行：
```javascript
document.getElementById('mainGameCanvas')
```

**应该返回**：
```
<canvas id="mainGameCanvas" width="400" height="600">
```

**如果返回null**：
- ❌ Canvas不存在
- 检查游戏引擎是否正确创建了Canvas

### 4. 检查渲染循环

在Console中运行：
```javascript
// 检查是否有动画帧在运行
// 应该看到持续的日志输出
```

---

## 🐛 常见问题

### 问题1：控制台没有任何日志

**原因**：游戏初始化函数未被调用

**解决**：
1. 检查App.ts第866行是否有：
   ```typescript
   case 'rpgShooterTD': initRpgShooterTD(gameEngine, () => this.endGame()); break
   ```

2. 检查导入是否正确（第36行）：
   ```typescript
   import { initRpgShooterTD } from './games/rpgShooterTowerDefense/init'
   ```

3. 重启开发服务器：
   ```bash
   Ctrl+C
   npm run dev
   ```

### 问题2：看到"未找到Canvas元素"错误

**原因**：Canvas ID不匹配

**解决**：
init.ts中应该使用：
```typescript
const canvas = document.getElementById('mainGameCanvas')
```

而不是：
```typescript
const canvas = document.querySelector('canvas')
```

### 问题3：看到日志但画面仍是黑色

**可能原因**：
- 渲染函数有错误
- Canvas上下文获取失败
- 绘制代码有问题

**调试步骤**：
1. 在Console中手动测试绘制：
   ```javascript
   const canvas = document.getElementById('mainGameCanvas')
   const ctx = canvas.getContext('2d')
   ctx.fillStyle = 'red'
   ctx.fillRect(50, 50, 100, 100)
   ```
   如果看到红色方块，说明Canvas工作正常

2. 检查render函数是否被调用：
   - 应该看到持续的"渲染帧"日志
   - 如果没有，说明gameLoop未启动

### 问题4：看到开始界面但点击无反应

**原因**：事件监听器未正确绑定

**检查**：
```javascript
// 在Console中检查
state.gameStarted  // 应该是false（开始前）
```

点击后应该变为true。

---

## 🔧 快速修复

如果以上都不起作用，尝试这个简化版本：

### 创建测试文件
在 `init.ts` 开头添加：

```typescript
export function initRpgShooterTD(engine: GameEngine, onEnd: () => void) {
  console.log('=== 游戏启动测试 ===')
  
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  if (!canvas) {
    console.error('❌ Canvas not found!')
    return
  }
  
  console.log('✅ Canvas found:', canvas)
  
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    console.error('❌ Context not found!')
    return
  }
  
  console.log('✅ Context found')
  
  // 简单测试绘制
  ctx.fillStyle = '#1a1a2e'
  ctx.fillRect(0, 0, 400, 600)
  
  ctx.fillStyle = '#fff'
  ctx.font = '20px sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('TEST - 游戏正在运行', 200, 300)
  
  console.log('✅ Test draw complete')
}
```

如果能看到"TEST - 游戏正在运行"文字，说明基础功能正常，问题在游戏逻辑中。

---

## 📊 预期行为

### 正常流程
1. 点击游戏卡片
2. 控制台显示启动日志
3. 看到深色背景 + 开始界面文字
4. 点击屏幕或按空格
5. 游戏开始，看到角色和UI
6. 敌人开始生成

### 异常流程
- 只有深色背景 → 检查渲染函数
- 没有任何内容 → 检查Canvas获取
- 控制台报错 → 根据错误信息修复

---

## 🎯 下一步

如果仍然有问题，请提供：
1. 控制台的完整日志
2. 是否有错误信息
3. Canvas元素是否存在
4. 渲染帧日志是否持续输出

这样可以更准确地定位问题！

---

*调试时间：2026-01-04*
*版本：v1.1 (带调试日志)*
