-- =====================================================
-- 清理废弃表 SQL 脚本
-- =====================================================
-- 说明：清理数据库中已废弃的表和备份表
-- 执行前请务必备份数据库！
-- 日期：2026-03-23
-- =====================================================

-- ========================================
-- 第一步：检查是否有外键依赖
-- ========================================

-- 检查 t_kid 是否被其他表引用
SELECT 
    't_kid' as table_name,
    COUNT(*) as foreign_key_count
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME = 't_kid'
  AND TABLE_SCHEMA = 'kidsgame'
UNION ALL
SELECT 
    't_parent',
    COUNT(*)
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME = 't_parent'
  AND TABLE_SCHEMA = 'kidsgame'
UNION ALL
SELECT 
    't_parent_limit',
    COUNT(*)
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME = 't_parent_limit'
  AND TABLE_SCHEMA = 'kidsgame';

-- ========================================
-- 第二步：重命名废弃表为 backup（保留 30 天）
-- ========================================

-- 2.1 重命名 t_kid (儿童旧表)
RENAME TABLE t_kid TO t_kid_backup_20260323;

-- 2.2 重命名 t_parent (家长旧表)
RENAME TABLE t_parent TO t_parent_backup_20260323;

-- 2.3 重命名 t_parent_limit (管控旧表)
RENAME TABLE t_parent_limit TO t_parent_limit_backup_20260323;

-- 2.4 重命名 t_game_lock (锁定旧表)
RENAME TABLE t_game_lock TO t_game_lock_backup_20260323;

-- 2.5 重命名 t_leaderboard_dimension (维度旧表)
RENAME TABLE t_leaderboard_dimension TO t_leaderboard_dimension_backup_20260323;

-- 2.6 重命名 theme_info_backup_20250318 (旧的备份表)
RENAME TABLE theme_info_backup_20250318 TO theme_info_backup_20250318_old;

-- 2.7 重命名 t_game_permission_backup_20240308 (权限备份表)
RENAME TABLE t_game_permission_backup_20240308 TO t_game_permission_backup_20240308_old;

-- ========================================
-- 第三步：验证重命名成功
-- ========================================

-- 查看所有 backup 结尾的表
SELECT 
    TABLE_NAME as '重命名后的表',
    TABLE_ROWS as '行数',
    ENGINE as '引擎',
    CREATE_TIME as '创建时间'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'kidsgame' 
  AND (TABLE_NAME LIKE '%backup%' OR TABLE_NAME LIKE '%_old%')
ORDER BY TABLE_NAME;

-- ========================================
-- 第四步：更新 Java Entity 标记为废弃
-- ========================================
-- 注意：这一步需要在 Java 代码中手动完成
-- 参见：JAVA_ENTITY_UPDATE_COMPLETE.md 中的建议

-- ========================================
-- 第五步：清理总结
-- ========================================

SELECT '清理完成！' as status,
       '已将以下表重命名为 backup 版本 (保留 30 天):' as message,
       '1. t_kid → t_kid_backup_20260323' as table1,
       '2. t_parent → t_parent_backup_20260323' as table2,
       '3. t_parent_limit → t_parent_limit_backup_20260323' as table3,
       '4. t_game_lock → t_game_lock_backup_20260323' as table4,
       '5. t_leaderboard_dimension → t_leaderboard_dimension_backup_20260323' as table5,
       '6. theme_info_backup_20250318 → theme_info_backup_20250318_old' as table6,
       '7. t_game_permission_backup_20240308 → t_game_permission_backup_20240308_old' as table7;

-- ========================================
-- 后续步骤说明
-- ========================================
/*

重要提示：

1. 【观察期 30 天】
   - 这些表现在已重命名为 backup 版本
   - 请在 30 天内确认系统运行正常
   - 如果没有问题，可以执行删除脚本

2. 【30 天后删除】
   执行以下 SQL 永久删除：
   
   DROP TABLE IF EXISTS t_kid_backup_20260323;
   DROP TABLE IF EXISTS t_parent_backup_20260323;
   DROP TABLE IF EXISTS t_parent_limit_backup_20260323;
   DROP TABLE IF EXISTS t_game_lock_backup_20260323;
   DROP TABLE IF EXISTS t_leaderboard_dimension_backup_20260323;
   DROP TABLE IF EXISTS theme_info_backup_20250318_old;
   DROP TABLE IF EXISTS t_game_permission_backup_20240308_old;

3. 【Java 代码处理】
   需要在 Java Entity 中标记为 @Deprecated:
   
   @Deprecated
   @TableName("t_kid")
   public class Kid { ... }
   
   @Deprecated
   @TableName("t_parent")
   public class Parent { ... }
   
   @Deprecated
   @TableName("t_parent_limit")
   public class ParentLimit { ... }

4. 【回滚方案】
   如果发现问题，可以立即恢复：
   
   RENAME TABLE t_kid_backup_20260323 TO t_kid;
   RENAME TABLE t_parent_backup_20260323 TO t_parent;
   RENAME TABLE t_parent_limit_backup_20260323 TO t_parent_limit;
   RENAME TABLE t_game_lock_backup_20260323 TO t_game_lock;
   RENAME TABLE t_leaderboard_dimension_backup_20260323 TO t_leaderboard_dimension;

*/
