# 游戏操作统一设计（移动端 + PC · kids-game-simple）

> **目标**：各 Canvas/3D 游戏在 **Android WebView + PC 浏览器** 上采用**可复用组件 + 预设模板**，避免每款游戏重复实现摇杆、键盘、鼠标点击与瞄准拖拽。  
> **代码入口**：[`src/platform/mobileControls/`](../src/platform/mobileControls/index.ts)  
> **试点清单**：[`CONTROL_PILOT_GAMES.md`](CONTROL_PILOT_GAMES.md)  
> **坐标**：一律使用**画布逻辑坐标**（`clientToCanvas` / `getPointerPos`），与 [`canvasMobileUtils.ts`](../src/utils/canvasMobileUtils.ts) 一致。

---

## 0. 当前进度（代码层 · 2026-06）

| 维度 | 状态 |
|------|------|
| **平台 API** | `bindMobileControlPreset`、`bindGameCanvasControls`、`bindGame3dCanvasControls`、`bindHorizontalSwipePan`、`bindTiltControl`、`bindDesktopControls`、`drawMobileControlOverlay` 已落地 |
| **Preset 实现** | §1.1 表中列出的 preset 已在 `bindPreset.ts` 实现（含 `tilt`、`portrait_dpad`、`swipe_flick`、`gesture_combo` 等） |
| **Registry** | `gameControlRegistry.ts` 已登记大厅主要 `gameId`；引导可用 `mergeGuideWithControlHint(gameId, guide)` |
| **2D 批量接入** | 约 30+ 款已走 `bindGameCanvasControls` 或混合 API（见 [`CONTROL_PILOT_GAMES.md`](CONTROL_PILOT_GAMES.md)「批量接入」） |
| **3D** | `happyDefense` / `plantZombieDefense`（tap+pick）、`cloudBallRush3d`（tilt）、`skyFrenzy`（swipe_pan）、`skyRush3d` / `voxelRealm` / `rpgShooter`（混合） |
| **P0 试点** | superMario、whackMole、dodge、bubbleShooter、tetris、cuteTankBattle — 代码 ✅ |
| **RPG 横屏** | `dnfRpg`：`joystick_action` + overlay（选角 `tap`）；`contraRpg`：完整主循环 + `bindGameCanvasControls` |
| **Registry 混合** | 部分 registry 为策划向 preset，运行时混合（见下表） |

**Registry ≠ 运行时 preset（有意混合时以代码为准，引导仍用 registry）**

| gameId | registry | 运行时说明 |
|--------|----------|------------|
| `dodge` | `swipe_pan` | `bindHorizontalSwipePan` + PC 方向键 |
| `tetris` | `swipe_pan` | 自绘 deck + `joystick_action` 仅按钮/键鼠 |
| `eliminate` | `tap` | 触屏 `bindCanvasTapDragSwap` |
| `racingRun` | `tap` | `bindCanvasDragFollowAndLaneTap` + desktop |
| `snake` | `swipe_pan` | `tap` 四向 + 键盘 |
| `cookieCut` | `swipe_pan` | 滑动切割（非 `tap_hold`） |
| `starCatcher` / `bouncePath` / `slimeJump` | `swipe_pan` | `tap`+`swipe` 跟手（bouncePath 点按可跳） |

**收尾（代码层）**：见 [`MOBILE_CONTROL_RELEASE.md`](MOBILE_CONTROL_RELEASE.md)。**待人工**：真机 G1–G7 全表勾选（§9 布局持久化已实现）。

---

## 1. 经典操作分类 → 平台预设（Control Preset）

