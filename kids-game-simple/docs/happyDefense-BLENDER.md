# 欢乐防线 · AI + Blender 资产规范（Android WebView）

## 工作流总览

```
AI 文/图生 3D（粗模） → Blender 清理 → 统一比例/材质 → 导出 GLB
→ public/assets/happyDefense/models/*.glb → 游戏自动加载（缺失则几何体占位）
```

## AI 出模（粗模即可）

| 工具 | 用途 |
|------|------|
| Meshy / Tripo / Rodin 等 | 单物体塔、小怪、基地，prompt 固定风格 |

**Prompt 模板（复制改物体名）**：

```text
cute chibi low poly tower defense game asset, [popcorn cannon tower],
single object, centered, soft pastel colors, no background,
stylized mobile game, friendly kids game, clean topology hint
```

敌人示例：`round fluffy slime monster, low poly, front view, game ready`

**注意**：保留生成记录（截图 + 日期）便于版权说明；儿童向避免血腥恐怖。

## Blender 清理清单（每个资产）

1. **导入** AI 的 glTF/FBX/OBJ  
2. **Apply** 缩放旋转（Ctrl+A → All Transforms）  
3. **原点**：脚底中心 → 物体原点 → 几何中心到格心  
4. **减面**：塔 **≤ 2500** 三角，小怪 **≤ 1200**，BOSS **≤ 4000**，基地 **≤ 3000**  
5. **材质**：合并为 **1 个 Principled BSDF**；烘焙或一张 **512×512** diffuse（Android 友好）  
6. **命名**：根节点与文件名一致，如 `tower_popcorn`  

## 世界比例（与代码对齐）

- 1 格 = `cellSize` **1.35** 世界单位  
- **塔**：占地约 **0.9×0.9**，高度 **0.6～1.2**（升级靠代码 `scaling.y`）  
- **小怪**：直径约 **0.5～0.7**；坦克 **~0.75**；BOSS **~1.0**  
- **基地**：约 **1.0×1.0**，高 **0.8**  

导出前在 Blender 里放 **1.35m 参考平面** 对齐占地。

## 导出 GLB（glTF 2.0）

| 选项 | 值 |
|------|-----|
| Format | glTF Binary (.glb) |
| Include | Selected Objects |
| Transform | +Y Up（Babylon 默认） |
| Geometry | Apply Modifiers, UVs, Normals |
| Compression | 可选 Draco（需 Babylon Draco 解码器；默认 **不压缩** 更简单） |

**不要**：动画（塔/怪用代码位移）、多材质超过 2 张、4K 贴图。

## 文件命名 → 放入目录

```
public/assets/happyDefense/models/
  tower_popcorn.glb
  tower_bubble.glb
  tower_lightning.glb
  tower_pierce.glb
  enemy_grunt.glb
  enemy_flyer.glb
  enemy_tank.glb
  enemy_boss.glb
  base.glb
```

地面仍可用 AI 生成 **无缝贴图**（2D）→ `textures/grass.webp`、`path.webp`（见 README）。

## Android WebView 预算

- 模型包合计建议 **≤ 5MB**（Draco 可更小）  
- 同屏实例：塔 + 怪 **≤ 50**；共享 **模板 Clone**，不重复 Import  
- 移动端：**无阴影**（代码已关）；纹理 **512** 为主  

## 2D HUD（可选）

AI 出 **图标**（透明 PNG 512）→ `ui/tower_popcorn.png` 等，在 Blender 之外用去底工具处理。