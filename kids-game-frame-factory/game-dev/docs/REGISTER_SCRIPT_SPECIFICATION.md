# 🎯 游戏注册脚本编写规范 - Skills 优化指南

## 📋 核心问题

### 问题 1：SQL 与数据库模型不匹配 ❌

**典型错误**：
```sql
-- 错误的 INSERT 语句
INSERT INTO t_game (..., status, ...) VALUES (..., 1, ...);
-- status = 1 表示"待审核"，不是"已上架"！
```

**后果**：
- ❌ 游戏注册后无法在前台显示
- ❌ 需要手动修改数据库状态
- ❌ 容易混淆不同状态的含义

### 问题 2：status 值总是搞错 ❌

**常见错误**：
```sql
-- 错误理解
status = 1  -- 以为是"正常/已上架"
-- 实际含义：1 = "待审核"（未上架）
```

**正确理解**：
```sql
-- t_game.status 的 5 个状态
0 = 草稿        -- 还未提交
1 = 待审核      -- 等待管理员审核
2 = 已上架      -- ✅ 正常运营状态（前台可见）
3 = 已下架      -- 停止运营
4 = 审核驳回    -- 审核未通过
```

### 问题 3：game_url 格式错误 ❌

**常见错误**：
```sql
-- 错误示例
game_url = 'localhost:3005'           -- 缺少协议
game_url = '/games/plane-shooter'     -- 相对路径
game_url = ''                         -- 空字符串
```

**正确格式**：
```sql
-- 必须是完整的 HTTP URL
game_url = 'http://localhost:3005'
game_url = 'https://game.example.com'
```

## 🎯 数据库表结构详解

### t_game 表核心字段

```sql
CREATE TABLE t_game (
    game_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_code VARCHAR(50) UNIQUE NOT NULL,      -- 游戏代码标识
    game_name VARCHAR(100) NOT NULL,            -- 游戏名称
    category VARCHAR(50),                       -- 分类：ACTION, PUZZLE, EDUCATION 等
    grade VARCHAR(20),                          -- 适龄阶段：一年级，二年级等
    
    -- 资源相关
    icon_url VARCHAR(255),                      -- 图标 URL
    cover_url VARCHAR(255),                     -- 封面 URL
    resource_url VARCHAR(255),                  -- 资源 CDN 地址
    
    -- 部署相关
    module_path VARCHAR(255),                   -- 模块路径（内部路由）
    game_url VARCHAR(255),                      -- ⚠️ 完整 HTTP URL（独立部署）
    game_secret VARCHAR(255),                   -- 游戏密钥
    game_config JSON,                           -- 游戏配置 JSON
    
    -- ⚠️ 重要：状态字段（5 个状态）
    status TINYINT DEFAULT 0 COMMENT '状态：
        0 - 草稿（未提交）
        1 - 待审核（等待审核）
        2 - 已上架（✅ 正常运营）
        3 - 已下架（停止运营）
        4 - 审核驳回（未通过）
    ',
    
    -- 其他字段
    sort_order INT DEFAULT 0,
    is_featured TINYINT DEFAULT 0,
    consume_points_per_minute INT DEFAULT 1,
    online_count INT DEFAULT 0,
    
    create_time BIGINT,
    update_time BIGINT,
    deleted TINYINT DEFAULT 0
);
```

### 状态值详解（重点！）

| status 值 | 含义 | 前台是否可见 | 使用场景 |
|-----------|------|-------------|---------|
| **0** | 草稿 | ❌ 不可见 | 刚创建还未提交 |
| **1** | 待审核 | ❌ 不可见 | 已提交等待审核 |
| **2** | ✅ 已上架 | ✅ **可见** | **正常运营状态** |
| **3** | 已下架 | ❌ 不可见 | 主动下架 |
| **4** | 审核驳回 | ❌ 不可见 | 审核未通过 |

**关键认知**：
> **新游戏注册必须使用 `status = 2`（已上架），才能在前台显示！**

## ✅ 正确的 SQL 脚本模板

### 标准模板（推荐）

