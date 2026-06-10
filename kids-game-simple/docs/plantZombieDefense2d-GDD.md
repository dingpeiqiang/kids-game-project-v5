# 萌植防线 2D｜游戏策划文档

> **交付等级目标**：P0（商用合集）  
> **渲染**：`2d` · Canvas 横屏 · `gameId`：`plantZombieDefense2d`  
> **工具链**：[GDD-PLANNING-GUIDE.md](GDD-PLANNING-GUIDE.md) · [GDD-MARKET-REFERENCES.md](GDD-MARKET-REFERENCES.md) · 工程见 [GDD-DEV-STANDARDS.md](GDD-DEV-STANDARDS.md)

---

## 文档信息

| 字段 | 填写 |
|------|------|
| 游戏中文名 | 萌植防线 2D |
| `gameId` | plantZombieDefense2d |
| `type` | 2d |
| 文档版本 | v1.0（策划交付稿） |
| **交付等级目标** | P0 |
| 体验主标签 | 策略 / 解压 / 益智 |
| **主参考产品** | 植物大战僵尸类横屏塔防（微信小游戏玩法统称）；欢乐防线 / 单路径草坪塔防 |
| **抄机制 / 不抄** | **抄**：草坪格子放置、阳光经济、多路出兵、坚果挡路+射手输出、波次间隙喘息。**不抄**：原版 IP/角色名、僵王与复杂章节、内购与广告复活链、恐怖僵尸美术、5 分钟以上长局。 |
| **参考首局节奏** | 参考品约 12s 内第一次击杀 → 本作 **≤14s**；约 18s 第一波收尾 → 本作 **≤22s** |

---

## §0 使用本模板（策划引导摘要）

| 步骤 | 本章 | 状态 |
|------|------|------|
| 1 定锚 | §1 | ✓ |
| 2 数值骨架 | §4 | ✓ |
| 3 反馈清单 | §5 | ✓ |
| 4 首局剧本 | §3 | ✓ |
| 5 指标与资产 | §2、§6、§7、§8 | ✓ |

---

## §1 产品定义（可对外）

### 1.1 电梯演讲（≤ 28 字）

横屏种萌植收阳光，挡呆萌僵尸，守小屋冲星过关。

### 1.2 核心循环（写清频率）

| 秒数/波次 | 玩家在做什么 | 系统给什么反馈（event_id） |
|-----------|--------------|----------------------------|
| 0～10s | 点选向日葵格、点草坪放置、点飘落阳光 | `sun_collect`、`plant_place` |
| 10～30s | 补 1～2 株射手、观察首只僵尸进射程 | `pea_hit`、`zombie_hurt_light` |
| 30～60s | 第一波收尾、攒阳光、考虑坚果 | `zombie_kill`、`wave_banner` |
| 60s+ | 第 2～3 波加压、卖植换阵、守小屋血量 | `house_hurt`、`wave_clear` |

### 1.3 设计支柱（可测后果）

| # | 支柱 | 若违反，玩家会感到… | 如何保证 |
|---|------|---------------------|----------|
| 1 | 阳光经济一眼懂 | 不知道为何放不了植物 | 阳光数置顶大号数字；不足时按钮灰+轻提示音 `ui_invalid` |
| 2 | 失败原因=漏怪进小屋 | 冤死、乱 | 小屋血条+每漏 1 只固定扣血 25；失败文案仅「小屋被攻破」 |
| 3 | 儿童向解压收割 | 压迫、恐怖 | 僵尸呆萌击退、无血腥；击杀为中反馈，波清为重反馈 |

### 1.4 范围边界（本期 0 工时）

- 不做联机、排行榜、内购、抽奖、原版角色/关卡名复刻  
- 不做 3D、不做僵王多阶段 Boss（P1 可加「路障首领」单波强化）  
- 不做 6 行以上大地图、不做潜水/屋顶等多地形（P1）  
- 植物 **5 种**、僵尸 **4 种**、关卡 **15 关**（与现网平衡表同量级）

---

## §2 体验规格（验收指标）

### 2.1 吸引力

