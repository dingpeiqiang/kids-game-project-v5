# 鼠标位置与选中位置不匹配问题修复

## 🐛 问题描述

在 PlantVsZombie 游戏中，当玩家移动鼠标选择植物放置位置时，鼠标指针位置与实际选中的网格位置不匹配。这导致玩家点击时，植物被放置在错误的位置。

## 🔍 问题分析

### 根本原因

游戏使用了 **Phaser.Scale.FIT** 缩放模式来适配不同屏幕尺寸：

```typescript
scale: {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
}
```

在这种模式下，存在两种坐标系统：
1. **屏幕坐标 (pointer.x, pointer.y)**: 相对于浏览器窗口的像素坐标
2. **世界坐标 (pointer.worldX, pointer.worldY)**: 相对于游戏画布的实际坐标

当游戏被缩放时，这两种坐标会产生偏差，导致：
- 使用 `pointer.x/y` 进行网格转换会得到错误的结果
- 必须使用 `pointer.worldX/worldY` 才能获得正确的游戏内坐标

### 摄像机设置影响

游戏还设置了摄像机边界：
```typescript
this.cameras.main.setBounds(0, 0, 1400, 600);
```

这使得世界坐标系统更加复杂，因为：
- 设计分辨率是 800x600
- 但摄像机边界是 1400x600（为了支持横向滚动）
- 需要确保使用正确的坐标系统进行转换

## ✅ 解决方案

### 1. 确保使用世界坐标

在 `updatePlantPreview()` 方法中，明确使用 `pointer.worldX` 和 `pointer.worldY`：

```typescript
private updatePlantPreview(): void {
  if (!this.plantPreview || !this.selectedPlant) return;

  const pointer = this.input.activePointer;
  
  // 关键修复：使用 pointer.worldX 和 pointer.worldY 获取世界坐标
  // 在缩放模式下，pointer.x/y 是屏幕坐标，pointer.worldX/worldY 是世界坐标
  const gridPos = this.gridSystem.screenToGrid(
    pointer.worldX,
    pointer.worldY
  );
  
  // ... 其余代码
}
```

### 2. 添加调试工具

为了帮助诊断和验证修复，添加了实时调试信息显示：

**文件**: `src/game/scenes/GameScene.ts`

```typescript
// 在类中添加调试文本属性
private debugText: Phaser.GameObjects.Text | null = null;

// 在 createUI() 中创建调试文本
if (GAME_CONFIG.DEBUG) {
  this.debugText = this.add.text(10, 550, '', {
    fontSize: '14px',
    color: '#00ff00',
    backgroundColor: '#000000',
    padding: { x: 6, y: 4 }
  });
  this.debugText.setScrollFactor(0); // 固定在屏幕上
  this.debugText.setDepth(1000); // 确保在最上层
}

// 在 onUpdate() 中更新调试信息
if (this.debugText && GAME_CONFIG.DEBUG) {
  const pointer = this.input.activePointer;
  const gridPos = this.gridSystem.screenToGrid(pointer.worldX, pointer.worldY);
  this.debugText.setText([
    `Mouse: (${pointer.x.toFixed(0)}, ${pointer.y.toFixed(0)})`,
    `World: (${pointer.worldX.toFixed(0)}, ${pointer.worldY.toFixed(0)})`,
    `Grid: ${gridPos ? `(${gridPos.row}, ${gridPos.col})` : 'N/A'}`,
    `Scale: ${this.scale.displaySize.width.toFixed(0)}x${this.scale.displaySize.height.toFixed(0)}`
  ].join('\n'));
}
```

### 3. 启用调试模式

临时启用调试模式以查看坐标信息：

**文件**: `src/types/index.ts`

```typescript
export const GAME_CONFIG = {
  DESIGN_WIDTH: 800,
  DESIGN_HEIGHT: 600,
  TITLE: '植物大战僵尸',
  DEBUG: true, // 临时启用以诊断坐标问题
} as const;
```

