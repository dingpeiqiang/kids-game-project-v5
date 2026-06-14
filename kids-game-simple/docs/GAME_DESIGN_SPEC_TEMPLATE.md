# 新游戏策划交付模板（GPTS v1）

> **用途**：策划/产品填写本模板后，AI 或研发应能**一次性**产出可接入「星光游学」平台、支持 **GTRS 换肤**、可上架的完整游戏。  
> **禁止**：只写玩法散文、不写 `gameId`、不写资源槽位、不写结束条件与计分规则（历史失败主因）。

---

## 0. 文档元信息（必填）

| 字段 | 填写 | 校验规则 |
|------|------|----------|
| 文档版本 | `v1.0.0` | 语义化版本 |
| 游戏 `gameId` | `camelCase`，如 `skyFrenzy` | 全局唯一，与代码目录名一致 |
| 游戏中文名 | | ≤8 字为佳 |
| 策划负责人 | | |
| 目标上线日期 | | |
| 参考对标 | 游戏名 + 借鉴点（≤3 条） | 避免侵权表述 |
| 变更记录 | 日期 / 版本 / 摘要 | |

```yaml
# 机器可读摘要（AI 优先解析此块）
gameId: yourGameId
name: 游戏中文名
type: 2d          # 2d | 3d
category: logic   # 见 types/index.ts GameCategory
orientation: portrait  # portrait | landscape | auto
engine: canvas    # canvas | phaser | three | hybrid
minPlaySeconds: 30
maxPlaySeconds: 600
```

---

## 1. 一句话与上架定位（必填）

### 1.1 电梯演讲（≤40 字）

示例：竖屏滑动走位，自动射击分段巨龙，拾取 buff 闯关解压。

### 1.2 平台卡片信息（直接映射 `Game` + `GAME_DISPLAY_CONFIG`）

| 字段 | 内容 | 平台字段 |
|------|------|----------|
| 副标题 `desc` | ≤50 字 | `game.desc` |
| 标签 `tag` | 2~4 字 | `game.tag` |
| 主题色 | 两个 HEX，逗号分隔 | `game.color` 如 `#FF6B6B,#FF8E53` |
| 能力维度 | 10 选 1 | `game.category`：`logic` `memory` `attention` `reaction` `coordination` `spatial` `strategy` `creativity` `problemSolving` `patience` |
| 首页展示 | 是/否、排序、角标 | `GAME_DISPLAY_CONFIG`: `visible` `order` `badge`（热门/推荐/新） |
| 预览 key | 与 `game.preview` 一致 | 用于后续扩展预览动画 |

### 1.3 儿童与安全

- [ ] 无恐怖血腥、无赌博机制、无外链诱导  
- [ ] 单局时长上限：____ 秒（建议 60~180）  
- [ ] 失败惩罚温和（可重试、无扣费）

---

## 2. 核心循环（必填，可验收）

用 **When → Player → System → Feedback** 写清主循环，至少 3 轮。

```
触发 → 玩家操作 → 系统判定 → 反馈（视听+分数）→ 下一状态
```

### 2.1 状态机（必填表）

| 状态 ID | 名称 | 进入条件 | 退出条件 | 允许的操作 |
|---------|------|----------|----------|------------|
| `BOOT` | 加载 | 进入游戏 | 资源就绪 | 无 |
| `GUIDE` | 引导 | 平台壳层 | 用户点开始 | 无（平台） |
| `PLAY` | 进行中 | 开始 | 胜/负/超时 | 见操作表 |
| `PAUSE` | 暂停 | 壳层暂停 | 恢复 | 无 |
| `END` | 结束 | 终局条件 | 回调 `onEnd` | 无 |

### 2.2 胜负与终局（必填，对应 `engine.end` / `onEnd`）

| 类型 | 条件 | 结算 |
|------|------|------|
| 胜利 | 例：通关第 N 关 / 分数 ≥ X | `setVictory(true)` + 最终分 |
| 失败 | 例：生命为 0 / 超时 | 最终分 |
| 平局/无尽 | 仅最高分模式 | 退出时上报分 |

**计分公式（必填）**：

```
baseScore = ...
comboMultiplier = ...
finalScore = floor(baseScore * comboMultiplier * buffMult)
```

是否与平台连击/Buff 联动：`是/否`（若是，列出触发 `engine.addScore` 的事件）

### 2.3 难度曲线