| 分类 | 典型玩法 | 预设 ID | 平台能力 |
|------|----------|---------|----------|
| 一、虚拟摇杆 | 动作 / RPG / 射击 / MOBA | `joystick_action` | 左下固定摇杆 + 右侧圆形技能键 |
| 摇杆变种 | 射击 / 开放世界 | `joystick_dynamic` | 随点生成隐形摇杆（左半屏按下） |
| 八向 / 四向 | 像素、横版 | `joystick_8way` / `joystick_4way` | 摇杆输出量化到 8/4 方向 |
| 二、点击触控 | 消除、放置、解谜 | `tap` | 单点映射到逻辑坐标 |
| 连点 / 长按 | 挂机、蓄力 | `tap_hold` | `onTap` + `onHold(ms)` |
| 三、滑动手势 | 地图、卡牌 | `swipe_pan` | 单指 delta；可选与键盘 `move` 合成 |
| 甩动 | 卡牌投掷 | `swipe_flick` | 释放时 `onAction('flick', { vx, vy })` |
| 四、拖拽瞄准 | MOBA、塔防 | `aim_drag_release` | 用 [`bindCanvasAimAndShoot`](../src/utils/canvasMobileUtils.ts) |
| 框选 | RTS | `drag_select_rect` | 按下-拖拽-抬起矩形 |
| 五、重力感应 | 赛车、平衡 | `tilt` | [`bindTiltControl`](../src/platform/mobileControls/bindTilt.ts) → `move`（`source: sensor`） |
| 六、手势组合 | 双击跳、侧滑菜单 | `gesture_combo` | `tap` + `double_tap`（`doubleTapMs` 可配） |
| 七、竖屏专属 | 跑酷、飞行 | `portrait_swipe_lane` / `portrait_dpad` | 半屏换道 / [`portraitDpadButtons`](../src/platform/mobileControls/layout.ts) 四向键 |
| 八、辅助 | MMORPG 点地 | `tap_move_marker` | 点击 → 回调目标格（触屏走 `tap` 分支） |
| 九、格斗 | 搓招 | `fighting_stick_buttons` | 左摇杆 + 右侧 6 键布局（layout 可扩按钮） |

新增游戏在 GDD / `gameRegistry.guide.ops` 中写**玩家文案**；程序侧在 [`gameControlRegistry.ts`](../src/platform/mobileControls/gameControlRegistry.ts) 绑定 **preset**。

### 1.1 预设实现成熟度（与 `bindMobileControlPreset` 对齐）

| preset | 触屏 | PC 键盘 | PC 鼠标 | 屏上 overlay |
|--------|------|---------|---------|--------------|
| `tap` / `tap_hold` / `tap_move_marker` | ✅ | ✅（`tap_hold` 长按） | ✅ | 无 |
| `joystick_*` / `fighting_stick_buttons` | ✅ | ✅ `move` + 映射键 | ✅ 点圆形键区 | 触屏主设备 |
| `portrait_swipe_lane` | ✅ 半屏 | ✅ A/D | ✅ 半屏 | 无 |
| `aim_drag_release` | ✅ | — | ✅ 拖放 | 无 |
| `swipe_pan` | ✅ delta + tap | ✅ 方向键 `move` | ✅ 拖 delta | 无；可选 `swipePanAxis: 'horizontal' \| 'vertical'` |
| `drag_select_rect` | ✅ | — | ✅ | 无 |
| `portrait_dpad` | ✅ | ✅ | ✅ 点四向键 | 触屏主设备 |
| `tilt` | ✅ 陀螺仪 + 左区动态摇杆降级 | ✅ 方向键 + 空格跳 | ✅ 点「跳」 | 触屏主设备（摇杆+跳） |
| `swipe_flick` | ✅ | — | ✅ 甩动 | 无 |
| `gesture_combo` | ✅ | — | ✅ 双击 | 无 |

未在 §1.1 表中的 preset（如 `tap_move_marker`）：可在 registry 登记策划向玩法；接入时用**混合模式**（§5.2）或扩展 `bindPreset.ts`。

---

## 2. 统一布局规范（横屏动作类默认）

```
┌─────────────────────────────────────────────┐
│  [HUD]                              [暂停壳] │
│                                              │
│   ◉ 摇杆区          游戏视口          ○ ○   │
│  (左 18% 宽)                      技能/跳  │
│  底边距 8%                         (右 22%) │
└─────────────────────────────────────────────┘
```

| 元素 | 默认（相对逻辑宽高） | 可调 |
|------|----------------------|------|
| 固定摇杆中心 | `(0.14·W, 0.82·H)` | `layout.joystick.anchor` → `x` / `y` |
| 摇杆外径 | `min(W,H)·0.11` | `radius` |
| 死区 | `0.12` | `deadZone` |
| 右侧主键 | 右下角 `(0.88W, 0.78H)` r=`0.06·min` | `buttons[]` |
| 左半屏动态摇杆 | `x < 0.42W` 触发 | `dynamicZoneWidthRatio` |

