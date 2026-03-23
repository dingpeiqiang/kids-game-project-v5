# Schema V2 数据库更新快速对比

## 文件说明
- **原始文件**: `schema_v2.sql.backup` (v2.0)
- **更新文件**: `schema_v2.sql` (v2.1)
- **更新时间**: 2026-03-23

## 主要变更概览

### ✅ 已更新的表

| 表名 | 变更类型 | 变更内容 |
|------|----------|----------|
| `t_user` | 新增字段 | + fatigue_points, daily_answer_points, fatigue_update_time |
| `t_game` | 新增字段 | + game_url, game_secret, game_config |

### ✨ 新增的表

| 模块 | 表名 | 说明 |
|------|------|------|
| **主题系统** | theme_info | 主题信息表 |
| | theme_game_relation | 主题游戏关联表 |
| | theme_purchase | 主题购买记录表 |
| | user_theme_preference | 用户主题偏好表 |
| **创作者系统** | creator_earnings | 创作者收益表 |
| **草稿系统** | draft | 草稿表 |
| | draft_version | 草稿版本表 |
| **排行榜系统** | t_leaderboard_config | 游戏排行榜配置表 |
| | t_leaderboard_data | 游戏排行榜数据表 |
| **系统配置** | t_system_config | 系统配置表 |

## 详细字段对比

### 1. t_user 表变更

#### v2.0 版本
```sql
CREATE TABLE t_user (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_type TINYINT NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    avatar VARCHAR(255),
    status TINYINT DEFAULT 1,
    account_expire_time BIGINT,
    password_expire_time BIGINT,
    last_login_time BIGINT,
    last_login_ip VARCHAR(50),
    create_time BIGINT,
    update_time BIGINT,
    deleted TINYINT DEFAULT 0
);
```

#### v2.1 版本（新增字段用 ➕ 标记）
```sql
CREATE TABLE t_user (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_type TINYINT NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) NOT NULL,
    avatar VARCHAR(255),
    status TINYINT DEFAULT 1,
    ➕ fatigue_points INT DEFAULT 0,           -- 新增
    ➕ daily_answer_points INT DEFAULT 0,      -- 新增
    ➕ fatigue_update_time BIGINT,             -- 新增
    account_expire_time BIGINT,
    password_expire_time BIGINT,
    last_login_time BIGINT,
    last_login_ip VARCHAR(50),
    create_time BIGINT,
    update_time BIGINT,
    deleted TINYINT DEFAULT 0
);
```

### 2. t_game 表变更

#### v2.0 版本
```sql
CREATE TABLE t_game (
    game_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_code VARCHAR(50) UNIQUE NOT NULL,
    game_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    grade VARCHAR(20),
    icon_url VARCHAR(255),
    cover_url VARCHAR(255),
    resource_url VARCHAR(255),
    description TEXT,
    module_path VARCHAR(255),
    status TINYINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    consume_points_per_minute INT DEFAULT 1,
    online_count INT DEFAULT 0,
    total_play_count BIGINT DEFAULT 0,
    total_play_duration BIGINT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    create_time BIGINT,
    update_time BIGINT,
    deleted TINYINT DEFAULT 0
);
```

#### v2.1 版本（新增字段用 ➕ 标记）
```sql
CREATE TABLE t_game (
    game_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    game_code VARCHAR(50) UNIQUE NOT NULL,
    game_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    grade VARCHAR(20),
    icon_url VARCHAR(255),
    cover_url VARCHAR(255),
    resource_url VARCHAR(255),
    description TEXT,
    module_path VARCHAR(255),
    ➕ game_url VARCHAR(255),              -- 新增
    ➕ game_secret VARCHAR(255),           -- 新增
    ➕ game_config JSON,                   -- 新增
    status TINYINT DEFAULT 1,
    sort_order INT DEFAULT 0,
    consume_points_per_minute INT DEFAULT 1,
    online_count INT DEFAULT 0,
    total_play_count BIGINT DEFAULT 0,
    total_play_duration BIGINT DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    create_time BIGINT,
    update_time BIGINT,
    deleted TINYINT DEFAULT 0
);
```

