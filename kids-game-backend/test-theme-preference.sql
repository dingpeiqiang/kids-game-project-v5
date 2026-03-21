-- ============================================
-- 主题偏好系统快速测试 SQL
-- Date: 2026-03-21
-- ============================================

-- 1. 验证表结构
SELECT '=== 表结构验证 ===' AS '';
DESCRIBE user_theme_preference;

-- 2. 验证索引
SELECT '=== 索引验证 ===' AS '';
SHOW INDEX FROM user_theme_preference;

-- 3. 插入测试数据
SELECT '=== 插入测试数据 ===' AS '';

-- 假设有以下用户和游戏
-- 用户 ID: 1, 2
-- 游戏 ID: 1 (plane-shooter), 2 (snake-vue3)
-- 主题 ID: 1, 2, 3

-- 用户 1 为游戏 1 设置主题 1
INSERT INTO user_theme_preference (user_id, owner_type, owner_id, theme_id, is_active)
VALUES (1, 'GAME', 1, 1, 1)
ON DUPLICATE KEY UPDATE theme_id = 1, updated_at = NOW();

-- 用户 1 为游戏 2 设置主题 2
INSERT INTO user_theme_preference (user_id, owner_type, owner_id, theme_id, is_active)
VALUES (1, 'GAME', 2, 2, 1)
ON DUPLICATE KEY UPDATE theme_id = 2, updated_at = NOW();

-- 用户 2 为游戏 1 设置主题 3（不同用户偏好不同）
INSERT INTO user_theme_preference (user_id, owner_type, owner_id, theme_id, is_active)
VALUES (2, 'GAME', 1, 3, 1)
ON DUPLICATE KEY UPDATE theme_id = 3, updated_at = NOW();

SELECT '✅ 测试数据插入成功' AS '';

-- 4. 查询测试结果
SELECT '=== 用户 1 的主题偏好 ===' AS '';
SELECT 
  utp.preference_id,
  utp.user_id,
  utp.owner_type,
  utp.owner_id,
  utp.theme_id,
  ti.theme_name,
  ti.author_name,
  utp.is_active,
  utp.created_at,
  utp.updated_at
FROM user_theme_preference utp
LEFT JOIN theme_info ti ON utp.theme_id = ti.theme_id
WHERE utp.user_id = 1
ORDER BY utp.owner_type, utp.owner_id;

SELECT '=== 用户 2 的主题偏好 ===' AS '';
SELECT 
  utp.preference_id,
  utp.user_id,
  utp.owner_type,
  utp.owner_id,
  utp.theme_id,
  ti.theme_name,
  ti.author_name,
  utp.is_active,
  utp.created_at,
  utp.updated_at
FROM user_theme_preference utp
LEFT JOIN theme_info ti ON utp.theme_id = ti.theme_id
WHERE utp.user_id = 2
ORDER BY utp.owner_type, utp.owner_id;

-- 5. 验证唯一约束
SELECT '=== 测试唯一约束（应该失败或更新） ===' AS '';
-- 再次执行相同的插入，应该触发 ON DUPLICATE KEY UPDATE
INSERT INTO user_theme_preference (user_id, owner_type, owner_id, theme_id, is_active)
VALUES (1, 'GAME', 1, 2, 1)
ON DUPLICATE KEY UPDATE theme_id = 2, updated_at = NOW();

-- 查看更新后的结果
SELECT '=== 验证用户 1 游戏 1 的主题已更新 ===' AS '';
SELECT user_id, owner_id, theme_id, updated_at 
FROM user_theme_preference 
WHERE user_id = 1 AND owner_id = 1;

-- 6. 统计信息
SELECT '=== 统计信息 ===' AS '';
SELECT 
  COUNT(DISTINCT user_id) AS total_users,
  COUNT(DISTINCT owner_id) AS total_games,
  COUNT(*) AS total_preferences
FROM user_theme_preference
WHERE is_active = 1;

-- 7. 清理测试数据（可选）
-- SELECT '=== 清理测试数据 ===' AS '';
-- DELETE FROM user_theme_preference WHERE user_id IN (1, 2);

SELECT '✅ 所有测试完成！' AS '';
