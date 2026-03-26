# 网格背景平铺对齐修复

## 🐛 问题描述

**用户反馈**：蛇和食物看起来比网格大，与网格不匹配。

## 🔍 根本原因

### 问题根源：TileSprite 平铺模式

之前的代码使用 `tileSprite` 来显示网格背景：

```typescript
// ❌ 错误：使用 tileSprite 平铺
const gridBg = scene.add.tileSprite(
  offsetX + gameWidth / 2,
  offsetY + gameHeight / 2,
  gameWidth,
  gameHeight,
  gridBgKey
)
```

### 为什么会不匹配？

1. **grid.png 纹理尺寸固定**（例如 50x50 像素）
2. **cellSize 是动态计算的**（例如 47.3 像素，根据屏幕缩放）
3. **tileSprite 会重复纹理**，按照原始尺寸平铺
4. **结果**：平铺出来的网格线位置 ≠ 实际的 cellSize 位置

### 具体偏差计算

假设：
- `grid.png` = 50x50 像素
- `cellSize` = 47.3 像素（动态计算）
- `gameWidth` = 32 * 47.3 = 1513.6 像素

**TileSprite 平铺**：
- 第 1 条网格线：x = offsetX + 50px
- 第 2 条网格线：x = offsetX + 100px
- 第 N 条网格线：x = offsetX + N*50px

**实际渲染位置**：
- 第 1 个网格格中心：x = offsetX + 47.3/2 = offsetX + 23.65px
- 第 2 个网格格中心：x = offsetX + 47.3 + 23.65 = offsetX + 70.95px
- 第 N 个网格格中心：x = offsetX + N*47.3 + 23.65px

**偏差**：每 50 - 47.3 = 2.7px，累积起来越来越明显！

## ✅ 解决方案

### 修改为拉伸模式

将 `tileSprite` 改为普通的 `image`，然后强制缩放到游戏区域大小：

```typescript
// ✅ 正确：使用 image 并缩放到游戏区域
const gridBg = scene.add.image(
  offsetX + gameWidth / 2,
  offsetY + gameHeight / 2,
  gridBgKey
)

// 👉 关键：设置 displaySize 为游戏区域大小
gridBg.setDisplaySize(gameWidth, gameHeight)
```

### 为什么这样就能对齐？

1. **图片被拉伸到恰好 gameWidth × gameHeight**
2. **无论原始纹理尺寸是多少，都会被拉伸到匹配**
3. **网格线位置由图片内容决定，但现在图片尺寸 = 游戏区域尺寸**
4. **蛇和食物的渲染位置基于相同的 gameWidth/gameHeight/cellSize**
5. **结果：完全对齐！** ✅

## 📊 修复前后对比

### 修复前（TileSprite 平铺）

```
网格背景：[||| ||| ||| ]  ← 按 50px 间隔平铺
蛇位置：  [ •   •   •  ]  ← 按 47.3px 间隔
          ↑   ↑   ↑
        不对齐！偏差逐渐累积
```

### 修复后（Image 拉伸）

```
网格背景：[||| ||| ||| ]  ← 拉伸到 1513.6px，32 等分
蛇位置：  [ •   •   •  ]  ← 按 47.3px 间隔
          ↑   ↑   ↑
        完美对齐！
```

## 🔧 技术细节

### setDisplaySize vs TileSprite

| 特性 | TileSprite | Image + setDisplaySize |
|------|-----------|------------------------|
| 平铺方式 | 重复原始纹理 | 拉伸到指定尺寸 |
| 尺寸控制 | 无法控制单个格子 | 精确控制整体尺寸 |
| 对齐精度 | 依赖纹理尺寸 | 完全匹配 cellSize |
| 适用场景 | 无缝纹理平铺 | 需要精确对齐 |

### 为什么选择拉伸而不是平铺？

**优点**：
- ✅ 确保网格线与 cellSize 完全对齐
- ✅ 不受原始纹理尺寸限制
- ✅ 适配所有屏幕尺寸和缩放比例

