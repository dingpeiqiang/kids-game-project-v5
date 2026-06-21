# 统一移动端操作 · 代码收尾说明

> **结论（代码层）**：大厅 **39 个可见游戏** 均已登记 `gameControlRegistry` preset；验收表 **38 款** 在源码树内可扫描到 platform 绑定（`pnpm run audit:controls`，已链入 `pnpm run build`）。壳层 [`gameLayout`](../src/games/gameLayout.ts) 元数据已接入 `CanvasGamePlay`；方向目录与验收表由 `pnpm run audit:orientation` 校验。  
> **不等于** 38 款真机 G1–G7 全部通过——见 [`MOBILE_ACCEPTANCE_CHECKLIST.md`](MOBILE_ACCEPTANCE_CHECKLIST.md)。

## 已完成

| 项 | 说明 |
|----|------|
| Platform API | `bindMobileControlPreset`、`bindGameCanvasControls`、`bindGame3dCanvasControls`、混合 API（§5.2–5.3） |
| Registry + G7 审计 | `scripts/audit-mobile-control-registry.mjs` |
| Vue 壳结算 | `CanvasGamePlay`：`installGameEventBridge` + `setGameEndHandler`（wangzheRpg / rpgShooter 等 `gameActions.gameOver`） |
| 壳层布局 | `getGameLayoutConfig` → `hidePlatformScore` / `hidePlatformPause` / `compactFooter` / **`immersiveHeader`**（横屏+隐藏壳分数时默认收起顶栏，浮动 ← + ☰）；`DEFAULT_PORTRAIT_HEIGHT_RATIO` 统一竖屏缩放 |
| 竖屏控件 | `portraitActionLayout`（`cuteTankBattle` 等长屏俯视角） |
| 方向 CI | `scripts/audit-game-orientation.mjs`（registry ↔ 目录 ↔ 验收表方向列） |
| RPG | `contraRpg` 主循环；`dnfRpg` / `contraRpg` 对局 `joystick_action` |
| 自管 DOM | `dragonShooter`：壳内容器 + destroy 解锁滚动 |
| P2 布局 | `localStorage` `mobileControlLayout:v1` + `layoutEditEnabled` 调试拖拽 |
| 试点 ID | `CONTROL_PILOT_GAME_IDS`（含 contraRpg、dnfRpg） |

## 有意「Registry ≠ 运行时」

策划向 preset 与混合实现见 [`MOBILE_CONTROL_DESIGN.md`](MOBILE_CONTROL_DESIGN.md) §0 表（dodge、tetris、eliminate、racingRun、snake 等）。引导用 `mergeGuideWithControlHint`。

## 发布前建议（人工）

1. 真机按验收表勾选 G1–G7（优先：横屏 RPG、dragonShooter、wangzheRpg、eliminate 触屏换格）。
2. CI / 本地：`cd kids-game-simple && pnpm run audit`（registry + gtrs + controls + orientation）。
3. 填写验收表 **§六、汇总**（通过数 / 缺陷 / 阻塞）。

## 已知非阻塞风险（代码层待验）

见验收表 **§五、已知代码层待验 / 风险**（真机确认后删或改表述）。