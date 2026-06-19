# 游戏操作统一设计（移动端 + PC · kids-game-simple）

> **目标**：各 Canvas/3D 游戏在 **Android WebView + PC 浏览器** 上采用**可复用组件 + 预设模板**，避免每款游戏重复实现摇杆、键盘、鼠标点击与瞄准拖拽。  
> **代码入口**：[`src/platform/mobileControls/`](../src/platform/mobileControls/index.ts)  
> **坐标**：一律使用**画布逻辑坐标**（`clientToCanvas` / `getPointerPos`），与 [`canvasMobileUtils.ts`](../src/utils/canvasMobileUtils.ts) 一致。

---

## 1. 经典操作分类 → 平台预设（Control Preset）

| 分类 | 典型玩法 | 预设 ID | 平台能力 |
|------|----------|---------|----------|
| 一、虚拟摇杆 | 动作 / RPG / 射击 / MOBA | `joystick_action` | 左下固定摇杆 + 右侧圆形技能键 |
| 摇杆变种 | 射击 / 开放世界 | `joystick_dynamic` | 随点生成隐形摇杆（左半屏按下） |
| 八向 / 四向 | 像素、横版 | `joystick_8way` / `joystick_4way` | 摇杆输出量化到 8/4 方向 |
| 二、点击触控 | 消除、放置、解谜 | `tap` | 单点映射到逻辑坐标 |
| 连点 / 长按 | 挂机、蓄力 | `tap_hold` | `onTap` + `onHold(ms)` |
| 三、滑动手势 | 地图、卡牌 | `swipe_pan` | 单指 delta；可选 `pinch` 占位 |
| 甩动 | 卡牌投掷 | `swipe_flick` | 释放时速度向量 |
| 四、拖拽瞄准 | MOBA、塔防 | `aim_drag_release` | 用 [`bindCanvasAimAndShoot`](../src/utils/canvasMobileUtils.ts) |
| 框选 | RTS | `drag_select_rect` | 按下-拖拽-抬起矩形 |
| 五、重力感应 | 赛车、平衡 | `tilt` | `DeviceOrientation`（可选，需权限） |
| 六、手势组合 | 双击跳、侧滑菜单 | `gesture_combo` | 在 `tap` 上叠加快击检测 / 边缘区 |
| 七、竖屏专属 | 跑酷、飞行 | `portrait_swipe_lane` / `portrait_dpad` | 全屏上下滑 / 四边方向键 |
| 八、辅助 | MMORPG 点地 | `tap_move_marker` | 点击 → 回调目标格 |
| 九、格斗 | 搓招 | `fighting_stick_buttons` | 左摇杆 + 右侧 6 键布局 |

新增游戏在 GDD / `gameRegistry.guide.ops` 中写**玩家文案**；程序侧在 [`gameControlRegistry.ts`](../src/platform/mobileControls/gameControlRegistry.ts) 绑定 **preset**。

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
| 固定摇杆中心 | `(0.14·W, 0.82·H)` | `layout.joystick.anchor` |
| 摇杆外径 | `min(W,H)·0.11` | `radius` |
| 死区 | `0.12` | `deadZone` |
| 右侧主键 | 右下角 `(0.88W, 0.78H)` r=`0.06·min` | `buttons[]` |
| 左半屏动态摇杆 | `x < 0.42W` 触发 | `dynamicZoneWidthRatio` |

透明度、尺寸用户自定义（存档）为 **P2**；首版 preset 内写死，与 `dnfRpg` / `superMario` 视觉对齐。

---

## 3. PC 端操作（与 preset 一一对应）

| preset | 键盘（默认） | 鼠标 |
|--------|--------------|------|
| `joystick_action` / `dynamic` | WASD/方向键 → `move`；空格 `jump`；J `attack`；1–4 / K/L 技能 | 点击画布上**虚拟按钮区域**（与触屏同 layout） |
| `joystick_4way` / `8way` | 方向键或 WASD → `move` | — |
| `tap` / `tap_hold` | — | 左键 → `tap`（`source: 'pointer'`） |
| `portrait_swipe_lane` | A/D 或 ←/→ → `lane_left` / `lane_right` | 左/右 1/3 屏（`bindCanvasLaneTap`） |
| `aim_drag_release` | — | 按住拖动 → `aim`，松手 → `shoot`（键鼠共用 `bindCanvasAimAndShoot`） |
| `swipe_pan` | 方向键 → `move` | 拖拽 → `swipe` |
| `drag_select_rect` | — | 左键拖拽 → `select_rect` |
| `fighting_stick_buttons` | WASD + J/K/L/U/I/O/P | 同摇杆类圆形键 |

