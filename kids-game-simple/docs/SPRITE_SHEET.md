# kids-game-simple 精灵图（图集）接入指南

## 现状

| 方式 | 示例 | 说明 |
|------|------|------|
| 单张 PNG | `plantZombieDefense2d/render/assets.ts` | `new Image()` + `ctx.drawImage(img, …)` |
| 矢量/渐变 | `contraRpg/render/entities.ts` | 无位图资源 |
| Babylon 纹理 | `happyDefense/render/assets.ts` | 3D 贴图，不走 Canvas 精灵 |

**平台层**已提供统一模块：`src/platform/spriteSheet.ts`（并从 `src/platform/index.ts` 导出）。

## 资源放哪

静态资源放在 **`kids-game-simple/public/assets/<gameId>/`**，运行时 URL 以 `/assets/...` 访问（与 Vite `public` 规则一致）。

推荐目录：

```
public/assets/myGame/
  atlas/
    player.json      # TexturePacker 导出
    player.png
  sprites/           # 仍可用单图（与图集并存）
    icon.png
```

## 制作图集

1. 用 [TexturePacker](https://www.codeandweb.com/texturepacker)、[Leshy SpriteSheet Tool](https://www.leshylabs.com/apps/sstool/) 或 Aseprite 等导出 **PNG + JSON**。
2. JSON 格式支持：
   - **Hash**：`{ "frames": { "run_01": { "frame": {...}, ... } }, "meta": { "image": "sheet.png" } }`
   - **Array**（与仓库内 `ai-town` 的 `hero.json` 相同）：`{ "textures": [{ "image": "hero.png", "frames": [...] }] }`
3. 帧名建议带语义前缀，便于动画：`hero_run_01`、`zombie_walk_03`。

无 JSON 时可用 **等分网格**：`loadGridSpriteSheet({ url, frameWidth, frameHeight, columns? })`。

## 在生命周期游戏里加载

在 `onInit`（或 `hostCanvas2D` 的 `onInit`）里 `await loadSpriteSheet`，在 `onRender` 里 `drawSpriteFrame`：

```ts
import {
  loadSpriteSheet,
  drawSpriteFrame,
  SpriteAnimation,
  type SpriteSheet,
} from '../platform/spriteSheet'

let sheet: SpriteSheet | null = null
let walkAnim: SpriteAnimation | null = null

// onInit:
sheet = await loadSpriteSheet('/assets/myGame/atlas/player.json')
walkAnim = sheet ? SpriteAnimation.fromPrefix(sheet, 'hero_run_', 12) : null

// onUpdate(dt):
const frame = walkAnim?.update(dt) ?? null

// onRender:
if (sheet && frame) {
  drawSpriteFrame(ctx, sheet, frame, player.x, player.y, {
    anchor: 'center',
    width: 48,
    height: 48,
    flipX: player.facing < 0,
  })
}
```

`onDestroy` 时若需释放缓存（少见，换局可复用）：`clearSpriteSheetCache()`。

与 **GameLifecycle / hostCanvas2D** 的关系：精灵模块不接管 RAF，只负责加载与绘制；逻辑仍在 `onUpdate`，绘制在 `onRender`。

## 从「单图」迁到图集

以 `plantZombieDefense2d` 为例：

1. 把 `plant_peashooter.png` 等多帧合并为 `plant_peashooter.json` + 图集 PNG。
2. `loadPzd2dAssets` 中增加 `loadSpriteSheet(`${ASSET_ROOT}/atlas/plants.json`)`。
3. `drawSprite` 改为：优先 `drawSpriteFrame(ctx, sheet, 'plant_peashooter_idle_0', cx, cy, { anchor: 'center', width: w, height: h })`，失败再回退原 `HTMLImageElement` 或 emoji。

保持 **单文件加载失败可玩**（与现有 `loadImage` 返回 `null` 一致）。

## API 速查

| 函数 | 作用 |
|------|------|
| `loadSpriteSheet(jsonUrl)` | 加载 TP JSON + 图集，带内存缓存 |
| `loadGridSpriteSheet(config)` | 均匀切格图集 |
| `drawSpriteFrame(ctx, sheet, name, x, y, opts?)` | 绘制一帧 |
| `SpriteAnimation` / `fromPrefix` | 序列帧 `update(dt)` |
| `clearSpriteSheetCache()` | 清空加载缓存 |

## Phaser / Babylon 游戏

- **spaceShooter（Phaser）**：用 Phaser 自带 `this.load.atlas()` / `anims`，不必强行用本模块。
- **happyDefense 等 3D**：继续 `Texture`；若 UI 用 2D overlay canvas，可对本模块 `drawSpriteFrame`。

## 与壳层约定

- 大图集在 `onInit` 异步加载；加载完成前可显示纯色占位，**不要**在玩法里自绘壳层顶栏分数（见 `FRAMEWORK_VS_SHELL.md`）。