默认数值由 [`defaultActionLayout`](../src/platform/mobileControls/layout.ts) 生成；`mergeLayout(W, H, partial)` 做局部覆盖。

**竖屏长屏动作类**（如 `cuteTankBattle` 750×1334）：用 [`portraitActionLayout`](../src/platform/mobileControls/layout.ts)（摇杆/「射」约在 `0.9·H`，四向量化 `4way`），勿直接套用横屏 `defaultActionLayout`（`min(W,H)` 过小）。

透明度、尺寸用户自定义（存档）为 **P2**；首版 preset 内写死，与 `dnfRpg` / `superMario` 视觉对齐。

### 2.1 界面责任矩阵（壳层 vs 操作 vs 游戏自绘）

| UI 带 | 负责方 | 说明 |
|-------|--------|------|
| 返回 / 标题 / 平台分数·暂停 | Vue [`CanvasGamePlay`](../src/components/CanvasGamePlay.vue) | `hidePlatformScore` / `hidePlatformPause` 来自 [`gameLayout`](../src/games/gameLayout.ts) |
| 画布缩放、横屏旋转、底栏 safe-area | `canvasGameRuntime` + 壳 CSS | `compactFooter` → `padding-bottom: max(8px, env(safe-area-inset-*))` |
| 虚拟摇杆 / 屏上键 overlay | `mobileControls` + 各游戏 `bind*` | 逻辑坐标内绘制；竖屏 tap 类常 `onScreenControls: 'never'` |
| 游戏内 HUD、自绘 D-pad（tetris 等） | 各 `game.ts` / lifecycle | 与 platform overlay 互斥，避免双层控件 |
| 3D pick / Phaser 画布 | 游戏 + `bindGame3dCanvasControls` | 壳层 `externalCanvas: true` 不创建 `#mainGameCanvas` |

---

## 3. PC 端操作（与 preset 一一对应）

| preset | 键盘（默认） | 鼠标 |
|--------|--------------|------|
| `joystick_action` / `dynamic` | WASD/方向键 → `move`；空格 `jump`；J `attack`；1–4 / K/L 技能 | 点击画布上**虚拟按钮区域**（与触屏同 layout） |
| `joystick_4way` / `8way` | 方向键或 WASD → `move` | — |
| `tap` / `tap_hold` | — | 左键 → `tap` / 按住 → `hold`（`source: 'pointer'`） |
| `portrait_swipe_lane` | A/D 或 ←/→ → `lane_left` / `lane_right` | 左/右 1/3 屏（`bindCanvasLaneTap`） |
| `aim_drag_release` | — | 按住拖动 → `aim`，松手 → `shoot` |
| `swipe_pan` | 方向键 → `move` | 拖拽 → `swipe`；按下 → `tap` |
| `drag_select_rect` | — | 左键拖拽 → `select_rect` |
| `fighting_stick_buttons` | WASD + J/K/L/U/I/O/P | 同摇杆类圆形键 |
| `portrait_dpad` | 方向键 → `move` | 点击屏上四向键 |
| `tilt` | 方向键（降级） | — |
| `swipe_flick` | — | 拖拽 + 快速松手 `flick` |
| `gesture_combo` | — | 单击 `tap` / 双击 `double_tap` |

- 键位表与覆盖：[`keyboardMapping.ts`](../src/platform/mobileControls/keyboardMapping.ts) 的 `DEFAULT_KEYBOARD_BY_PRESET`、`mergeKeyboardProfile`、`keyboardProfile` 入参。
- 引导文案：`getCombinedControlGuideHint(preset)` = 触屏一行 + PC 一行（[`gameControlRegistry.ts`](../src/platform/mobileControls/gameControlRegistry.ts)）。
- **屏上摇杆**：PC 默认 **不绘制**（`runtime.shouldDrawOverlay()`）；调试可 `onScreenControls: 'always'`。
- 回调统一带 `payload.source`：`touch` | `pointer` | `keyboard`。
- `bindMobileControlPreset` 默认 **`enableTouch` + `enableDesktop` 均为 true**（二合一设备可同时用）。

### 3.1 设备判定与 overlay

| API | 用途 |
|-----|------|
| `isTouchPrimaryDevice()` | `(pointer: coarse)`、`hover: none`、UA、窄屏等综合 |
| `shouldDrawOnScreenControls()` | `onScreenControls: 'auto'` 时是否画摇杆/按钮 |
| `getPrimaryControlSurface()` | `'touch' \| 'desktop'`，用于 HUD 提示 |

