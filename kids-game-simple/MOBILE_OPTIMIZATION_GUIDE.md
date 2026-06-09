# Simple-Game 移动端优化指南

## 概述

本文档说明如何为 simple-game 下的所有游戏添加移动端支持，使其在手机和平板设备上也能流畅运行。

## 优化原则

1. **触摸事件支持**：所有点击事件必须同时支持 `click` 和 `touchstart`
2. **Canvas 缩放**：移动端自动缩小 Canvas 尺寸以适应小屏幕
3. **UI 自适应**：按钮、文字等 UI 元素根据屏幕大小自动调整
4. **虚拟控制**：为需要方向控制的游戏提供虚拟摇杆
5. **性能优化**：减少粒子数量，降低渲染负担

## 快速开始

### 1. 导入移动端辅助工具

在每个游戏文件的顶部添加：

```typescript
import { 
  isMobile, 
  bindCanvasEvents, 
  getPointerPos, 
  resizeCanvasForMobile,
  createVirtualJoystick,
  createMobileButton
} from '../utils/mobileHelper'
```

### 2. 初始化 Canvas 尺寸

在游戏初始化时调用：

```typescript
const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
resizeCanvasForMobile(canvas)
```

### 3. 替换事件绑定

**原来的代码：**
```typescript
canvas.onclick = (e: MouseEvent) => {
  const rect = canvas.getBoundingClientRect()
  const mx = (e.clientX - rect.left) * (W / rect.width)
  const my = (e.clientY - rect.top) * (H / rect.height)
  // ... 处理逻辑
}
```

**优化后的代码：**
```typescript
// 清除旧的事件监听器
canvas.onclick = null
canvas.onmousedown = null

// 统一的事件处理函数
const handleClick = (e: MouseEvent | TouchEvent) => {
  const pos = getPointerPos(e, canvas)
  const mx = pos.x
  const my = pos.y
  // ... 处理逻辑（与原来相同）
}

// 绑定鼠标和触摸事件
bindCanvasEvents(canvas, handleClick)
```

### 4. 添加虚拟摇杆（可选）

对于需要方向控制的游戏（如赛车、跑酷）：

```typescript
let joystick: ReturnType<typeof createVirtualJoystick> | null = null

if (isMobile()) {
  const container = document.getElementById('game-container')!
  joystick = createVirtualJoystick(container)
  
  // 在游戏循环中使用
  function update() {
    if (joystick) {
      const dir = joystick.getDirection()
      player.x += dir.x * speed
      player.y += dir.y * speed
    }
  }
}

// 游戏结束时清理
function cleanup() {
  if (joystick) {
    joystick.destroy()
  }
}
```

### 5. 添加移动端控制按钮（可选）

```typescript
if (isMobile()) {
  const container = document.getElementById('game-container')!
  
  // 跳跃按钮
  createMobileButton(container, {
    text: '跳跃',
    position: 'right',
    onClick: () => {
      player.jump()
    }
  })
  
  // 射击按钮
  createMobileButton(container, {
    text: '射击',
    position: 'left',
    onClick: () => {
      player.shoot()
    }
  })
}
```

## 已优化的游戏列表

### ✅ 已完成优化

1. **eliminate (极速消除)** - 点击类游戏
   - 添加了触摸事件支持
   - Canvas 自动缩放
   - 坐标获取统一化

### 🔄 待优化游戏

以下游戏需要按照上述步骤进行优化：

#### 点击/消除类（优先级：高）
- [ ] dodge (轻量躲避)
- [ ] pop (气球砰砰)
- [ ] fruitSlice (水果切切)
- [ ] cookieCut (切饼干)
- [ ] whackMole (打地鼠)
- [ ] colorTap (颜色Tap)

#### 益智/策略类（优先级：中）
- [ ] sort (色彩排序)
- [ ] tetris (方块消除)
- [ ] jewelMatch (宝石消消乐)
- [ ] starCatcher (星星捕手)
- [ ] bubbleShooter (泡泡龙)
- [ ] memoryMatch (翻牌配对)
- [ ] snake (贪吃蛇)

#### 动作/射击类（优先级：高）
- [ ] bouncePath (弹珠迷宫)
- [ ] neonRun (霓虹跑酷)
- [ ] slimeJump (史莱姆跳)
- [ ] stack (叠叠乐)
- [ ] spaceShooter (太空射击)
- [ ] towerDefense (星际塔防)
- [ ] racingRun (极速赛车)
- [ ] rpgShooter (星际猎手)
- [ ] dragonShooter (打龙小游戏)
- [ ] rpgShooterTD (RPG塔防射击)

#### 3D 游戏（优先级：低）
- [ ] stack3d (3D堆叠乐园)

## 具体游戏优化建议

### 1. 消除类游戏 (eliminate, jewelMatch, tetris)
- ✅ 已支持触摸点击
- 需要确保道具栏按钮也支持触摸

### 2. 射击类游戏 (spaceShooter, dragonShooter, rpgShooter)
- 需要添加虚拟摇杆控制移动
- 自动射击无需额外按钮
- 道具按钮需要支持触摸

### 3. 跑酷类游戏 (neonRun, racingRun)
- 需要左右切换车道的触摸按钮
- 或者使用虚拟摇杆
- 道具拾取自动触发

### 4. 塔防类游戏 (towerDefense, rpgShooterTD)
- 建造按钮需要支持触摸
- 角色移动需要虚拟摇杆
- 炮台放置直接点击地图

### 5. 切割类游戏 (fruitSlice, cookieCut)
- 滑动切割需要同时监听 touchmove
- 轨迹绘制需要适配触摸坐标

## 测试清单

在真机上测试以下内容：

- [ ] 游戏能否正常启动
- [ ] 触摸点击是否响应灵敏
- [ ] Canvas 尺寸是否合适（不会太大或太小）
- [ ] UI 元素是否清晰可见
- [ ] 虚拟摇杆是否流畅
- [ ] 游戏性能是否流畅（60fps）
- [ ] 横屏/竖屏切换是否正常
- [ ] 多指触摸是否会误触

## 常见问题

### Q1: 触摸延迟怎么办？
A: 确保 `touchstart` 事件设置 `{ passive: false }`，并在事件处理中调用 `e.preventDefault()`

### Q2: Canvas 在手机上显示模糊？
A: 检查 Canvas 的 CSS 尺寸和实际像素尺寸是否匹配，避免浏览器自动缩放

### Q3: 虚拟摇杆不灵敏？
A: 调整摇杆的最大移动距离和灵敏度参数

### Q4: 游戏在低端手机上卡顿？
A: 减少粒子数量，降低渲染频率，简化特效

## 性能优化建议

1. **减少粒子数量**：移动端粒子数量减半
2. **降低渲染分辨率**：使用 `devicePixelRatio` 适配
3. **使用 requestAnimationFrame**：确保流畅动画
4. **避免频繁 DOM 操作**：批量更新 UI
5. **及时清理事件监听器**：防止内存泄漏

## 下一步计划

1. 逐个优化剩余游戏
2. 建立自动化测试流程
3. 收集用户反馈持续改进
4. 添加更多移动端专属功能（如震动反馈）

---

**最后更新**: 2026-05-16
**维护者**: AI Assistant