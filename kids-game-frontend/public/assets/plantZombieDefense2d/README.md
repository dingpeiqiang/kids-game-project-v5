# plantZombieDefense2d 资产

策划路径与命名见 `docs/plantZombieDefense2d-GDD.md` §6。

## 目录

| 目录 | 说明 |
|------|------|
| `backgrounds/` | 关卡背景（逻辑 960×540） |
| `sprites/` | 植物 5 + 僵尸 4 |
| `ui/` | 阳光、卡框、小屋、血条、豌豆 |
| `audio/` | BGM + SFX（OGG，见 `audio/README.md`） |

## 生成占位图（P0）

无第三方依赖，纯 Node 输出 PNG：

```bash
cd kids-game-simple
node scripts/generate-pzd2d-assets.mjs
```

占位图为程序绘制卡通色块，**商用前请按 GDD §6.2 英文 Prompt 替换为正式美术/AI 出图**。背景当前为 PNG；可另存 `lawn_day.webp` 并在 manifest 中切换。

## manifest

`manifest.json` 与 `src/games/plantZombieDefense2d/render/assets.ts` 键名对齐。

## 许可

见 `LICENSES-plantZombieDefense2d.txt`。