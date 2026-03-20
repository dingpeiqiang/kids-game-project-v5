# 游戏主题系统架构设计 V3

## 核心设计理念

**主题与游戏解耦，支持跨游戏复用**

- ✅ 主题是独立资产，不绑定特定游戏
- ✅ 通过关系表实现主题与游戏的多对多关联
- ✅ 支持通用主题（适用所有游戏）和专属主题（指定游戏）
- ✅ 每个游戏可设置一个默认主题

---

## 数据模型

### 1. 主题信息表（theme_info）

```sql
theme_info
├── theme_id (PK)          -- 主题 ID
├── author_id              -- 作者 ID
├── theme_name             -- 主题名称
├── author_name            -- 作者名称
├── price                  -- 价格（游戏币）
├── status                 -- 状态：on_sale/offline/pending
├── download_count         -- 下载次数
├── total_revenue          -- 总收益
├── thumbnail_url          -- 缩略图 URL
├── description            -- 描述
├── config_json (JSON)     -- 主题配置（资源/样式）
├── applicable_scope       -- 适用范围：all/specific
├── created_at
└── updated_at
```

**关键字段说明：**
- `applicable_scope`: 
  - `all` - 通用主题，适用于所有游戏（如：经典复古主题）
  - `specific` - 专属主题，只适用于指定游戏（如：贪吃蛇专属主题）

### 2. 主题 - 游戏关系表（theme_game_relation）

```sql
theme_game_relation
├── relation_id (PK)       -- 关系 ID
├── theme_id (FK)          -- 主题 ID → theme_info.theme_id
├── game_id                -- 游戏 ID
├── game_code              -- 游戏代码（如：snake-vue3）
├── is_default             -- 是否为该游戏的默认主题
├── sort_order             -- 排序权重
└── created_at
```

**唯一约束：**
- `UNIQUE KEY uk_theme_game (theme_id, game_id)` - 同一主题对同一游戏只能有一条关系

### 3. 主题资源表（theme_assets）- 可选

```sql
theme_assets
├── asset_id (PK)          -- 资源 ID
├── theme_id (FK)          -- 主题 ID → theme_info.theme_id
├── asset_key              -- 资源键（如：bg_main）
├── asset_type             -- 资源类型：image/audio/font/other
├── file_path              -- 文件路径
├── file_size              -- 文件大小（字节）
├── file_hash              -- 文件哈希（用于去重）
└── created_at
```

---

## 关系模型图

```
┌─────────────────┐
│   theme_info    │
│  (主题信息表)    │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────┴────────┐
│theme_game_relation│
│  (关系表 - 多对多) │
└────────┬────────┘
         │ N
         │
         │ 1
┌────────┴────────┐
│     game        │
│   (游戏信息表)   │
└─────────────────┘

使用示例：
- 主题 A (applicable_scope=all) → 关联 游戏 1, 游戏 2, 游戏 3
- 主题 B (applicable_scope=specific) → 只关联 游戏 1
- 游戏 1 可以有 主题 A, 主题 B, 主题 C...
- 游戏 1 的默认主题 = 主题 A (is_default=1)
```

---

## 使用场景

### 场景 1: 创建通用主题

```java
// 1. 创建主题（适用范围：all）
ThemeUploadDTO dto = new ThemeUploadDTO();
dto.setThemeName("经典复古主题");
dto.setApplicableScope("all");
dto.setConfigJson(config);

ThemeInfo theme = themeService.uploadTheme(authorId, dto);

// 2. 批量关联到所有游戏
List<Game> allGames = gameService.getAllGames();
for (Game game : allGames) {
    themeService.addGameTheme(theme.getThemeId(), game.getGameId(), game.getGameCode(), false);
}
```

### 场景 2: 创建游戏专属主题

```java
// 1. 创建主题（适用范围：specific）
ThemeUploadDTO dto = new ThemeUploadDTO();
dto.setThemeName("贪吃蛇专属主题");
dto.setApplicableScope("specific");
dto.setConfigJson(config);

ThemeInfo theme = themeService.uploadTheme(authorId, dto);

// 2. 只关联到贪吃蛇游戏
themeService.addGameTheme(theme.getThemeId(), snakeGameId, "snake-vue3", false);
```

### 场景 3: 设置游戏默认主题

```java
// 设置贪吃蛇的默认主题
themeService.setGameDefaultTheme(snakeGameId, classicThemeId);

// SQL 执行：
// UPDATE theme_game_relation SET is_default = 0 WHERE game_id = ?
// UPDATE theme_game_relation SET is_default = 1 WHERE game_id = ? AND theme_id = ?
```

### 场景 4: 获取游戏的所有主题

```java
// 前端调用：GET /api/theme/list?gameId=1&gameCode=snake-vue3
Page<ThemeInfo> themes = themeService.listGameThemes(gameId, gameCode, "on_sale", page, pageSize);

// 返回结果包含：
// - 主题列表（带 is_default 标记）
// - 分页信息
```

### 场景 5: 主题管理（管理员）

```java
// 为游戏添加主题
themeService.addGameTheme(themeId, gameId, gameCode, false);

// 从游戏移除主题
themeService.removeGameTheme(themeId, gameId);

// 获取主题关联的游戏列表
List<Long> gameIds = themeService.getThemeGames(themeId);
```

---

## API 接口设计