```sql
-- ============================================================
-- ✈️ 飞机大战游戏注册脚本
-- ============================================================
-- 用途：将飞机大战游戏注册到 Kids Game 平台数据库
-- 版本：v1.0.0
-- 创建时间：2026-03-28
-- ============================================================

-- 设置字符集
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ✅ 关键：指定使用的数据库
USE kids_game;

-- ============================================================
-- 1. 注册游戏基本信息
-- ============================================================
INSERT INTO t_game (
  game_code,                        -- 游戏代码标识
  game_name,                        -- 游戏名称
  category,                         -- 游戏分类
  grade,                            -- 适合年级
  tags,                             -- 标签列表
  icon_url,                         -- 图标 URL
  cover_url,                        -- 封面 URL
  resource_url,                     -- 资源目录
  screenshot_urls,                  -- 截图 URLs
  game_url,                         -- ⚠️ 完整 HTTP URL
  game_secret,                      -- 游戏密钥
  game_config,                      -- 游戏配置 JSON
  description,                      -- 游戏描述
  play_guide,                       -- 玩法说明
  module_path,                      -- 模块路径
  status,                           -- ⚠️ 状态值（2=已上架）
  sort_order,                       -- 排序顺序
  is_featured,                      -- 是否推荐
  consume_points_per_minute,        -- 每分钟消耗积分
  min_fatigue_to_start,             -- 开始游戏最小疲劳值
  online_count,                     -- 在线人数
  total_play_count,                 -- 总游玩次数
  total_play_duration,              -- 总游玩时长
  average_rating,                   -- 平均评分
  create_time,                      -- 创建时间戳
  update_time,                      -- 更新时间戳
  deleted,                          -- 是否删除
  creator_id,                       -- 创建者 ID
  publish_time                      -- 发布时间戳
) VALUES (
  'PLANE_SHOOTER',                  -- game_code: 飞机大战代码
  '飞机大战',                        -- game_name: 中文名称
  'ACTION',                         -- category: 动作类游戏
  '三年级',                          -- grade: 适合三年级及以上
  '射击，闯关，挑战',                -- tags: 标签列表
  '/themes/default/assets/scene/player.png',  -- icon_url: 玩家飞机图标
  '/themes/default/assets/scene/background.png', -- cover_url: 背景封面
  NULL,                             -- resource_url: 无外部资源
  NULL,                             -- screenshot_urls: 暂无截图
  'http://localhost:3005',          -- ✅ game_url: 完整 HTTP URL
  NULL,                             -- game_secret: 暂无密钥
  NULL,                             -- game_config: 暂无配置
  '经典飞机大战游戏，驾驶战机射击敌机，躲避撞击，挑战最高分！支持多种道具和连击系统。', -- description
  NULL,                             -- play_guide: 玩法说明
  NULL,                             -- module_path: 内部模块路径
  2,                                -- ✅ status: 已上架（前台可见）
  2,                                -- sort_order: 排序第 2
  0,                                -- is_featured: 非推荐
  1,                                -- consume_points_per_minute: 每分钟 1 积分
  0,                                -- min_fatigue_to_start: 无需疲劳值
  0,                                -- online_count: 初始为 0
  0,                                -- total_play_count: 初始为 0
  0,                                -- total_play_duration: 初始为 0
  0.00,                             -- average_rating: 初始为 0
  UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,  -- create_time
  UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000,  -- update_time
  0,                                -- deleted: 未删除
  NULL,                             -- creator_id: 未知创建者
  NULL                              -- publish_time: 暂未发布
);

-- ============================================================
-- 2. 注册主题信息
-- ============================================================
INSERT INTO t_theme_info (
  author_id,
  is_official,
  owner_type,
  owner_id,
  theme_name,
  author_name,
  price,
  status,
  download_count,
  total_revenue,
  thumbnail_url,
  description,
  config_json,
  is_default,
  created_at,
  updated_at
) VALUES (
  0,                                -- author_id: 官方
  1,                                -- is_official: 官方主题
  'GAME',                           -- owner_type: 游戏类型
  LAST_INSERT_ID(),                 -- owner_id: 关联刚插入的游戏 ID
  '飞机大战 - 太空迷彩',              -- theme_name: 主题名称
  '官方团队',                        -- author_name: 作者
  0,                                -- price: 免费
  'on_sale',                        -- status: 销售中
  0,                                -- download_count: 下载次数
  0,                                -- total_revenue: 总收入
  '/themes/default/assets/scene/background.png', -- thumbnail_url
  '飞机大战官方默认主题，太空迷彩风格，适合三年级及以上学生', -- description
  '{}',                             -- config_json: 空配置
  1,                                -- is_default: 默认主题
  NOW(),                            -- created_at
  NOW()                             -- updated_at
);

SET FOREIGN_KEY_CHECKS = 1;
```

## 📝 检查清单

### SQL 编写前检查

- [ ] **确认数据库表结构**
  - 查看 `schema_v2.sql` 中的最新定义
  - 确认字段名称、类型、注释
  - 特别注意状态字段的枚举值

- [ ] **确认 status 值**
  - t_game.status = 2（已上架）✅
  - t_theme_info.status = 'on_sale'（销售中）✅

- [ ] **确认 game_url 格式**
  - 必须是完整的 HTTP/HTTPS URL
  - 不能是相对路径
  - 不能缺少协议头

### SQL 编写中检查

- [ ] **字段对应关系**
  - INSERT 字段顺序与表结构一致
  - VALUES 值顺序与字段一一对应
  - 字符串使用单引号包裹

- [ ] **必填字段**
  - game_code（唯一标识）
  - game_name（游戏名称）
  - category（分类）
  - grade（适龄阶段）
  - status（状态值）
  - create_time/update_time（时间戳）

