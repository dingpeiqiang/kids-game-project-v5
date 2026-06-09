# 游戏开发规范 AGENTS.md

> **适用范围**：主交付工程为 `kids-game-simple/`。`kids-game-house/` 等为历史/参考子项目，新增与重构默认只改 `kids-game-simple`，勿把本规范里的目录路径硬套到其它仓库根目录。

## 〇、技术栈与方向（2026）

| 维度 | 选型 | 说明 |
|------|------|------|
| **2D** | Phaser 3 + 少量 Canvas 2D | 保留现有 2D，新 2D 优先 Phaser 或平台统一脚手架 |
| **3D（新）** | **Babylon.js** | 旧 Three.js 3D 视为废弃，**重做**而非修补；共用 `src/engine3d/`（规划/落地中） |
| **壳层** | Vite + TypeScript + Capacitor | 3D 单独打包 chunk，避免拖累 2D 首屏 |
| **平台** | `GameEngine` + `GAME_REGISTRY` | 积分、连击、结算与 App 只认这一套接口 |

**上架门槛（3D）**：未完成「能玩」验收的 3D，`GAME_DISPLAY_CONFIG` 中 **`visible: false`**，禁止带「新」角标误导用户。

---

## 一、项目结构规范

### 1.0 去旧留新原则
- **新增功能**：用当前技术栈（2D Phaser / 3D Babylon），不扩展废弃 Three 3D。
- **旧代码清理**：重做或替换后删除旧实现与死路由，避免双份 `initXxx`。
- **向后兼容**：移除对外入口前，确认 `GAME_REGISTRY` 与 `games/index.ts` 已切换。
- **废弃标记**：`@deprecated` + 替代路径（如 `engine3d` 或新游戏 id）。
- **定期清理**：迭代末清理未引用资源；**不**在仓库根目录批量新增 `*_FIX_REPORT.md` 类过程文档（见 1.3）。

### 1.1 目录约定（`kids-game-simple`）

```
kids-game-simple/src/games/<gameId>/    # gameId 与注册 id 一致，camelCase，如 jump3d、carParking3d
├── index.ts          # 对外 init / destroy 导出
├── game.ts           # 编排：循环、输入、模块调用（或 Phaser Scene / Babylon 游戏类）
├── config.ts         # 可调常量、关卡表、数值
├── types.ts          # 跨文件类型
├── logic/            # 可选：无 DOM/Canvas/WebGL 的纯逻辑（推荐 3D/复杂 2D）
└── render/ 或 scenes/ # 可选：绘制/UI；Phaser 用 scenes/ 亦可
```

- **单文件游戏**：允许 `src/games/foo.ts`（历史 Canvas），新游戏**优先目录化**。
- **平台注册**：`src/games/gameRegistry.ts` 的 `GAME_REGISTRY` + `GAME_DISPLAY_CONFIG` 为运行期真相源之一；`src/data/games.ts` 中 `GAMES` / `GAME_GUIDES` 与注册表**保持 id 一致**，改一处要同步另一处。

### 1.2 单一文件上限
- 单文件建议 **≤ 500 行**（含注释）；超过应拆 `logic/`、`render/`、`scenes/` 或 `systems/`。
- **例外**（允许放宽，但仍需拆分提交）：自动生成的关卡表、纯数据 `config.ts`、Phaser 单 Scene 若逻辑已外提。
- `game.ts` 只做编排，不写大段绘制或物理公式。

### 1.3 文档规范
- 用户可见说明：优先 `README.md`（模块级，简短）或 `kids-game-simple/CLAUDE.md`。
- **禁止**为每次小修复在仓库根或游戏目录堆砌 `*_COMPLETE.md` / `*_FIX_REPORT.md`（历史文件可保留，不再新增）。

---

## 二、代码组织规范

### 2.1 分层架构（按引擎区分）

| 类型 | 编排 | 逻辑 | 表现 |
|------|------|------|------|
| **Canvas 2D** | `game.ts` + rAF | `logic/` | `render/` 或内联 draw |
| **Phaser 3** | Scene / `game.ts` | `logic/` 或 systems | Scene `create`/`update`，**不要**在 logic 里 `new Phaser.Game` |
| **Babylon 3D** | `game.ts` + `engine3d` 适配器 | `logic/` | `render/` 或 Babylon 场景构建模块 |

### 2.2 逻辑与表现分离（原则，非教条）
- `logic/`：**不得**直接操作 Canvas 2D API、WebGL、Phaser 显示对象、Babylon Mesh 创建。
- `render/` / 场景模块：**不得**写业务规则（扣血、过关判定、刷怪表）；可读状态快照用于绘制。
- Phaser/Babylon 中若难以拆分，至少保证 **update 逻辑函数** 与 **资源加载/网格创建** 分文件。

### 2.3 时间与延迟
- 局内计时、刷怪、无敌帧：用 **帧 dt** 或 `performance.now()` 差值，不用 `setInterval`。
- `setTimeout` / `setInterval` **仅允许**：返回大厅、UI  toast、非游戏循环的壳层逻辑。

### 2.4 平台接入（强制）

