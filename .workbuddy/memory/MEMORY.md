# 项目长期记忆

## 贪吃蛇道具系统 Bug 修复（2026-03-26，两轮）

### 第一轮：碰撞检测不工作、道具不消失（根本 4 个 Bug）
1. `PhaserGame.update()` 传入空数组 → 改为传入 `currentSnake`
2. 坐标系不一致：道具用左上角坐标，蛇用中心点坐标 → 统一为 `col * cellSize + cellSize/2`
3. `ItemSystem.render()` offsetY 未含 safeTop → 接受 adaptParams 参数修正
4. `ItemSystem.update()` 重复调用 applyItemEffect → 删除重复逻辑

### 第二轮：道具效果看不出来（数据孤岛问题）
**根本原因**：`PhaserGame.gameData` 与 `gameStore` 完全脱节——速度改了 gameData 但 moveSnake 读 gameStore；分数改了 gameData 但 addScore 直接加原始分

**修复方案**：
- `game.ts`（store）新增 `itemEffects` 状态 + `applyItemEffect()` 统一入口 + `resetItemEffects()`
- `moveSnake()` 使用 `effectiveSpeed = currentConfig.speed * itemEffects.speedMultiplier`
- `addScore()` 用 `Math.round(points * itemEffects.scoreMultiplier)` 
- 碰撞检测（边界/自身/障碍物）先判 `hasShield` 消耗护盾再 endGame
- `length_reduce` 直接 `snake.value.splice()` 实际缩短 3 节
- `PhaserGame` 新增 `onItemEffect` 回调字段 + `setItemEffectCallback()`，由 `SnakeGame.vue` 注入 `gameStore.applyItemEffect`（不在 Phaser class 内调用 useGameStore，避免热更新后方法丢失）
- 道具收集音效：`playSound('item_collect')` → 映射到 `effect_levelup`
- `SnakeGame.vue` 新增道具效果状态栏 UI（彩色徽章 + 倒计时进度条）
- `resetItemEffects()` 改为逐字段重置（不整体替换），避免路由过渡动画期间 template 访问 undefined

### ⚠️ 关键教训：Pinia useGameStore() 必须在 Vue 组件 setup 上下文中调用，不能在 Phaser class 内部调用

### 关键文件
- `kids-game-house/games/snake/src/stores/game.ts` - 道具效果状态中心
- `kids-game-house/games/snake/src/components/game/PhaserGame.ts` - 收集回调委托给 store
- `kids-game-house/games/snake/src/components/game/SnakeGame.vue` - 道具效果 UI 显示
- `kids-game-house/games/snake/src/components/game/components/ItemManager.ts`
- `kids-game-house/games/snake/src/components/game/components/ItemSystem.ts`

## 贪吃蛇游戏 GTRS 规范适配（完成于 2026-03-20）

### 项目路径
`kids-game-house/snake-vue3/`

### GTRS 规范核心约定
- **GTRS v1.0.0**：4 个顶级字段 `specMeta` / `themeInfo` / `globalStyle` / `resources`
- **资源结构**：`resources.images.scene`（场景图）、`resources.audio.bgm`（背景乐）、`resources.audio.effect`（音效）
- **key 命名规范**：英文小写+下划线，例如 `snake_head`、`food_apple`、`scene_bg_main`、`effect_eat`

### 关键文件
| 文件 | 说明 |
|------|------|
| `src/config/GTRS.json` | **纯占位符**，枚举本游戏合法 key，src 全空，不作运行兜底 |
| `src/components/game/PhaserGame.ts` | Phaser 游戏引擎封装，完全从 GTRS 读取资源 |
| `src/stores/theme.ts` | Vue UI 层主题状态，从 GTRS globalStyle 提取颜色 |
| `src/utils/gtrs-validator.ts` | GTRS JSON Schema 严格校验工具（Ajv） |

> ⚠️ `public/games/.../gtrs-theme.json` 已删除（多余）

### 设计决策：无主题必须报错
- `GTRS.json` 是纯结构定义（key 枚举），**src 全空**，不可直接运行
- 游戏运行时 `GTRS` 变量初始值为 `null`
- `assertGTRS()` 函数：未加载时直接 `throw`，快速定位问题
- `loadTheme()` 任何失败（未登录 / HTTP 错误 / GTRS 校验不通过）均直接 `throw`，不静默降级
- `start(difficulty, themeId)` 中 `themeId` 必填，否则 `throw`

