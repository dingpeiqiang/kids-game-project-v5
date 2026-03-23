# /api/game/code/{gameCode} 接口出参缺失问题修复

## 🔴 问题描述

**接口**: `/api/game/code/snake-vue3`  
**问题**: 返回的游戏信息缺少多个重要字段

### 实际返回（修复前）
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "gameId": 1,
    "gameCode": "SNAKE_VUE3",
    "gameName": "贪吃蛇大冒险",
    "category": "PUZZLE",
    "grade": "一年级",
    "tags": null,
    "iconUrl": "/images/games/snake-vue3/snake-icon.png",
    "isFeatured": 0,
    "modulePath": null,
    "status": 1,
    "sortOrder": 1,
    "creatorId": null,
    "publishTime": null,
    "consumePointsPerMinute": 1,
    "minFatigueToStart": 0,
    "onlineCount": 0,
    "createTime": 1234567890000,
    "updateTime": 1234567890000,
    "deleted": 0
  }
}
```

### 应该返回（修复后）
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "gameId": 1,
    "gameCode": "SNAKE_VUE3",
    "gameName": "贪吃蛇大冒险",
    "category": "PUZZLE",
    "grade": "一年级",
    "tags": null,
    "iconUrl": "/images/games/snake-vue3/snake-icon.png",
    "coverUrl": "",                    // ✅ 新增
    "resourceUrl": null,               // ✅ 新增
    "description": "经典贪吃蛇游戏...", // ✅ 新增
    "gameUrl": "http://localhost:3003", // ✅ 新增
    "gameSecret": null,                // ✅ 新增
    "gameConfig": null,                // ✅ 新增
    "isFeatured": 0,
    "modulePath": null,
    "status": 1,
    "sortOrder": 1,
    "creatorId": null,
    "publishTime": null,
    "consumePointsPerMinute": 1,
    "minFatigueToStart": 0,
    "onlineCount": 0,
    "createTime": 1234567890000,
    "updateTime": 1234567890000,
    "deleted": 0
  }
}
```

## 📋 问题原因

**数据库表结构** (`t_game`) 包含以下字段：
- `game_code`
- `game_name`
- `category`
- `grade`
- `icon_url`
- `cover_url` ✅
- `resource_url` ✅
- `description` ✅
- `module_path`
- `game_url` ✅
- `game_secret` ✅
- `game_config` ✅
- `status`
- ...等等

**Game 实体类** 缺少对应字段：
```java
// ❌ 缺失的字段
private String coverUrl;        // 游戏封面 URL
private String resourceUrl;     // 游戏资源 CDN 地址
private String description;     // 游戏描述
private String gameUrl;         // 游戏访问地址 URL
private String gameSecret;      // 游戏密钥
private String gameConfig;      // 游戏配置 JSON
```

导致 MyBatis-Plus 在查询时虽然从数据库获取了完整数据，但无法映射到实体类中，最终返回给前端的数据不完整。

## ✅ 修复方案

### 更新 Game 实体类

**文件**: `kids-game-dao/src/main/java/com/kidgame/dao/entity/Game.java`

**新增字段**:
```java
/**
 * 游戏封面 URL
 */
@TableField("cover_url")
private String coverUrl;

/**
 * 游戏资源 CDN 地址
 */
@TableField("resource_url")
private String resourceUrl;

/**
 * 游戏描述
 */
private String description;

/**
 * 游戏访问地址 URL（独立部署时使用）
 */
@TableField("game_url")
private String gameUrl;

/**
 * 游戏密钥（用于签名验证）
 */
@TableField("game_secret")
private String gameSecret;

/**
 * 游戏配置（透传给游戏的 JSON 配置）
 */
@TableField("game_config")
private String gameConfig;
```

### 字段说明

| 字段名 | 类型 | 数据库列 | 用途 | 示例 |
|--------|------|---------|------|------|
| `coverUrl` | String | `cover_url` | 游戏封面图 URL | `https://cdn.example.com/cover.jpg` |
| `resourceUrl` | String | `resource_url` | 游戏资源 CDN 地址 | `https://cdn.example.com/game.zip` |
| `description` | String | `description` | 游戏描述文本 | "经典贪吃蛇游戏，支持多种难度" |
| `gameUrl` | String | `game_url` | 独立部署的游戏访问地址 | `http://localhost:3003` |
| `gameSecret` | String | `game_secret` | 游戏密钥（签名验证用） | `abc123def456` |
| `gameConfig` | String | `game_config` | JSON 格式的游戏配置 | `{"difficulty":"easy","maxPlayers":4}` |

## 🎯 影响范围

### 直接影响的接口

1. **`GET /api/game/code/{gameCode}`** - 通过游戏代码获取游戏信息
   - ✅ 现在返回完整字段

2. **`GET /api/game/list`** - 获取游戏列表
   - ✅ 列表中的每个游戏也包含完整字段