竖屏掌机 UI（如俄罗斯方块底栏）可在 `shouldDrawOnScreenControls()` 为 true 时**自绘 deck**，并配合 `onScreenControls: 'never'` 避免与 platform overlay 叠两层（见 §5.3）。

---

## 4. 实现分层

```
游戏 game.ts
    ↓ 选用 preset + 回调
bindMobileControlPreset()  ← mobileControls/bindPreset.ts
    ↓ 指针路由
canvasMobileUtils (clientToCanvas, bindCanvasAimAndShoot, bindCanvasHorizontalDrag, …)
    ↓ 每帧 / 事件
VirtualJoystick / buttonPressed Map / AimState
    ↓ 可选
bindDesktopControls()  ← 键鼠与虚拟键点击
    ↓ 可选绘制
drawMobileControlOverlay(ctx, snapshot, controls.getJoystick())
```

- **壳层 Esc/返回**：仍用 [`inputManager.ts`](../src/platform/inputManager.ts)，与游戏内 pointer **解耦**。
- **DOM 摇杆**：[`mobileHelper.createVirtualJoystick`](../src/utils/mobileHelper.ts) 仅用于非 Canvas 壳；**Canvas 内优先 Canvas 绘制**（与现有 `contraRpg`、`superMario` 一致）。

---

## 5. 游戏接入模板（新游戏 / 迁移）

### 5.0 入口 API 速查

| 场景 | 推荐 API | 备注 |
|------|----------|------|
| 2D Canvas，preset 与 registry 一致 | `bindGameCanvasControls(canvas, { gameId, viewWidth, viewHeight, onAction })` | 内部 `getGameControlPreset(gameId)`，可 `preset` 覆盖 |
| 2D，需显式 layout / 选项 | `bindMobileControlPreset(canvas, { preset, viewWidth, viewHeight, … })` | tetris 混合、wangzhe 自定义 buttons |
| 3D Babylon 画布 | `bindGame3dCanvasControls` | 同 2D 选项 + `onScreenControls` |
| 仅横向跟手（dodge） | `bindHorizontalSwipePan` | registry 仍为 `swipe_pan` |
| 消除触屏交换 | `bindCanvasTapDragSwap` | 与 `bindMobileControlPreset('tap')` 双轨 |
| 引导页 ops | `mergeGuideWithControlHint(gameId, guide)` | 追加触屏 + PC 两行 |

### 5.1 标准接入

```typescript
import {
  bindMobileControlPreset,
  drawMobileControlOverlay,
  getGameControlPreset,
  type MobileControlRuntime,
} from '@/platform/mobileControls'

let controls: MobileControlRuntime | null = null

function startGame(canvas: HTMLCanvasElement, W: number, H: number) {
  const preset = getGameControlPreset('myGameId') // 或显式 'joystick_action'
  controls = bindMobileControlPreset(canvas, {
    preset,
    viewWidth: W,
    viewHeight: H,
    onAction: (action, payload) => {
      if (action === 'move') {
        /* payload.stickX, stickY, stickMagnitude, source */
      }
      if (action === 'button_down' && payload.id === 'jump') {
        /* … */
      }
      if (action === 'tap') {
        /* payload.x, payload.y */
      }
    },
  })
}

function render(ctx: CanvasRenderingContext2D) {
  // … 游戏画面 …
  if (controls?.shouldDrawOverlay()) {
    drawMobileControlOverlay(ctx, controls.getSnapshot(), controls.getJoystick())
  }
}

function destroy() {
  controls?.dispose()
  controls = null
}
```

### 5.2 混合接入（preset 语义 + 专用手势）

当玩法需要 **跟手拖拽**、**自定义 deck**，而 `swipe_pan` 的 delta 语义不够用时：

1. 在 `gameControlRegistry` 仍登记**策划向** preset（如 `dodge` → `swipe_pan`）。
2. 触屏：[`bindCanvasHorizontalDrag`](../src/utils/canvasMobileUtils.ts) / 自研分区点击。
3. PC：单独 [`bindDesktopControls`](../src/platform/mobileControls/bindDesktop.ts)（可 `enablePointer: false` 仅要键盘）。
4. `onDestroy` 中分别 `dispose()` / 解绑，避免重复监听。

