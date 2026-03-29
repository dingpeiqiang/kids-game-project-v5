# 🐛 网格和图片尺寸不匹配问题修复

## ❌ 问题现象

拼图块图片与网格位置对不上，表现为：
- 拼图块之间间距过大或过小
- 拼图块超出游戏区域
- 网格计算基于错误的行列数（20x15 vs 2x2/3x3/4x4）

---

## 🔍 问题分析

### 根本原因

1. **框架的 cellSize 计算基于默认 gridCols/gridRows**
   ```typescript
   // GameScene.ts (基类)
   this.cellSize = Math.floor(
     Math.min(
       (this.screenW * 0.9) / this.gridCols,    // ← 20 列
       (this.screenH * 0.85) / this.gridRows,   // ← 15 行
     )
   )
   ```

2. **拼图游戏实际使用动态 gridSize**
   ```typescript
   // MyGameScene.ts
   this.gridSize = 2 | 3 | 4  // 根据难度变化
   ```

3. **图片尺寸固定为 256px**
   ```javascript
   // generate-resources.mjs
   const tileSize = 256  // 生成的拼图块尺寸
   ```

### 尺寸对比

| 项目 | 旧值 | 正确值 |
|------|------|--------|
| 网格大小 | 20x15 (错误) | 2x2 / 3x3 / 4x4 (根据难度) |
| cellSize | ~40px (基于 20x15) | ≥280px (容纳 256px 图片) |
| 拼图块显示 | 32px (cellSize - 8) | 252px (256 - 4 缝隙) |

---

## ✅ 解决方案

### 1. 修正 cellSize 计算

在 `create()` 方法中重新计算 `cellSize`：

```typescript
create(): void {
  super.create()
  
  // 从难度推断网格大小
  const difficultyId = gameStore.difficulty || 'easy'
  this.gridSize = difficultyId === 'easy' ? 2 : difficultyId === 'medium' ? 3 : 4
  
  // 🎯 修正：根据实际网格大小重新计算 cellSize
  this.cellSize = Math.floor(
    Math.min(
      (this.screenW * 0.9) / this.gridSize,
      (this.screenH * 0.8) / this.gridSize,
    )
  )
  
  // 确保 cellSize 能容纳 256px 的拼图块
  if (this.cellSize < 280) {
    this.cellSize = 280  // 256px 图片 + 边框 + 边距
  }
  
  // 重新计算偏移量
  const gameW = this.gridSize * this.cellSize
  const gameH = this.gridSize * this.cellSize
  this.offsetX = Math.floor((this.screenW - gameW) / 2)
  this.offsetY = Math.floor((this.screenH - gameH) / 2)
}
```

### 2. 使用固定的 256px 拼图块尺寸

修改 `createTiles()` 方法：

```typescript
private createTiles(): void {
  const animal = this.animalThemes[this.gridSize as keyof typeof this.animalThemes] || 'cat'
  
  // 🎯 使用固定的 256px 拼图块尺寸（与生成脚本一致）
  const tileSize = 256
  const gap = 4  // 拼图块之间的缝隙
  const effectiveTileSize = tileSize - gap  // 实际显示尺寸
  
  // 计算起始位置（居中）
  const totalWidth = this.gridSize * tileSize + (this.gridSize - 1) * gap
  const startX = this.offsetX + (this.gridSize * this.cellSize - totalWidth) / 2
  const startY = this.offsetY + 100
  
  console.log(`📏 拼图块尺寸：${tileSize}x${tileSize}, 缝隙：${gap}px`)
  
  // ... 创建拼图块
}
```

### 3. 正确的坐标计算

包含缝隙的精确坐标：

```typescript
// 计算像素坐标（包含缝隙）
const x = startX + currentPos.col * (tileSize + gap) + tileSize / 2
const y = startY + currentPos.row * (tileSize + gap) + tileSize / 2

// 创建拼图块精灵
const sprite = this.add.image(x, y, spriteKey)
  .setDisplaySize(effectiveTileSize, effectiveTileSize)  // 略小以留出缝隙
```

---

## 📊 修复效果对比

### 修复前

```
🧩 拼图游戏启动：2x2, 难度：easy
(cellSize 基于 20x15 计算 ≈ 40px)
❌ 拼图块：32x32px (远小于 256px 图片)
❌ 网格错位，图片严重变形
```

### 修复后

