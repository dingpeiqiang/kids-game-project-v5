# Schema V2 数据库结构更新说明

## 更新时间
2026-03-23

## 版本变更
- **原版本**: schema_v2.sql v2.0
- **新版本**: schema_v2.sql v2.1

## 主要更新内容

### 1. 用户体系优化

#### t_user 表（统一用户表）
**新增字段**:
- `fatigue_points` - 疲劳点数（所有用户类型通用）
- `daily_answer_points` - 每日答题获得的疲劳点数
- `fatigue_update_time` - 疲劳点最后更新时间（毫秒时间戳）

**说明**: 
- 将疲劳点相关字段从 `t_user_profile` 提升到 `t_user` 表，提高查询性能
- 支持所有用户类型（儿童、家长、管理员）的疲劳点管理

### 2. 游戏模块增强

#### t_game 表（游戏信息表）
**新增字段**:
- `game_url` - 游戏访问地址 URL（独立部署时使用）
- `game_secret` - 游戏密钥（用于签名验证）
- `game_config` - 游戏配置（透传给游戏的 JSON 配置）

**说明**:
- 支持游戏的独立部署和统一认证
- 提供灵活的游戏配置机制

### 3. 主题系统（全新模块）

#### theme_info 表（主题信息表）
**字段**:
- `theme_id` - 主题 ID
- `author_id` - 作者 ID
- `is_official` - 是否为官方主题
- `owner_type` - 所有者类型（GAME/APPLICATION）
- `owner_id` - 所有者 ID
- `theme_name` - 主题名称
- `author_name` - 作者名称
- `price` - 价格（游戏币）
- `status` - 状态（on_sale/offline/pending）
- `download_count` - 下载次数
- `total_revenue` - 总收益
- `thumbnail_url` - 缩略图 URL
- `description` - 描述
- `config_json` - 主题配置（包含资源/样式）
- `is_default` - 是否为默认主题
- `created_at` - 创建时间
- `updated_at` - 更新时间

#### theme_game_relation 表（主题游戏关联表）
**字段**:
- `relation_id` - 关联 ID
- `theme_id` - 主题 ID
- `game_id` - 游戏 ID
- `game_code` - 游戏编码
- `is_default` - 是否为默认主题
- `create_time` - 创建时间
- `update_time` - 更新时间

#### theme_purchase 表（主题购买记录表）
**字段**:
- `purchase_id` - 购买 ID
- `user_id` - 用户 ID
- `theme_id` - 主题 ID
- `price_paid` - 实际支付价格
- `purchase_time` - 购买时间
- `status` - 状态（completed/refunded）

### 4. 创作者系统（全新模块）

#### creator_earnings 表（创作者收益表）
**字段**:
- `earnings_id` - 收益记录 ID
- `creator_id` - 创作者 ID
- `theme_id` - 主题 ID
- `amount` - 金额
- `status` - 状态（pending/withdrawn）
- `created_at` - 创建时间
- `withdrawn_at` - 提现时间

#### user_theme_preference 表（用户主题偏好表）
**字段**:
- `preference_id` - 偏好 ID
- `user_id` - 用户 ID
- `game_id` - 游戏 ID
- `theme_id` - 主题 ID
- `is_active` - 是否激活
- `create_time` - 创建时间
- `update_time` - 更新时间

### 5. 草稿系统（全新模块）

#### draft 表（草稿表）
**字段**:
- `draft_id` - 草稿 ID
- `author_id` - 作者 ID
- `author_type` - 作者类型（USER/ADMIN）
- `content_type` - 内容类型（THEME/GAME_CONFIG/ARTICLE 等）
- `draft_name` - 草稿名称
- `draft_title` - 草稿标题（可选）
- `content_json` - 草稿内容 JSON
- `metadata_json` - 元数据 JSON（扩展字段）
- `thumbnail_url` - 缩略图 URL
- `related_entity_type` - 关联实体类型
- `related_entity_id` - 关联实体 ID
- `status` - 状态（draft/archived/published）
- `content_size` - 内容大小（字节）
- `version` - 草稿版本号
- `created_at` - 创建时间
- `updated_at` - 更新时间
- `published_at` - 发布时间
- `tags` - 标签（逗号分隔）
- `remark` - 备注说明

#### draft_version 表（草稿版本表）
**字段**:
- `version_id` - 版本 ID
- `draft_id` - 草稿 ID
- `version_number` - 版本号
- `content_json` - 版本内容 JSON
- `created_at` - 创建时间
- `created_by` - 创建者 ID
- `change_description` - 变更说明

### 6. 排行榜系统（全新模块）