**缺点**：
- ⚠️ 图片会被拉伸（可能轻微失真）
- ⚠️ 如果原始纹理分辨率低，可能模糊

**权衡**：
- 网格背景通常是简单的线条，拉伸影响很小
- 对齐的重要性 > 轻微的图像失真
- 现代 Phaser 渲染器质量很好，拉伸几乎看不出来

## 📝 代码修改

### 文件位置
`src/components/game/PhaserGame.ts` L580-L597

### 修改内容

```diff
- // ⭐ 直接使用 GTRS 规范 key：scene_bg_grid
+ // ⭐ 使用 GTRS 网格背景图片 - 但不平铺，而是缩放到游戏区域大小
  const gridBgKey = this.getThemeAssetKey('scene_bg_grid')
  if (gridBgKey) {
-   // ⭐ 使用网格背景图片 - 平铺模式（不拉伸）
-   const gridBg = scene.add.tileSprite(
+   // 创建精灵并缩放到恰好覆盖游戏区域
+   const gridBg = scene.add.image(
      offsetX + gameWidth / 2,
      offsetY + gameHeight / 2,
-     gameWidth,
-     gameHeight,
      gridBgKey
    )
+   
+   // 👉 关键：设置 displaySize 为游戏区域大小，确保网格纹理恰好匹配
+   gridBg.setDisplaySize(gameWidth, gameHeight)
    gridBg.setDepth(0)
    
-   console.log('🔲 网格背景已平铺:', {
-     size: `${gameWidth.toFixed(0)} × ${gameHeight.toFixed(0)}`,
-     mode: 'tile (repeat)'
+   console.log('🔲 网格背景已缩放:', {
+     imageSize: `${gameWidth.toFixed(0)} × ${gameHeight.toFixed(0)}`,
+     cellSize: this.Adapt.cellSize.toFixed(2),
+     mode: 'stretch to fit (确保网格对齐)'
    })
  } else {
```

## 🎯 验证方法

### 1. 视觉检查
- [ ] 蛇身中心是否对齐网格格中心
- [ ] 食物是否对齐网格格
- [ ] 障碍物是否对齐网格格
- [ ] 网格线是否在蛇身边缘（不在中间穿过）

### 2. 控制台日志
运行游戏后查看控制台，应该看到：
```
🔲 网格背景已缩放：{
  imageSize: "1514 × 851",
  cellSize: "47.31",
  mode: "stretch to fit (确保网格对齐)"
}
```

### 3. 不同设备测试
- [ ] 小屏手机：cellSize ≈ 20-30px
- [ ] 大屏手机：cellSize ≈ 30-40px
- [ ] 平板：cellSize ≈ 40-50px
- [ ] 桌面：cellSize ≈ 50-80px

## 🎨 主题制作者注意事项

如果你是主题制作者，需要注意：

### grid.png 设计要求

1. **推荐尺寸**：50x50 或 100x100 像素（方便缩放）
2. **图案要求**：简单的网格线条，透明背景
3. **线条粗细**：不要太粗，建议 1-2px
4. **颜色**：白色或浅色，透明度 5-10%

### 示例设计规格

```
grid.png
├─ 尺寸：50x50 px
├─ 背景：透明
├─ 线条：右侧和下侧各 1px 白线
├─ 透明度：5%
└─ 效果：当拉伸到任意尺寸时，形成均匀网格
```

## 📋 相关文件

- **修改文件**: `src/components/game/PhaserGame.ts`
- **网格纹理**: `public/themes/default/images/scene/grid.png`
- **GTRS 配置**: `src/config/GTRS.json`

## 🎓 教育意义

这个问题反映了游戏开发中的一个重要原则：

**动态适配系统不能使用固定尺寸的平铺**

当你的游戏元素（如 cellSize）是动态计算的时候：
- ❌ 避免使用固定尺寸的平铺纹理
- ✅ 使用拉伸或程序化绘制来确保对齐
- ✅ 或者让纹理尺寸也是动态计算的

---

**修复时间**: 2026-03-24  
**修复类型**: 渲染对齐优化  
**影响范围**: 所有使用网格背景的贪吃蛇游戏场景
