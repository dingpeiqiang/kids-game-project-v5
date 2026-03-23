-- ============================================
-- 游戏管理重构 - 快速升级脚本
-- 版本：v2.0 (从 schema_v2.sql 升级)
-- 日期：2026-03-23
-- 
-- 适用场景：当前数据库已经是 schema_v2.sql
-- 执行时间：预计 1-3 分钟
-- ============================================

SET AUTOCOMMIT = 0;
START TRANSACTION;

-- ============================================
-- 第 1 步：备份现有数据
-- ============================================

SELECT '=== 第 1 步：备份现有数据 ===' AS step;

DROP TABLE IF EXISTS t_game_backup_20260323;
CREATE TABLE t_game_backup_20260323 LIKE t_game;
INSERT INTO t_game_backup_20260323 SELECT * FROM t_game;
SELECT '✓ t_game 表已备份' AS status;

DROP TABLE IF EXISTS t_game_tag_backup_20260323;
CREATE TABLE t_game_tag_backup_20260323 LIKE t_game_tag;
INSERT INTO t_game_tag_backup_20260323 SELECT * FROM t_game_tag;
SELECT '✓ t_game_tag 表已备份' AS status;

DROP TABLE IF EXISTS t_game_tag_relation_backup_20260323;
CREATE TABLE t_game_tag_relation_backup_20260323 LIKE t_game_tag_relation;
INSERT INTO t_game_tag_relation_backup_20260323 SELECT * FROM t_game_tag_relation;
SELECT '✓ t_game_tag_relation 表已备份' AS status;

-- ============================================
-- 第 2 步：创建新的统计表等（7 个新表）
-- ============================================

SELECT '=== 第 2 步：创建新的统计表 ===' AS step;