| 阶段 | 时间或关卡 | 参数变化 |
|------|------------|----------|
| 前期 | | |
| 中期 | | |
| 后期 | | |

---

## 3. 操作与输入（必填）

### 3.1 操作表（映射 `GameGuide.ops`）

| 图标 emoji | 说明（可用 `<b>高亮</b>`） | PC | 触屏 |
|------------|---------------------------|-----|------|
| 👆 | | 鼠标/键位 | 手势 |

### 3.2 布局（映射 `gameLayout`）

| 项 | 值 |
|----|-----|
| 设计分辨率 `designWidth` × `designHeight` | |
| `orientation` | portrait / landscape / auto |
| `externalCanvas` | 是否自管画布（Phaser/Three） |
| `forceLandscapeOnMobile` | 横屏游戏填 true |

### 3.3 音效清单（映射 GTRS `audio`）

| 槽位名 `alias` | 触发时机 | 默认占位 |
|----------------|----------|----------|

---

## 4. GTRS 资源规范（必填，换肤核心）

> 规范版本：**GTRS v1.0.0**（`specMeta.specName === 'GTRS'`）  
> 运行时：`prepareGameTheme(gameId)` → `loadThemeGTRS` → `GTRSThemeApplier`  
> Phaser 纹理 key：`gtrs_{gameId}_{category}_{name}`（见 `getPhaserTextureKey`）

### 4.1 原则

1. **代码只认槽位名（alias/key），不写死 CDN 路径**  
2. 图片放 `resources.images` 五类：`login` `scene` `ui` `icon` `effect`  
3. 无图时：`globalStyle` + `scene` 内 **元数据槽**（值为 `#RRGGBB` 或 JSON 颜色数组）  
4. 默认主题文件路径（本地）：`public/themes/{gameId}_theme_default.json`  
5. 后端主题：`config_json` 整包 GTRS，与前端类型对齐（`types/gtrs-theme.ts`）

### 4.2 本游戏资源槽位表（策划必须列全）

#### 4.2.1 `globalStyle`（必填）

| 字段 | 用途 | 默认值 |
|------|------|--------|
| primaryColor | 主色、按钮、玩家 | |
| secondaryColor | 辅色 | |
| bgColor | 背景 | |
| textColor | HUD 文字 | |
| fontFamily | 可选 | Arial, sans-serif |

#### 4.2.2 `images.scene`（按游戏填写）

| 槽位 key | alias | 类型 | 说明 | 尺寸建议 |
|----------|-------|------|------|----------|
| `player` | player | png | 玩家精灵 | |
| `enemy_01` | enemy_01 | png | | |
| `bg_main` | bg_main | jpg/webp | 背景 | |
| `food_colors` | food_colors | **元数据** | `src` 为 JSON 数组字符串 `["#FF6B6B",...]` | |
| `snake_body` | snake_body | **元数据** | 填 HEX，供 Canvas 调色 | |

> **元数据槽**：`ImageResource.src` 不是 URL 而是 `#hex` 或 `[...]` 时，供 `paletteFromGTRS` / `readSceneMeta` 读取。

#### 4.2.3 `images.ui` / `icon` / `effect`

（按 UI 按钮、道具图标、粒子/特效拆分列出）

#### 4.2.4 `audio`

| 分类 | key | volume | 说明 |
|------|-----|--------|------|
| bgm | main | 0.6 | 循环背景音乐 |
| effect | hit | 1.0 | 击中 |

### 4.3 主题 JSON 最小示例（复制后改 gameId 与槽位）

```json
{
  "specMeta": {
    "specName": "GTRS",
    "specVersion": "1.0.0",
    "compatibleVersion": "1.0.0"
  },
  "themeInfo": {
    "themeId": "yourGameId_theme_default",
    "ownerType": "GAME",
    "ownerId": 0,
    "themeName": "默认主题",
    "isDefault": true,
    "gameId": "yourGameId"
  },
  "globalStyle": {
    "primaryColor": "#4CAF50",
    "secondaryColor": "#6BCB77",
    "bgColor": "#1a1a2e",
    "textColor": "#ffffff"
  },
  "resources": {
    "images": {
      "login": {},
      "scene": {
        "player": { "src": "/themes/yourGameId/player.png", "type": "png", "alias": "player" }
      },
      "ui": {},
      "icon": {},
      "effect": {}
    },
    "audio": {
      "bgm": { "main": { "src": "/themes/yourGameId/bgm.mp3", "type": "mp3", "volume": 0.6, "alias": "main" } },
      "effect": {},
      "voice": {}
    },
    "video": {}
  }
}
```