**参考**：[`dodge/game.ts`](../src/games/dodge/game.ts) — 横向 drag + `bindDesktopControls({ preset: 'swipe_pan', … })` 读方向键 `move`。

### 5.2.1 Babylon 3D · `tap` + `scene.pick`

1. Registry：`happyDefense` / `plantZombieDefense` → `tap`。
2. 坐标：[`clientToPickCoords`](../src/platform/babylonPickUtils.ts)（与 `clientToCanvas` 等价）；实现 `pick*AtCanvasPixels(scene, logicalX, logicalY)`。
3. `bindGameCanvasControls(canvas, { gameId, viewWidth: canvas.width, viewHeight: canvas.height, onAction })` → `tap` 时 pick。
4. 悬停预览可保留 `pointermove` + `clientToPickCoords`（不参与 G7 preset 绑定）。
5. 退出：`runtime.dispose()`。

**参考**：[`happyDefense/input.ts`](../src/games/happyDefense/input.ts)、[`plantZombieDefense/input.ts`](../src/games/plantZombieDefense/input.ts)（含阳光 `sunId` pick）。

### 5.2.2 Babylon 3D · `tilt` / `swipe_pan`

1. 入口：[`bindGame3dCanvasControls`](../src/platform/mobileControls/bindGame3dCanvasControls.ts)（默认 `onScreenControls: 'never'`；云球等可 `'auto'` 以绘制左摇杆 + 「跳」）。
2. **`tilt`**（如 `cloudBallRush3d`）：`onAction('move')` 区分 `source === 'sensor'` 与 `touch`（左半屏降级摇杆）；`stickX`/`stickY` 映射 world（例 `moveZ = -stickY`）；陀螺仪有输入时约 280ms 内优先于触屏摇杆；`button_down` id=`jump`、键盘 Space；`KeyP`/`KeyR` 等可保留游戏内 `keydown`。
3. **`swipe_pan`**（如 `skyFrenzy`）：`onScreenControls: 'never'` 时监听 `swipe` 的 `dx`/`dy` 累加位移；键盘 `move` 与拖移合成。

**参考**：[`cloudBallRush3d/input.ts`](../src/games/cloudBallRush3d/input.ts)、[`skyFrenzy/input.ts`](../src/games/skyFrenzy/input.ts)。

### 5.3 自绘 UI + platform 键鼠（俄罗斯方块模式）

1. Registry 登记 `tetris` → `swipe_pan`（引导文案面向「滑动/方向键」）。
2. 运行时：`bindMobileControlPreset` 使用 **`joystick_action` + 摇杆移出屏外**（`x/y: -100`, `deadZone: 0.99`），仅保留 **`layout.buttons`** 与 [`handheldTouchLayout`](../src/games/tetris/tetrisHandheldShell.ts) 圆心对齐。
3. `keyboardProfile` 覆盖：`Space` → `hard_drop`，`C`/`Shift` → `hold`，方向/WASD → `move` 后在 `onAction` 里映射旋转/软降。
4. 渲染：自绘底栏 D-pad，**不**调用 `drawMobileControlOverlay`（或 `onScreenControls: 'never'`）。

**参考**：[`TetrisGame.setupEventListeners`](../src/games/tetris/TetrisGame.ts)。

### 5.4 自定义 layout 片段

```typescript
import { mergeLayout } from '@/platform/mobileControls'

const layout = mergeLayout(W, H, {
  buttons: [
    { id: 'fire', label: '射', cx: W * 0.88, cy: H * 0.78, r: min * 0.07 },
  ],
  joystick: { quantize: '4way', dynamicZoneWidthRatio: 0.5 },
})
```

摇杆类 preset 下，`button_down` / `button_up` 的 `id` 必须与 `layout.buttons[].id`、以及 `keyboardProfile.buttons` 的 value 一致。

### 5.5 `onAction` 事件字典