```typescript
// gameRegistry 中的约定（App 统一调用）
interface GameRegistration {
  init: (engine: GameEngine, onEnd: () => void) => Promise<void>
  destroy?: () => void   // 3D / WebGL / Phaser 必须实现，防止泄漏
  setup?: (container: HTMLDivElement) => { gameW; gameH; displayW; displayH }
  isSpecial?: boolean    // 全屏容器、自定义布局时使用
}
```

- 新游戏 **必须** 在 `GAME_REGISTRY` 注册，并 `await import('./xxx')` 懒加载。
- 结算分数走 `GameEngine`（整局类用 `setScore`，过程类用 `addScore`）。

---

## 三、TypeScript 规范

### 3.1 类型
- 实体与配置用 `export interface` / `type`；配置对象用 `as const` + 派生类型。
- 避免无类型大对象字面量散落在 `game.ts`。

### 3.2 类型位置
- 游戏内共享 → `types.ts`；仅单文件使用 → 文件顶部。

### 3.3 函数
- 显式参数，避免依赖隐式模块级可变全局；必要时的单例须在 `game.ts` 注明生命周期。

### 3.4 `any`
- 默认禁止；边界（第三方、JSON）用 `unknown` + 收窄。
- **已有代码**中的 `any` 在触碰该文件时逐步消除，不要求单次全库大扫除。

---

## 四、游戏架构规范

### 4.1 游戏循环
- **Canvas 2D**：`requestAnimationFrame`，`dt` 上限建议 `0.033s` 防螺旋。
- **Phaser / Babylon**：用引擎主循环；**禁止**再套一层无意义的 rAF 双循环。

### 4.2 状态
- 运行时状态聚合为 `GameState`（或 Phaser registry / 类字段），重置用 `reset()` 或新 Scene，避免幽灵状态。
- 与平台无关的进度（最高分等）走 `storageService`。

### 4.3 输入
- 维护当前帧输入快照（键、触摸、摇杆）；移动端与 Capacitor WebView 需 `passive: false` 处要显式声明。

### 4.4 关卡与数值
- 关卡表、波次、Boss 参数进 `config.ts` 或 JSON；避免 `if (level === 3)` 散落。
- 平衡调整只改配置，不改判定框架。

---

## 五、性能与资源

### 5.1 实体生命周期
- 离屏/死亡实体从集合并释放引用；Phaser Group / Babylon 对象 `dispose`。
- 退出游戏时 `destroy()` 注销监听、引擎、纹理。

### 5.2 粒子与投射物（建议上限，可按游戏微调）
- 粒子 ≤ 200、同屏子弹 ≤ 50、飘字 ≤ 30（与 `CLAUDE.md` 一致）。

### 5.3 碰撞
- **2D**：AABB / 瓦片 / Phaser 物理，大量对象做粗筛。
- **3D**：优先 Babylon 物理或官方碰撞，不自写粗糙 mesh 穿透。

### 5.4 构建
- Phaser、Babylon、Three（迁移期）分 vendor chunk；新 3D **不**依赖 Three。

---

## 六、命名规范

### 6.1 文件与目录
- 游戏目录：**camelCase**，与 `game.id` 一致（`carParking3d`，非 `car-parking-3d`）。
- 游戏内模块：`logic/`、`render/`、`scenes/` 小写固定名。
- 多词文件名：**camelCase**（`gameLoop.ts`）或 **kebab-case**（`game-loop.ts`）二选一，**同一游戏内统一**。

### 6.2 变量与函数
- camelCase：`playerHp`, `updatePlayer()`
- 布尔：`is` / `has` / `can` 前缀
- **常量对象**：`GAME_CONFIG`、`LEVELS`（PascalCase 或 SCREAMING_SNAKE 均可，**同一文件统一**）

### 6.3 类型
- 类 / 接口 / 类型别名：PascalCase，接口**不加** `I` 前缀。

---

## 七、验收标准

### 7.1 编译
- 在 `kids-game-simple` 下：`npm run type-check` 零 error。

### 7.2 2D 检查表
- [ ] 已注册 `GAME_REGISTRY`，懒加载
- [ ] 配置与类型分离
- [ ] 退出可重复开局无泄漏
- [ ] 触控 + 键鼠至少一种路径可玩

### 7.3 3D 检查表（重做后）
- [ ] 基于 Babylon + 共用 `engine3d` 适配层
- [ ] `destroy()` 已实现并在注册表挂载
- [ ] 中端 Android WebView 可稳定 30fps+（或明确降级策略）
- [ ] 10 秒内能理解操作；有明确胜负/计分并回写 `GameEngine`
- [ ] `visible: true` 前产品/策划验收通过

---

## 附：常见反模式

| 反模式 | 正确做法 |
|--------|---------|
| 继续修补废弃 Three 3D | Babylon 重做 + 旧入口隐藏 |
| 每个 3D 各写一套初始化 | `engine3d` 统一生命周期 |
| 未 `destroy` 退出 WebGL 游戏 | 注册 `destroy`，App 切换时调用 |
| `setTimeout` 刷怪/无敌 | dt 或时间戳 |
| 元数据只改 `games.ts` 不改 Registry | id 与展示配置同步 |
| 500 行硬拆无意义碎片 | 按职责拆 logic/render/scene |
| 根目录堆砌修复报告 | CHANGELOG 或 commit 说明 |
| 3D  demo 上架带「新」标 | `visible: false` 直到 7.3 通过 |