### 4.4 换肤验收

- [ ] 仅替换 JSON + 静态资源，**不改代码**即可换主题  
- [ ] 缺图时游戏仍可玩（降级到 `globalStyle` / 内置 fallback）  
- [ ] 启动日志无 GTRS 阻断；`prepareGameTheme` 失败不崩溃

---

## 5. 平台接入清单（研发/AI 必填勾选）

### 5.1 `GameRegistry` 注册项

```ts
// 结构见 src/games/GameRegistry.ts → GameRegistration
{
  game: { id, name, desc, type, category, tag, color, players, best: 0, preview },
  guide: { icon, name, desc, ops, tipsTitle, tips, bg },
  init: async (engine, onEnd) => { ... },
  destroy?: () => { ... },  // 3D/WebGL 必填
  isSpecial?: boolean,      // 复杂全屏交互
  setup?: ...               // 少用，优先 gameLayout
}
```

### 5.2 `gameLayout.ts` 覆盖（若非常规竖屏）

在 `LAYOUT_OVERRIDES` 增加 `{ gameId: { designWidth, designHeight, orientation, ... } }`

### 5.3 引擎契约

| 项 | 要求 |
|----|------|
| Canvas ID | 默认 `mainGameCanvas`（`externalCanvas` 除外） |
| 分数 | 通过 `GameEngine.addScore` / 结束传最终分 |
| 暂停 | 尊重 `engine.paused` |
| 横竖屏 | `engine.setOrientation` / `getGameLayoutConfig` |
| 主题 | 开局 `getCanvasPaletteForGame(gameId)` 或 GTRS 纹理加载 |
| 清理 | `destroy` 释放 WebGL、定时器、全局监听 |

### 5.4 后端（若需排行榜/评论）

| 项 | 说明 |
|----|------|
| `gameId` 字符串 | 与前端一致 |
| 排行榜 | `convertGameIdToNumber` 映射（新游戏需登记） |

---

## 6. 引导与运营文案（必填）

映射 `GameGuide`：

| 字段 | 内容 |
|------|------|
| icon | 单 emoji |
| tipsTitle | 如「💡 小技巧」 |
| tips | ≤200 字，可 `\n` 换行 |
| bg | 与主色一致的 HEX |

---

## 7. 上架验收标准（全部通过才可合并）

### 7.1 功能

- [ ] 从大厅进入 → 引导 → 开局 → 终局 → 结果页分数正确  
- [ ] 再来一局 / 返回大厅无报错  
- [ ] 3D 游戏往返大厅无 WebGL 泄漏（`destroy`）  
- [ ] 移动端触屏与 PC 键鼠可玩  
- [ ] 横屏游戏有旋转提示或强制横屏策略  

### 7.2 GTRS

- [ ] 存在 `public/themes/{gameId}_theme_default.json` 或 API 默认主题  
- [ ] 代码内无硬编码外部图片 URL（除主题 JSON）  
- [ ] 替换主题后主要视觉变化可见  

### 7.3 性能与体验

- [ ] 首帧可交互 &lt; 3s（中端机）  
- [ ] 对局 FPS 稳定（2D ≥ 50，3D ≥ 30）  
- [ ] 无控制台 Error（Warn 需说明）  

### 7.4 平台数据

- [ ] `GAME_DISPLAY_CONFIG` 已配置  
- [ ] `players` 展示值合理（可 0，后期运营改）  

---

## 8. 附录：策划常见反模式（禁止）

| 反模式 | 后果 |
|--------|------|
| 只描述「好玩」无状态机 | AI 无法实现终局 |
| 资源散落在代码里 | 无法 GTRS 换肤 |
| gameId 与文件夹不一致 | 注册/主题加载失败 |
| 计分规则模糊 | 排行榜与结果页争议 |
| 横屏游戏未写 layout | 画布拉伸、操作区错位 |
| 3D 无 destroy | 返回大厅黑屏/卡顿 |

---

**填写完成后**，将本文档路径与 `gameId` 一并交给研发；AI 实施时请同时阅读 [GPTS_GAME_DEV_SPEC.md](./GPTS_GAME_DEV_SPEC.md)。