| 项 | 方案 | 验收指标 | 目标值 |
|----|------|----------|--------|
| 首局钩子 | 开局 250 阳光，引导高亮可放列 | 首次 `plant_place` | ≤8s |
| 教学 | 图标引导：阳光→选卡→点格 | 无长文完成首次放置 | ≤12s |
| 辨识度 | 单路径 5 行草坪 + 小屋在左 | 与跑酷/射击区分 | 固定地图 §4.5 |
| 回流 | 关卡星级、解锁下一关、每关最高星本地纪录 | 局外目标数 | ≥2（星级+关卡进度） |

### 2.2 玩法

| 项 | 方案 | 验收指标 | 目标值 |
|----|------|----------|--------|
| 主操作占比 | 选卡 + 点格放置 + 点阳光 | 核心操作时间占比 | ≥85% |
| 变化 | 新僵尸种类、波次密度、植物卡冷却 | 第2局/第3关新增 | 第2关路牌僵尸；第3关水桶 |
| 决策 | 先向日葵 vs 先射手、坚果放哪路、何时卖植 | 每局有意义抉择 | ≥6 次 |
| 单局时长 | 1～3 关设计 | 第1关中位通关 | 2.5～4.0 min |
| 失败可理解 | 小屋 HP 归零 | 死因枚举 | 1 种（小屋被攻破） |

### 2.3 竞技 / 成绩

| 项 | 方案 | 验收指标 | 目标值 |
|----|------|----------|--------|
| 主分数 | 关卡通关 + 小屋剩余血量比例 | 显示在结算 | 百分比 + 星级 |
| 纪录 | `localStorage` `pzd2d_level_{id}_stars` | 每关最高星 | 1～3 |
| 星级 | 按小屋剩余 HP% | 阈值 | 3★ ≥100% / 2★ ≥50% / 1★ ≥10% |

### 2.4 解压

| 项 | 方案 | 验收指标 | 目标值 |
|----|------|----------|--------|
| 释放事件 | 波次清空、僵尸击杀连击 | `wave_clear` / `zombie_kill` | 每 25～45s 至少 1 次「中」或「重」 |
| 惩罚 | 漏怪扣血可挽回 | 第1关从小屋 100% 到失败 | ≥4 只漏怪才失败（25×4） |

### 2.5 画风与可读性

| 项 | 方案 | 验收指标 | 目标值 |
|----|------|----------|--------|
| 敌我区分 | 植物绿/黄、僵尸灰绿、小屋木色 | 主色 hex 差 | 植物 `#72D566` vs 僵尸 `#94B49F` |
| 小屏可读 | 单格含植物+僵尸剪影 | 360×640 横屏单格边长 | ≥48px |
| 合规 | §4.8 | 禁用元素 | 通过 |

---

## §3 首局 60 秒剧本（第 1 关）

| 时间 | 游戏状态 | 场上内容 | 玩家操作 | 系统响应 | event_id |
|------|----------|----------|----------|----------|----------|
| 0s | prep→wave | 250 阳光，空草坪，选卡栏 | 选向日葵 | 高亮第 2～4 列草坪 | `ui_select_card` |
| 3s | wave | 首株向日葵种下 | 点格放置 | -50 阳光，种植音效 | `plant_place` |
| 6s | wave | 天降落阳光 | 点击阳光 | +25 阳光 | `sun_collect` |
| 8s | wave | 引导选豌豆射手 | 点射手卡+草坪 | -100 阳光 | `plant_place` |
| 12s | wave | 首只 normalZombie 行 2 出现 | 观察 | 行内移动 | `zombie_spawn` |
| 14s | wave | 豌豆命中 | 无 | 僵尸掉血飘字 | `pea_hit` |
| 18s | wave | 首杀 | 无 | 僵尸倒地 | `zombie_kill` |
| 22s | wave | 第 1 波剩余 3 只 | 可补向日葵 | 持续产出/射击 | `pea_hit` |
| 35s | wave | 第 1 波末只 | 无 | 波次横幅 | `wave_banner` |
| 45s | wave | 第 2 波开始（密度+1） | 可选坚果 | 刷怪加快 | `zombie_spawn` |
| 60s | wave | 约 8 只累计击杀 | 调整布局 | 阳光 180～320 | `zombie_kill` |