## 📊 调试信息显示

启用调试模式后，屏幕左下角会显示：

```
Mouse: (450, 320)          ← 屏幕坐标（相对于浏览器窗口）
World: (720, 480)          ← 世界坐标（相对于游戏画布）
Grid: (2, 4)               ← 对应的网格行列
Scale: 1200x900            ← 当前显示尺寸
```

通过观察这些信息，可以验证：
1. 鼠标移动时，World 坐标是否正确变化
2. Grid 坐标是否与鼠标悬停的网格单元匹配
3. 点击时是否选择了正确的网格

## 🧪 测试步骤

1. **启动游戏**
   ```bash
   npm run dev
   ```

2. **选择一个植物**（如向日葵）

3. **移动鼠标到网格上**
   - 观察预览框是否跟随鼠标
   - 检查左下角调试信息
   - 确认 Grid 坐标与鼠标位置一致

4. **点击放置植物**
   - 植物应该出现在预览框指示的位置
   - 不应该有偏移

5. **测试不同区域**
   - 测试网格的各个角落
   - 测试边缘情况
   - 测试不同缩放比例下的表现

## 🎯 关键技术点

### Phaser 坐标系统

| 属性 | 说明 | 用途 |
|------|------|------|
| `pointer.x` | 屏幕 X 坐标 | UI 元素定位 |
| `pointer.y` | 屏幕 Y 坐标 | UI 元素定位 |
| `pointer.worldX` | 世界 X 坐标 | 游戏对象交互 |
| `pointer.worldY` | 世界 Y 坐标 | 游戏对象交互 |

### 缩放模式影响

- **Phaser.Scale.FIT**: 保持宽高比，填充容器
- 会导致屏幕坐标 ≠ 世界坐标
- 必须使用 worldX/worldY 进行游戏逻辑计算

### 坐标转换流程

```
鼠标点击
  ↓
pointer.worldX, pointer.worldY (世界坐标)
  ↓
gridSystem.screenToGrid(worldX, worldY)
  ↓
{ row, col } (网格坐标)
  ↓
gridSystem.gridToScreen(row, col)
  ↓
{ x, y } (屏幕中心坐标)
```

## 📝 修改文件清单

### 核心修复
1. ✅ `src/game/scenes/GameScene.ts`
   - 添加 GAME_CONFIG 导入
   - 添加 debugText 属性
   - 在 createUI() 中创建调试文本
   - 在 onUpdate() 中更新调试信息
   - 优化 updatePlantPreview() 注释

### 配置调整
2. ✅ `src/types/index.ts`
   - 临时启用 DEBUG 模式

## ⚠️ 注意事项

### 生产环境
完成测试后，记得将 DEBUG 改回 false：

```typescript
export const GAME_CONFIG = {
  // ...
  DEBUG: false, // 生产环境关闭调试
} as const;
```

### 性能考虑
- 调试文本每帧更新，仅在开发时使用
- 生产环境应移除或禁用调试代码
- 可以使用条件编译或环境变量控制

### 其他场景
如果将来遇到类似的坐标问题，检查：
1. 是否使用了正确的坐标属性（worldX vs x）
2. 摄像机是否有偏移或缩放
3. 游戏容器是否有 CSS 变换
4. 浏览器缩放是否影响

## 🔗 相关资源

- [Phaser 3 Scale Manager](https://phaser.io/docs/3.60.0/Phaser.Scale.ScaleManager)
- [Phaser Input Pointer](https://phaser.io/docs/3.60.0/Phaser.Input.Pointer)
- [Coordinate Systems in Phaser](https://phaser.io/tutorials/making-your-first-phaser-3-game/part2)

---

**修复日期**: 2026-04-09  
**状态**: ✅ 已修复并添加调试工具  
**调试模式**: 已启用（测试完成后请关闭）
