# /api/game/code/{gameCode} 接口修复 - 快速参考

## 🎯 问题速览

**接口**: `/api/game/code/snake-vue3`  
**问题**: 返回的游戏信息缺少封面图、描述、游戏地址等字段  
**原因**: Game 实体类缺少对应数据库字段的属性  
**解决**: 添加 6 个缺失字段到 Game 实体类

## ✅ 已添加的字段

| 字段名 | 类型 | 数据库列 | 说明 |
|--------|------|---------|------|
| `coverUrl` | String | `cover_url` | 游戏封面 URL |
| `resourceUrl` | String | `resource_url` | 游戏资源 CDN 地址 |
| `description` | String | `description` | 游戏描述 |
| `gameUrl` | String | `game_url` | 游戏访问地址（独立部署） |
| `gameSecret` | String | `game_secret` | 游戏密钥（签名验证） |
| `gameConfig` | String | `game_config` | JSON 游戏配置 |

## 📝 修改的文件

**文件路径**: `kids-game-dao/src/main/java/com/kidgame/dao/entity/Game.java`

**修改内容**:
```java
// 在 iconUrl 字段后添加以下 6 个字段：

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

## 🔧 验证方法

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
curl http://localhost:8080/api/game/code/snake-vue3
```

### 4. 检查返回数据
应包含以下字段：
- ✅ `"coverUrl"` - 封面图
- ✅ `"description"` - 游戏描述
- ✅ `"gameUrl"` - 游戏地址
- ✅ `"resourceUrl"` - 资源地址
- ✅ `"gameSecret"` - 游戏密钥
- ✅ `"gameConfig"` - 游戏配置

## 📊 受影响的接口

所有返回 Game 实体的接口都会自动包含新字段：

1. `GET /api/game/code/{gameCode}` - 按游戏代码查询 ✅
2. `GET /api/game/list` - 获取游戏列表 ✅
3. `GET /api/game/{gameId}` - 获取游戏详情 ✅

## 💡 使用示例

### 前端调用
```typescript
// 获取游戏信息
const response = await fetch('http://localhost:8080/api/game/code/snake-vue3');
const result = await response.json();
const game = result.data;

// 使用新字段
console.log('游戏名称:', game.gameName);
console.log('封面图:', game.coverUrl);
console.log('描述:', game.description);
console.log('游戏地址:', game.gameUrl);

// 如果有配置信息
if (game.gameConfig) {
  const config = JSON.parse(game.gameConfig);
  console.log('配置:', config);
}
```

### 数据库查询
```sql
-- 查看 snake-vue3 的完整信息
SELECT 
    game_code,
    game_name,
    cover_url,
    description,
    game_url,
    icon_url,
    resource_url,
    game_config
FROM t_game
WHERE game_code = 'SNAKE_VUE3';
```

## ⚠️ 注意事项

### 1. 数据库字段必须存在
确保 `t_game` 表包含以下字段：
- `cover_url`
- `resource_url`
- `description`
- `game_url`
- `game_secret`
- `game_config`

如果不存在，执行：
```sql
ALTER TABLE t_game ADD COLUMN IF NOT EXISTS cover_url VARCHAR(255);
ALTER TABLE t_game ADD COLUMN IF NOT EXISTS resource_url VARCHAR(255);
ALTER TABLE t_game ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE t_game ADD COLUMN IF NOT EXISTS game_url VARCHAR(255);
ALTER TABLE t_game ADD COLUMN IF NOT EXISTS game_secret VARCHAR(255);
ALTER TABLE t_game ADD COLUMN IF NOT EXISTS game_config JSON;
```

### 2. 数据初始化
```sql
UPDATE t_game 
SET 
    cover_url = '/images/games/snake-vue3/cover.jpg',
    description = '经典贪吃蛇游戏',
    game_url = 'http://localhost:3003'
WHERE game_code = 'SNAKE_VUE3';
```

### 3. 空值处理
前端使用时注意判空：
```typescript
// 安全访问可能为 null 的字段
const coverUrl = game.coverUrl || '';
const description = game.description || '暂无描述';
const gameUrl = game.gameUrl || '';

// JSON 解析前检查
const config = game.gameConfig ? JSON.parse(game.gameConfig) : {};
```

---

**修复状态**: ✅ 已完成  
**影响范围**: 所有使用 Game 实体的接口  
**向后兼容**: ✅ 完全兼容（新增字段允许 NULL）
