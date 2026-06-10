# 游戏开发规范（与 GDD 策划文档配套）

> **用途**：程序、美术生产、工程验收；**不替代** [GDD-AI-ASSET-TEMPLATE.md](GDD-AI-ASSET-TEMPLATE.md) v3 中的 **§4 配置蓝图、§5 事件、§9 商务验收**。  
> **平台默认**：Android WebView · 儿童向 · `public/assets/<gameId>/` 单包建议 ≤ 5MB。  
> **上线门槛**：策划 GDD 标注 **P0 定稿 v1.0** 且 §9 全勾，方可合入发布分支。

---

## 1. 渲染类型与可跳过章节

| 类型 | `gameRegistry.type` | 主要资产 | 策划 GDD 侧重 |
|------|---------------------|----------|---------------|
| **2D** | `2d` | 精灵、UI、背景、音效 | §5.2 2D master、§6 视觉表 |
| **3D** | `3d` | GLB、贴图、UI、音效 | §5.2 3D master、Blender 可选 |
| **混合** | 以主玩法为准 | 两套资产目录 | 两套 §6 |

仓库内 2D 占多数；3D 参考 `happyDefense`、`cloudBallRush3d`。

---

## 2. `gameRegistry` 字段（对齐大厅）

| 字段 | 说明 |
|------|------|
| `id` | 小驼峰，与 `gameId`、目录名一致 |
| `name` | 中文名 |
| `desc` | 列表简介 ≤ 40 字（策划 §8） |
| `type` | `2d` / `3d` |
| `category` | coordination / strategy / … |
| `tag` | 标签二字 |
| `color` | 两色渐变，如 `#6BCB77,#FFD93D` |
| `preview` | 通常同 `id` |
| `guide.tipsTitle` | |
| `guide.tips` | 策划 §8 |
| `guide.ops` | 操作说明（emoji + 文案，可对齐 GDD §4.2） |
| `guide.bg` | 引导页背景 hex |

横竖屏对齐 `engine.setOrientation`：`landscape` / `portrait`。

---

## 3. 程序对照：坐标与碰撞（2D 必填）

| 项 | 约定 |
|----|------|
| 逻辑分辨率 | 设计稿或满屏缩放 |
| 主画布 | 全屏 Canvas / 固定比例留边 |
| 实体尺寸 | 单格 px、角色宽高 |
| 碰撞 | AABB / 圆半径 / 透明通道（是否用） |
| 滚动 | 无 / 横卷轴 / 纵卷轴 |

**实体表现与资源**：

| kind | 表现 | 资源 |
|------|------|------|
| | 色块 + emoji | 程序 |
| | 单张 PNG | `sprites/xxx.png` |
| | 精灵表 | `sprites/xxx_sheet.png` + 帧表 |

**精灵表帧定义（写在 GDD §6 备注）**：

```text
sheet: sprites/mole_sheet.png  frame: 64x64  count: 4  fps: 8  labels: idle,hit,pop,hide
```

---

## 4. 程序对照：3D 比例

| 类型 | 占地（世界单位） | 高度 | 朝向 |
|------|------------------|------|------|
| 可放置单位 | 0.9 × 0.9 | 0.6～1.2 | 正面或 3/4 |
| 敌人 | 0.7 直径 | 0.5～0.9 | 朝镜头 |
| 基地 | 1.0 × 1.0 | 0.8～1.5 | |

**3D 地图**：`cellSize` 默认 **1.35**；地图编码 `0=` `1=` … 见 `happyDefense` `MAP_LAYOUT`。

---

## 5. 像素与格式（2D 生产）

| 类型 | 尺寸 px | 格式 |
|------|---------|------|
| 方块/棋子 | 64～128 | PNG 透明 |
| 角色/敌人 | 128～256 高 | PNG 透明 |
| 道具/子弹 | 32～64 | PNG 透明 |
| UI 图标 | 64 / 128 | PNG 透明 |
| 全屏背景 | 1280×720 或 720×1280 | WebP/JPG |
| 精灵表总宽 | ≤ 2048 | PNG 横排等宽帧 |

**3D**：贴图单张 ≤ 512²；塔 GLB ≤2500 三角、怪 ≤1200（可按游戏收紧）。

---

## 6. 资产目录与 Prompt 模板

**根目录**：`kids-game-simple/public/assets/<gameId>/`

```
sprites/ backgrounds/ ui/ audio/     # 2D 常见
models/ textures/                      # 3D 常见
LICENSES-<gameId>.txt
README.md
```

**单物体 Prompt（替换括号）**：

```text
[GDD §5.2 master EN],
[物体英文描述], front view, single object, game asset
```

**负面提示词（通用，按需追加）**：

```text
realistic gore, blood, horror, zombie, weapon gun, military,
logo, text, watermark, blurry, messy topology, multiple objects,
dark gritty, NSFW
```

---

## 7. 占位策略（素材缺失仍可玩）

| 资产 | 占位 |
|------|------|
| 2D 精灵 | Canvas 圆角矩形 + 配置主色 + emoji |
| 2D 背景 | 渐变 + `game.color` |
| GLB | 程序几何体 + `color` |
| 贴图 | 纯色材质 |
| 音频 | 静音或 Web Audio 短哔 |

策划在 GDD §6.3 标明是否接受占位。

---

## 8. AI 生产流水线（人工 checklist）

| 步骤 | 产出 |
|------|------|
| 1 | 策划 GDD §1～§8 定稿，锁定 §5 风格 |
| 2 | 按 §6 逐文件生成，留生成截图 |
| 3a | **3D**：Blender 清理或 AI 直出 GLB |
| 3b | **2D**：去底、统一尺寸、压 WebP、切精灵表 |
| 4 | 放入 `public/assets/<gameId>/`，命名与 GDD §6 一致 |
| 5 | `LICENSES-<gameId>.txt` |
| 6 | **2D**：`game.ts` `loadImage` 对齐路径；**3D**：`render/models.ts` |

---

## 9. LICENSE 条目格式

```text
asset: sprites/hero.png
tool: Flux 2026-06-10
prompt: (GDD §6 该行完整 prompt)
human_edit: 去底 / 压 webp / 无
license_note: 平台 ToS；儿童向已人工审核
```

---

## 10. 素材验收标准

| 项 | 标准 |
|----|------|
| 风格 | 与 GDD §5 一致，无写实恐怖 |
| 2D | 透明底干净、小图可读 |
| 3D 面数 | 不超过 §5 生产表上限 |
| 命名 | 小写蛇形，与 §6 完全一致 |
| 缺失 | 删文件后仍可玩（占位） |
| 包体 | 目录合计建议 ≤ 5MB |

---

## 11. 新游戏最小工程目录

```
kids-game-simple/
  docs/<gameId>-GDD.md
  docs/<gameId>-BLENDER.md          # 可选，3D
  public/assets/<gameId>/
  src/games/<gameId>/
    index.ts, game.ts, config.ts, types.ts
    logic/, render/, input.ts
```

`config.ts` / `types.ts` 数值以策划 GDD **§4** 为准。

---

*规范版本：v1.0 · 配套 GDD 模板 v2.0*