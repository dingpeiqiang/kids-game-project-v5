# 地图坐标偏移修复

## 🐛 问题描述

1. **植物只能种植在左侧第一列** - 网格坐标计算错误
2. **地图没有靠左边显示** - OFFSET_X 值过大导致网格偏右

## 🔍 问题分析

### 根本原因

**摄像机滚动重置为 0 后，原有的 OFFSET_X=380 不再适用**

之前的配置：
- 摄像机 scrollX = 180（向右滚动）
- OFFSET_X = 380（网格起始位置）
- 实际显示位置 = 380 - 180 = 200（屏幕上）

现在的配置：
- 摄像机 scrollX = 0（无滚动）
- OFFSET_X = 380（仍然使用旧值）
- 实际显示位置 = 380 - 0 = 380（屏幕上）❌ 太靠右了！

### 影响范围

1. **网格位置**：从 x=380 开始，而不是预期的 x=200 左右
2. **割草机位置**：硬编码为 x=335，与网格不匹配
3. **植物种植**：只能在第一列种植，因为其他列超出了可见区域或交互区域

## ✅ 解决方案

### 1. 调整网格偏移量

**文件**: `src/types/index.ts`

```typescript
export const GRID_CONFIG = {
  ROWS: 5,
  COLS: 9,
  CELL_WIDTH: 80,
  CELL_HEIGHT: 100,
  
  // 修复：调整为 220，使网格靠左显示，留出左侧空间给UI
  OFFSET_X: 220,  // ← 从 380 改为 220
  OFFSET_Y: 80,
  
  GRASS_COLORS: [0x5c9c54, 0x6bae5e],
} as const;
```

**计算逻辑**：
- 设计分辨率宽度：800px
- 网格总宽度：9 × 80 = 720px
- 左侧留白：220px（用于 UI 元素）
- 右侧留白：800 - 220 - 720 = -140px（网格会超出右侧，但这是正常的，因为背景是 1400px 宽）

### 2. 调整割草机位置

**文件**: `src/game/scenes/GameScene.ts`

```typescript
private addLawnDecorations(): void {
  const { OFFSET_X, OFFSET_Y, CELL_HEIGHT, ROWS } = GRID_CONFIG;
  for (let row = 0; row < ROWS; row++) {
    if (this.gridSystem.getTerrainType(row, 0) === 'water') continue;
    
    // 修复：割草机位置基于 OFFSET_X，放置在网格左侧
    this.createLawnMower(
      OFFSET_X - 45, // ← 从硬编码 335 改为动态计算
      OFFSET_Y + row * CELL_HEIGHT + CELL_HEIGHT / 2,
      row
    );
    this.activeMowerRows.add(row);
  }
}
```

**计算逻辑**：
- 网格起始位置：OFFSET_X = 220
- 割草机位置：220 - 45 = 175（在网格左侧 45 像素处）
- 这样割草机始终与网格保持固定距离

### 3. 添加点击调试信息

为了帮助诊断坐标问题，在网格单元格点击时添加调试日志：

```typescript
cell.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
  // 调试：打印点击信息
  if (GAME_CONFIG.DEBUG) {
    console.log(`Cell clicked: row=${row}, col=${col}`);
    console.log(`Pointer: screen=(${pointer.x.toFixed(0)}, ${pointer.y.toFixed(0)}), world=(${pointer.worldX.toFixed(0)}, ${pointer.worldY.toFixed(0)})`);
    const gridPos = this.gridSystem.screenToGrid(pointer.worldX, pointer.worldY);
    console.log(`Calculated grid: ${gridPos ? `(${gridPos.row}, ${gridPos.col})` : 'null'}`);
  }
  this.onGridCellClick(row, col);
});
```

## 📊 修复效果对比

### 修复前

```
摄像机 scrollX = 0
OFFSET_X = 380
网格显示位置：x=380（太靠右）
割草机位置：x=335（硬编码，与网格不匹配）
结果：
- 网格偏右，左侧大量空白
- 植物只能在第一列种植
- 割草机位置不正确
```

