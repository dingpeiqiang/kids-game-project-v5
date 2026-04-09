# 网格位置调整指南

## 🎯 问题诊断

如果地图起始位置不正确，请按以下步骤诊断：

### 1. 查看控制台输出

打开浏览器开发者工具（F12），查看 Console 标签页，应该看到类似输出：

```
=== Background Debug Info ===
Background key: day-grass
Background position: (700, 300)
Background size: 1400x600
Background range: x=[0-1400], y=[0-600]

=== Grid Debug Info ===
OFFSET_X: 250, OFFSET_Y: 85
Grid size: 9x5, Cell: 80x100
Grid total width: 720, height: 500
Grid range: x=[250-970], y=[85-585]
```

### 2. 分析问题

根据输出信息判断：

**背景图范围**：x=[0-1400], y=[0-600]
**网格范围**：x=[250-970], y=[85-585]

检查：
- ✅ 网格是否在背景图范围内？
- ✅ 网格左侧是否有足够空间给 UI？
- ✅ 网格右侧是否超出太多？
- ✅ 网格垂直位置是否合适？

## 🔧 调整方法

### 调整 OFFSET_X（水平位置）

**文件**: `src/types/index.ts`

```typescript
export const GRID_CONFIG = {
  // ...
  OFFSET_X: 250, // ← 调整这个值
  // ...
}
```

**调整原则**：
- **增大 OFFSET_X**：网格向右移动
- **减小 OFFSET_X**：网格向左移动

**推荐值**：
- `OFFSET_X = 200-250`：网格偏左，左侧留白较多
- `OFFSET_X = 250-300`：网格居中偏左，平衡布局
- `OFFSET_X = 300-350`：网格居中
- `OFFSET_X > 350`：网格偏右

**计算公式**：
```
左侧留白 = OFFSET_X
右侧留白 = 背景宽度 - (OFFSET_X + 网格总宽度)
         = 1400 - (OFFSET_X + 720)
         = 680 - OFFSET_X

示例：
OFFSET_X = 250
左侧留白 = 250px
右侧留白 = 680 - 250 = 430px
```

### 调整 OFFSET_Y（垂直位置）

```typescript
export const GRID_CONFIG = {
  // ...
  OFFSET_Y: 85, // ← 调整这个值
  // ...
}
```

**调整原则**：
- **增大 OFFSET_Y**：网格向下移动
- **减小 OFFSET_Y**：网格向上移动

**推荐值**：
- `OFFSET_Y = 80-90`：网格靠上，顶部留白较少
- `OFFSET_Y = 90-100`：网格垂直居中偏上
- `OFFSET_Y > 100`：网格靠下

**计算公式**：
```
顶部留白 = OFFSET_Y
底部留白 = 背景高度 - (OFFSET_Y + 网格总高度)
         = 600 - (OFFSET_Y + 500)
         = 100 - OFFSET_Y

示例：
OFFSET_Y = 85
顶部留白 = 85px
底部留白 = 100 - 85 = 15px（很小，正常）
```

## 📊 常见配置方案

### 方案 1：偏左布局（当前使用）
```typescript
OFFSET_X: 250,
OFFSET_Y: 85,
```
- 左侧留白：250px（足够显示 UI）
- 右侧留白：430px
- 适合：UI 元素较多的情况

### 方案 2：居中布局
```typescript
OFFSET_X: 340,  // (1400 - 720) / 2
OFFSET_Y: 50,   // (600 - 500) / 2
```
- 左侧留白：340px
- 右侧留白：340px
- 顶部留白：50px
- 底部留白：50px
- 适合：网格完全居中

### 方案 3：紧凑布局
```typescript
OFFSET_X: 200,
OFFSET_Y: 80,
```
- 左侧留白：200px（最小可用空间）
- 右侧留白：480px
- 适合：最大化游戏区域

## 🧪 测试步骤

1. **修改 OFFSET_X/OFFSET_Y**

2. **保存文件**（Vite 会自动重新加载）

3. **刷新浏览器**

4. **检查控制台输出**，确认新的网格范围

5. **视觉检查**：
   - 网格是否在预期位置？
   - UI 元素是否与网格协调？
   - 割草机位置是否正确？

6. **功能测试**：
   - 选择植物
   - 在所有 9 列尝试种植
   - 确认预览框位置准确
   - 确认植物放置在正确位置

## ⚠️ 注意事项

### 割草机位置自动调整

割草机位置会根据 OFFSET_X 自动计算：
```typescript
this.createLawnMower(
  OFFSET_X - 45, // 在网格左侧 45px
  ...
);
```

所以调整 OFFSET_X 后，割草机会自动跟随。

### UI 元素位置

UI 元素（SunDisplay、PlantSelector）的位置是固定的：
- SunDisplay: (80, 40)
- PlantSelector: (160, 45)

确保 OFFSET_X 足够大，使 UI 不会与网格重叠：
```
OFFSET_X > PlantSelector.x + PlantSelector.width
OFFSET_X > 160 + 约 200 = 360（理论值）

但实际上 PlantSelector 在 uiLayer 中，设置了 setScrollFactor(0)，
所以不会随摄像机滚动，可以重叠显示。

建议：OFFSET_X >= 200，保证视觉上不拥挤
```

### 摄像机滚动

当前配置：
```typescript
this.cameras.main.scrollX = 0; // 无滚动
```

如果将来需要启用摄像机滚动，需要重新计算 OFFSET_X：
```
实际显示位置 = OFFSET_X - camera.scrollX
```

## 🎯 快速调整流程

1. **观察当前问题**：
   - 网格太靠左？→ 增大 OFFSET_X
   - 网格太靠右？→ 减小 OFFSET_X
   - 网格太靠上？→ 增大 OFFSET_Y
   - 网格太靠下？→ 减小 OFFSET_Y

2. **微调数值**（每次调整 10-20px）

3. **保存并刷新**

4. **重复直到满意**

## 📝 当前配置

```typescript
// src/types/index.ts
export const GRID_CONFIG = {
  ROWS: 5,
  COLS: 9,
  CELL_WIDTH: 80,
  CELL_HEIGHT: 100,
  OFFSET_X: 250,  // ← 可根据需要调整
  OFFSET_Y: 85,   // ← 可根据需要调整
  GRASS_COLORS: [0x5c9c54, 0x6bae5e],
} as const;
```

---

**最后更新**: 2026-04-09  
**当前状态**: OFFSET_X=250, OFFSET_Y=85
