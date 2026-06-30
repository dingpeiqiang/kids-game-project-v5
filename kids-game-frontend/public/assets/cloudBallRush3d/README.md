# 云端滚球大冒险 · 美术素材（低多边形马卡龙治愈 3D）

**锁定主风格**：低面数几何体、马卡龙柔光配色、无写实 PBR、无暗黑质感；模型 / 场景 / 特效 / UI 统一卡通治愈调性。

## 目录

```
models/          # Blender 导出 GLB（低模，建议单文件 ≤ 512KB）
textures/        # 主题地块 WebP 512（可选）
ui/              # 圆角 UI、星级徽章、模式图标 PNG
audio/           # BGM + SFX（见 manifest.json）
fx/              # 星光粒子、拖尾、导航指引（可选序列帧/WebP）
```

## 规则

- **无外部文件** → `render/scene.ts` 程序几何体 + `render/style.ts` 配色，可完整游玩。
- **有 GLB/贴图** → `render/assets.ts` HEAD 探测后加载，缺失项自动回退。
- 移动端：关阴影、纹理 **512**、音频 **OGG/MP3** 二选一、总包建议 **≤ 8MB**。

## 视觉素材清单（22 项）

| # | 资产 ID | 说明 | 建议路径 |
|---|---------|------|----------|
| 1 | `ball_base` | 基础白色原生滚球 | `models/ball_base.glb` |
| 2–4 | `skin_macaron_*` | 马卡龙纯色皮肤 ×3 | `textures/skin_macaron_*.webp` 或材质色 |
| 5–6 | `skin_nebula_*` | 星云流光皮肤 ×2 | `textures/skin_nebula_*.webp` |
| 7 | `track_meadow` | 青空草甸赛道地块 | `textures/track_meadow.webp` |
| 8 | `track_cloud` | 云端浮空平台组 | `models/track_cloud_set.glb` |
| 9 | `track_ice` | 冰雪琉璃冰面 | `textures/track_ice.webp` |
| 10 | `track_star` | 星穹夜景基底 | `textures/track_star.webp` |
| 11 | `hazard_bounce` | 弹性弹跳跳板 | `models/bounce_pad.glb` |
| 12 | `hazard_barrier` | 往复滑动挡板 | `models/sliding_barrier.glb` |
| 13 | `hazard_slow` | 减速绵软地块 | `textures/slow_zone.webp` |
| 14 | `finish_flag` | 终点通关旗帜 | `models/finish_flag.glb` |
| 15–16 | `deco_grass_cloud` | 草丛、云朵装饰 | `models/deco_grass.glb`, `deco_cloud.glb` |
| 17 | `deco_star_rock` | 星空碎石装饰 | `models/deco_star_rock.glb` |
| 18 | `fx_star_collect` | 星光收集粒子 | `fx/star_sparkle.webp` |
| 19–21 | `pickup_*` | 护盾/冲刺/导航道具模型+特效 | `models/pickup_*.glb` |
| 22 | `fx_ball_trail` | 球体柔光拖尾 | 程序粒子或 `fx/trail.webp` |
| — | `fx_jump_flash` | 跳跃闪光 | `fx/jump_flash.webp` |
| — | `ui_kit` | 圆角 UI 组件 | `ui/` |
| — | `ui_star_badge` | 星级徽章 | `ui/star_badge.png` |
| — | `ui_mode_icons` | 休闲/竞速图标 | `ui/mode_casual.png`, `mode_compete.png` |

## 音效清单（16 项）

见 [`manifest.json`](./manifest.json) 中 `audio` 字段；文件名与 `render/audio.ts` 的 `SfxId` / `BgmId` 一致。

## 版权

第三方 / AI 生成素材记录写入 `LICENSES-cloudBallRush3d.txt`。