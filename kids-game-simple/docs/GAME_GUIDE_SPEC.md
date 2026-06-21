# 游戏玩法介绍（统一框架）

玩法介绍不再写在 `gameRegistry.ts` 中，由各游戏目录自行维护，平台壳层统一展示。

## 目录约定

每个已注册游戏在开发目录下提供：

```
src/games/<gameId>/guide.ts          # 必选：导出 guide 数据
src/games/<gameId>/GuidePage.vue     # 可选：自定义介绍页内容区
```

注册表 id 与文件夹不一致时（如 `sort` → `colorSort`），以 `platform/gameGuide/gameGuideRegistry.ts` 中的 `GAME_GUIDE_LOADERS` 为准。

## guide.ts

```ts
import type { GameGuide } from '../../types'

export const guide: GameGuide = {
  icon: '🎯',
  name: '游戏名',
  desc: '一句话玩法说明',
  ops: [{ icon: '👆', text: '<b>点击</b>操作说明' }],
  tipsTitle: '💡 小技巧',
  tips: '支持换行的提示文案',
  bg: '#4D96FF',
}
```

## 可选自定义组件

```ts
import type { GameGuideModule } from '../../platform/gameGuide/types'
import GuidePage from './GuidePage.vue'

export const guide: GameGuide = { /* ... */ }
export const GuidePage = GuidePage

export default { guide, GuidePage } satisfies GameGuideModule
```

`GuidePage` 接收与默认面板相同的 props：`guide`、`accent`（主题色）。外壳（遮罩、跳过勾选、「开始游戏」按钮）由 `GameGuideShell` 统一提供。

## 平台 API

| 方法 | 说明 |
|------|------|
| `hasGameGuide(gameId)` | 是否已注册引导模块 |
| `loadGameGuide(gameId)` | 懒加载 `GameGuide` 数据，并自动追加 `getCombinedControlGuideHint`（见 `mergeGuideWithControlHint`） |
| `loadGameGuideModule(gameId)` | 加载完整模块（含可选 `GuidePage`） |

## 接入点

- **路由游玩壳**：`CanvasGamePlay.vue` → `GameGuideOverlay` → `GameGuideShell`
- **首页壳**：`gameSession.ts` 的 `showGameGuide` 异步加载后填充 `#guide-overlay` DOM

新增游戏时：编写 `guide.ts`，并在 `GAME_GUIDE_LOADERS` 增加一行动态 `import`。

维护脚本（从 git 恢复 registry 并重新提取）：`node scripts/restore-and-extract-guides.mjs`