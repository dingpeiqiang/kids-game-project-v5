# kids-game-simple 精灵图接入指南

资源放在 **`public/assets/<gameId>/`**，运行时 URL 为 `/assets/<gameId>/...`（Vite 静态目录）。

## 三种常见形态

| 形态 | 适用 | 仓库示例 |
|------|------|----------|
| **单张整图** | 图标、角色立绘、背景 | `plantZombieDefense2d/render/assets.ts` + `drawSprite` |
| **均匀切格精灵表** | 横向/网格等宽等高帧 | `beatDragon` 龙身 `dragon_*_sheet.png`（2 列） |
| **JSON 图集** | 不规则帧、多动画名 | 使用 `platform/sprite2d` 的 `loadSpriteAtlas` |

加载失败时 **返回 `null` 并回退 emoji/色块**，与现有塔防、打龙一致，避免强依赖美术资源。

## 推荐：平台 API `platform/sprite2d`

```ts
import {
  loadImage,
  loadImages,
  drawSpriteImage,
  loadUniformSpriteSheet,
  UniformSpriteSheet,
  loadSpriteAtlas,
  SpriteAnimator,
} from '../platform/sprite2d'
```

### 1. 单图（植物 / 僵尸）

在 `onInit`（或 `loadXxxAssets`）里预加载：

```ts
const ASSET_ROOT = '/assets/myGame'
const hero = await loadImage(`${ASSET_ROOT}/sprites/hero.png`)
```

在 `onRender` / `drawFrame`：

```ts
if (!drawSpriteImage(ctx, hero, x, y, 64, 64)) {
  // emoji / 圆形回退
}
```

### 2. 均匀精灵表（行走、受击）

图：总宽 = `列数 × 单帧宽`，总高 = `行数 × 单帧高`。

```ts
const sheet = await loadUniformSpriteSheet(
  `${ASSET_ROOT}/sprites/zombie_walk.png`,
  4, // 4 列
  1,
)
// 绘制第 2 帧
sheet?.draw(ctx, 1, cx, cy, 72, 90, { flipX: movingLeft })
```

等价于 beatDragon 手写：

```ts
const fw = sheet.width / 2
ctx.drawImage(sheet, frame * fw, 0, fw, sheet.height, x, y, w, h)
```

### 3. 帧动画

```ts
const walk = new SpriteAnimator({
  frames: [0, 1, 2, 3],
  frameDuration: 0.12,
  loop: true,
})

// onUpdate(dt)
walk.advance(dt)

// onRender
sheet?.draw(ctx, walk.currentUniformFrame, cx, cy, dw, dh)
```

### 4. JSON 图集（手工格式）

`public/assets/myGame/atlas/player.json`：

```json
{
  "image": "player.png",
  "frames": {
    "idle_0": { "x": 0, "y": 0, "w": 32, "h": 32 },
    "walk_0": { "x": 32, "y": 0, "w": 32, "h": 32 }
  }
}
```

```ts
const atlas = await loadSpriteAtlas('/assets/myGame/atlas/player.json')
atlas?.draw(ctx, 'walk_0', cx, cy, 48, 48)
```

TexturePacker 等工具若导出格式不同，可在游戏目录写一层 `parseTexturePackerJson` 转成 `SpriteRect` 再 `new SpriteAtlas(img, frames)`。

## 与 GameLifecycle 结合

```ts
return hostCanvas2D(ctx, {
  async onInit() {
    assets = await loadMyAssets()
    anim = new SpriteAnimator({ frames: [0, 1, 2, 3], frameDuration: 0.1 })
  },
  onUpdate(dt) {
    anim.advance(dt)
    // 逻辑...
  },
  onRender() {
    sheet?.draw(ctx, anim.currentUniformFrame, player.x, player.y, 64, 64)
  },
  onDestroy() {
  },
})
```

**不要**在玩法里自开 `requestAnimationFrame`；资源在 `onInit` 里 `await` 完成后再开局。

## 3D / Babylon 游戏

精灵表不经过 `sprite2d`：用 `Texture` + UV 或精灵材质，见 `happyDefense/render/assets.ts`。2D Canvas 游戏统一用本文与 `sprite2d`。

## 目录约定（建议）

```
public/assets/<gameId>/
  backgrounds/
  sprites/          # 单图或 *_sheet.png
  ui/
  atlas/            # 可选 *.json + 大图
```

## 相关文件

- [sprite2d.ts](../src/platform/sprite2d.ts)
- [plantZombieDefense2d/render/assets.ts](../src/games/plantZombieDefense2d/render/assets.ts)
- [beatDragon/render/draw.ts](../src/games/beatDragon/render/draw.ts)
- [FRAMEWORK_MIGRATE_TEMPLATE.md](./FRAMEWORK_MIGRATE_TEMPLATE.md)