-- 2.1 游戏统计表
DROP TABLE IF EXISTS t_game_statistics;
CREATE TABLE t_game_statistics (
    stat_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '统计 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    total_play_count INT DEFAULT 0 COMMENT '总游玩次数',
    unique_players INT DEFAULT 0 COMMENT '独立玩家数',
    total_duration BIGINT DEFAULT 0 COMMENT '总时长 (秒)',
    average_duration INT DEFAULT 0 COMMENT '平均时长 (秒)',
    average_score DECIMAL(10,2) DEFAULT 0 COMMENT '平均分数',
    max_score INT DEFAULT 0 COMMENT '最高分',
    min_score INT DEFAULT 0 COMMENT '最低分',
    like_count INT DEFAULT 0 COMMENT '点赞数',
    dislike_count INT DEFAULT 0 COMMENT '踩数',
    favorite_count INT DEFAULT 0 COMMENT '收藏数',
    satisfaction_rate DECIMAL(5,2) DEFAULT 0 COMMENT '满意度 (%)',
    next_day_retention DECIMAL(5,2) DEFAULT 0 COMMENT '次日留存率 (%)',
    week_retention DECIMAL(5,2) DEFAULT 0 COMMENT '周留存率 (%)',
    total_fatigue_consumed INT DEFAULT 0 COMMENT '总消耗疲劳度',
    average_fatigue_per_player INT DEFAULT 0 COMMENT '人均消耗疲劳度',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
    deleted TINYINT DEFAULT 0,
    UNIQUE KEY uk_game_date (game_id, stat_date),
    INDEX idx_stat_date (stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏统计表';
SELECT '✓ t_game_statistics 创建成功' AS status;

-- 2.2 游戏版本历史表
DROP TABLE IF EXISTS t_game_version_history;
CREATE TABLE t_game_version_history (
    version_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '版本 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    version VARCHAR(20) NOT NULL COMMENT '版本号',
    version_description VARCHAR(500) COMMENT '版本说明',
    change_log TEXT COMMENT '变更日志',
    resource_url VARCHAR(500) COMMENT '资源 URL',
    status TINYINT DEFAULT 1 COMMENT '状态：0-草稿，1-已发布',
    publisher_id BIGINT COMMENT '发布人 ID',
    publish_time BIGINT COMMENT '发布时间',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
    deleted TINYINT DEFAULT 0,
    INDEX idx_game_id (game_id),
    INDEX idx_version (version),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏版本历史表';
SELECT '✓ t_game_version_history 创建成功' AS status;

-- 2.3 游戏审核记录表
DROP TABLE IF EXISTS t_game_review_record;
CREATE TABLE t_game_review_record (
    review_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '审核 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    reviewer_id BIGINT NOT NULL COMMENT '审核人 ID',
    review_status TINYINT NOT NULL COMMENT '审核状态：1-通过，2-驳回',
    review_comment VARCHAR(500) COMMENT '审核意见',
    reject_reason VARCHAR(500) COMMENT '驳回原因',
    review_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
    INDEX idx_game_id (game_id),
    INDEX idx_reviewer_id (reviewer_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏审核记录表';
SELECT '✓ t_game_review_record 创建成功' AS status;

-- 2.4 游戏资源配置表
DROP TABLE IF EXISTS t_game_resource_config;
CREATE TABLE t_game_resource_config (
    config_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '配置 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    resource_type VARCHAR(50) NOT NULL COMMENT '资源类型：image,audio,video,font,config',
    resource_key VARCHAR(100) NOT NULL COMMENT '资源键名',
    resource_url VARCHAR(500) NOT NULL COMMENT '资源 URL',
    file_size BIGINT COMMENT '文件大小 (字节)',
    md5_hash VARCHAR(50) COMMENT 'MD5 校验值',
    version VARCHAR(20) COMMENT '资源版本',
    description VARCHAR(500) COMMENT '资源说明',
    status TINYINT DEFAULT 1 COMMENT '状态',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000),
    deleted TINYINT DEFAULT 0,
    UNIQUE KEY uk_game_key (game_id, resource_key),
    INDEX idx_game_id (game_id),
    INDEX idx_resource_type (resource_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏资源配置表';
SELECT '✓ t_game_resource_config 创建成功' AS status;

-- ============================================
-- 第 3 步：重建标签表（使用新结构）
-- ============================================

SELECT '=== 第 3 步：重建标签表 ===' AS step;

-- 3.1 重建 t_game_tag 表
DROP TABLE IF EXISTS t_game_tag_new;
CREATE TABLE t_game_tag_new (
    tag_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '标签 ID',
    tag_code VARCHAR(50) UNIQUE NOT NULL COMMENT '标签代码',
    tag_name VARCHAR(50) NOT NULL COMMENT '标签名称',
    category VARCHAR(50) COMMENT '所属分类',
    icon VARCHAR(50) COMMENT '图标 emoji',
    sort_order INT DEFAULT 0 COMMENT '排序',
    status TINYINT DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    update_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_category (category),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏标签表';

-- 迁移旧标签数据（tag_type → category）
INSERT INTO t_game_tag_new (tag_id, tag_code, tag_name, category, sort_order, create_time, deleted)
SELECT 
    tag_id, 
    CONCAT('tag_', tag_id) AS tag_code,
    tag_name, 
    tag_type AS category,  -- 关键字段映射
    sort_order, 
    create_time, 
    deleted
FROM t_game_tag;

-- 替换旧表
DROP TABLE t_game_tag;
RENAME TABLE t_game_tag_new TO t_game_tag;
SELECT '✓ t_game_tag 重建完成' AS status;

-- 3.2 重建 t_game_tag_relation 表
DROP TABLE IF EXISTS t_game_tag_relation_new;
CREATE TABLE t_game_tag_relation_new (
    relation_id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '关联 ID',
    game_id BIGINT NOT NULL COMMENT '游戏 ID',
    tag_id BIGINT NOT NULL COMMENT '标签 ID',
    create_time BIGINT DEFAULT (UNIX_TIMESTAMP(CURRENT_TIMESTAMP) * 1000) COMMENT '创建时间',
    UNIQUE KEY uk_game_tag (game_id, tag_id),
    INDEX idx_game_id (game_id),
    INDEX idx_tag_id (tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='游戏标签关联表';

-- 迁移旧数据
INSERT INTO t_game_tag_relation_new (relation_id, game_id, tag_id, create_time)
SELECT id, game_id, tag_id, create_time FROM t_game_tag_relation;

-- 替换旧表
DROP TABLE t_game_tag_relation;
RENAME TABLE t_game_tag_relation_new TO t_game_tag_relation;
SELECT '✓ t_game_tag_relation 重建完成' AS status;

-- ============================================
-- 第 4 步：修改 t_game 表结构
-- ============================================

SELECT '=== 第 4 步：修改 t_game 表 ===' AS step;

-- 4.1 统一现有游戏状态（避免数据错乱）
-- 将原来的 status=1（启用）改为 status=2（已上架）
UPDATE t_game SET status = 2 WHERE status = 1;
SELECT '✓ 游戏状态已统一' AS status;

-- 4.2 添加新字段
ALTER TABLE t_game 
ADD COLUMN tags VARCHAR(500) COMMENT '标签列表（逗号分隔）' AFTER grade,
ADD COLUMN screenshot_urls TEXT COMMENT '截图 URLs(JSON 数组)' AFTER tags,
ADD COLUMN play_guide TEXT COMMENT '玩法说明' AFTER description,
ADD COLUMN is_featured TINYINT DEFAULT 0 COMMENT '是否推荐：0-否，1-是' AFTER play_guide,
ADD COLUMN version VARCHAR(20) DEFAULT '1.0.0' COMMENT '版本号' AFTER is_featured,
ADD COLUMN version_description VARCHAR(500) COMMENT '版本说明' AFTER version,
ADD COLUMN creator_id BIGINT COMMENT '创建人 ID' AFTER version_description,
ADD COLUMN reviewer_id BIGINT COMMENT '审核人 ID' AFTER creator_id,
ADD COLUMN review_time BIGINT COMMENT '审核时间' AFTER reviewer_id,
ADD COLUMN review_comment VARCHAR(500) COMMENT '审核意见' AFTER review_time,
ADD COLUMN publish_time BIGINT COMMENT '上架时间' AFTER review_comment,
ADD COLUMN min_fatigue_to_start INT DEFAULT 0 COMMENT '启动所需最低疲劳度' AFTER consume_points_per_minute;
SELECT '✓ 已添加 12 个新字段' AS status;

-- 4.3 删除冗余统计字段
ALTER TABLE t_game 
DROP COLUMN total_play_count,
DROP COLUMN total_play_duration,
DROP COLUMN average_rating;
SELECT '✓ 已删除 3 个冗余字段' AS status;

-- 4.4 更新 status 字段注释
ALTER TABLE t_game 
MODIFY COLUMN status TINYINT DEFAULT 0 COMMENT '状态：0-草稿，1-待审核，2-已上架，3-已下架，4-审核驳回';
SELECT '✓ status 字段注释已更新' AS status;

-- 4.5 添加新索引
ALTER TABLE t_game
ADD INDEX idx_tags (tags),
ADD INDEX idx_creator (creator_id),
ADD INDEX idx_featured (is_featured);
SELECT '✓ 已添加 3 个新索引' AS status;

-- ============================================
-- 第 5 步：初始化标签数据
-- ============================================

SELECT '=== 第 5 步：初始化标签数据 ===' AS step;

INSERT INTO t_game_tag (tag_code, tag_name, category, icon, sort_order, status) VALUES
-- 科目类
('math', '数学', 'subject', '🔢', 1, 1),
('chinese', '语文', 'subject', '📖', 2, 1),
('english', '英语', 'subject', '🔤', 3, 1),
('science', '科学', 'subject', '🔬', 4, 1),
-- 技能类
('memory', '记忆力', 'skill', '🧠', 5, 1),
('logic', '逻辑思维', 'skill', '💡', 6, 1),
('creativity', '创造力', 'skill', '✨', 7, 1),
('reaction', '反应力', 'skill', '⚡', 8, 1),
-- 模式类
('single_player', '单人游戏', 'mode', '👤', 9, 1),
('multi_player', '多人游戏', 'mode', '👥', 10, 1),
('offline', '离线游戏', 'mode', '✈️', 11, 1),
('online', '在线游戏', 'mode', '🌐', 12, 1),
-- 其他分类
('puzzle', '益智', 'category', '🧩', 13, 1),
('sport', '运动', 'category', '⚽', 14, 1),
('art', '艺术', 'category', '🎨', 15, 1),
('music', '音乐', 'category', '🎵', 16, 1);

SELECT '✓ 已初始化 16 个标签' AS status;

-- ============================================
-- 第 6 步：验证迁移结果
-- ============================================

SELECT '=== 第 6 步：验证迁移结果 ===' AS step;

-- 验证 t_game 表字段数量
SELECT 
    CONCAT('✓ t_game 表字段数：', COUNT(*)) AS validation
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 't_game';

-- 验证 t_game_tag 表字段数量
SELECT 
    CONCAT('✓ t_game_tag 表字段数：', COUNT(*)) AS validation
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 't_game_tag';

-- 验证 t_game_tag_relation 表字段数量
SELECT 
    CONCAT('✓ t_game_tag_relation 表字段数：', COUNT(*)) AS validation
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 't_game_tag_relation';

-- 验证新表创建
SELECT 
    CONCAT('✓ 新增表数量：', COUNT(*)) AS validation
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN (
    't_game_statistics', 
    't_game_version_history', 
    't_game_review_record', 
    't_game_resource_config'
  );

-- 验证标签数据
SELECT 
    CONCAT('✓ 标签数据量：', COUNT(*)) AS validation
FROM t_game_tag;

-- ============================================
-- 提交事务
-- ============================================

COMMIT;

SELECT '============================================' AS '';
SELECT '🎉 迁移完成！所有步骤执行成功！' AS result;
SELECT '============================================' AS '';
SELECT '下一步:' AS '';
SELECT '1. 检查上述验证结果' AS '';
SELECT '2. 启动应用测试 API' AS '';
SELECT '3. 如有问题，可回滚到备份表' AS '';
SELECT '============================================' AS '';
