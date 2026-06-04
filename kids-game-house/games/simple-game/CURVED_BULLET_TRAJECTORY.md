# 曲线路径子弹效果实现

## 功能概述

实现了玩家子弹在移动时呈现曲线路径的视觉效果，增强游戏的动态感和视觉冲击力。

---

## 实现原理

### 核心思路

当玩家发射子弹后继续移动时，子弹会根据玩家的移动距离产生曲线偏移，形成类似"尾迹"的效果。

```
玩家发射子弹时记录位置 → 玩家继续移动 → 子弹根据移动差值产生曲线偏移
```

---

## 技术实现

### 1. 数据结构扩展

在子弹对象中添加 `originX` 字段，记录发射时的玩家X坐标：

```typescript
private bullets: { 
  x: number; 
  y: number; 
  vx: number; 
  vy: number; 
  pierce: number; 
  originX?: number  // 新增：发射时的玩家X位置
}[] = []
```

### 2. 发射时记录位置

在所有发射子弹的地方添加 `originX: this.playerX`：

```typescript
// 普通射击
this.bullets.push({ 
  x: this.playerX, 
  y: this.playerY - this.PLAYER_H / 2, 
  vx: 0, 
  vy: -this.BULLET_SPEED, 
  pierce: pierceCount, 
  originX: this.playerX  // 记录发射位置
})

// 三连射
this.bullets.push({ 
  x: this.playerX + ox, 
  y: this.playerY - this.PLAYER_H / 2, 
  vx: 0, 
  vy: -this.BULLET_SPEED * 1.3, 
  pierce: 3, 
  originX: this.playerX  // 记录发射位置
})

// 散射、激光等其他射击方式同理
```

### 3. 更新时应用曲线偏移

在 `updateBullets()` 函数中添加曲线计算逻辑：

```typescript
private updateBullets() {
  for (let i = this.bullets.length - 1; i >= 0; i--) {
    const b = this.bullets[i]
    
    // 曲线路径：根据发射位置和当前位置的差值产生偏移
    if (b.originX !== undefined && b.vx === 0) {
      // 计算玩家移动的距离
      const playerMoveX = this.playerX - b.originX
      
      // 子弹飞行距离（从发射点算起）
      const flyDistance = (BASE_H - 55) - b.y
      
      // 曲线系数：飞行越远，偏移越大，但逐渐减弱
      const curveFactor = Math.min(flyDistance / 300, 1.0) * 0.3
      
      // 应用曲线偏移
      b.x += playerMoveX * curveFactor * 0.1
    }
    
    b.x += b.vx; b.y += b.vy
    // ... 其他逻辑
  }
}
```

---

## 算法详解

### 曲线偏移计算公式

```
偏移量 = 玩家移动距离 × 曲线系数 × 衰减因子
```

**参数说明：**

1. **玩家移动距离** (`playerMoveX`)
   - 当前玩家X位置 - 发射时玩家X位置
   - 正值表示向右移动，负值表示向左移动

2. **飞行距离** (`flyDistance`)
   - 从发射点到当前子弹位置的垂直距离
   - 用于计算曲线系数

3. **曲线系数** (`curveFactor`)
   ```typescript
   curveFactor = Math.min(flyDistance / 300, 1.0) * 0.3
   ```
   - 飞行距离 / 300：归一化到0-1范围
   - `Math.min(..., 1.0)`：限制最大值为1
   - `* 0.3`：整体缩放，控制曲线强度

4. **衰减因子** (`0.1`)
   - 进一步减弱偏移效果，避免过度弯曲
   - 可根据需要调整

### 视觉效果

```
发射时刻 (t=0):
玩家位置: x=200
子弹位置: x=200, y=545

玩家向右移动到 x=250 (t=0.5s):
子弹位置: x=200 + (250-200) × 0.15 × 0.1 = 200.75
         ↑ 轻微向右偏移

玩家继续向右到 x=300 (t=1.0s):
子弹位置: x=200 + (300-200) × 0.3 × 0.1 = 203
         ↑ 偏移增大，形成曲线
```

---

## 适用条件

### 仅对垂直子弹生效

```typescript
if (b.originX !== undefined && b.vx === 0) {
  // 只处理 vx === 0 的子弹（垂直向上）
}
```

**原因：**
- 散射子弹本身就有水平速度 (`vx !== 0`)
- 散射已经有扇形轨迹，不需要额外曲线
- 只对垂直子弹应用曲线，效果更明显

---

## 参数调优

### 调整曲线强度

修改 `curveFactor` 的计算公式：

```typescript
// 更强的曲线
const curveFactor = Math.min(flyDistance / 200, 1.0) * 0.5

// 更弱的曲线
const curveFactor = Math.min(flyDistance / 400, 1.0) * 0.2

// 线性增长（无上限）
const curveFactor = (flyDistance / 300) * 0.3
```

### 调整衰减速度

修改最后的乘法因子：

```typescript
// 更快的衰减
b.x += playerMoveX * curveFactor * 0.05

// 更慢的衰减
b.x += playerMoveX * curveFactor * 0.2
```

---

## 视觉效果示例

### 场景1：玩家快速左右移动

```
     🚀 玩家当前位置
     
   ~~~~ 子弹轨迹（S形曲线）
   
  ~       ~
 ~         ~
~           ~
🔵 🔵 🔵 🔵 🔵  子弹序列
```

### 场景2：玩家持续向右移动

```
          🚀 玩家当前位置
          
        /
      /
    /
  /
🔵 🔵 🔵 🔵  子弹序列（弧线）
```

### 场景3：玩家静止不动

```
🚀 玩家位置

|
|
|
🔵 🔵 🔵 🔵  子弹序列（直线）
```

---

## 性能优化

### 1. 条件判断

只在必要时计算曲线：
```typescript
if (b.originX !== undefined && b.vx === 0) {
  // 只有垂直子弹才计算
}
```

### 2. 避免重复计算

`originX` 只在发射时设置一次，后续不再修改。

### 3. 数学运算简化

使用简单的乘法和除法，避免复杂的三角函数或平方根运算。

---

## 兼容性

### 与其他系统的兼容

✅ **道具系统** - 所有道具射击都支持曲线  
✅ **穿透弹** - 穿透效果不受影响  
✅ **连击系统** - 不影响得分计算  
✅ **碰撞检测** - 曲线偏移在碰撞检测之前应用  

### 边界情况处理

- **子弹超出屏幕** - 正常移除，无特殊处理
- **玩家快速移动** - 曲线系数有上限，不会过度偏移
- **多子弹同时发射** - 每颗子弹独立计算，互不影响

---

## 未来扩展

### 1. 可配置的曲线强度

```typescript
private readonly CURVE_STRENGTH = 0.3  // 可在设置中调整
```

### 2. 不同类型的曲线

```typescript
// 正弦曲线
b.x += Math.sin(flyDistance / 50) * 5

// 抛物线
b.x += Math.pow(flyDistance / 100, 2) * playerMoveX * 0.01
```

### 3. 粒子尾迹

为曲线子弹添加粒子效果，增强视觉冲击：

```typescript
if (Math.abs(playerMoveX) > 1) {
  this.explode(b.x, b.y, '#4FC3F7', 1, 1)
}
```

---

## 总结

✅ **实现简单** - 只需添加一个字段和几行计算代码  
✅ **效果明显** - 玩家能清晰感受到移动对子弹的影响  
✅ **性能友好** - 计算量小，不影响游戏帧率  
✅ **视觉增强** - 增加游戏的动态感和爽快感  

这个曲线路径子弹效果让太空射击游戏的体验更加流畅和有趣！🎮✨