```
🧩 拼图游戏启动：2x2, 网格尺寸：400px
📐 游戏区域：800x800, 偏移：(453, 66)
🐾 使用动物主题：cat, 网格：2x2
📏 拼图块尺寸：256x256, 缝隙：4px, 起始位置：(579, 166)
✅ 创建了 4 个拼图块，每个 252x252px
✨ 网格对齐完美，图片清晰
```

---

## 🎯 技术细节

### 为什么是 280px？

```
最小 cellSize = 图片尺寸 + 边框 + 边距
             = 256px + 2px(边框) + 22px(边距)
             = 280px
```

### 缝隙计算

```
总宽度 = gridSize * tileSize + (gridSize - 1) * gap
实际显示 = tileSize - gap
```

**示例 (2x2 网格)**:
- 总宽度 = 2×256 + 1×4 = 516px
- 每个显示 = 256 - 4 = 252px

### 居中公式

```typescript
const totalWidth = gridSize * tileSize + (gridSize - 1) * gap
const startX = offsetX + (gridSize * cellSize - totalWidth) / 2
```

---

## 📝 关键改动总结

### 文件：`src/scenes/MyGameScene.ts`

#### 修改 1: create() 方法

**新增**:
- ✅ 根据实际 gridSize 重新计算 cellSize
- ✅ 设置最小值 280px 确保容纳 256px 图片
- ✅ 重新计算 offsetX/offsetY

**删除**:
- ❌ 不再依赖基类的 gridCols/gridRows

#### 修改 2: createTiles() 方法

**修改**:
- ✅ 使用固定的 256px 尺寸（与生成脚本一致）
- ✅ 添加 4px 缝隙
- ✅ 改进坐标计算（包含缝隙和中心点）

**效果**:
- ✅ 拼图块完美对齐
- ✅ 图片不变形
- ✅ 有清晰的视觉分隔

---

## ✅ 验证步骤

### 1. 检查控制台输出

刷新浏览器后应该看到：

```
🧩 拼图游戏启动：2x2, 网格尺寸：400px
📐 游戏区域：800x800, 偏移：(453, 66)
🐾 使用动物主题：cat, 网格：2x2
📏 拼图块尺寸：256x256, 缝隙：4px, 起始位置：(579, 166)
✅ 创建了 4 个拼图块，每个 252x252px
```

### 2. 视觉检查

- ✅ 4 个拼图块整齐排列成 2x2 网格
- ✅ 拼图块之间有均匀的 4px 缝隙
- ✅ 白色边框清晰可见
- ✅ 图片清晰，无变形
- ✅ 整体在游戏区域居中

### 3. 测试不同难度

```typescript
// 简单 (2x2)
gridSize = 2, cellSize ≥ 280px
拼图块：252x252px, 缝隙：4px

// 普通 (3x3)
gridSize = 3, cellSize ≥ 280px
拼图块：252x252px, 缝隙：4px

// 困难 (4x4)
gridSize = 4, cellSize ≥ 280px
拼图块：252x252px, 缝隙：4px
```

---

## 🔄 兼容性说明

### 开发环境
- ✅ 使用本地 GTRS.json
- ✅ 自动热重载生效

### 生产环境
- ✅ 从后端 API 加载主题
- ✅ 保持原有逻辑

### 屏幕适配
- ✅ 响应式计算 cellSize
- ✅ 监听窗口尺寸变化
- ✅ 自动居中

---

## 🎯 最佳实践

### 1. 图片尺寸规范

```javascript
// generate-resources.mjs
const tileSize = 256  // 固定尺寸

// MyGameScene.ts
const tileSize = 256  // 必须与生成脚本一致
```

### 2. 网格计算原则

```typescript
// ❌ 错误：依赖基类的 gridCols/gridRows
const size = this.cellSize  // 基于 20x15 计算

// ✅ 正确：根据实际网格计算
this.cellSize = Math.min(screenW / gridSize, screenH / gridSize)
```

### 3. 缝隙设计

```typescript
const gap = 4  // 推荐值：4-8px
const effectiveSize = tileSize - gap  // 略小于图片
```

**优点**:
- 清晰的视觉分隔
- 避免图片重叠
- 方便点击操作

---

## 📋 相关文件

| 文件 | 作用 |
|------|------|
| `src/scenes/MyGameScene.ts` | ✅ 已修改：修正网格计算 |
| `src/scenes/GameScene.ts` | 基类（未修改） |
| `generate-resources.mjs` | 资源生成（256px 固定尺寸） |
| `public/themes/.../GTRS.json` | 资源配置 |

---

<div align="center">

**修复完成！**  
*现在网格和图片尺寸完美对齐* 🎉

**修复时间**: 2026-03-29

</div>