**波峰**：22s 紧张（首波未清完）；35s 释放（`wave_banner` 轻庆祝）。

---

## §4 程序配置蓝图

### 4.1 画布与局规格

| 键 | 值 | 说明 |
|----|-----|------|
| `BASE_W` × `BASE_H` | 960 × 540 | 逻辑像素横屏 |
| `orientation` | landscape | |
| `ASSET_ROOT` | `/assets/plantZombieDefense2d` | |
| 单局超时（s） | 0 | 无 |
| 目标帧逻辑 | 固定 dt 1/60 | |

| `gridW` × `gridH` | 9 × 5 | 与 MAP 列行一致 |
| `cellPx` | 72 | 单格边长 px（草坪区） |
| `houseBaseHp` | 100 | 小屋血量 |
| `leakDamage` | 25 | 每只僵尸进小屋扣血 |
| `sellRefundRatio` | 0.2 | 卖植返还阳光比例 |
| `sunFallInterval` | 9 | 秒 |
| `sunFallValue` | 25 | |
| `maxWavesPerLevel` | 3（1～5 关）/ 4（6～15 关） | |
| `totalLevels` | 15 | |

### 4.2 `COLORS`

| 键 | hex | 用于 |
|----|-----|------|
| primary | #72D566 | 植物、主按钮 |
| accent | #FFD23F | 阳光、向日葵 |
| bg | #87CE98 | 草坪基调 |
| danger | #F87171 | 小屋低血量 |
| success | #4ADE80 | 波次清除 |
| house | #C4A46B | 小屋 |
| zombie | #94B49F | 普通僵尸 |
| pea | #B8F070 | 豌豆弹 |

### 4.3 状态机（`GamePhase`）

| phase id | 进入条件 | 退出条件 | 玩家可操作 |
|----------|----------|----------|------------|
| boot | 进关 | 资源就绪 | 无 |
| prep | boot 完 | 3s 或点「开始」 | 选卡、放置（预放置可选关） |
| wave | prep 结束 | 本关波次全清 | 选卡、放置、卖植、收阳光 |
| pause | 点暂停 | 继续 | 无 |
| victory | 最后一波清完且小屋>0 | 点下一关/重开 | 按钮 |
| defeat | 小屋 HP≤0 | 重开/返回 | 按钮 |

### 4.4 玩家实体

本游戏无自由移动「玩家角色」；**主控实体=经济+放置**。记录字段：

| 字段 | 值 |
|------|-----|
| `startSun` Lv1 | 250 |
| `plantCardCooldownMul` Lv1 | 1.0 |
| 同时放置上限 | 每格 1 植物 |

### 4.5 植物（`PLANT_DEFS`）

| kind | name | cost | maxHp | damage | fireRate | sunProduce | sunInterval s | 特殊 |
|------|------|------|-------|--------|----------|------------|---------------|------|
| peashooter | 豌豆射手 | 100 | 80 | 12 | 1.2/s | 0 | — | 射程整行向右 |
| sunflower | 向日葵 | 50 | 60 | 0 | — | 25 | 8 | — |
| wallnut | 高坚果 | 50 | 400 | 0 | — | 0 | — | 纯挡 |
| potatoMine | 土豆地雷 | 25 | 50 | — | — | 0 | — | arm 2s，范围 1 格，伤害 60 |
| snowPea | 寒冰豌豆 | 175 | 75 | 10 | 1.4/s | 0 | — | slow 0.7 持续 2.5s |

### 4.6 僵尸（`ZOMBIE_DEFS`）

| kind | name | hp | speed px/s | attackDps | 特殊 |
|------|------|-----|------------|-----------|------|
| normalZombie | 呆萌普通僵尸 | 120 | 32 | 5 | — |
| flagZombie | 路牌僵尸 | 180 | 32 | 5 | 略厚 |
| bucketZombie | 水桶僵尸 | 320 | 30 | 5 | armorMul 0.6 |
| sportZombie | 皮球跳跳僵尸 | 140 | 20 | 0 | 遇坚果跳过 1 次 |

