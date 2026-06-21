# 统一操作框架 · 试点调试游戏

用于验证 `bindMobileControlPreset` / `bindGameCanvasControls` **触屏 + PC 键鼠** 在真机与浏览器上的表现。  
设计总览见 [`MOBILE_CONTROL_DESIGN.md`](MOBILE_CONTROL_DESIGN.md)（**§0 进度**、混合 §5.2 / 自绘 deck §5.3）。  
每款覆盖一种 **preset 或等价玩法**；代码接入 ✅ 后须在真机完成 [验收清单](MOBILE_ACCEPTANCE_CHECKLIST.md) G7。

**进度摘要**：P0–P2 下表 15 款 + **RPG 试点** `contraRpg` / `dnfRpg` 代码已接入；批量表 30+ 款已迁 platform。`CONTROL_PILOT_GAME_IDS` 含上表 P0–P2 与两款横屏 RPG，供 `isControlPilotGame()` 使用。

| 优先级 | gameId | preset | 调试重点 | PC | 移动 | 状态 |
|--------|--------|--------|----------|----|------|------|
| P0 | `superMario` | `joystick_dynamic` | `game.ts` + `bindMobileControlPreset` | WASD/方向 + 空格跳 + Shift 跑 | 左滑 + 「跳」 | ✅ 已接入 |
| P0 | `whackMole` | `tap` | `whackMole.lifecycle.ts` | 鼠标点击 | 单指点击 | ✅ 已接入 |
| P0 | `dodge` | `swipe_pan` | **`bindHorizontalSwipePan`**（设计 §5.2） | ←/→ 或 A/D | 横向跟手拖拽 | ✅ 已接入 |
| P1 | `bubbleShooter` | `aim_drag_release` | `BubbleShooterGame.setupEventListeners` | 鼠标拖拽 | 单指拖拽 | ✅ 已接入 |
| P1 | `tetris` | `swipe_pan`（registry） | **混合 §5.3**：自绘底栏 + `bindMobileControlPreset('joystick_action')` 仅按钮/键鼠 | ←/→、W/S/↑/空格/C | 底栏 D-pad + A/B | ✅ 已接入 |
| P1 | `cuteTankBattle` | `joystick_4way` | `input.ts` + 屏上「射」 | 方向键 + 空格 | 四向摇杆 + 射击键 | ✅ 已接入 |
| P2 | `towerDefense` | `tap` | `GameEngine` + `bindGameCanvasControls` | 点击 | 点击 | ✅ 已接入 |
| P2 | `cookieCut` | `swipe_pan` | 滑动切割（`swipe` 线段） | 按住拖动 | 滑动 | ✅ 已接入 |
| P2 | `cloudBallRush3d` | `tilt` | `bindGame3dCanvasControls` + 陀螺仪/左半屏摇杆降级 + 「跳」 | 方向键 + 空格 | 倾斜 / 左滑 | ✅ 已接入 |
| P2 | `skyFrenzy` | `swipe_pan` | 3D `swipe_pan` 拖移 + 键盘 | 方向键 | 单指拖移 | ✅ 已接入 |
| P2 | `skyRush3d` | `joystick_dynamic` | **混合 §5.2**：platform 左摇杆 + 右半屏瞄准 | WASD + 鼠标 | 左滑 + 右拖瞄准 | ✅ 已接入 |
| P2 | `rpgShooter` | `joystick_dynamic` | 左摇杆 + `tap` 目标点；PC `mousemove` 跟手 | WASD + 鼠标 | 左滑 + 点按 | ✅ 已接入 |
| P2 | `spaceShooter` | `swipe_pan` | Phaser canvas + `trackOutsideCanvas` 拖飞机 | 方向键 | 单指拖移 | ✅ 已接入 |
| P2 | `voxelRealm` | `joystick_dynamic` | 3D 混合：platform 左滑 + 挖/放/跳 + 右上视角区 | WASD + 鼠标 | 左滑 + 右下键 | ✅ 已接入 |
| P2 | `wangzheRpg` | `joystick_action` | 自定义 layout（攻/1/2/3）+ overlay | WASD + J/1/2/3 | 左摇杆 + 右侧键 | ✅ 已接入 |
| RPG | `contraRpg` | `joystick_action` | 横屏卷轴 + `game.ts` 主循环；左摇杆 + 跳/射 | WASD + Space/J | 左摇杆 + 跳/射 | ✅ 已接入 |
| RPG | `dnfRpg` | `joystick_action` | 选角 `tap`；对局 platform overlay | WASD + J/1–4 | 左摇杆 + A/J/S1/S2 | ✅ 已接入 |

