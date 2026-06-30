# Legacy 原生大厅（已停用）

`App.ts` 为 **Vue 路由接入前** 的纯 DOM 大厅 + 游戏层实现，当前终端入口为 `main.ts` → `App.vue` → `router`。

内置 Canvas 游戏已迁移至：

- `@simple/components/CanvasGamePlay.vue`
- `@simple/services/canvasGameRuntime.ts`
- `@simple/views/GamePlayHost.vue`

保留本文件仅供对照 `startGame` / 引导 / 排行榜逻辑；**勿再作为入口引用**。