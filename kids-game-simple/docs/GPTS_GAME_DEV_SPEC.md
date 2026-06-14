# GPTS — Game Production & Technical Spec（AI 实施规范 v1）

> **GPTS** = 本仓库内「从策划文档到可上架游戏」的**唯一实施入口**。  
> 策划填写 [GAME_DESIGN_SPEC_TEMPLATE.md](./GAME_DESIGN_SPEC_TEMPLATE.md) 后，AI/研发按本文档顺序执行，**不得跳过 GTRS 与 Registry 步骤**。

---

## 1. 仓库与模块边界

| 路径 | 职责 |
|------|------|
| `kids-game-simple/src/games/{gameId}/` 或 `games/{gameId}.ts` | 游戏逻辑 |
| `kids-game-simple/src/games/GameRegistry.ts` | 注册 `game` / `guide` / `init` / `destroy` |
| `kids-game-simple/src/games/gameLayout.ts` | 分辨率与横竖屏 |
| `kids-game-simple/public/themes/{gameId}_theme_default.json` | 默认 GTRS |
| `kids-game-simple/src/services/gtrsThemeLoader.ts` | 加载/缓存/迁移 TRS→GTRS |
| `kids-game-simple/src/games/gameThemeBridge.ts` | 进局前 `prepareGameTheme` |
| `kids-game-simple/src/utils/GTRSThemeApplier.ts` | Canvas 调色板 / DOM CSS 变量 |

平台壳层（勿改游戏核心逻辑）：`app/gameSession.ts`、`services/gameEngine.ts`。

---

## 2. AI 实施流水线（严格顺序）

```
① 解析策划 YAML 摘要（gameId、type、category、orientation）
② 校验 gameId 未被 GAME_REGISTRY 占用
③ 创建游戏实现 + 默认 GTRS JSON（槽位与策划表 1:1）
④ 注册 GameRegistry + GAME_DISPLAY_CONFIG + gameLayout 覆盖
⑤ 代码内通过 getCanvasPaletteForGame / getCachedGTRSTheme / getPhaserTextureKey 读资源
⑥ 自测：gameSession 全流程 + 换主题 JSON 冒烟
⑦ 勾选策划文档 §7 验收项
```

---

## 3. 代码规范

### 3.1 初始化签名

```ts
export function initYourGame(engine: GameEngine, onEnd: () => void): void | Promise<void>
export function destroyYourGame(): void  // 3D / 全局监听 / Phaser 实例
```

`initGame` 已在 Registry 层调用 `prepareGameTheme(gameId)`，游戏内**无需重复**加载主题，只需读取缓存。

### 3.2 Canvas 2D 读 GTRS（推荐）

```ts
import { getCanvasPaletteForGame } from '../utils/GTRSThemeApplier'

const palette = getCanvasPaletteForGame('yourGameId')
// 绘制时用 palette.primary / palette.background 等，勿写死 #2ECC71
```

扩展调色板：在 GTRS `scene` 增加元数据 key，并在 `GTRSThemeApplier.ts` 的 `paletteFromGTRS` 中增加 `readSceneMeta` 映射（仅当通用槽位不够时）。

### 3.3 Phaser / 图片

```ts
import { getCachedGTRSTheme } from '../services/gtrsThemeLoader'
import { getPhaserTextureKey } from './gameThemeBridge'

const theme = getCachedGTRSTheme(gameId)
const player = theme?.resources?.images?.scene?.player
if (player?.src) this.load.image(getPhaserTextureKey(gameId, 'scene', 'player'), player.src)
```

### 3.4 分数与结束

```ts
engine.addScore(points, x?, y?, isCrit?, isCombo?)
// 终局
engine.setVictory?.(true) // 若引擎暴露
onEnd() // 必须调用，否则壳层不弹结果
```

### 3.5 暂停与销毁

游戏循环开头：

```ts
if (!engine.running || engine.paused) return
```

`destroy` 中：`cancelAnimationFrame`、 `removeEventListener`、`renderer.dispose()` 等。

---

## 4. GTRS 与 GPTS 对齐规则

| 策划文档章节 | GTRS 位置 |
|--------------|-----------|
| §4.2 globalStyle | `globalStyle.*` |
| §4.2 scene 槽位表 | `resources.images.scene` |
| §3.3 音效 | `resources.audio` |
| 主题元信息 | `themeInfo.gameId` === `gameId` |

**迁移**：旧扁平 `images` / `globalStyle` 由 `migrateTRSOrLegacyToGTRS` 自动转 GTRS，新游戏**禁止**再交付 TRS 格式。

**后端**：`kids-game-backend` 主题表 `config_json` 存完整 GTRS；前端 `fetchThemeFromApi` 优先 API，失败回退本地 JSON。

---

## 5. Registry 片段模板

```ts
yourGameId: {
  game: {
    id: 'yourGameId',
    name: '...',
    desc: '...',
    type: '2d',
    category: 'logic',
    tag: '...',
    color: '#hex1,#hex2',
    players: 0,
    best: 0,
    preview: 'yourGameId',
  },
  guide: { /* 与策划 §6 一致 */ },
  init: async (engine, onEnd) => {
    const { initYourGame } = await import('./yourGameId')
    await initYourGame(engine, onEnd)
  },
  destroy: () => {
    void import('./yourGameId').then(m => m.destroyYourGame?.())
  },
},
```

并在 `GAME_DISPLAY_CONFIG` 追加：

```ts
{ id: 'yourGameId', visible: true, order: 1, badge: '新' },
```

---

## 6. 质量门禁（AI 输出前自检）

1. `grep` 游戏目录：无 `https://` 图片（主题 JSON 除外）  
2. `gameId` 在 `GameRegistry`、`GAME_DISPLAY_CONFIG`、主题文件名三者一致  
3. `npm run build`（或项目等效命令）通过  
4. 手动：大厅 → 游戏 → 结算 → 返回  
5. 修改 `primaryColor` 后重进游戏，视觉有变化  

---

## 7. 与 Cursor / 其他 AI 的协作方式

将策划填好的 `GAME_DESIGN_SPEC_TEMPLATE.md`（或导出 PDF）与本文档一并作为上下文，并明确指令：

> 按 GPTS v1 流水线实现 `gameId=xxx`，先输出 GTRS JSON 与资源槽位对照表，再写代码。

---

## 8. 文档索引

| 文档 | 读者 |
|------|------|
| [GAME_DESIGN_SPEC_TEMPLATE.md](./GAME_DESIGN_SPEC_TEMPLATE.md) | 策划 / 产品 |
| [GTRS_THEME_GUIDE.md](./GTRS_THEME_GUIDE.md) | 美术 / 运营换肤 |
| [GameRegistry.md](./GameRegistry.md) | 研发速查 |
| 本文档 GPTS | AI / 研发实施 |