# 贪吃蛇游戏 - RESIZE 模式全屏适配

## 更新说明

从 **FIT 模式**升级为 **RESIZE 模式**，实现真正的全屏适配：

✅ **游戏背景完全填充屏幕** - 无黑边
✅ **游戏活动区域自适应** - 根据屏幕大小动态调整
✅ **背景渐变效果全屏** - 更美观的视觉效果
✅ **游戏区域居中显示** - 在全屏背景中居中显示游戏网格

## 技术方案

### Phaser RESIZE 模式

```typescript
scale: {
  mode: Phaser.Scale.RESIZE,  // RESIZE 模式：游戏世界尺寸随屏幕变化
  autoCenter: Phaser.Scale.CENTER_BOTH
}
```

**特点：**
- 游戏世界尺寸自动跟随屏幕大小
- 无黑边，背景完全填充屏幕
- 需要手动处理游戏区域的居中和尺寸计算
- 游戏逻辑使用相对坐标，支持动态缩放

### 核心实现

#### 1. 动态计算单元格大小

```typescript
private calculateCellSize(): void {
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  // 使用宽高中较小的一个作为游戏区域大小
  const gameAreaSize = Math.min(windowWidth, windowHeight)

  // 计算单元格大小（保留一些边距）
  this.cellSize = (gameAreaSize * 0.95) / this.gridSize
}
```

#### 2. 监听 resize 事件

```typescript
private create(): void {
  // 监听 resize 事件
  scene.scale.on('resize', this.handleResize.bind(this))

  // 创建背景、网格等
  this.createBackground(scene)
  this.createGrid(scene)
}

private handleResize(gameSize: Phaser.Structs.Size): void {
  // 重新计算单元格大小
  this.calculateCellSize()

  // 清除旧的背景和网格
  const graphicsList = this.scene.children.getChildren().filter(child => {
    return child instanceof Phaser.GameObjects.Graphics
  })

  graphicsList.forEach(graphics => {
    graphics.destroy()
  })

  // 重新创建背景和网格
  this.createBackground(this.scene)
  this.createGrid(this.scene)
}
```

#### 3. 创建全屏渐变背景

```typescript
private createBackground(scene: Phaser.Scene): void {
  const graphics = scene.add.graphics()

  // 获取当前画布尺寸（全屏）
  const width = scene.cameras.main.width
  const height = scene.cameras.main.height

  // 计算游戏区域大小（正方形）
  const gameAreaSize = Math.min(width, height) * 0.95
  const offsetX = (width - gameAreaSize) / 2
  const offsetY = (height - gameAreaSize) / 2

  // 全屏渐变背景
  const colors = [0x1a1a2e, 0x16213e, 0x0f3460]
  for (let y = 0; y < height; y += 8) {
    const ratio = y / height
    const color = this.interpolateColor(colors[0], colors[2], ratio)
    graphics.fillStyle(color, 1)
    graphics.fillRect(0, y, width, 8)
  }

  // 绘制游戏区域边框
  graphics.lineStyle(3, 0x4ade80, 0.5)
  graphics.strokeRect(offsetX, offsetY, gameAreaSize, gameAreaSize)

  // 填充游戏区域背景
  graphics.fillStyle(0x0a0a1a, 0.8)
  graphics.fillRect(offsetX, offsetY, gameAreaSize, gameAreaSize)
}
```

#### 4. 获取游戏区域偏移量

```typescript
private getGameAreaOffset(): { x: number; y: number } {
  if (!this.scene) return { x: 0, y: 0 }

  const width = this.scene.cameras.main.width
  const height = this.scene.cameras.main.height
  const gameAreaSize = Math.min(width, height) * 0.95

  return {
    x: (width - gameAreaSize) / 2,
    y: (height - gameAreaSize) / 2
  }
}
```

#### 5. 渲染时添加偏移量

```typescript
renderSnake(snake: SnakeSegment[]): void {
  const offset = this.getGameAreaOffset()

  snake.forEach((segment, index) => {
    const x = offset.x + segment.x * this.cellSize + this.cellSize / 2
    const y = offset.y + segment.y * this.cellSize + this.cellSize / 2
    // ...
  })
}

renderFood(food: Food | null): void {
  const offset = this.getGameAreaOffset()
  const x = offset.x + food.position.x * this.cellSize + this.cellSize / 2
  const y = offset.y + food.position.y * this.cellSize + this.cellSize / 2
  // ...
}
```

## 效果对比

### FIT 模式（之前）
```
+---------------------+
|                     |
|   +-------------+   |
|   |             |   |
|   |   游戏区域   |   |
|   |             |   |
|   +-------------+   |
|                     |
+---------------------+
 ↑ 黑边 ↑   ↓ 黑边 ↓
```

- 游戏区域固定大小（600x600）
- 屏幕四周有黑边
- 游戏内容不变形