- 键位表与覆盖：[`keyboardMapping.ts`](../src/platform/mobileControls/keyboardMapping.ts) 的 `DEFAULT_KEYBOARD_BY_PRESET`、`keyboardProfile` 入参。
- 引导文案：`getCombinedControlGuideHint(preset)` = 触屏 + PC 两行。
- **屏上摇杆**：PC 默认 **不绘制**（`controls.shouldDrawOverlay()`）；调试可 `onScreenControls: 'always'`。
- 回调统一带 `payload.source`：`touch` | `pointer` | `keyboard`。
- `bindMobileControlPreset` 默认 **`enableTouch` + `enableDesktop` 均为 true**（二合一设备可同时用）。

---

## 4. 实现分层

```
游戏 game.ts
    ↓ 选用 preset + 回调
bindMobileControlPreset()  ← mobileControls/bindPreset.ts
    ↓ 指针路由
canvasMobileUtils (clientToCanvas, bindCanvasAimAndShoot, …)
    ↓ 每帧读取
VirtualJoystick / TouchButtonState / AimState
    ↓ 可选绘制
drawMobileControlOverlay(ctx, snapshot)
```

- **壳层 Esc/返回**：仍用 [`inputManager.ts`](../src/platform/inputManager.ts)，与游戏内 pointer **解耦**。
- **DOM 摇杆**：[`mobileHelper.createVirtualJoystick`](../src/utils/mobileHelper.ts) 仅用于非 Canvas 壳；**Canvas 内优先 Canvas 绘制**（与现有 `contraRpg`、`superMario` 一致）。

---

## 5. 游戏接入模板（新游戏 / 迁移）

```typescript
import {
  bindMobileControlPreset,
  drawMobileControlOverlay,
  type MobileControlRuntime,
} from '@/platform/mobileControls'
import { getGameControlPreset } from '@/platform/mobileControls/gameControlRegistry'

let controls: MobileControlRuntime | null = null

function startGame(canvas: HTMLCanvasElement, W: number, H: number) {
  const preset = getGameControlPreset('myGameId') // 或显式 'joystick_action'
  controls = bindMobileControlPreset(canvas, {
    preset,
    viewWidth: W,
    viewHeight: H,
    onAction: (action, payload) => {
      if (action === 'move') { /* payload.stickX, stickY */ }
      if (action === 'button' && payload.id === 'jump') { /* … */ }
    },
  })
}

function render(ctx: CanvasRenderingContext2D) {
  // … 游戏画面 …
  if (controls) drawMobileControlOverlay(ctx, controls.getSnapshot())
}

function destroy() {
  controls?.dispose()
  controls = null
}
```

**迁移 checklist**

- [ ] 在 `gameControlRegistry` 登记 `gameId → preset`
- [ ] 删除重复的 touchstart/move/end 复制粘贴，改用 `bindMobileControlPreset`
- [ ] 引导页 `guide.ops` 与 preset 描述一致
- [ ] 真机：左摇杆 + 右按键无串触；`touch-action: none`

---

## 6. 预设与现有游戏对照（建议）

| gameId | 建议 preset | 备注 |
|--------|-------------|------|
| superMario, contraRpg, dnfRpg, wangzheRpg | `joystick_action` | 已部分自研，逐步迁到 platform |
| dragonShooter, rpgShooter, spaceShooter | `joystick_dynamic` 或 `aim_drag_release` | 视是否拖拽瞄准 |
| dodge, racingRun, neonRun | `portrait_swipe_lane` / `tap` | 分屏已在 `bindCanvasLaneTap` |
| eliminate, match3, jewelMatch | `tap` | `bindCanvasPointerInput` |
| bubbleShooter, fruitSlice | `aim_drag_release` / `swipe_flick` | |
| towerDefense, happyDefense, plantZombie* | `tap` + `drag_select_rect`（可选） | 点格放塔 |
| tetris, stack | `swipe_pan` + `tap` | 滑动手势映射方向 |
| voxelRealm | `joystick_dynamic` + 右侧跳跃键 | 参考现有 input.ts |

---

## 7. 与策划文档对齐

- [`GDD-DEV-STANDARDS.md`](GDD-DEV-STANDARDS.md) §2：`guide.ops` 使用 emoji + 短句，对应上表「分类」。
- 验收：[`MOBILE_ACCEPTANCE_CHECKLIST.md`](MOBILE_ACCEPTANCE_CHECKLIST.md) 增加「操作 preset 已登记且可玩」。

---

## 8. 后续扩展（P2）

- 按键布局 JSON 持久化（localStorage `mobileControlLayout:v1`）
- 3D：`game3dHost` 上叠加 HTML 控件层或 Nipple.js 适配
- 陀螺仪 preset `tilt` 与权限降级策略