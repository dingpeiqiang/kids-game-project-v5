# 实施计划｜萌植防线 2D（`plantZombieDefense2d`）

> **策划依据**：[plantZombieDefense2d-GDD.md](plantZombieDefense2d-GDD.md) v1.0 P0  
> **工程依据**：[GDD-DEV-STANDARDS.md](GDD-DEV-STANDARDS.md) · [AGENTS.md](../AGENTS.md)（若存在）  
> **不改动**：现有 `plantZombieDefense`（3D Babylon）保持独立，避免回归 3D。

---

## 1. 目标与范围

| 项 | 内容 |
|----|------|
| 交付 | 可进大厅的 **2D 横屏** 塔防，15 关、5 植物、4 僵尸 |
| 平台 | Android WebView，`mainGameCanvas` + `engine.setOrientation('landscape')` |
| P0 底线 | 玩法闭环 + emoji/色块占位可玩 + §4 数值对齐 + 本地星级/关卡进度 |
| P1（本期外） | §6 全量 AI 精灵、行走帧动画、完整 §5 音效包 |

**成功标准（对齐 GDD §9）**：第 1 关 §3 时间轴误差 ≤2s；小屋失败文案唯一；`npm run type-check` 通过。

---

## 2. 架构决策

### 2.1 逻辑复用 vs 重写

| 模块 | 建议 | 说明 |
|------|------|------|
| `types.ts`（枚举/状态） | **复制后改** | 与 3D 版同构：`PlantKind`、`ZombieKind`、`GamePhase`、实体数组 |
| `config.ts` | **新建 2D** | GDD §4：`BASE_W/H`、px 速度、`leakDamage:25`、MAP 与 `LEVELS` |
| `logic/gameLoop.ts` | **移植核心** | 从 `plantZombieDefense/logic/gameLoop.ts` 抽离，**去掉** `gridToWorld` 的 3D 依赖 |
| `logic/storage.ts` | **复制改 key** | `pzd2d_records` / `pzd2d_unlock` |
| `render/*` | **全新 Canvas** | 参考 `beatDragon/render/draw.ts` + `input.ts` |
| `game.ts` | **全新** | 模式同 `beatDragon/game.ts`，无 Babylon |

### 2.2 坐标系（2D）

- **逻辑画布**：960×540（GDD §4.1）  
- **网格**：`gridW=9`，`gridH=5`，`cellPx=72`；草坪区列 0～4 可放置  
- **实体位置**：  
  - 植物：格心 `(gridLeft + (gx+0.5)*cellPx, gridTop + (gz+0.5)*cellPx)`  
  - 僵尸：行 `gz` 固定，**x 像素** 从右缘 `spawnX` 向左递减至 `houseX`  
- **速度换算**：GDD 僵尸 `32 px/s` ↔ 3D 版 `0.8` 世界单位/s 时，在 2D 中 **直接用 px/s**，豌豆弹速建议 `195 px/s`（≈ 3× 僵尸，手感接近 3D 的 6.5 世界单位）  

### 2.3 地图与路径（与 GDD §4.5 一致）

```
列:  0  1  2  3  4 | 5  6  7 | 8
     放 放 放 放 放 | 路 路 路 | 屋
```

- 僵尸仅在列 5～7 行走（逻辑 x 连续）；进小屋：`x <= houseThreshold` → `house_hurt`，扣 `leakDamage`，移除僵尸  
- 射手射程：同 row，目标 `zombie.x > plant.x` 且 `zombie.x < spawnX`

---

## 3. 目录与文件清单

```
kids-game-simple/
  docs/plantZombieDefense2d-GDD.md          # 已有
  public/assets/plantZombieDefense2d/       # P0 可先空，占位
    sprites/ backgrounds/ ui/ audio/
    LICENSES-plantZombieDefense2d.txt
    README.md
  src/games/plantZombieDefense2d/
    index.ts              # export init / destroy
    game.ts               # rAF 主循环、engine 对接
    config.ts             # GDD §4 全量
    types.ts
    input.ts              # 点选卡、格、阳光、植物
    logic/
      gameLoop.ts
      storage.ts
      events.ts           # 可选：event_id → audio/粒子请求
    render/
      assets.ts           # loadImage 列表
      draw.ts             # HUD + 网格 + 实体 + 结算
      layout.ts           # 格↔屏坐标
```