## 新增表结构示例

### theme_info 表
```sql
CREATE TABLE theme_info (
    theme_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    author_id BIGINT NOT NULL,
    is_official TINYINT DEFAULT 0,
    owner_type VARCHAR(20) NOT NULL,
    owner_id BIGINT NOT NULL,
    theme_name VARCHAR(100) NOT NULL,
    author_name VARCHAR(50),
    price INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'on_sale',
    download_count INT DEFAULT 0,
    total_revenue INT DEFAULT 0,
    thumbnail_url VARCHAR(255),
    description TEXT,
    config_json JSON,
    is_default TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### draft 表
```sql
CREATE TABLE draft (
    draft_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    author_id BIGINT NOT NULL,
    author_type VARCHAR(20) NOT NULL,
    content_type VARCHAR(20) NOT NULL,
    draft_name VARCHAR(100) NOT NULL,
    draft_title VARCHAR(200),
    content_json JSON,
    metadata_json JSON,
    thumbnail_url VARCHAR(255),
    related_entity_type VARCHAR(50),
    related_entity_id BIGINT,
    status VARCHAR(20) DEFAULT 'draft',
    content_size INT,
    version INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    published_at DATETIME,
    tags VARCHAR(255),
    remark VARCHAR(500)
);
```

## 初始化数据变更

### v2.1 新增系统配置初始化
```sql
INSERT INTO t_system_config (config_key, config_value, description, config_group) VALUES
('fatigue.initial_points', '10', '初始疲劳点数', 'fatigue'),
('fatigue.daily_reset_time', '06:00', '每日重置时间', 'fatigue'),
('fatigue.max_points', '100', '最大疲劳点数', 'fatigue'),
('game.default_consume_rate', '1', '默认每分钟疲劳消耗', 'game'),
('answer.points_per_correct', '1', '每答对一题获得的疲劳点', 'answer'),
('answer.daily_limit', '10', '每日答题获得疲劳点上限', 'answer');
```

## 影响范围评估

### 🔴 需要代码同步更新
- **User/Kid 实体类**: 需要添加 fatigue_points 等字段（✅ 已完成）
- **Game 实体类**: 需要添加 game_url 等字段（✅ 已完成）
- **Service 层**: 需要使用新的系统配置表

### 🟡 可选适配
- **主题系统**: 新增功能，可选择性集成
- **草稿系统**: 新增功能，可选择性集成
- **排行榜系统**: 新增功能，可选择性集成

### 🟢 向后兼容
- 所有现有 API 保持不变
- 现有业务逻辑不受影响
- 数据迁移可逐步进行

## 执行建议

### 开发环境（首次部署）
```bash
# 直接执行完整的 schema_v2.sql
mysql -u root -p kidsgame < schema_v2.sql
```

### 生产环境（从 v2.0 升级）
```bash
# 1. 备份数据库
mysqldump -u root -p kidsgame > backup_$(date +%Y%m%d).sql

# 2. 执行增量更新脚本
mysql -u root -p kidsgame < SCHEMA_V2_MIGRATION.sql
```

## 验证清单

- [ ] t_user 表包含 fatigue_points 字段
- [ ] t_user 表包含 daily_answer_points 字段
- [ ] t_user 表包含 fatigue_update_time 字段
- [ ] t_game 表包含 game_url 字段
- [ ] t_game 表包含 game_secret 字段
- [ ] t_game 表包含 game_config 字段
- [ ] theme_info 表已创建
- [ ] theme_game_relation 表已创建
- [ ] theme_purchase 表已创建
- [ ] creator_earnings 表已创建
- [ ] draft 表已创建
- [ ] draft_version 表已创建
- [ ] t_leaderboard_config 表已创建
- [ ] t_leaderboard_data 表已创建
- [ ] t_system_config 表已创建
- [ ] 系统配置初始化数据已插入

## 相关文档

- 详细更新说明：`SCHEMA_V2_UPDATE_SUMMARY.md`
- 原始备份文件：`schema_v2.sql.backup`
- 实体类位置：`kids-game-dao/src/main/java/com/kidgame/dao/entity/`

---
更新日期：2026-03-23