### 获取游戏主题列表
```
GET /api/theme/list?gameId=1&gameCode=snake-vue3&status=on_sale&page=1&pageSize=20
```

**响应：**
```json
{
  "success": true,
  "data": {
    "list": [
      {
        "themeId": 1,
        "themeName": "经典复古",
        "isDefault": true,
        "price": 0,
        "downloadCount": 100
      },
      {
        "themeId": 2,
        "themeName": "炫酷科技",
        "isDefault": false,
        "price": 50,
        "downloadCount": 25
      }
    ],
    "total": 2,
    "page": 1,
    "pageSize": 20
  }
}
```

### 为游戏添加主题
```
POST /api/theme/game-relation
Content-Type: application/json

{
  "themeId": 1,
  "gameId": 1,
  "gameCode": "snake-vue3",
  "isDefault": false
}
```

### 设置游戏默认主题
```
POST /api/theme/set-default
Content-Type: application/json

{
  "gameId": 1,
  "themeId": 1
}
```

### 从游戏移除主题
```
DELETE /api/theme/game-relation?themeId=1&gameId=1
```

---

## 前端集成

### 游戏管理 → 主题管理弹窗

```
┌──────────────────────────────┐
│ 🎨 贪吃蛇 - 主题管理         │
├──────────────────────────────┤
│ 已关联主题 (2):              │
│ ┌────┐ ┌────┐                │
│ │主题│ │主题│  + 添加主题    │
│ │ A  │ │ B  │                │
│ │默认│ │    │                │
│ └────┘ └────┘                │
│                              │
│ 可添加主题 (5):              │
│ ┌────┐ ┌────┐ ┌────┐        │
│ │主│ │主│ │主│  ...         │
│ │题│ │题│ │题│               │
│ └────┘ └────┘ └────┘        │
│                              │
│ [✏️编辑] [📥下架] [⭐默认]   │
│ [🗑️移除]                     │
└──────────────────────────────┘
```

### 主题管理 → 关联游戏

```
┌──────────────────────────────┐
│ ✏️ 编辑主题 - 经典复古       │
├──────────────────────────────┤
│ 基本信息                     │
│ ├ 主题名称：经典复古         │
│ ├ 适用范围：● 所有游戏       │
│ │              ○ 指定游戏    │
│ └ 主题配置：{...}            │
│                              │
│ 已关联游戏 (3):              │
│ - 贪吃蛇 (默认) [移除]       │
│ - 飞机大战 [移除]            │
│ - 射击游戏 [移除]            │
│                              │
│ + 添加游戏                   │
└──────────────────────────────┘
```

---

## 优势对比

### V2 设计（主题绑定游戏）
```
theme_info.game_id → 一对一绑定
❌ 主题不能跨游戏复用
❌ 创建多个游戏主题需要重复配置
❌ 通用主题需要复制多份
```

### V3 设计（关系模型）
```
theme_info + theme_game_relation → 多对多关联
✅ 主题独立，可跨游戏复用
✅ 通用主题一次创建，批量关联
✅ 专属主题灵活指定
✅ 扩展性强（未来可支持主题分类、标签等）
```

---

## 数据库迁移

### 执行顺序

1. **创建新表**
```sql
-- 执行 theme-system-migration-v3.sql
source /path/to/theme-system-migration-v3.sql;
```

2. **迁移旧数据（如果有）**
```sql
-- 如果 theme_info 已有 game_id 字段，迁移到关系表
INSERT INTO theme_game_relation (theme_id, game_id, game_code, is_default)
SELECT theme_id, game_id, game_code, is_default
FROM theme_info
WHERE game_id IS NOT NULL;

-- 删除旧字段
ALTER TABLE theme_info DROP COLUMN game_id;
ALTER TABLE theme_info DROP COLUMN game_code;
ALTER TABLE theme_info DROP COLUMN is_default;
```

3. **初始化默认数据**
```sql
-- 为现有游戏添加默认主题
INSERT INTO theme_info (author_id, theme_name, author_name, price, status, applicable_scope, config_json)
VALUES (1, '官方默认主题', '游戏官方', 0, 'on_sale', 'all', '{"default": {"name": "默认", "assets": {}, "styles": {}}}');

-- 获取刚插入的主题 ID
SET @default_theme_id = LAST_INSERT_ID();

-- 关联到所有游戏
INSERT INTO theme_game_relation (theme_id, game_id, game_code, is_default, sort_order)
SELECT @default_theme_id, game_id, game_code, 1, 1
FROM game
WHERE status = 1;
```

---

## 待实现功能

- [ ] ThemeServiceImpl 实现所有新增方法
- [ ] ThemeController 添加关系管理接口
- [ ] 前端主题管理支持关联游戏
- [ ] 前端游戏管理支持添加/移除主题
- [ ] 主题市场支持按游戏筛选
- [ ] 游戏页面自动加载默认主题

---

## 扩展方向

1. **主题分类** - 添加 theme_category 表，支持主题分类管理
2. **主题标签** - 添加 theme_tag 表，支持标签检索
3. **主题评分** - 添加 theme_rating 表，支持用户评分
4. **主题预览** - 在游戏管理界面直接预览主题效果
5. **主题包导入导出** - 支持主题配置批量导入导出
6. **主题版本管理** - 支持主题多版本，可回滚
