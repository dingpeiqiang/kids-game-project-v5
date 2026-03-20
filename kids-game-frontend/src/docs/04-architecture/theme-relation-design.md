# 主题系统数据库设计

## 核心设计理念

**主题与游戏解耦，支持跨游戏复用**

- ✅ 主题是独立资产，不绑定特定游戏
- ✅ 通过关系表实现主题与游戏的多对多关联
- ✅ 支持通用主题（适用所有游戏）和专属主题（指定游戏）
- ✅ 每个游戏可设置一个默认主题

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
  - `all` - 通用主题，适用于所有游戏
  - `specific` - 专属主题，只适用于指定游戏

### 2. 主题-游戏关系表（theme_game_relation）

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
```sql
UNIQUE KEY uk_theme_game (theme_id, game_id)
```

### 3. 主题资源表（theme_assets）- 可选

```sql
theme_assets
├── asset_id (PK)          -- 资源 ID
├── theme_id (FK)          -- 主题 ID
├── asset_key              -- 资源键（如：bg_main）
├── asset_type             -- 资源类型：image/audio/font
├── file_path              -- 文件路径
├── file_size              -- 文件大小
└── created_at
```

## 关系模型图

```
┌─────────────────┐
│   theme_info    │
│  (主题信息表)    │
└────────┬────────┘
         │ 1
         │ N
┌────────┴────────┐
│theme_game_relation│
│  (关系表 - 多对多) │
└────────┬────────┘
         │ N
         │ 1
┌────────┴────────┐
│     game        │
│   (游戏信息表)   │
└─────────────────┘
```

## 使用场景

### 场景 1: 创建通用主题

```java
// 1. 创建主题（适用范围：all）
dto.setApplicableScope("all");
ThemeInfo theme = themeService.uploadTheme(authorId, dto);

// 2. 批量关联到所有游戏
List<Game> allGames = gameService.getAllGames();
for (Game game : allGames) {
    themeService.addGameTheme(theme.getThemeId(), game.getGameId(), game.getGameCode(), false);
}
```

### 场景 2: 创建游戏专属主题

```java
// 适用范围：specific
dto.setApplicableScope("specific");
ThemeInfo theme = themeService.uploadTheme(authorId, dto);

// 只关联到指定游戏
themeService.addGameTheme(theme.getThemeId(), snakeGameId, "snake-vue3", false);
```

### 场景 3: 设置游戏默认主题

```java
themeService.setGameDefaultTheme(snakeGameId, classicThemeId);
```

## API 接口

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
        "price": 0
      }
    ],
    "total": 2,
    "page": 1
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

## 优势对比

### V2 设计（主题绑定游戏）

```sql
theme_info.game_id → 一对一绑定
❌ 主题不能跨游戏复用
❌ 创建多个游戏主题需要重复配置
```

### V3 设计（关系模型）

```sql
theme_info + theme_game_relation → 多对多关联
✅ 主题独立，可跨游戏复用
✅ 通用主题一次创建，批量关联
✅ 扩展性强
```

---

**版本**: v3.0.0
**最后更新**: 2026-03-20