**预估规模**：`gameLoop` 250～350 行，`draw` 300～450 行；单文件尽量 ≤500 行。

---

## 4. 分阶段实施

### Phase 0 — 脚手架（0.5d）

- [ ] 创建上述目录 + `index.ts`  
- [ ] `gameRegistry.ts`：`GAME_DISPLAY_CONFIG` 增加 `plantZombieDefense2d`（`visible: true`，`badge: '新'` 按需）  
- [ ] 注册 `game` / `guide` 字段 **严格按 GDD §4.10**  
- [ ] `init`：`engine.start()`、`setOrientation('landscape')`、绑定 `#mainGameCanvas`  
- [ ] 空循环：清屏 + 显示「加载中」→ `type-check` 绿

### Phase 1 — 模拟核心（1.5～2d）

- [ ] `config.ts`：`GAME_CONFIG`、`MAP_LAYOUT`、`PLANT_DEFS`、`ZOMBIE_DEFS`、`LEVELS`（复用 3D `buildLevel` 算法或整文件移植后改常量）  
- [ ] `createInitialState` / `startNextWave` / `updateSimulation`  
- [ ] 放置、出售、阳光（落天+向日葵）、豌豆、减速、地雷、咬植物、漏怪扣小屋血  
- [ ] `phase`：`prep`（3s 或按钮）→ `wave` → `victory`/`defeat`  
- [ ] **单元可测**：在 `draw` 前用 `console` 或极简 debug 线框验证第 1 关能通关  

**3D→2D 移植注意点**：

| 3D 行为 | 2D 实现 |
|---------|---------|
| `zombieStartX = 5.2` | `spawnX = gridOriginX + 7.5*cellPx` 等 |
| `zombieReachHouseX` | `houseX` 像素阈值 |
| `sportZombie` 跳坚果 | 保留：遇 `wallnut` 跳过并消耗一次跳跃 |
| `starsForHouseHp` | 同 GDD §4.9 |

### Phase 2 — 输入与 HUD（1d）

- [ ] 底部 **5 植物卡** + 阳光数 + 波次 `waveIndex/totalWaves` + 小屋 HP 条  
- [ ] 点击：选卡 → 草坪格放置；点击阳光实体收集；点击植物出售（或长按，与 GDD 一致用点击）  
- [ ] 阳光不足：`ui_invalid`（`audioService` 或占位哔声）  
- [ ] 暂停 / 继续（可选 P0：仅结算返回）

### Phase 3 — 渲染与反馈（1～1.5d）

- [ ] `render/layout.ts` 统一缩放：letterbox 适配真机宽高  
- [ ] 绘制：草坪格线、小屋、植物（图或 `emoji+color`）、僵尸、豌豆、阳光飘字  
- [ ] `floats` 飘字（+阳光、-cost、伤害）  
- [ ] 轻量粒子数组（可选 P0：击杀 12 点、波清 20 点）  
- [ ] 结算页：星级、下一关 / 重试 / 回大厅；`engine.setGameStats` + `setScore`  
- [ ] `persistRecords`：每关最高星、解锁关 `maxUnlockedLevel`

### Phase 4 — 资产与音效（0.5～1d，可并行）

- [ ] `ASSET_ROOT = '/assets/plantZombieDefense2d'`  
- [ ] `loadPlantZombieDefense2dAssets()`：有图用图，失败回退 emoji（与 GDD §6.4 一致，但 P0 验收要求主视觉逐步替换）  
- [ ] 映射 GDD §5：`pea_hit`、`zombie_kill`、`wave_clear`、`house_hurt`、`win`/`lose` → `audioService` 或 WebAudio 短音  
- [ ] `LICENSES-plantZombieDefense2d.txt` 占位条目  

### Phase 5 — 验收与调参（0.5d）

- [ ] 按 GDD §3 录屏核对第 1 关时间点  
- [ ] 漏 4 只才死（100 HP / 25）  
- [ ] §9 清单勾选；包体 `assets/plantZombieDefense2d` ≤5MB  
- [ ] 真机横屏触控无偏移  

---

## 5. `gameRegistry` 草稿（实现时照抄）