### 路径规范
- 资源路径 **不含** `/public/` 前缀：`/games/snake-vue3/themes/default/...`
- `normalizeSrcPaths()` 函数自动兼容旧格式 `/public/xxx` → `/xxx`

### Phaser 资源加载规则
- Phaser key = GTRS scene key（完全对应，无映射）
- `loadGTRSImages()` 遍历 `resources.images.scene` 批量加载
- `getThemeAssetKey()` 优先级：食物类型映射 > 直接 key 命中 > 兼容别名

### 主题上传链路（ownerId = gameId）
- **DIY 流程**：基于已有主题点击 DIY → 跳转 GTRS 编辑器，路由携带 `themeId` + `gameId` → 编辑器加载原主题配置作为模板 → 发布新主题时直接使用路由中的 `gameId` 作为 `ownerId`
- **creator-center/index.vue** `handleDIYTheme(theme)`：将 `theme.gameId` 传入路由参数 `query.gameId`
- **GTRSThemeCreatorV2.vue**：从 `route.query.gameId` 读取，发布时直接传给 `ownerId`，不再走 `gameApi.getByCode` 查询
- 后端 `ThemeUploadDTO` 接收 `ownerId`（Long），优先使用，为空时才通过 `gameCode` 反查
- BasicInfoPanel 游戏列表从 `gameApi.getList()` 动态加载（替代硬编码）

### 主题字段清理（废弃 applicableScope）
- `applicableScope`（all/specific）与 `ownerType`（APPLICATION/GAME）+ `ownerId` 功能完全重复，已废弃
- 所有主题均为游戏主题（`ownerType = 'GAME'`，`ownerId = gameId`），不再区分通用/专属
- 后端：ThemeInfo、ThemeResponseDTO 删除 `applicableScope` 字段；Controller/Service 中相关判断改为 `ownerType`
- 前端：删除 `ApplicableScope` 类型、`convertApplicableScopeToOwnerType()` 函数、各组件中的 `applicableScope` 字段

### 主题审批功能（2026-03-21 12:20）
- 后端新增 `ThemeService.approveTheme(themeId, approved)` 方法：审批通过 → `status=on_sale`，拒绝 → `status=offline`，只能对待审核主题操作
- 后端新增 `POST /api/theme/approve?themeId=xxx&approved=true/false` 接口
- 前端 `ThemeManagement.vue`：待审核主题卡片显示 ✅通过 / ❌拒绝 按钮，其他状态显示常规操作

### 主题加载链路
后端 API `/api/theme/download?id=xxx` → 提取 `configJson` → `validateGTRSTheme()` 校验  
→ 通过：`applyGTRS()` 直接赋值（不 deepMerge）  
→ 失败：直接 `throw`，由 Vue 组件显示报错 UI

### CSS 变量（applyThemeToDocument）
从 `ThemeConfig.colors.*` 写入 `--theme-primary`、`--theme-secondary`、`--theme-background` 等  
`ThemeConfig.colors` 从 GTRS `globalStyle` 字段提取（`primaryColor` / `secondaryColor` / `bgColor` / `textColor`）

### 音频文件
- 实际文件同时存在 `.mp3` 和 `.wav`，统一使用 **mp3** 格式
- 音频路径：`/games/snake-vue3/themes/default/audio/bgm_main.mp3` 等

## 认证安全策略（更新于 2026-03-21）

### 严格认证模式
- **原则**：所有主题相关API必须要求登录认证，未登录用户完全无法操作
- **实现**：
  1. JWT拦截器拦截所有`/api/**`路径
  2. `ThemeController`类添加`@RequireLogin`注解
  3. 移除主题API的排除项，强制所有主题操作都经过认证检查

### 认证流程
1. **公开接口**（允许未登录访问）：
   - `/api/auth/public-key` - 获取RSA公钥
   - `/api/auth/login` - 统一登录接口
   - `/api/kid/login`, `/api/parent/login` - 特定用户登录
   - `/api/game/list`, `/api/game/code/*` - 游戏信息
   - `/api/game/config/**` - 游戏配置
   - `/api/question/random` - 随机题目

2. **需要认证的接口**：
   - 所有主题API：`/api/theme/**`
   - 包括：主题列表、详情、上传、购买、下载、校验等所有操作

### 技术要点
- `@RequireLogin`注解：类或方法级别，JWT拦截器会根据此注解决定是否验证token
- 排除路径机制：在WebConfig中配置，被排除的路径跳过JWT拦截
- token验证：从Authorization头或token参数获取Bearer token进行验证

