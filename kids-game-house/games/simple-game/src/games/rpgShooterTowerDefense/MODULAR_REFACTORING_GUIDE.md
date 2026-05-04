# RPG塔防射击游戏 - 模块化重构指南

## 📋 当前问题

`init.ts` 文件过大（1267行，46.3KB），包含：
- 输入处理（鼠标、触摸、键盘）
- 渲染逻辑（UI绘制、炮台绘制等）
- 游戏循环
- 状态管理
- 事件监听器注册

## 🎯 重构目标

将 `init.ts` 拆分成多个小模块，每个模块职责单一，易于维护。

## 📁 建议的模块结构

```
rpgShooterTowerDefense/
├── init.ts              # 主入口（~200行）- 只负责初始化和协调
├── input.ts            # ✅ 已创建 - 输入处理模块
├── renderer.ts         # ⏳ 待创建 - 渲染模块
├── gameLoop.ts         # ⏳ 待创建 - 游戏循环模块
├── types.ts            # ✅ 已有 - 类型定义
├── state.ts            # ✅ 已有 - 状态管理
├── config.ts           # ✅ 已有 - 配置常量
├── turrets.ts          # ✅ 已有 - 炮台系统
├── enemies.ts          # ✅ 已有 - 敌人系统
├── combat.ts           # ✅ 已有 - 战斗系统
├── waves.ts            # ✅ 已有 - 波次系统
├── traps.ts            # ✅ 已有 - 陷阱系统
├── enemyBullets.ts     # ✅ 已有 - 敌人子弹
└── sounds.ts           # ✅ 已有 - 音效系统
```

## 🔧 模块职责划分

### 1. **input.ts** (输入处理) - ✅ 已创建
**职责**：
- 鼠标事件处理（移动、点击、右键）
- 触摸事件处理（触摸开始、移动、结束）
- 键盘事件处理（按键按下、释放）
- 虚拟摇杆逻辑
- 按钮点击检测

**导出**：
```typescript
export function initInputSystem(...)
export function initKeyboardInput(...)
export interface JoystickState
export interface MobileButtons
```

### 2. **renderer.ts** (渲染模块) - ⏳ 待创建
**职责**：
- UI 面板绘制（资源显示、波次信息）
- 炮台选择按钮绘制
- 升级弹窗绘制
- 连击显示
- 浮动文字绘制
- 开始/结束界面绘制

**建议函数**：
```typescript
export function drawUI(ctx: CanvasRenderingContext2D, state: GameState, ...)
export function drawStartScreen(ctx: CanvasRenderingContext2D, state: GameState)
export function drawEndScreen(ctx: CanvasRenderingContext2D, state: GameState)
export function drawUpgradeDialog(ctx: CanvasRenderingContext2D, ...)
export function drawTurretButtons(ctx: CanvasRenderingContext2D, ...)
```

### 3. **gameLoop.ts** (游戏循环) - ⏳ 待创建
**职责**：
- 游戏主循环（requestAnimationFrame）
- 更新逻辑调用（updateGame）
- 渲染调用
- 时间步长计算

**建议函数**：
```typescript
export function startGameLoop(canvas: HTMLCanvasElement, state: GameState, ...)
export function updateGame(state: GameState, dt: number, now: number)
export function stopGameLoop()
```

### 4. **init.ts** (主入口) - 需要简化
**职责**：
- Canvas 初始化
- 状态创建
- 调用各模块的初始化函数
- 协调各模块工作

**简化后的结构**：
```typescript
import { initInputSystem, initKeyboardInput } from './input'
import { startGameLoop } from './gameLoop'
import { createInitialState } from './state'

export function initRpgShooterTD(engine: GameEngine, onEnd: () => void) {
  // 1. 初始化 Canvas
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')
  
  // 2. 创建状态
  const state = createInitialState()
  
  // 3. 初始化输入系统
  const cleanupInput = initInputSystem(...)
  const cleanupKeyboard = initKeyboardInput(...)
  
  // 4. 启动游戏循环
  const cleanupLoop = startGameLoop(...)
  
  // 5. 返回清理函数
  return () => {
    cleanupInput()
    cleanupKeyboard()
    cleanupLoop()
  }
}
```

