# 统一操作框架 · 试点调试游戏

用于验证 `bindMobileControlPreset` **触屏 + PC 键鼠** 在真机与浏览器上的表现。  
每款覆盖一种 **preset**，避免重复；迁移完成一项在表中打勾。

| 优先级 | gameId | preset | 调试重点 | PC | 移动 | 状态 |
|--------|--------|--------|----------|----|------|------|
| P0 | `superMario` | `joystick_dynamic` | `game.ts` + `bindMobileControlPreset` | WASD/方向 + 空格跳 + Shift 跑 | 左滑 + 「跳」 | ✅ 已接入 |
| P0 | `whackMole` | `tap` | `whackMole.lifecycle.ts` | 鼠标点击 | 单指点击 | ✅ 已接入 |
| P0 | `dodge` | `swipe_pan` | 触屏/鼠标：`bindCanvasHorizontalDrag`；PC：`bindDesktopControls` 方向键 | ←/→ 或 A/D | 横向拖拽 | ✅ 已接入 |
| P1 | `bubbleShooter` | `aim_drag_release` | 按住瞄准、松手发射 | 鼠标拖拽 | 单指拖拽 | ⬜ 待接入 |
| P1 | `tetris` | `swipe_pan` | 滑动 delta + 方向键 | 方向键/WASD | 滑动手势 | ⬜ 待接入 |
| P1 | `cuteTankBattle` | `joystick_4way` | 四向量化 `move` | 方向键 | 摇杆四向 | ⬜ 待接入 |
| P2 | `towerDefense` | `tap` | 点格放塔（复杂 UI 点击） | 点击 | 点击 | ⬜ 待接入 |
| P2 | `cookieCut` | `tap_hold` | 长按蓄力 | 鼠标按住 | 长按 | ⬜ 待接入 |

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