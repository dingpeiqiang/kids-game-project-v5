-- 修复主题表的 owner_type 和 owner_id 字段问题
-- Date: 2026-03-21

USE kids_game;

-- 1. 添加 owner_type 和 owner_id 字段（如果不存在）
ALTER TABLE theme_info
ADD COLUMN IF NOT EXISTS `owner_type` VARCHAR(20) DEFAULT 'APPLICATION' COMMENT '所有者类型：GAME-游戏，APPLICATION-应用' AFTER `applicable_scope`;

ALTER TABLE theme_info
ADD COLUMN IF NOT EXISTS `owner_id` BIGINT COMMENT '所有者 ID（游戏 ID 或应用 ID）' AFTER `owner_type`;

-- 2. 根据 applicable_scope 迁移数据到 owner_type 和 owner_id
UPDATE theme_info
SET owner_type = 'APPLICATION'
WHERE applicable_scope = 'all' AND owner_type IS NULL OR owner_type = '';

UPDATE theme_info
SET owner_type = 'GAME'
WHERE applicable_scope = 'specific' AND (owner_type IS NULL OR owner_type = '');

-- 3. 根据 theme_game_relation 表更新 owner_id
UPDATE theme_info t
INNER JOIN theme_game_relation r ON t.theme_id = r.theme_id
SET t.owner_id = r.game_id
WHERE t.applicable_scope = 'specific' AND (t.owner_id IS NULL OR t.owner_id = 0);

-- 4. 为新字段添加索引
ALTER TABLE theme_info
ADD INDEX IF NOT EXISTS idx_owner_type (owner_type);

ALTER TABLE theme_info
ADD INDEX IF NOT EXISTS idx_owner_id (owner_id);

-- 5. 查看迁移后的数据
SELECT theme_id, theme_name, owner_type, owner_id, applicable_scope, status
FROM theme_info
ORDER BY theme_id;