## 游戏资源生成（完成于 2026-03-21）

### 资源文件位置
- 图片：`kids-game-house/snake-vue3/public/themes/default/images/scene/`
- 音频：`kids-game-house/snake-vue3/public/themes/default/audio/`

### 图片资源（10个）
使用 Node.js + Canvas 生成像素风格图片：
- snake_head.png - 绿色蛇头（带眼睛）
- snake_body.png - 绿色蛇身（带高光）
- snake_tail.png - 渐变蛇尾
- food_apple.png - 红苹果（带叶子高光）
- food_banana.png - 黄色香蕉
- food_cherry.png - 双樱桃（带梗叶）
- obstacle_rock.png - 灰色石头（带纹理）
- obstacle_wall.png - 砖块墙壁
- scene_bg_main.png - 深色渐变星空背景（720x1280）
- scene_bg_grid.png - 网格背景（720x1280）

### 音频资源（8个）
使用 FFmpeg 合成：
- bgm_main.mp3 (47KB) - 主菜单温暖上行和弦
- bgm_gameplay.mp3 (63KB) - 游戏中节奏感 BGM
- bgm_gameover.mp3 (40KB) - 游戏结束低沉下行
- effect_eat.mp3 - 吃到食物清脆上升音
- effect_crash.mp3 - 碰撞低频撞击声
- effect_gameover.mp3 - 游戏结束下降音
- effect_levelup.mp3 - 升级欢快和弦
- effect_button_click.mp3 - 按钮点击短促音

### 生成脚本
- `generate-better-resources.cjs` - Node.js Canvas 图片生成
- `generate-better-audio.cjs` - FFmpeg 音频合成

## GTRS 编辑器/发布修复（更新于 2026-03-21）

### 修复的问题清单
1. **前端 vite 代理缺少 /themes**：前端无法访问 `localhost:3005` 的主题资源
   - 修复：`kids-game-frontend/vite.config.ts` 添加 `/themes` → `localhost:3005` 代理
2. **GTRS 校验不支持 /themes/ 路径**：`isValidResourceUrl()` 缺少该前缀
   - 修复：`kids-game-frontend/src/utils/gtrs-validator.ts` 添加 `/themes/` 支持
3. **Schema 不支持 $comment 字段**：前后端 Schema 都缺少 `$comment` 定义
   - 修复：`kids-game-frontend/src/schemas/gtrs-schema.json` 和 `kids-game-backend/.../gtrs-schema.json` 添加 `$comment` 属性
4. **上架按钮不触发后端**：`handleToggleSale()` 只有 TODO，没有实际调用
   - 修复：`kids-game-frontend/.../index.vue` 实现 `ElMessageBox.confirm` + `themeManager.toggleThemeSale()`
5. **toggle-sale API 前后端参数不匹配**：前端发 JSON body，后端期望 `@RequestParam`
   - 修复：`theme-api.service.ts` 改为 URL 参数 `?themeId=xxx&onSale=true`
6. **confirm() 沙箱被禁**：IDE 内嵌浏览器不支持 `confirm()`/`alert()`
   - 修复：改用 Element Plus 的 `ElMessageBox` 和 `ElMessage`

### 关键注意点
- 后端 `ThemeController` 在 `kids-game-backend/kids-game-web/src/main/java/com/kidgame/web/controller/ThemeController.java`
- 后端 `gtrs-schema.json` 在 `kids-game-backend/kids-game-service/src/main/resources/gtrs-schema.json`
- 前端和后端各有一份独立的 Schema，修改时**必须同步更新**
- IDE 沙箱环境禁止使用原生 `confirm()`/`alert()`/`prompt()`，必须用 Element Plus 组件

### GTRS 编辑器专用接口（2026-03-22）
- **新增接口**：`GET /api/theme/editor-data?id=xxx`
- **用途**：为 GTRS 编辑器提供结构化的主题数据，方便加载和查看
- **返回结构**：
  ```json
  {
    "themeInfo": { "themeId", "themeName", "authorName", "ownerType", "ownerId", ... },
    "config": { "specMeta", "globalStyle", "resources" }  // 已解析的对象，不是字符串
  }
  ```
- **后端实现**：`ThemeController.getEditorData()` → `ThemeService.getEditorData()` → `ThemeServiceImpl.getEditorData()`
- **前端使用**：`GTRSThemeCreatorV2.vue` 的 `loadExistingTheme()` 调用 `themeApi.getEditorData()`