#### t_leaderboard_config 表（游戏排行榜配置表）
**字段**:
- `config_id` - 配置 ID
- `game_id` - 游戏 ID
- `dimension_code` - 维度代码
- `dimension_name` - 维度名称
- `dimension_type` - 维度类型（SCORE/TIME/COUNT）
- `sort_order` - 排序规则（ASC/DESC）
- `is_enabled` - 是否启用
- `create_time` - 创建时间
- `update_time` - 更新时间
- `deleted` - 逻辑删除

#### t_leaderboard_data 表（游戏排行榜数据表）
**字段**:
- `data_id` - 数据 ID
- `game_id` - 游戏 ID
- `user_id` - 用户 ID
- `username` - 用户名
- `nickname` - 昵称
- `avatar_url` - 头像 URL
- `dimension_code` - 维度代码
- `dimension_value` - 维度值（BIGINT）
- `decimal_value` - 小数值（DECIMAL）
- `rank_date` - 排行日期（YYYY-MM-DD）
- `rank_month` - 排行月份（YYYY-MM）
- `rank_year` - 排行年份（YYYY）
- `rank_type` - 排行类型（ALL/DAILY/MONTHLY/YEARLY）
- `create_time` - 创建时间
- `update_time` - 更新时间

### 7. 系统配置模块（优化）

#### t_system_config 表（系统配置表）
**字段**:
- `id` - 配置 ID
- `config_key` - 配置键
- `config_value` - 配置值
- `description` - 配置描述
- `config_group` - 配置分组（fatigue/game/answer/system）
- `create_time` - 创建时间
- `update_time` - 更新时间
- `deleted` - 逻辑删除

**初始化配置项**:
```sql
- fatigue.initial_points = 10 (初始疲劳点数)
- fatigue.daily_reset_time = 06:00 (每日重置时间)
- fatigue.max_points = 100 (最大疲劳点数)
- game.default_consume_rate = 1 (默认每分钟疲劳消耗)
- answer.points_per_correct = 1 (每答对一题获得的疲劳点)
- answer.daily_limit = 10 (每日答题获得疲劳点上限)
```

## 迁移指南

### 从 v2.0 迁移到 v2.1

1. **备份现有数据库**
```bash
mysqldump -u your_user -p kidsgame > backup_before_migration.sql
```

2. **执行表结构更新**
```sql
-- 更新 t_user 表
ALTER TABLE t_user 
ADD COLUMN fatigue_points INT DEFAULT 0 COMMENT '疲劳点数（所有用户类型通用）',
ADD COLUMN daily_answer_points INT DEFAULT 0 COMMENT '每日答题获得的疲劳点数',
ADD COLUMN fatigue_update_time BIGINT COMMENT '疲劳点最后更新时间（毫秒时间戳）';

-- 更新 t_game 表
ALTER TABLE t_game
ADD COLUMN game_url VARCHAR(255) COMMENT '游戏访问地址 URL（独立部署时使用）',
ADD COLUMN game_secret VARCHAR(255) COMMENT '游戏密钥（用于签名验证）',
ADD COLUMN game_config JSON COMMENT '游戏配置（透传给游戏的 JSON 配置）';
```

3. **创建新表**
```sql
-- 依次执行以下表的创建语句
-- theme_info
-- theme_game_relation
-- theme_purchase
-- creator_earnings
-- user_theme_preference
-- draft
-- draft_version
-- t_leaderboard_config
-- t_leaderboard_data
```

4. **数据迁移（如果需要）**
- 如果有旧的 t_kid 或 t_parent 表数据，需要迁移到 t_user
- 疲劳点数据从 t_user_profile 迁移到 t_user

### 注意事项

1. **字符集**: 所有表使用 utf8mb4 字符集
2. **时间戳**: 时间字段统一使用 BIGINT（毫秒时间戳）或 DATETIME
3. **逻辑删除**: 所有表都有 deleted 字段支持逻辑删除
4. **索引**: 已为常用查询字段添加索引
5. **外键**: 不使用物理外键，在应用层维护数据一致性

## 兼容性说明

- **向后兼容**: 新版本完全兼容旧版本的数据结构
- **API 兼容**: 现有 API 无需修改即可正常工作
- **渐进式迁移**: 可以逐步迁移，不影响系统运行

## 测试建议

1. 在开发环境先完整测试所有功能
2. 验证主题系统的创建、购买、应用流程
3. 测试草稿系统的保存、发布功能
4. 验证排行榜数据的记录和查询
5. 检查系统配置的正确加载

## 回滚方案

如果需要回滚到 v2.0：

```bash
# 使用备份文件恢复
mysql -u your_user -p kidsgame < schema_v2.sql.backup
```

## 相关文件

- 原始版本：`schema_v2.sql.backup`
- 更新版本：`schema_v2.sql`
- 实体类位置：`kids-game-dao/src/main/java/com/kidgame/dao/entity/`

## 更新日期

2026-03-23