- 生成 X：格右缘外 `spawnX = gridRight + 40`  
- 进小屋判定：`x <= houseX` → `house_hurt` + 移除僵尸  

### 4.7 波次 / 关卡（第 1～3 关示例，余关按 tier 缩放）

| id | 显示名 | startSun | 波次数 | 波 1 组成 | spawnInterval s | 体验意图 |
|----|--------|----------|--------|-----------|-----------------|----------|
| 1 | 第1关 | 250 | 3 | normal×6 | 0.9 | 教学经济+首杀 |
| 2 | 第2关 | 250 | 3 | normal×8 + flag×1 | 0.85 | 引入路牌 |
| 3 | 第3关 | 200 | 3 | normal×8 + flag×1 + bucket×1 | 0.8 | 水桶教学寒冰/火力 |

**tier**：1～5 关 mul=1.0，6～10 mul=1.3，11～15 mul=1.6；每波 count 按 mul 取整。  
**4 波关**：6 关起第 4 波，间隔 0.55s，数量 +3。

### 4.8 儿童合规与文案

| 类型 | 允许 | 禁止 |
|------|------|------|
| 视觉 | 呆萌僵尸、卡通植物、柔和粒子 | 断肢、血浆、写实腐尸、枪械 |
| 文案 | 守护小屋、闯关、星星 | 杀死人类、赌博、充值 |

### 4.9 胜负与星级

| 结果 | 判定条件 |
|------|----------|
| win | 当前关所有波次 `aliveZombies=0` 且未 defeat |
| lose | `houseHp <= 0` |
| 3★ / 2★ / 1★ | 通关时 `houseHp/max ≥ 1.0 / 0.5 / 0.1` |

### 4.10 大厅引导文案

| `guide.ops` | emoji | 文案 |
|-------------|-------|------|
| | ☀️ | **点击**飘落阳光，增加放置资源 |
| | 🌱 | **点草坪格**放置选中的植物 |
| | 🗑️ | **点已种植物**出售，返还 20% 阳光 |

| `desc` | 横屏种萌植收阳光，挡呆萌僵尸守小屋，休闲闯关冲三星！ |
|--------|--------------------------------------------------------|

| `name` | 萌植防线 2D |
| `tag` | 塔防 |
| `color` | #72D566,#FFD23F |
| `category` | strategy |

### 4.5 地图（`MAP_LAYOUT`）

编码：`0` 草坪可放 `1` 僵尸行走 `2` 小屋 `3` 禁区  

5 行 × 9 列（列 0 左=小屋侧，列 8 右=出怪侧）：

```text
行0～4 均为：
[0,0,0,0,0, 1,1,1, 2]
```

- 列 0～4：放置区  
- 列 5～7：行内路径（僵尸沿固定行 x 减小方向走向小屋）  
- 列 8：小屋占格显示（逻辑碰撞在列 0 前缘）

---

## §5 反馈事件规格书

> 同时「重」≤1，「中」≤3。

