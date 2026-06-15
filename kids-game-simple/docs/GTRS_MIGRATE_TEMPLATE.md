# Canvas 游戏 GTRS v1.0.0 逐步适配模板

> 全游戏在 `initGame` 时都会 **加载** GTRS（`prepareGameTheme` → `loadThemeGTRS`），并可能刷新壳层 CSS 变量。  
> **适配** 指玩法不再写死颜色/贴图路径，而是从缓存主题读取。

权威类型：[gtrs-theme.ts](../src/types/gtrs-theme.ts)  
加载器：[gtrsThemeLoader.ts](../src/services/gtrsThemeLoader.ts)  
进度列表：[registerGtrsCanvasGames.ts](../src/games/registerGtrsCanvasGames.ts)

## 阶段说明

| 阶段 | 范围 | 动作 |
|------|------|------|
| L0 | 全部 | 已由 `gameRegistry.initGame` 完成加载 + `applyCachedThemeToDocument` |
| L1 | 竖屏 Canvas | `resolveGtrsCanvasStyle` + `public/themes/{id}/gtrs.json` |
| L2 | 专用玩法色 | 扩展 `scene` 约定 key 或 `paletteFromGTRS`（参考 snake） |
| L3 | 贴图/音频 | `resolveGTRSResourceUrl` / `loadImage` + `resources.images` |
| L4 | Phaser/Babylon | `getPhaserTextureKey` + 引擎内 preload |

## 1. 添加 `public/themes/{gameId}/gtrs.json`

最小结构：

```json
{
  "specMeta": { "specName": "GTRS", "specVersion": "1.0.0", "compatibleVersion": "1.0.0" },
  "themeInfo": {
    "themeId": "colorTap_theme_default",
    "ownerType": "GAME",
    "ownerId": 0,
    "themeName": "默认",
    "isDefault": true,
    "gameId": "colorTap"
  },
  "globalStyle": {
    "primaryColor": "#6BCB77",
    "bgColor": "#1a1a2e",
    "textColor": "#FFFFFF"
  },
  "resources": {
    "images": {
      "login": {},
      "scene": {
        "accent": { "src": "#FFD700", "type": "png", "alias": "强调色" },
        "hud_bg": { "src": "rgba(0,0,0,0.45)", "type": "png", "alias": "HUD 底" },
        "danger": { "src": "#FF4444", "type": "png", "alias": "倒计时警告" },
        "game_palette": {
          "src": "[\"#FF6B6B\",\"#4ECDC4\",\"#FFD93D\",\"#6BCB77\",\"#9B59B6\",\"#FF9F43\"]",
          "type": "png",
          "alias": "按钮色板"
        }
      },
      "ui": {},
      "icon": {},
      "effect": {}
    },
    "audio": { "bgm": {}, "effect": {}, "voice": {} },
    "video": {}
  }
}
```

`scene.*.src` 可为 `#hex`、`rgba(...)`、或 **JSON 数组字符串**（见 `readGtrsSceneList`）。

## 2. 玩法 `onInit` 解析样式

```ts
import { resolveGtrsCanvasStyle } from '../utils/gtrsCanvasTheme'

// onInit 内：
const gtrs = resolveGtrsCanvasStyle('colorTap')
const COLORS = ['红', '蓝', '黄', '绿', '紫', '橙'].map((name, i) => ({
  name,
  hex: gtrs.palette[i % gtrs.palette.length],
  emoji: '…',
}))
```

绘制时用 `gtrs.background`、`gtrs.text`、`gtrs.accent`、`gtrs.hudBg`、`gtrs.danger`，勿写死 `#1a1a2e`。

## 3. 贪吃蛇类专用调色板

```ts
import { getCanvasPaletteForGame } from '../utils/GTRSThemeApplier'
const palette = getCanvasPaletteForGame('snake')
```

约定 key：`snake_head_light`、`food_palette` 等（见 [snake/gtrs.json](../public/themes/snake/gtrs.json)）。

## 4. 贴图（L3）

```ts
import { resolveGTRSResourceUrl } from '../services/gtrsThemeLoader'
import { loadImage } from '../platform/sprite2d'

const url = resolveGTRSResourceUrl('beatDragon', 'scene', 'dragon_body')
const img = url ? await loadImage(url) : null
```

## 5. 完成后登记

将 `gameId` 加入 `GTRS_CANVAS_ADAPTED_GAME_IDS`（[registerGtrsCanvasGames.ts](../src/games/registerGtrsCanvasGames.ts)）。

## 禁止 / 推荐

| 避免 | 推荐 |
|------|------|
| 玩法里 `fetch` 主题 API | 依赖 `initGame` 已写入的 `themeCache` |
| 无 `gtrs.json` 仍假设有自定义色 | `resolveGtrsCanvasStyle` 自带 fallback |
| 与 GameLifecycle 混为一谈 | GTRS 只换肤；循环仍用 `gameActions` / `runCanvasLifecycle` |

## 建议排期（P0 竖屏简单）

`pop` → `dodge` → `whackMole` → `starCatcher` → `bouncePath` → `memoryMatch` → …