| action | 典型 preset | payload 字段 | 游戏侧常见处理 |
|--------|-------------|--------------|----------------|
| `move` | joystick_*, swipe_pan(键) | `stickX`, `stickY`, `stickMagnitude`, `source` | 速度/方向向量 |
| `button_down` / `button_up` | joystick_* | `id`, `source` | 跳跃、射击、技能 |
| `tap` | tap, swipe_pan | `x`, `y`, `source` | 命中检测 |
| `hold` | tap_hold | `x`, `y`, `holdMs`, `source` | 蓄力开始 |
| `aim` / `shoot` | aim_drag_release | `x`, `y`, `chargeTime` | 瞄准线 / 发射 |
| `lane_left` / `lane_right` | portrait_swipe_lane | `source` | 换道 |
| `swipe` | swipe_pan, swipe_flick | `dx`, `dy`, `x`, `y` | 相机/棋盘 |
| `flick` | swipe_flick | `vx`, `vy`, `x`, `y` | 卡牌投掷 |
| `double_tap` | gesture_combo | `x`, `y` | 二段跳等 |
| `select_rect` | drag_select_rect | `rect: { x1,y1,x2,y2 }` | RTS 框选 |
| `button_up`（id=`aim_cancel`） | aim_drag_release | — | 取消瞄准 |

**混合 / 选项**

- **`bindCanvasTapDragSwap`（§5.2）**：三消/极速消除触屏专用；PC 仍用 `bindMobileControlPreset('tap', enableTouch: false)`。见 `canvasMobileUtils.ts`。
- **`trackOutsideCanvas`**：`swipe_pan` / `swipe_flick` 可选；滑出画布仍跟手（切水果）。`bindGameCanvasControls({ trackOutsideCanvas: true })` 透传；退出须 `dispose()`。
- **`swipePanAxis`**：`'horizontal' | 'vertical' | 'both'`，收敛 dodge 类仅横向 delta。
- **`tilt`（3D）**：[`cloudBallRush3d/input.ts`](../src/games/cloudBallRush3d/input.ts) 使用 `bindGame3dCanvasControls`；陀螺仪优先（`source: sensor`），无传感器时左半屏动态摇杆；右侧「跳」键。Canvas 2D 同理 `bindGameCanvasControls({ preset: 'tilt' })`。
- **3D `swipe_pan`**：[`skyFrenzy/input.ts`](../src/games/skyFrenzy/input.ts) — `onScreenControls: 'never'`，`swipe` delta 累加 + 键盘 `move` 合成 `InputSnapshot`。
- **3D 混合 · 移动 + 瞄准**：[`skyRush3d/input.ts`](../src/games/skyRush3d/input.ts) — `bindGame3dCanvasControls('joystick_dynamic')` 负责左半屏移动与 PC 键；右侧 `pointer` 自管归一化瞄准（`inStickZone` 不抢事件）。清屏/暂停仍走 `keydown`。
- **3D 混合 · 体素**：[`voxelRealm/input.ts`](../src/games/voxelRealm/input.ts) — `layout.buttons` 对齐原「挖/放/跳」区；`move` → 四向 bool；PC 指针锁定 + 鼠标键；移动端右上 `inLookZone` 视角拖拽保留。

**约定**：同一逻辑（移动/点击）合并处理 `source`：`touch` | `pointer` | `keyboard` | `sensor`（陀螺仪）。tetris 连按等用 `button_down` + 游戏内 repeat。

### 5.6 迁移 checklist

- [ ] 在 `gameControlRegistry` 登记 `gameId → preset`
- [ ] 删除重复的 touchstart/move/end，改用 `bindMobileControlPreset` 或文档认可的混合模式
- [ ] 引导页 `guide.ops` 与 `getCombinedControlGuideHint(preset)` 一致
- [ ] 真机：左摇杆 + 右按键无串触；`applyCanvasMobileStyles` / `touch-action: none`
- [ ] 退出对局 `controls.dispose()`（及混合模式下的 drag/desktop 解绑）
- [ ] PC：`shouldDrawOverlay()` 为 false 时玩法仍完整可玩

---

## 6. 预设与现有游戏对照（`gameControlRegistry`）

完整映射见 [`listGameControlPresets()`](../src/platform/mobileControls/gameControlRegistry.ts)。下表为摘要 + 接入备注。

