# 打了个龙 - 完整版 AI 素材游戏策划文档 GDD v0.1

> 用途：一份文档同时服务 策划定稿、程序开发、AI 批量出图/出模/出音。  
> 填写原则：凡是要进 `public/assets/beatDragon/` 的条目，必须在 §7 资产清单里有一行，且 文件名、风格、比例 与本文一致。  
> 平台默认：Android WebView · 儿童向 · 单包素材 ≤ 4.2MB（合规达标）。  
> 渲染：`type: '2d'` → Canvas 2D 小游戏绘制 + WebP 压缩。

## 文档信息

| 字段 | 填写 |
|------|------|
| 游戏中文名 | 打了个龙 |
| 游戏 ID（gameRegistry） | beatDragon |
| 渲染类型 | 2d |
| 文档版本 | v0.1 |
| 作者 / 日期 | 策划AI / 2026.06.10 |

## §5 大厅与注册信息

- **id**: beatDragon  
- **name**: 打了个龙  
- **desc**: 竖屏解压屠龙小游戏，滑动走位自动射击，闯关变强，治愈解压！  
- **type**: 2d · **category**: strategy · **tag**: 解压  

## 附录B：工程目录

```
kids-game-simple/
  docs/beatDragon-GDD.md
  public/assets/beatDragon/
    sprites/
    backgrounds/
    ui/
    audio/
    LICENSES-beatDragon.txt
  src/games/beatDragon/
    index.ts, game.ts, config.ts, types.ts
    logic/, render/, input.ts
```

完整策划正文见仓库策划交付版本；程序以 `config.ts` / `types.ts` 与 §7 资产路径为准。