## 📊 预期效果

| 文件 | 当前行数 | 重构后行数 | 减少比例 |
|------|---------|-----------|---------|
| init.ts | 1267 | ~200 | -84% |
| input.ts | 0 | ~380 | 新增 |
| renderer.ts | 0 | ~400 | 新增 |
| gameLoop.ts | 0 | ~150 | 新增 |
| **总计** | **1267** | **~1130** | **-11%** |

虽然总行数略有增加（因为添加了导出和接口），但每个文件的职责更清晰，易于维护。

## 🚀 重构步骤

### Phase 1: 提取输入处理 ✅ 已完成
- [x] 创建 `input.ts`
- [x] 迁移鼠标/触摸/键盘事件处理
- [x] 导出初始化函数

### Phase 2: 提取渲染逻辑 ⏳ 进行中
- [ ] 创建 `renderer.ts`
- [ ] 迁移 `drawUI` 函数
- [ ] 迁移 `drawStartScreen` / `drawEndScreen`
- [ ] 迁移升级弹窗绘制
- [ ] 迁移底部按钮绘制

### Phase 3: 提取游戏循环 ⏳ 待进行
- [ ] 创建 `gameLoop.ts`
- [ ] 迁移 `gameLoop` 函数
- [ ] 迁移 `updateGame` 函数
- [ ] 导出启动/停止函数

### Phase 4: 简化 init.ts ⏳ 待进行
- [ ] 移除已迁移的代码
- [ ] 导入新模块
- [ ] 调用各模块初始化函数
- [ ] 测试功能是否正常

## ⚠️ 注意事项

1. **保持向后兼容**：确保 `initRpgShooterTD` 函数签名不变
2. **逐步迁移**：每次只迁移一个模块，确保功能正常后再继续
3. **充分测试**：每完成一个阶段都要测试游戏功能
4. **保留注释**：迁移时保留原有的注释和日志
5. **类型安全**：确保 TypeScript 类型正确，避免使用 `any`

## 🎯 优先级

**高优先级**：
1. ✅ 输入处理模块（已完成）
2. 渲染模块（最大的一块，约500行）

**中优先级**：
3. 游戏循环模块

**低优先级**：
4. 进一步优化其他小模块

## 💡 额外优化建议

1. **常量提取**：将魔法数字提取到 `config.ts`
2. **工具函数**：通用工具函数放到 `utils.ts`
3. **类型完善**：减少 `any` 类型的使用
4. **文档注释**：为每个导出的函数添加 JSDoc 注释

## 📝 示例代码

### renderer.ts 示例结构

```typescript
import type { GameState } from './types'
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './config'
import { drawTurret } from './turrets'
import { drawEnemy } from './enemies'

export function drawUI(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  selectedTurretForUpgrade: any,
  upgradeDialogPos: { x: number; y: number },
  mobileButtonsRef: { current: any }
) {
  // 只在游戏进行中显示UI
  if (!state.gameStarted || state.gameEnded) return
  
  // 绘制资源面板
  drawResourcePanel(ctx, state)
  
  // 绘制波次信息
  drawWaveInfo(ctx, state)
  
  // 绘制连击
  drawCombo(ctx, state)
  
  // 绘制升级弹窗
  if (selectedTurretForUpgrade) {
    drawUpgradeDialog(ctx, state, selectedTurretForUpgrade, upgradeDialogPos, mobileButtonsRef)
  }
  
  // 绘制底部按钮
  drawTurretButtons(ctx, state, mobileButtonsRef)
}

function drawResourcePanel(ctx: CanvasRenderingContext2D, state: GameState) {
  // ... 实现
}

function drawUpgradeDialog(...) {
  // ... 实现
}

// 更多辅助函数...
```

---

**下一步**：继续创建 `renderer.ts` 和 `gameLoop.ts` 模块，然后简化 `init.ts`。