- [ ] **可选字段处理**
  - 暂时不用的字段设为 NULL
  - 数值型字段设默认值 0
  - JSON 字段设 NULL 或 '{}'

### SQL 编写后验证

- [ ] **执行测试**
  ```bash
  mysql -u root -p kids_game < register-game.sql
  ```

- [ ] **查询验证**
  ```sql
  -- 验证游戏注册
  SELECT game_code, game_name, status FROM t_game 
  WHERE game_code = 'PLANE_SHOOTER';
  
  -- 验证状态是否正确
  SELECT game_name, 
    CASE status 
      WHEN 0 THEN '草稿'
      WHEN 1 THEN '待审核'
      WHEN 2 THEN '已上架'
      WHEN 3 THEN '已下架'
      WHEN 4 THEN '审核驳回'
    END AS status_name
  FROM t_game WHERE game_code = 'PLANE_SHOOTER';
  
  -- 验证 game_url 格式
  SELECT game_name, game_url FROM t_game 
  WHERE game_url LIKE 'http%';
  ```

- [ ] **前台验证**
  - 访问游戏列表页面
  - 确认新游戏显示
  - 确认可以正常启动

## 🔧 常见错误案例

### 错误案例 1：status = 1

```sql
-- ❌ 错误：status = 1（待审核）
INSERT INTO t_game (..., status, ...) VALUES (..., 1, ...);

-- 结果：游戏注册成功但前台不显示
-- 解决：改为 status = 2
INSERT INTO t_game (..., status, ...) VALUES (..., 2, ...);
```

### 错误案例 2：game_url 缺少协议

```sql
-- ❌ 错误：缺少 http://
game_url = 'localhost:3005'

-- ✅ 正确：完整 URL
game_url = 'http://localhost:3005'
```

### 错误案例 3：字段不匹配

```sql
-- ❌ 错误：使用了不存在的字段
INSERT INTO t_game (total_play_count, average_rating, ...) VALUES (...);
-- schema_v2.sql 中这些字段已被删除！

-- ✅ 正确：删除冗余字段
INSERT INTO t_game (...) VALUES (...);
-- 只保留现有字段
```

## 💡 最佳实践

### 1. 始终参考最新 Schema

**做法**：
```bash
# 查看最新表结构
cat kids-game-backend/kids-game-web/src/main/resources/schema_v2.sql | grep -A 50 "CREATE TABLE t_game"
```

**不要**：
- ❌ 凭记忆编写 SQL
- ❌ 复制过时的脚本
- ❌ 假设字段存在

### 2. 使用模板化脚本

**好处**：
- ✅ 减少错误
- ✅ 提高效率
- ✅ 易于维护

**示例**：
```sql
-- 使用标准模板
-- 只需要修改 VALUES 部分的具体值
-- 字段名和顺序已经固定好
```

### 3. 自动化验证

**建议工具**：
```javascript
// validate-register-script.js
import fs from 'fs';
import mysql from 'mysql2/promise';

async function validateScript(sqlFile) {
  const sql = fs.readFileSync(sqlFile, 'utf-8');
  
  // 检查是否包含 USE 语句
  if (!sql.includes('USE kids_game')) {
    throw new Error('缺少 USE kids_game 语句');
  }
  
  // 检查 status 值
  const statusMatch = sql.match(/status.*VALUES.*?,\s*(\d),/);
  if (statusMatch && statusMatch[1] !== '2') {
    throw new Error(`status 应该是 2，实际是 ${statusMatch[1]}`);
  }
  
  // 检查 game_url 格式
  const urlMatch = sql.match(/game_url.*?'([^']+)'/);
  if (urlMatch && !urlMatch[1].startsWith('http')) {
    throw new Error(`game_url 应该以 http 开头：${urlMatch[1]}`);
  }
  
  console.log('✅ SQL 脚本验证通过');
}
```

## 📚 相关文档

- **[REGISTER_GAME_DB_FIX.md](./REGISTER_GAME_DB_FIX.md)** - 数据库配置问题修复
- **[GENERATE_RESOURCES_OPTIMIZATION.md](./GENERATE_RESOURCES_OPTIMIZATION.md)** - 资源生成优化
- **[GTRS_PATH_FIX.md](./GTRS_PATH_FIX.md)** - GTRS 路径规范化
- **schema_v2.sql** - 数据库基准版本

## 🎯 总结

**核心要点**：
1. ✅ **status 必须 = 2**（已上架），游戏才能在前台显示
2. ✅ **game_url 必须是完整 HTTP URL**（http://或 https://开头）
3. ✅ **SQL 必须与 schema_v2.sql 表结构完全匹配**
4. ✅ **必须先执行 USE kids_game 指定数据库**

**三个不要**：
- ❌ 不要凭记忆写 SQL（要查 schema）
- ❌ 不要用 status = 1（那是待审核）
- ❌ 不要省略 http://（URL 不完整）

**记住**：
> **细节决定成败，规范保证质量！** 🎮✨
