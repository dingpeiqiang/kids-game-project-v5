# 游戏壳层 · 真机抽测清单

进入任意游戏后检查：**顶栏**（返回 / 标题 / 得分 / 暂停）、**暂停蒙层**、**退出回大厅**、**再来一局**。

## 竖屏 · 平台得分 + 暂停

| gameId | 名称 | 要点 |
|--------|------|------|
| `eliminate` | 极速消除 | 顶栏得分随 `addScore` 变化；暂停后不能操作 |
| `dodge` | 轻量躲避 | 道具底栏 + 暂停 |
| `tetris` | 俄罗斯方块 | 暂停画面冻结 |
| `snake` | 贪吃蛇 | 暂停仍显示当前帧 |

## 竖屏 · 自绘 HUD（隐藏平台得分）

| gameId | 名称 | 要点 |
|--------|------|------|
| `spaceShooter` | 太空射击 | Phaser 在视口内；顶栏无重复分数 |
| `dragonShooter` | 打龙 | wrapper 在 `#gameCanvas` |
| `rpgShooter` | 星际猎手 | 暂停只渲染 |
| `beatDragon` | 打了个龙 | `canTick` 冻结 |

## 横屏 · 画布 / 旋转

| gameId | 名称 | 要点 |
|--------|------|------|
| `dnfRpg` | DNF | 顶栏 + 横屏视口 |
| `kingBaby` | 王者萌斗 | 隐藏平台得分 |
| `plantsVsZombies` | 植物大战僵尸 | 通关/失败走平台结算 |
| `towerDefense` | 星际塔防 | 暂停不推进波次 |

## 3D · 自管 HUD（隐藏得分/暂停 + 紧凑底栏）

| gameId | 名称 | 要点 |
|--------|------|------|
| `cloudBallRush3d` | 云球冲刺 | 壳层无暂停钮；游戏内工具栏暂停 |
| `voxelRealm` | 体素世界 | 同上 |
| `happyDefense` | 欢乐塔防 | 壳层暂停与 `isPaused` |
| `skyFrenzy` | 天空狂飙 | 游戏内暂停菜单 |

## 流程

1. 引导页 → 开始 → 壳层出现  
2. 暂停 → 继续 → 逻辑恢复  
3. 返回 → 普通游戏出「游戏暂停」蒙层；`hidePlatformPause` 游戏出「退出游戏？」（继续玩 / 退出到大厅）  
4. 本局结束 → 结算 → 再来一局 / 返回大厅（壳层 `unmount` 正常）  
5. 桌面端 **Esc**：暂停蒙层 / 退出确认 → 关闭或继续；对局中无蒙层时 Esc 等同暂停或退出确认

配置见 [gameLayout.ts](../src/games/gameLayout.ts)：`hidePlatformScore` / `hidePlatformPause` / `compactFooter`。