| event_id | 触发条件 | 视觉 | 特效 | 音效文件 | 震屏 | 时长 ms |
|----------|----------|------|------|----------|------|---------|
| ui_select_card | 选中植物卡 | 卡边框高亮 | 无 | ui_tick.ogg | 0 | 150 |
| ui_invalid | 阳光不足点卡 | 卡抖动+灰闪 | 无 | ui_buzz.ogg | 0 | 200 |
| sun_collect | 点击可拾取阳光 | +N 飘字 | 8 点金光 | sun_pop.ogg | 0 | 400 |
| sun_fall | 天上掉落阳光 | 斜落图标 | 无 | sun_drop.ogg | 0 | — |
| plant_place | 放置成功 | 格上弹一下 | 泥土 6 粒子 | plant_place.ogg | 0 | 300 |
| plant_sell | 卖植 | 缩小消失 | 无 | plant_sell.ogg | 0 | 250 |
| pea_hit | 豌豆命中僵尸 | 僵尸闪白 80ms | 2 绿叶 | pea_hit.ogg | 0 | 120 |
| zombie_hurt_light | hp>0 受击 | 轻微后退 4px | 无 | — | 0 | 100 |
| zombie_kill | 僵尸 hp≤0 | 倒地淡出 | 12 彩色纸屑 | zombie_pop.ogg | 0 | 500 |
| zombie_spawn | 波次刷怪 | 行右侧冒头 | 灰尘 4 | zombie_groan_light.ogg | 0 | 300 |
| zombie_eat | 僵尸咬植物 | 植物抖 | 啃食碎屑 | chomp.ogg | 0 | 循环至离开 |
| mine_explode | 地雷触发 | 范围闪黄 | 16 粒子 | boom_soft.ogg | 1 | 450 |
| wave_banner | 每波开始/结束 | 横幅字 | 无 | wave_whoosh.ogg | 0 | 1200 |
| wave_clear | 全波完成 | 屏周绿光 | 20 粒子 | wave_clear.ogg | 1 | 800 |
| house_hurt | 漏怪 | 小屋红闪+血条减 | 无 | house_hit.ogg | 1 | 400 |
| win | victory | 三星展示 | 花瓣 | win.ogg | 1 | 2000 |
| lose | defeat | 小屋冒烟 | 无 | lose.ogg | 0 | 1500 |

---

## §6 资产与 Prompt

### 6.1 P0 最低资产集

- [x] 主背景 `backgrounds/lawn_day.webp` 960×540  
- [x] 植物 5 kind 各 1 精灵  
- [x] 僵尸 4 kind 各 1 精灵  
- [x] UI：阳光图标、5 植物卡、小屋、血条底  
- [x] BGM 1 + §5 所列音效各 1  

### 6.2 视觉资产表

| 状态 | 文件路径 | kind | 尺寸 px | 帧×fps | 完整 Prompt EN | negative |
|------|----------|------|---------|--------|----------------|----------|
| ☐ | backgrounds/lawn_day.webp | — | 960×540 | — | 2D cartoon mobile kids game, full screen lawn yard with cute fence and small wooden house on left, soft blue sky gradient, no characters no UI no text | §7.3 |
| ☐ | sprites/plant_peashooter.png | peashooter | 128² | 1 | 2D cartoon mobile kids game sprite, cute pea shooter plant in pot, green leaves, thick outline, transparent background, no text | §7.3 |
| ☐ | sprites/plant_sunflower.png | sunflower | 128² | 1 | 2D cartoon sunflower in pot, happy face, yellow petals, transparent background | §7.3 |
| ☐ | sprites/plant_wallnut.png | wallnut | 128² | 1 | 2D cartoon round nut wall plant, brown beige, tough cute expression, transparent background | §7.3 |
| ☐ | sprites/plant_potato_mine.png | potatoMine | 96² | 1 | 2D cartoon potato in soil lump, mine hint sparks cute not scary, transparent background | §7.3 |
| ☐ | sprites/plant_snow_pea.png | snowPea | 128² | 1 | 2D cartoon icy blue pea plant, frost leaves, transparent background | §7.3 |
| ☐ | sprites/zombie_normal.png | normalZombie | 128×160 | 4×6 walk | 2D cartoon silly zombie child-friendly, gray green clothes, transparent background, sprite sheet 4 frames horizontal | §7.3 |
| ☐ | sprites/zombie_bucket.png | bucketZombie | 128×160 | 4×6 | 2D cartoon zombie with cute bucket on head, transparent background, 4 frames | §7.3 |
| ☐ | ui/icon_sun.png | sun | 64² | 1 | 2D cartoon shiny sun coin icon, transparent background | §7.3 |
| ☐ | ui/card_frame.png | ui | 128×96 | 1 | 2D cartoon plant card frame green border, transparent center, transparent background | §7.3 |

### 6.3 音频资产表

