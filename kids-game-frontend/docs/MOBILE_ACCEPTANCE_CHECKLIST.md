# 儿童游戏大厅 · 移动端验收清单（38 款）

> 对应注册表：`src/games/gameRegistry.ts`  
> 改造范围：触摸坐标缩放、`touch-action`、结束解绑、3D `scene.pick` 缩放等。  
> **代码状态 ≠ 真机通过**，本表用于人工/真机勾选。  
> 代码层收尾说明：[`MOBILE_CONTROL_RELEASE.md`](MOBILE_CONTROL_RELEASE.md)

---

## 一、验收环境（每轮测试填一次）

| 项 | 填写 |
|----|------|
| 日期 | |
| 构建分支 / commit | |
| 前端入口 | `kids-game-simple` dev / 打包 H5 / App WebView |
| 设备 A | 型号 _____ 系统 _____ 浏览器/内核 _____ |
| 设备 B（可选） | |
| 网络 | 登录 □是 □否（部分游戏会提交 session） |

---

## 二、通用通过标准（每款至少测一遍）

| # | 检查项 | 通过 |
|---|--------|------|
| G1 | 从大厅进入游戏，画布全屏/比例正常，无大面积黑边错位 | □ |
| G2 | **单指操作**命中与画面一致（点格子/按钮不偏左上或偏右） | □ |
| G3 | 滑动/拖动摇杆时 **页面不跟着滚动**（无整页上下晃） | □ |
| G4 | 能正常 **开始 → 玩一局 → 结束/返回大厅** | □ |
| G5 | 返回大厅后 **再次进入同一游戏**，无「点两次才动」、无鬼触 | □ |
| G6 | 横屏游戏（若提示横屏）旋转后操作仍正确 | □ |
| G7 | **操作 preset**：`getGameControlPreset(id)` 已在 [`gameControlRegistry`](../src/platform/mobileControls/gameControlRegistry.ts) 登记；PC 无 overlay 时仍可玩；引导与 `getCombinedControlGuideHint` 不矛盾（混合接入见 [`MOBILE_CONTROL_DESIGN.md`](MOBILE_CONTROL_DESIGN.md) §5.2–5.3） | □ |

**严重缺陷（任一条即判该游戏不通过）**：无法开始、无法操作、结束卡死、触摸系统性偏移 > 约 1 格、退出后 CPU/发热异常。

### 统一操作框架 · 已接入（代码层，须真机 G7）

以下已使用 `bindGameCanvasControls` / `bindMobileControlPreset` / 文档混合 API（`bindHorizontalSwipePan`、`bindCanvasDragFollowAndLaneTap`、`bindCanvasTapDragSwap` 等）。验收时对照 [`CONTROL_PILOT_GAMES.md`](CONTROL_PILOT_GAMES.md) 与 `getGameControlPreset(id)`。

| 类别 | gameId |
|------|--------|
| tap | pop, colorTap, whackMole, memoryMatch, jewelMatch, match3, stack, sort, towerDefense, snake*, plantsVsZombies, … |
| swipe_pan / 混合 | dodge, fruitSlice†, cookieCut, beatDragon, kingBaby, slimeJump, bouncePath, starCatcher, racingRun‡ |
| lane | neonRun |
| joystick 试点 | superMario, cuteTankBattle, tetris§ |
| aim | bubbleShooter |
| eliminate | PC `tap` + 触屏 `bindCanvasTapDragSwap` |

\* snake：registry `swipe_pan`，玩法为 `tap` 四向 + 键盘。  
† fruitSlice：`trackOutsideCanvas: true`。  
‡ racingRun：混合拖拽换道 + PC 键。  
§ tetris：自绘底栏 + `joystick_action` 按钮。

**3D tap + pick**：happyDefense、plantZombieDefense（`pickGridAtCanvasPixels` / `pickSunIdAtCanvasPixels`）。

**2D 横屏 tap**：plantZombieDefense2d（`bindPzd2dInput` → `bindGameCanvasControls`）。

**3D 统一操作**：`cloudBallRush3d`（`tilt`）、`skyFrenzy`（`swipe_pan`）、`happyDefense` / `plantZombieDefense`（`tap` + pick）。

**3D 混合**：`skyRush3d`（platform 移动 + 右半屏瞄准）。

**Phaser + platform**：`spaceShooter`（`swipe_pan` on Phaser canvas）。

**3D 混合 · voxel**：`voxelRealm`（platform 移动/按钮 + 右上视角 pointer）。

**塔防混合**：`rpgShooterTD`（platform 左下摇杆 + 塔栏 touch/click）。

**RPG platform**：`dnfRpg` / `contraRpg` 对局 `joystick_action` + `bindGameCanvasControls`（选角 dnf 仍 `tap`）。

---

## 三、分游戏验收表

**图例**  
- **改造**：本轮是否改过移动端输入相关代码（据仓库记录）  
- **方向**：`竖` / `横` / `3D`（以 `engine.setOrientation` 或玩法为准）  
- **操作要点**：验收时重点测什么  

在 **通过** 列打勾；有问题在 **备注** 写现象 + 设备。