## 批量接入（`bindGameCanvasControls`）

以下已迁离 `bindCanvasPointerInput` / `bindCanvasLaneTap` 等工具直连，preset 以 `gameControlRegistry` 为准：

| gameId | preset | 说明 |
|--------|--------|------|
| `pop` `colorTap` `memoryMatch` `jewelMatch` `match3` `stack` | `tap` | `onAction('tap', { x, y })` |
| `fruitSlice` `cookieCut` | `swipe_pan` | `tap` + `swipe`；`fruitSlice` 可 `trackOutsideCanvas: true` 滑出画布跟刀 |
| `bouncePath` `starCatcher` `slimeJump` | `swipe_pan` | 跟手 `swipe`；bouncePath 另收 `tap` 弹跳 |
| `neonRun` | `portrait_swipe_lane` | `lane_left` / `lane_right` + PC 键 |
| `racingRun` | `tap`（registry） | **混合**：`bindCanvasDragFollowAndLaneTap` + `bindDesktopControls` 换道/空格开火 |
| `sort` | `tap` | 点试管倒水 |
| `eliminate` | `tap` + touch | PC：`bindMobileControlPreset`；触屏 **`bindCanvasTapDragSwap`** |
| `plantsVsZombies` | `tap` | 卡片 + 草地 |
| `snake` | `swipe_pan`（registry） | `tap` 四向 + 键盘 WASD（`keydown` 保留） |
| `beatDragon` | `swipe_pan` | 横向跟手 + `tap` 选 buff；PC 悬停 `mousemove` |
| `kingBaby` | `swipe_pan` | 左区 `swipe` 拖英雄 + `tap` 右侧自绘技能圈 |
| `happyDefense` `plantZombieDefense` | `tap` | 3D `bindGameCanvasControls` → Babylon pick |
| `cloudBallRush3d` | `tilt` | `bindGame3dCanvasControls` |
| `skyFrenzy` | `swipe_pan` | 3D 拖移 + 方向键 |
| `skyRush3d` | `joystick_dynamic` | 混合：platform 移动 + 右半屏瞄准 |
| `rpgShooterTD` | `joystick_action` | 左下固定摇杆 platform + 塔防 touch/click |
| `dragonShooter` | `swipe_pan` | 640×800 逻辑坐标 |
| `plantZombieDefense2d` | `tap` | 横屏 2D 选关/卡片/格子 |
| `wangzheRpg` | `joystick_action` | MOBA 自定义右侧技能键 |

## 建议调试顺序

1. **whackMole** — 接入成本最低，确认 `onAction('tap')` + `source` + PC 点击。  
2. **dodge** — 确认 `lane_left` / `lane_right` 双端。  
3. **superMario** — 替换手写 touch，保留键盘时可读 `keyboardProfile` 对齐现有键位。  
4. **bubbleShooter** — 确认 `aim` / `shoot` 与旧逻辑一致。  
5. **tetris** / **cuteTankBattle** — 方向类 preset。

## 本地启动

```bash
cd kids-game-simple
npm run dev
```

在列表中进入对应游戏；PC 打开 DevTools 设备模拟对比 `shouldDrawOverlay()`。

## 代码引用

```ts
import {
  CONTROL_PILOT_GAME_IDS,
  getGameControlPreset,
  getCombinedControlGuideHint,
} from '@/platform/mobileControls'
```

## 验收（每款）

- [ ] `getGameControlPreset(gameId)` 与上表一致  
- [ ] PC：无屏上摇杆（除非 `onScreenControls: 'always'`）  
- [ ] 手机：摇杆/按钮可见且 `touch-action: none`  
- [ ] `guide.ops` 或引导页与 `getCombinedControlGuideHint(preset)` 一致  
- [ ] 退出对局 `controls.dispose()` 无残留监听