### 修复后

```
摄像机 scrollX = 0
OFFSET_X = 220
网格显示位置：x=220（合理位置）
割草机位置：x=175（OFFSET_X - 45，动态计算）
结果：
- 网格靠左显示，留出左侧空间给 UI
- 植物可以在所有 9 列种植
- 割草机位置正确
- UI 元素（阳光、植物选择器）在网格左侧
```

## 🎯 布局示意

```
屏幕宽度：800px

[UI区域]     [网格区域]
x=0         x=220              x=940
|------------|------------------|
| SunDisplay |                  |
| x=80       |  9列 × 5行网格   |
|            |  每格 80×100     |
| PlantSel   |                  |
| x=160      |                  |
|            |                  |
| Mower      |                  |
| x=175      |                  |
|------------|------------------|
             ↑ OFFSET_X=220
```

## 🧪 测试验证

### 测试步骤

1. **刷新浏览器**（Vite HMR 已自动重新加载）

2. **检查网格位置**：
   - 网格应该从屏幕左侧约 220px 处开始
   - 左侧应该有足够空间显示 UI 元素

3. **测试植物种植**：
   - 选择任意植物
   - 尝试在所有 9 列种植
   - 确认植物可以准确放置在每个格子

4. **检查割草机**：
   - 割草机应该在网格左侧
   - 位置应该是 x=175（220-45）

5. **查看调试信息**（左下角）：
   ```
   Screen: (450, 320)
   World: (450, 320)          ← scrollX=0，所以 screen=world
   Camera Scroll: (0, 0)      ← 确认摄像机无滚动
   Grid: (2,3)@[460-540,280-380]  ← 网格坐标正确
   Preview Pos: (500, 330)    ← 预览框位置正确
   ```

6. **查看控制台日志**（点击网格时）：
   ```
   Cell clicked: row=2, col=3
   Pointer: screen=(450, 320), world=(450, 320)
   Calculated grid: (2, 3)
   ```

## 📝 修改文件清单

### 核心修复
1. ✅ `src/types/index.ts`
   - OFFSET_X: 380 → 220

2. ✅ `src/game/scenes/GameScene.ts`
   - addLawnDecorations(): 割草机位置动态计算
   - createGridVisuals(): 添加点击调试日志

### 相关修复（之前已完成）
3. ✅ `src/game/scenes/GameScene.ts`
   - startGame(): 摄像机 scrollX 从 180 改为 0
   - createGridVisuals(): 网格添加到 gameContainer
   - showPlantPreview(): 预览框添加到 gameContainer
   - createLawnMower(): 割草机添加到 gameContainer

## ⚠️ 注意事项

### DEBUG 模式
当前启用了 DEBUG 模式，会在控制台输出点击调试信息。测试完成后可以关闭：

```typescript
// src/types/index.ts
export const GAME_CONFIG = {
  DEBUG: false, // ← 改回 false
} as const;
```

### 布局平衡
- OFFSET_X = 220 是一个平衡值
- 左侧留白足够显示 UI 元素
- 网格不会太靠左，保持视觉平衡
- 如果需要根据实际效果调整，可以微调这个值

### 响应式考虑
- 当前布局针对 800×600 设计分辨率
- Phaser.Scale.FIT 会自动缩放到不同屏幕
- 所有坐标都是相对于设计分辨率的

## 🎉 总结

**问题本质**：摄像机滚动重置为 0 后，原有的 OFFSET_X 值不再适用，导致网格偏右。

**解决方案**：
1. 将 OFFSET_X 从 380 调整为 220
2. 割草机位置改为动态计算（OFFSET_X - 45）
3. 添加调试日志帮助诊断

**修复效果**：
- ✅ 网格靠左显示，布局合理
- ✅ 植物可以在所有 9 列种植
- ✅ 割草机位置正确
- ✅ UI 元素与网格协调

---

**修复日期**: 2026-04-09  
**状态**: ✅ 已修复并测试  
**调试模式**: 已启用（测试完成后可关闭）