| # | id | 名称 | 方向 | 改造 | 操作要点 | G1–G6 | 通过 | 备注 |
|---|-----|------|------|------|----------|-------|------|------|
| 1 | eliminate | 极速消除 | 竖 | 是 | 点方块消除 | | □ | |
| 2 | tetris | 方块消除 | 竖 | 是 | 点左/中/右区移动旋转；下方可下落 | | □ | |
| 3 | jewelMatch | 宠物消消乐 | 竖 | 是 | 点选+交换相邻 | | □ | |
| 4 | bubbleShooter | 泡泡龙 | 竖 | 是 | 拖瞄准+松手/点击发射 | | □ | |
| 5 | sort | 色彩排序 | 竖 | 是 | 点管子交换 | | □ | |
| 6 | memoryMatch | 翻牌配对 | 竖 | 是 | 点卡牌 | | □ | |
| 7 | colorTap | 颜色Tap | 竖 | 是 | 点颜色按钮 | | □ | |
| 8 | whackMole | 打地鼠 | 竖 | 是 | 点洞 | | □ | |
| 9 | pop | 气球砰砰 | 竖 | 是 | 点气球 | | □ | |
| 10 | fruitSlice | 水果切切 | 竖 | 是 | 滑动切割 | | □ | |
| 11 | cookieCut | 切饼干 | 竖 | 是 | 滑动切割 | | □ | |
| 12 | dodge | 轻量躲避 | 竖 | 是 | 左右拖角色 | | □ | |
| 13 | neonRun | 霓虹跑酷 | 竖 | 是 | 左/右半屏切道 | | □ | |
| 14 | slimeJump | 史莱姆跳 | 竖 | 是 | 左右跟手 | | □ | |
| 15 | superMario | 超级玛丽 | 横 | 是 | 左摇杆+右跳；键盘可选 | | □ | |
| 16 | snake | 贪吃蛇 | 竖 | 是 | 点四方向 | | □ | |
| 17 | racingRun | 极速赛车 | 竖 | 是 | 拖车道 | | □ | |
| 18 | starCatcher | 星星捕手 | 竖 | 是 | 拖精灵 | | □ | |
| 19 | bouncePath | 弹珠迷宫 | 竖 | 是 | 左右跟手 | | □ | |
| 20 | stack | 叠叠乐 | 竖 | 是 | 点击落块 | | □ | |
| 21 | spaceShooter | 太空射击 | 竖 | 是 | Phaser 拖飞船+射 | | □ | |
| 22 | towerDefense | 星际塔防 | 竖 | 是 | 点塔栏+点地图 | | □ | |
| 23 | plantsVsZombies | 植物大战僵尸 | 横 | 是 | 点卡片+草地 | | □ | |
| 24 | rpgShooter | 星际猎手 | 竖 | 是 | 摇杆+点目标；`gameActions.gameOver` 结算 | | □ | |
| 25 | dragonShooter | 打龙小游戏 | 竖 | 是 | 滑走位；独立全屏 wrapper | | □ | |
| 26 | beatDragon | 打了个龙 | 竖 | 是 | 滑走位+点 buff | | □ | |
| 27 | kingBaby | 王者萌斗 | 横 | 是 | 左拖走位+右技能 | | □ | |
| 28 | rpgShooterTD | RPG塔防射击 | 竖 | 是 | 摇杆+点放塔；注意摇杆瞄准曾修 scale | | □ | |
| 29 | contraRpg | 魂斗罗RPG | 横 | 是 | 左摇杆+跳/射；卷轴过关；横屏壳 | | □ | |
| 30 | wangzheRpg | 王者荣耀 | 横 | 是 | 左摇杆+技能；Vue 壳 `gameEventBridge` | | □ | |
| 31 | happyDefense | 欢乐防线 | 3D横 | 是 | 点格子放塔 | | □ | |
| 32 | plantZombieDefense | 萌趣植物僵尸3D | 3D横 | 是 | 点格子/阳光 | | □ | |
| 33 | plantZombieDefense2d | 萌植防线2D | 横 | 是 | 点格子种植物 | | □ | |
| 34 | cloudBallRush3d | 云端滚球 | 3D横 | 是 | 左下摇杆+右下跳 | | □ | |
| 35 | voxelRealm | 方块幻境 | 3D横 | 是 | 移动：左摇杆；右下挖/放/跳；PC 可锁鼠标 | | □ | |
| 36 | skyFrenzy | 天际狂潮 | 3D横 | 小改 | 拖拽战机 | | □ | |
| 37 | cuteTankBattle | 萌趣坦克 | 竖 | 是 | 滑方向+点射 | | □ | |
| 38 | dnfRpg | 地下城勇士 | 横 | 是 | 摇杆+技能键；选角点卡片 | | □ | |

---

## 四、建议测试顺序（按风险从高到低）

1. **横屏 + 虚拟键**：`contraRpg`、`wangzheRpg`、`dnfRpg`、`kingBaby`、`plantZombieDefense2d`  
2. **全屏独立画布**：`dragonShooter`、`rpgShooterTD`（移动端 wrapper）  
3. **3D 拾取**：`happyDefense`、`plantZombieDefense`、`cloudBallRush3d`  
4. **沙盒多指**：`voxelRealm`  
5. 其余 2D 点选/滑动类批量抽测 10 款  

---

## 五、已知代码层待验 / 风险（优先测）

| id | 风险说明 |
|----|----------|
| wangzheRpg | Vue 壳已接 `installGameEventBridge`；真机验结算面板与返回大厅 |
| rpgShooter | 已 `gameActions.gameOver`；真机验结算（无整页 reload） |
| dragonShooter | 壳内 absolute wrapper + destroy 解锁滚动；真机验退出/再来一局 |
| contraRpg | 横屏壳 + overlay 坐标；真机验 G2/G5/G6 |
| towerDefense | 已 `bindGameCanvasControls`；验 G5 退出无鬼触 |
| plantsVsZombies | 已 `bindGameCanvasControls`；验卡片+草地点击 |

---

## 六、汇总（测试完成后填）

| 统计 | 数量 |
|------|------|
| 38 款全部通过 | /38 |
| 有缺陷待修 | |
| 阻塞（无法玩） | |

**签字**：__________  

---

## 七、缺陷记录模板（复制使用）

```
游戏 id：
设备：
复现步骤：
期望：
实际：
截图/录屏：
严重级别：阻塞 / 高 / 中 / 低
```