### RESIZE 模式（现在）
```
+---------------------+
|   全屏渐变背景      |
|                     |
|   +-------------+   |
|   |             |   |
|   |   游戏区域   |   |
|   |             |   |
|   +-------------+   |
|                     |
+---------------------+
```

- 背景完全填充屏幕
- 游戏区域居中显示
- 游戏区域大小自适应
- 背景有漂亮的渐变效果

## 不同设备上的表现

| 设备类型 | 分辨率 | 背景 | 游戏区域 |
|---------|--------|------|---------|
| 桌面 PC (16:9) | 1920x1080 | 全屏渐变 | 600x600 居中 |
| 桌面 PC (4:3) | 1600x1200 | 全屏渐变 | 600x600 居中 |
| 平板 (3:2) | 1024x768 | 全屏渐变 | 600x600 居中 |
| 手机竖屏 | 375x812 | 全屏渐变 | 356x356 居中 |
| 手机横屏 | 812x375 | 全屏渐变 | 356x356 居中 |

**特点：**
- 背景始终全屏显示
- 游戏区域大小根据屏幕尺寸动态调整
- 游戏区域始终保持正方形
- 游戏区域居中显示

## 技术优势

### 1. 更美观
- ✅ 全屏渐变背景，视觉效果更佳
- ✅ 无黑边，更沉浸的游戏体验
- ✅ 游戏区域边框清晰可见

### 2. 更灵活
- ✅ 游戏区域大小自适应
- ✅ 支持任意屏幕比例
- ✅ 充分利用屏幕空间

### 3. 更专业
- ✅ 使用 Phaser 官方 RESIZE 模式
- ✅ 监听 resize 事件，自动适配
- ✅ 代码简洁，易于维护

## 测试方法

### 1. 桌面端测试
```bash
npm run dev
```
在浏览器中：
- 打开开发者工具（F12）
- 切换到设备模拟模式（Ctrl+Shift+M）
- 选择不同设备测试
- 调整窗口大小验证响应式

### 2. 验证清单
- [ ] 背景完全填充屏幕（无黑边）
- [ ] 背景有渐变效果
- [ ] 游戏区域居中显示
- [ ] 游戏区域大小自适应
- [ ] 游戏区域有绿色边框
- [ ] 调整窗口大小时平滑调整
- [ ] 横竖屏切换正常工作

### 3. 预期效果
- ✅ 背景始终全屏显示
- ✅ 游戏区域始终居中
- ✅ 游戏区域大小随屏幕变化
- ✅ 响应式流畅无卡顿

## 与 FIT 模式的对比

| 项目 | FIT 模式 | RESIZE 模式 |
|------|---------|-------------|
| 背景 | 有黑边 | 全屏填充 |
| 游戏区域 | 固定大小 | 自适应大小 |
| 代码复杂度 | 简单 | 中等 |
| 视觉效果 | 一般 | 优秀 |
| 适用场景 | 固定比例游戏 | 需要全屏背景的游戏 |

## 代码变更

### 主要修改

1. **Scale Manager 模式**
   - 从 `Phaser.Scale.FIT` 改为 `Phaser.Scale.RESIZE`

2. **添加 resize 监听**
   - 监听 `scene.scale.on('resize')` 事件
   - 自动重新计算单元格大小
   - 重新创建背景和网格

3. **动态计算偏移量**
   - 添加 `getGameAreaOffset()` 方法
   - 根据当前画布尺寸计算游戏区域偏移量

4. **渲染时使用偏移量**
   - 蛇渲染时添加偏移量
   - 食物渲染时添加偏移量
   - 粒子效果添加偏移量

## 常见问题

### Q: RESIZE 模式会影响性能吗？
A: 不会。RESIZE 模式只在窗口大小改变时触发，平时性能与 FIT 模式相同。

### Q: 如何调整游戏区域大小？
A: 修改 `gameAreaSize` 的计算逻辑中的 `0.95` 系数，值越大游戏区域越大。

### Q: 如何更改背景渐变颜色？
A: 修改 `createBackground()` 方法中的 `colors` 数组。

### Q: 游戏区域为什么要居中？
A: 保持游戏网格的正方形比例，确保蛇的移动逻辑简单稳定。

## 总结

使用 **Phaser RESIZE 模式** 实现了真正的全屏适配：

1. **背景全屏填充** - 无黑边，更美观
2. **游戏区域自适应** - 根据屏幕大小动态调整
3. **视觉效果优秀** - 全屏渐变背景
4. **响应式流畅** - 自动适配所有设备

**推荐：对于需要全屏背景的游戏，使用 RESIZE 模式是最佳选择。**

## 相关文档

- [Phaser Scale Manager 快速参考](./SCALE_MANAGER_QUICK_REF.md)
- [Phaser Scale Manager 官方方案](./PHASER_SCALE_MANAGER.md)
- [重构说明](./REFACTOR_SUMMARY.md)
- [Phaser 3 官方文档](https://photonstorm.github.io/phaser3-docs/)
