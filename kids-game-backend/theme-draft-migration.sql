-- 草稿功能数据库迁移脚本
-- Date: 2026-03-23

-- ============================================
-- 1. 创建草稿表
-- ============================================

CREATE TABLE IF NOT EXISTS `theme_draft` (
    `draft_id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '草稿 ID',
    `author_id` BIGINT NOT NULL COMMENT '作者 ID',
    `draft_name` VARCHAR(100) NOT NULL COMMENT '草稿名称',
    `theme_name` VARCHAR(100) COMMENT '主题名称',
    `owner_type` VARCHAR(20) NOT NULL DEFAULT 'GAME' COMMENT '适用范围：GAME-游戏主题，APPLICATION-应用主题',
    `owner_id` BIGINT COMMENT '所有者 ID（游戏主题时需要）',
    `config_json` JSON NOT NULL COMMENT '完整主题配置 (GTRS 格式)',
    `thumbnail_url` VARCHAR(500) COMMENT '缩略图 URL',
    `size` INT DEFAULT 0 COMMENT '草稿大小（字节）',
    `status` VARCHAR(20) DEFAULT 'draft' COMMENT '状态：draft-草稿',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`draft_id`),
    INDEX `idx_author_id` (`author_id`),
    INDEX `idx_owner_type` (`owner_type`),
    INDEX `idx_owner_id` (`owner_id`),
    INDEX `idx_updated_at` (`updated_at`),
    CONSTRAINT `fk_draft_author` FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='主题草稿表';

-- ============================================
-- 2. 查询示例
-- ============================================

-- 查询用户的所有草稿
-- SELECT 
--   draft_id,
--   draft_name,
--   theme_name,
--   owner_type,
--   owner_id,
--   size,
--   status,
--   created_at,
--   updated_at
-- FROM theme_draft
-- WHERE author_id = 1
-- ORDER BY updated_at DESC;

-- 查看草稿数量限制（建议每个用户最多保留 20 个草稿）
-- SELECT 
--   author_id,
--   COUNT(*) as draft_count
-- FROM theme_draft
-- GROUP BY author_id
-- HAVING draft_count > 20;

-- ============================================
-- 3. 清理过期草稿（可选）
-- ============================================

-- 删除 30 天未更新的草稿
-- DELETE FROM theme_draft 
-- WHERE updated_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
