# Phaser Scale Manager 快速参考

## 核心配置

```typescript
// Phaser Scale Manager 配置
scale: {
  mode: Phaser.Scale.FIT,           // FIT 模式：保持比例，自动适应
  autoCenter: Phaser.Scale.CENTER_BOTH,  // 自动居中
  width: '100%',                   // 占满容器宽度
  height: '100%'                   // 占满容器高度
}
```

## 常用模式

### 1. FIT 模式（推荐）
```typescript
mode: Phaser.Scale.FIT
```
- 保持游戏宽高比
- 自动缩放适应屏幕
- 自动居中显示
- 不足区域添加黑边
- **适用**：固定比例游戏（贪吃蛇、俄罗斯方块等）

### 2. RESIZE 模式
```typescript
mode: Phaser.Scale.RESIZE
```
- 游戏世界尺寸随屏幕变化
- 利用全部屏幕空间
- 需要手动处理响应式
- **适用**：自由视角游戏、策略游戏

### 3. EXACT_FIT 模式
```typescript
mode: Phaser.Scale.EXACT_FIT
```
- 拉伸填满屏幕
- 内容会变形
- **适用**：不变形的游戏（纯色背景等）

### 4. NONE 模式
```typescript
mode: Phaser.Scale.NONE
```
- 不进行缩放
- 使用原始尺寸
- **适用**：特殊需求

## 自动居中选项

```typescript
autoCenter: Phaser.Scale.CENTER_BOTH   // 水平和垂直居中
autoCenter: Phaser.Scale.CENTER_HORIZ  // 仅水平居中
autoCenter: Phaser.Scale.CENTER_VERT   // 仅垂直居中
autoCenter: Phaser.Scale.NO_CENTER     // 不居中
```

## 贪吃蛇游戏示例

### 完整配置
```typescript
export class SnakePhaserGame {
  // 固定游戏世界尺寸
  private readonly GAME_WIDTH = 600
  private readonly GAME_HEIGHT = 600
  private readonly GRID_SIZE = 20

  constructor(element: HTMLElement) {
    this.cellSize = this.GAME_WIDTH / this.GRID_SIZE

    this.config = {
      type: Phaser.AUTO,
      width: this.GAME_WIDTH,
      height: this.GAME_HEIGHT,
      parent: element,
      backgroundColor: '#1a1a2e',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: '100%',
        height: '100%'
      },
      scene: {
        preload: this.preload.bind(this),
        create: this.create.bind(this),
        update: this.update.bind(this)
      }
    }
  }
}
```

### 渲染坐标
```typescript
// 不需要偏移量，直接使用游戏世界坐标
const x = segment.x * this.cellSize + this.cellSize / 2
const y = segment.y * this.cellSize + this.cellSize / 2
```

## 容器样式

### Vue 组件
```vue
<template>
  <div class="game-container" ref="gameContainer"></div>
</template>

<style scoped>
.game-container {
  width: 100%;
  height: 100%;
}
</style>
```

### 全局样式
```css
html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
}

#app {
  width: 100%;
  height: 100%;
}
```

## 测试方法

### 1. 开发者工具
```
F12 → Ctrl+Shift+M → 选择设备
```

### 2. 测试设备
- 桌面：1920x1080, 1366x768
- 平板：1024x768, 768x1024
- 手机：375x812, 414x896

### 3. 验证要点
- [ ] 游戏居中显示
- [ ] 内容不变形
- [ ] 黑边均匀
- [ ] 响应式流畅

## 常见问题

### Q: 如何调整游戏世界尺寸？
A: 修改 `GAME_WIDTH` 和 `GAME_HEIGHT` 常量

### Q: 如何去除黑边？
A: 使用 RESIZE 模式，或调整游戏世界尺寸

### Q: 如何支持多种比例？
A: FIT 模式自动适配所有比例

### Q: 性能如何？
A: Scale Manager 是官方优化的，性能优秀

## 相关文档

- [Phaser Scale Manager 完整文档](./PHASER_SCALE_MANAGER.md)
- [重构说明](./REFACTOR_SUMMARY.md)
- [官方文档](https://photonstorm.github.io/phaser3-docs/Phaser.Scale.ScaleManager.html)

## 快速开始

1. 设置游戏世界尺寸
2. 配置 Scale Manager
3. 移除手动计算逻辑
4. 简化渲染代码
5. 测试验证

**就这么简单！** 🎮✨