```ts
plantZombieDefense2d: {
  game: {
    id: 'plantZombieDefense2d',
    name: '萌植防线 2D',
    desc: '横屏种萌植收阳光，挡呆萌僵尸守小屋，休闲闯关冲三星！',
    type: '2d',
    category: 'strategy',
    tag: '塔防',
    color: '#72D566,#FFD23F',
    preview: 'plantZombieDefense2d',
  },
  guide: { /* GDD §4.10 ops + tips + bg #C2E8B9 */ },
  destroy: () => void import('./plantZombieDefense2d').then(m => m.destroyPlantZombieDefense2d()),
  init: async (engine, onEnd) => {
    const { initPlantZombieDefense2d } = await import('./plantZombieDefense2d')
    await initPlantZombieDefense2d(engine, onEnd)
  },
},
```

`GAME_DISPLAY_CONFIG` 增加：`{ id: 'plantZombieDefense2d', visible: true, order: … }`（order 与产品位协调）。

---

## 6. `game.ts` 主循环伪代码

```ts
export async function initPlantZombieDefense2d(engine, onEnd) {
  destroyPlantZombieDefense2d()
  engine.start()
  engine.setOrientation('landscape')
  const canvas = document.getElementById('mainGameCanvas') as HTMLCanvasElement
  const ctx = canvas.getContext('2d')!
  const assets = await loadAssets()
  let state = createInitialState(1)
  startNextWave(state) // 或 prep 倒计时后 start

  const unbind = bindInput(canvas, state, handlers)
  let lastTs = performance.now()
  const loop = (ts: number) => {
    const dt = Math.min(0.05, (ts - lastTs) / 1000)
    lastTs = ts
    updateSimulation(state, dt)
    if (state.phase === 'victory' || state.phase === 'defeat') { /* 等点击结算 */ }
    drawFrame(ctx, canvas, state, assets)
    raf = requestAnimationFrame(loop)
  }
  raf = requestAnimationFrame(loop)
  activeDispose = () => { cancelAnimationFrame(raf); unbind() }
}
```

**禁止**：`setTimeout` 刷怪/波次（用 `spawnTimer` + `dt`）。

---

## 7. 关卡与数值来源

- **直接来源**：`plantZombieDefense/config.ts` 的 `buildLevel` + `LEVELS`（15 关）  
- **2D 差异常量**（写入 `plantZombieDefense2d/config.ts`）：

| 键 | 2D 值 |
|----|--------|
| `houseBaseHp` | 100 |
| `leakDamage` | 25 |
| `BASE_W` / `BASE_H` | 960 / 540 |
| `zombie speed` | 30～32 px/s（按 kind） |
| `peaSpeed` | 195 px/s |

- **可选**：GDD §4.7 前三关文案与 3D 一致即可，无需重复手写 15 关表。

---

## 8. 风险与缓解

| 风险 | 缓解 |
|------|------|
| 3D 逻辑与 2D 碰撞不一致 | 统一用 **像素 AABB**；豌豆仅判同行 `x` 相交 |
| 横屏 HUD 挡格 | 卡栏占底 96px，网格整体上移；`layout.ts` 单点算 |
| 与 3D 版重复占坑 | Registry **新 id** `plantZombieDefense2d`，名称区分 |
| 资产未就绪 | P0 允许 emoji；§9 A3 要求删图不崩 |
| 文件超 500 行 | `draw.ts` 拆 `drawHud.ts` / `drawEntities.ts` |

---

## 9. 任务拆分（可开 Issue）

| ID | 任务 | 依赖 | 估时 |
|----|------|------|------|
| T1 | 脚手架 + Registry | — | 4h |
| T2 | config + types | T1 | 4h |
| T3 | gameLoop 移植 | T2 | 12h |
| T4 | layout + draw 网格实体 | T2 | 8h |
| T5 | input + HUD | T3,T4 | 8h |
| T6 | 结算 + storage | T3 | 4h |
| T7 | 音效/事件 + assets | T5 | 6h |
| T8 | 调参 + §9 验收 | T6 | 4h |

**合计**：约 **6～7 人日**（单人 sequential）。

---

## 10. 验证命令

```bash
cd kids-game-simple && npm run type-check
# 本地跑大厅 → 萌植防线 2D → 第1关通关/失败各一次
```

---

*计划版本：v1.0 · 2026-06-10 · 对应 GDD plantZombieDefense2d v1.0*