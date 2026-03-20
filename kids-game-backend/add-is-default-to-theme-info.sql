-- 为 theme_info 表添加 is_default 字段
-- 用于标记是否为默认主题（简化设计，不使用关系表）
-- Date: 2026-03-17

-- ============================================
-- 1. 添加 is_default 字段到 theme_info
-- ============================================

-- 检查字段是否已存在，不存在则添加
ALTER TABLE `theme_info` 
ADD COLUMN IF NOT EXISTS `is_default` TINYINT DEFAULT 0 COMMENT '是否为默认主题：0-否，1-是' AFTER `config_json`;

-- 添加索引以优化查询
ALTER TABLE `theme_info` 
ADD INDEX IF NOT EXISTS `idx_is_default` (`is_default`);

-- ============================================
-- 2. 数据初始化
-- ============================================

-- 如果没有默认主题，将第一个主题设为默认
UPDATE theme_info 
SET is_default = 1 
WHERE theme_id = (
    SELECT MIN(theme_id) 
    FROM (
        SELECT theme_id 
        FROM theme_info 
        WHERE applicable_scope = 'all' 
        AND status = 'on_sale'
    ) AS temp
);

-- ============================================
-- 3. 验证
-- ============================================

-- 查看表结构
DESCRIBE theme_info;

-- 查看所有主题及其默认状态
SELECT 
    theme_id,
    theme_name,
    applicable_scope,
    is_default,
    status,
    created_at
FROM theme_info
ORDER BY is_default DESC, theme_id;