| gameId | preset | 接入备注 |
|--------|--------|----------|
| superMario | `joystick_dynamic` | `bindMobileControlPreset` + overlay |
| wangzheRpg | `joystick_action` | 自定义 layout 攻/1/2/3 |
| dnfRpg | `joystick_action` | 对局 platform + overlay；选角 `tap` |
| contraRpg | `joystick_action` | `game.ts` 主循环 + platform overlay |
| dragonShooter | `swipe_pan` | 640×800 逻辑坐标 |
| rpgShooter, skyRush3d, voxelRealm | `joystick_dynamic` | 射击/混合瞄准（§5.5） |
| spaceShooter | `swipe_pan` | Phaser canvas + `trackOutsideCanvas` |
| dodge | `swipe_pan` | **混合**：`bindHorizontalSwipePan`（§5.2） |
| neonRun | `portrait_swipe_lane` | 半屏换道 |
| eliminate, match3, whackMole, towerDefense | `tap` | eliminate 触屏 `bindCanvasTapDragSwap` |
| bubbleShooter | `aim_drag_release` | 已接入 |
| cookieCut, fruitSlice | `swipe_pan` | 滑动切割；fruitSlice 可 `trackOutsideCanvas` |
| tetris, snake | `swipe_pan` | tetris 混合 §5.3；snake `tap` 四向 |
| cuteTankBattle | `joystick_4way` | 四向 + 「射」 |
| cloudBallRush3d | `tilt` | `bindGame3dCanvasControls` |
| happyDefense, plantZombieDefense, plantZombieDefense2d | `tap` | 3D/2D pick |
| rpgShooterTD | `joystick_action` | 左摇杆 + 地图 tap 放塔 |
| kingBaby, beatDragon | `swipe_pan` | 拖移 + 分区 tap |

---

## 7. 与策划 / 验收文档对齐

- [`GDD-DEV-STANDARDS.md`](GDD-DEV-STANDARDS.md) §2：`guide.ops` 使用 emoji + 短句，对应 §1「分类」。
- [`MOBILE_ACCEPTANCE_CHECKLIST.md`](MOBILE_ACCEPTANCE_CHECKLIST.md)：通用项增加 **preset 已登记且双端可玩**（见该文档 G7）。
- 新 preset 或混合模式请在 [`CONTROL_PILOT_GAMES.md`](CONTROL_PILOT_GAMES.md) 增一行试点记录。

---

## 8. 调试与常见问题

| 现象 | 排查 |
|------|------|
| 点击偏左上/缩放错 | 画布 CSS 尺寸 vs `width/height` 属性；必须走 `clientToCanvas` |
| 页面随滑滚动 | 未 `preventDefault` / 未 `applyCanvasMobileStyles` |
| PC 仍显示摇杆 | 检查 `onScreenControls`；应用 `shouldDrawOverlay()` 再绘制 |
| 键盘无反应 | 焦点在 body；是否被壳层拦截；`enableDesktop` 是否为 false |
| 退出再进鬼触 | `dispose()` 未调或混合模式漏解绑 drag/desktop |
| 双指误触按钮 | 摇杆 preset 已按 touchId 分流；检查游戏内是否另有全局 touch 监听 |

本地：`npm run dev` → 进入游戏；PC 用 DevTools 设备模拟对比 overlay；真机 WebView 测 Capacitor 包。

---

## 9. 后续扩展（P2）

- **按键布局持久化（已实现）**：`localStorage` 键 `mobileControlLayout:v1`；`bindGameCanvasControls` / `bindGame3dCanvasControls` 默认按 `gameId` 读取并按视口等比缩放。API：`loadSavedLayoutOverrides` / `saveLayoutOverrides` / `clearSavedLayoutOverrides`。调试拖拽：`bindGameCanvasControls(..., { layoutEditEnabled: true })`（拖拽按钮；固定摇杆可拖锚点，松手写入）。
- **真机验收**：[`MOBILE_ACCEPTANCE_CHECKLIST.md`](MOBILE_ACCEPTANCE_CHECKLIST.md) G1–G7；汇总见 [`MOBILE_CONTROL_RELEASE.md`](MOBILE_CONTROL_RELEASE.md)
- 3D：`game3dHost` 上可选 HTML 控件层（当前以 Canvas overlay 为主）
- 陀螺仪 `tilt`：权限拒绝 / 桌面无传感器时的 UI 提示（降级方向键已内置）
- 引导页已通过 [`loadGameGuide`](../src/platform/gameGuide/loadGameGuide.ts) 自动 `mergeGuideWithControlHint`；各游戏 `guide.ops` 避免与 preset 文案完全重复