| 状态 | 文件路径 | event_id | 时长 s | 描述 |
|------|----------|----------|--------|------|
| ☐ | audio/bgm_lawn.ogg | — | 75 循环 | 轻快木琴+拍手 95bpm |
| ☐ | audio/sun_pop.ogg | sun_collect | 0.25 | 清脆叮 |
| ☐ | audio/pea_hit.ogg | pea_hit | 0.15 | 软噗 |
| ☐ | audio/zombie_pop.ogg | zombie_kill | 0.35 | 呆萌噗通 |
| ☐ | audio/wave_clear.ogg | wave_clear | 0.8 | 上升和弦 |
| ☐ | audio/house_hit.ogg | house_hurt | 0.4 | 低沉咚 |
| ☐ | audio/win.ogg | win | 1.2 | 欢快号角 |
| ☐ | audio/lose.ogg | lose | 1.0 | 舒缓下降 |

### 6.4 占位策略（仅原型）

| kind | P0 必须有文件 | 原型占位 |
|------|---------------|----------|
| 植物 | 是 | 圆角矩形+emoji（现 3D 版逻辑可过渡） |
| 僵尸 | 是 | emoji �� |

---

## §7 视听风格锁

### 7.1 世界观

后院草坪上的萌植小队，守护木质小屋，击退迷糊呆萌僵尸的阳光午后。

### 7.2 Master Prompt（2D）

```text
2D cartoon mobile kids game sprite, flat colors with soft shading,
thick clean outline, high readability at small size,
centered, transparent background, no text, no watermark
```

### 7.3 负面提示

```text
realistic gore, blood, horror, Plants vs Zombies logo, copyrighted characters,
logo, text, watermark, blurry, NSFW, dark gritty, guns
```

---

## §8 界面与流程

| 界面 id | 入口 | 必显控件 | 默认焦点 | 退出 | phase |
|---------|------|----------|----------|------|-------|
| hud_level | wave | 阳光数、波次 2/3、小屋血条、植物卡栏 | 首卡 | pause | wave |
| overlay_pause | 暂停 | 继续/重开/退出 | 继续 | play | pause |
| result | win/lose | 星级、小屋 HP%、下一关/重试 | 下一关 | 大厅或下一关 | victory/defeat |

**结算下一局动力**：显示「差 1 星满血」或「解锁第 N+1 关」。

---

## §9 商务验收（P0）

### 9.1 内容与合规

| # | 标准 | 通过 |
|---|------|------|
| C1 | §4.8 禁止项未出现 | ☐ |
| C2 | 无抽奖/充值文案 | ☐ |
| C3 | 失败仅「小屋被攻破」 | ☐ |

### 9.2 体验

| # | 标准 | 通过 |
|---|------|------|
| E1 | §3 的 0～30s 与第 1 关实机误差 ≤2s | ☐ |
| E2 | §2 目标抽测 3 局达标 ≥2 | ☐ |
| E3 | 连续 5 分钟无卡死 | ☐ |
| E4 | 缺 BGM 可完整一局 | ☐ |

### 9.3 资产与包体

| # | 标准 | 通过 |
|---|------|------|
| A1 | §6.1 进包 | ☐ |
| A2 | 目录 ≤5MB | ☐ |
| A3 | 单精灵缺失可占位不崩 | ☐ |

### 9.4 工程对接

| # | 标准 | 通过 |
|---|------|------|
| T1 | `config.ts` 与 §4 一致 | ☐ |
| T2 | §5 每个 event_id 有触发 | ☐ |
| T3 | `gameRegistry` 与 §4.10 一致 | ☐ |

---

## §10 版本记录

| 版本 | 日期 | 变更 | 交付等级 |
|------|------|------|----------|
| v1.0 | 2026-06-10 | 2D 策划定稿（对标市场 PvZ 类） | P0 待开发/换皮 |

---

## 附录 B 自检

| 问 | 是 |
|----|-----|
| 不看代码能猜出整局流程？ | ☑ |
| 测试能用 §3+§9 写用例？ | ☑ |
| 美术能按 §6+§7 出图？ | ☑ |
| §2 无空指标？ | ☑ |
| P0 主角色非长期 emoji？ | ☑（定稿要求） |

---

**与现网关系**：仓库内 `plantZombieDefense` 为 **3D Babylon** 实现，数值已接近本 §4；若产品要 **统一为 2D**，建议新 Registry 项 `plantZombieDefense2d` 或替换 `type:'2d'` 并改 `render/` 为 Canvas，策划以本文为准做事件与资产补齐。