3. **`GET /api/game/{gameId}`** - 获取游戏详情
   - ✅ 返回完整游戏信息

### 受益的前端功能

1. **游戏展示** - 可以显示游戏封面图
2. **游戏描述** - 可以展示游戏详细介绍
3. **独立部署** - 可以使用 `gameUrl` 访问游戏
4. **签名验证** - 可以使用 `gameSecret` 进行安全验证
5. **动态配置** - 可以读取 `gameConfig` 中的配置信息

## 📝 使用示例

### 前端调用示例

```typescript
// 请求
const game = await gameApi.getGameByCode('snake-vue3');

// 响应数据（修复后）
console.log('游戏名称:', game.gameName);
console.log('封面图:', game.coverUrl);
console.log('描述:', game.description);
console.log('游戏地址:', game.gameUrl);
console.log '图标:', game.iconUrl);
console.log('资源地址:', game.resourceUrl);

// 如果有游戏配置
if (game.gameConfig) {
  const config = JSON.parse(game.gameConfig);
  console.log('游戏配置:', config);
}
```

### 数据库数据示例

```sql
-- 查询 snake-vue3 游戏的完整数据
SELECT 
    game_code,
    game_name,
    cover_url,
    description,
    game_url,
    icon_url,
    resource_url
FROM t_game
WHERE game_code = 'SNAKE_VUE3';

-- 预期结果
-- game_code    : SNAKE_VUE3
-- game_name    : 贪吃蛇大冒险
-- cover_url    : (空字符串)
-- description  : 经典贪吃蛇游戏，控制小蛇吃食物，不断变长，挑战最高分！支持多种难度和稀有食物。
-- game_url     : http://localhost:3003
-- icon_url     : /images/games/snake-vue3/snake-icon.png
-- resource_url : NULL
```

## ⚠️ 注意事项

### 1. 数据库迁移

如果数据库中还没有这些字段，需要执行以下 SQL：

```sql
-- 确保 t_game 表包含所有必要字段
ALTER TABLE t_game 
ADD COLUMN IF NOT EXISTS cover_url VARCHAR(255) COMMENT '游戏封面 URL',
ADD COLUMN IF NOT EXISTS resource_url VARCHAR(255) COMMENT '游戏资源 CDN 地址',
ADD COLUMN IF NOT EXISTS description TEXT COMMENT '游戏描述',
ADD COLUMN IF NOT EXISTS game_url VARCHAR(255) COMMENT '游戏访问地址 URL（独立部署时使用）',
ADD COLUMN IF NOT EXISTS game_secret VARCHAR(255) COMMENT '游戏密钥（用于签名验证）',
ADD COLUMN IF NOT EXISTS game_config JSON COMMENT '游戏配置（透传给游戏的 JSON 配置）';
```

### 2. 数据初始化

确保游戏中有正确的数据：

```sql
UPDATE t_game 
SET 
    cover_url = '/images/games/snake-vue3/cover.jpg',
    description = '经典贪吃蛇游戏，控制小蛇吃食物，不断变长，挑战最高分！',
    game_url = 'http://localhost:3003'
WHERE game_code = 'SNAKE_VUE3';
```

### 3. 向后兼容

- ✅ 新增字段都是可选的（允许 NULL）
- ✅ 不影响现有功能
- ✅ 前端可以安全地访问这些字段（不存在时为 null）

## 🔧 验证步骤

### 1. 编译后端
```bash
cd kids-game-backend
.\compile.bat
```

### 2. 重启应用
```bash
.\start-backend.bat
```

### 3. 测试接口
```bash
# 使用 curl 测试
curl http://localhost:8080/api/game/code/snake-vue3 | jq

# 或者在浏览器访问
http://localhost:8080/api/game/code/snake-vue3
```

### 4. 验证字段完整性
检查返回的 JSON 是否包含以下字段：
- ✅ coverUrl
- ✅ resourceUrl
- ✅ description
- ✅ gameUrl
- ✅ gameSecret
- ✅ gameConfig

## 📊 修复前后对比

| 项目 | 修复前 | 修复后 |
|------|--------|--------|
| 实体类字段数 | 15 个 | 21 个 |
| 封面图字段 | ❌ 缺失 | ✅ coverUrl |
| 描述字段 | ❌ 缺失 | ✅ description |
| 游戏地址 | ❌ 缺失 | ✅ gameUrl |
| 资源配置 | ❌ 缺失 | ✅ resourceUrl, gameConfig |
| 安全密钥 | ❌ 缺失 | ✅ gameSecret |
| 数据库映射 | ⚠️ 部分映射 | ✅ 完整映射 |

---

**修复时间**: 2026-03-24  
**修复内容**: Game 实体类添加缺失字段  
**影响接口**: `/api/game/code/*`, `/api/game/list`, `/api/game/{gameId}`  
**状态**: ✅ 已完成，等待验证
