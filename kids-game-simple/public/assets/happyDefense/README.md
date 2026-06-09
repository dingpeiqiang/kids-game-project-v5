# 欢乐防线 · AI + Blender 素材（Android WebView）

主流程见 **[docs/happyDefense-BLENDER.md](../../docs/happyDefense-BLENDER.md)**。

## 目录

```
models/          # Blender 导出 GLB（AI 粗模修整后）
  tower_popcorn.glb … tower_pierce.glb
  enemy_grunt.glb … enemy_boss.glb
  base.glb
textures/        # 可选：AI 无缝地面 WebP 512
  grass.webp, path.webp, rock.webp
ui/              # 可选：AI 图标 PNG 透明底
audio/           # 可选
```

## 规则

- **无 GLB** → 游戏用程序几何体，可正常玩。
- **有 GLB** → `render/models.ts` 加载并 **Clone** 实例（WebView 友好）。
- 移动端：**关阴影**、纹理 **512**、模型包建议 **≤ 5MB**。

## 版权

AI 生成记录 + Blender 修改说明写入 `LICENSES-happyDefense.txt`。