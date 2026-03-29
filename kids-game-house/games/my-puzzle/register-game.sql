-- ============================================================
-- 游戏注册 SQL 模板
-- ============================================================
-- 使用前请替换以下占位符：
--   my-puzzle  - 游戏代码（如：my-game）
--   拼图游戏  - 游戏名称（如：我的游戏）
--   __GAME_ICON__  - 游戏图标 URL
--   __THEME_ID__   - 默认主题 ID
-- ============================================================

-- 1. 插入游戏记录
INSERT INTO game (code, name, icon, status, create_time, update_time)
VALUES (
  'my-puzzle',
  '拼图游戏',
  '__GAME_ICON__',
  1,  -- 1 = 上线状态
  NOW(),
  NOW()
)
ON DUPLICATE KEY UPDATE 
  name = VALUES(name),
  icon = VALUES(icon),
  update_time = NOW();

-- 2. 获取游戏 ID
SET @game_id = (SELECT id FROM game WHERE code = 'my-puzzle' LIMIT 1);

-- 3. 插入默认主题（如果主题表存在）
-- INSERT INTO theme (game_id, theme_id, theme_name, is_default, create_time)
-- VALUES (@game_id, '__THEME_ID__', '默认主题', 1, NOW())
-- ON DUPLICATE KEY UPDATE theme_name = VALUES(theme_name);

-- 4. 验证插入结果
SELECT 
  id AS game_id,
  code,
  name,
  status
FROM game 
WHERE code = 'my-puzzle';
