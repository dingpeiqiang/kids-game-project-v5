-- ================================================
-- 数据库结构差异分析与修正脚本
-- 比对时间：2026-03-28
-- 比对对象：schema_v2.sql vs 实际数据库 kidgame
-- ================================================

-- ================================================
-- 发现的差异汇总
-- ================================================

/*
差异 1: t_theme_info.owner_type 默认值不一致
  - schema_v2.sql: 无默认值
  - 实际数据库：APPLICATION
  
差异 2: t_user_theme_preference 结构不一致
  - schema_v2.sql: owner_type 无默认值，owner_id 允许 NULL
  - 实际数据库：owner_type 无默认值，owner_id 不允许 NULL
  
差异 3: t_system_config 字段缺失
  - schema_v2.sql 缺少 config_type 和 status 字段
  - 实际数据库有这两个字段（已通过 ALTER TABLE 添加）
  
差异 4: t_game 字段长度不一致
  - schema_v2.sql: game_url VARCHAR(255), game_secret VARCHAR(255)
  - 实际数据库：game_url VARCHAR(500), game_secret VARCHAR(100)
  
差异 5: t_game_session 缺少 session_token 字段
  - schema_v2.sql: 无此字段
  - 实际数据库：有 session_token 字段
  
差异 6: t_daily_stats 字段缺失
  - schema_v2.sql: 缺少 total_fatigue_points 和 total_consumed_points
  - 实际数据库有这两个字段

差异 7: t_theme_assets 外键引用错误
  - schema_v2.sql: REFERENCES theme_info(theme_id)
  - 应该是：REFERENCES t_theme_info(theme_id)
*/

-- ================================================
-- 修正 SQL
-- ================================================

-- 修正 1: t_theme_info.owner_type 默认值修正为 GAME（根据业务逻辑和现有数据，应该是 GAME）
-- 注意：数据库中当前默认值为 'APPLICATION'，但实际数据都是 'GAME'，需要修正
ALTER TABLE t_theme_info 
MODIFY COLUMN owner_type VARCHAR(20) NOT NULL DEFAULT 'GAME' COMMENT '所有者类型：GAME-游戏，APPLICATION-应用';

-- 修正 2: t_user_theme_preference 结构修正（保持与数据库一致）
-- 注意：这个表在 schema_v2.sql 中定义了两次，需要统一
-- 第一次定义在第 496-508 行，第二次在第 782-795 行
-- 第二次的定义是正确的，应该保留第二次的定义

-- 修正 3: t_system_config 字段已经存在，无需修正
-- 但需要在 schema_v2.sql 中补充这两个字段的定义

-- 修正 4: t_game 字段长度已在 schema_v2.sql 第 801-804 行修正，无需额外操作

-- 修正 5: t_game_session 的 session_token 字段已在 schema_v2.sql 第 811-813 行添加，无需额外操作

-- 修正 6: t_daily_stats 字段已在 schema_v2.sql 第 815-818 行添加，无需额外操作

-- 修正 7: t_theme_assets 外键引用修正
-- 需要将 theme_info 改为 t_theme_info
ALTER TABLE t_theme_assets 
DROP FOREIGN KEY fk_theme_assets_theme;

ALTER TABLE t_theme_assets
ADD CONSTRAINT fk_theme_assets_theme 
    FOREIGN KEY (theme_id) REFERENCES t_theme_info(theme_id) ON DELETE CASCADE;

-- ================================================
-- 补充缺失的表定义（在实际数据库中存在但 schema_v2.sql 中没有的）
-- ================================================

-- 这些表在实际数据库中存在但在 schema_v2.sql 中没有定义：
-- t_game_resource_config
-- t_game_review_record  
-- t_game_statistics
-- t_game_version_history
-- t_leaderboard_dimension
-- t_user_achievement
-- t_user_action_log
-- t_user_level
-- t_user_request
-- t_relation_confirmation

-- ================================================
-- 执行完成
-- ================================================
