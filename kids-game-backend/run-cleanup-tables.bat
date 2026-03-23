@echo off
REM =====================================================
REM 清理废弃表执行脚本
REM =====================================================
REM 功能：将废弃表重命名为 backup 版本（保留 30 天）
REM 日期：2026-03-23
REM =====================================================

echo ======================================
echo 清理废弃表 - 第一阶段（重命名）
echo ======================================
echo.

REM 设置数据库连接参数
set DB_HOST=106.54.7.205
set DB_PORT=3306
set DB_USER=kidsgame
set DB_NAME=kidsgame
set DB_PASSWORD=kidsgame2024

echo [步骤 1/4] 备份当前数据库...
echo.

REM 第一步：备份数据库
set BACKUP_FILE=cleanup_backup_%DATE:~0,4%%DATE:~5,2%%DATE:~8,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%.sql
set BACKUP_FILE=%BACKUP_FILE: =0%
set MYSQL_PWD=%DB_PASSWORD%

mysqldump -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% --single-transaction --quick %DB_NAME% > %BACKUP_FILE%

if %ERRORLEVEL% EQU 0 (
    echo [成功] 数据库备份完成：%BACKUP_FILE%
    echo.
) else (
    echo [失败] 数据库备份失败，错误代码：%ERRORLEVEL%
    goto :error
)

echo [步骤 2/4] 检查外键依赖...
echo.

REM 第二步：检查外键依赖
echo SELECT 
    TABLE_NAME as '被引用的表',
    COUNT(*) as '外键数量'
FROM information_schema.KEY_COLUMN_USAGE
WHERE REFERENCED_TABLE_NAME IN ('t_kid', 't_parent', 't_parent_limit')
  AND TABLE_SCHEMA = '%DB_NAME%'
GROUP BY TABLE_NAME; | mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME%

echo.
if %ERRORLEVEL% EQU 0 (
    echo [成功] 外键依赖检查完成
    echo.
) else (
    echo [警告] 外键依赖检查失败
    echo.
)

echo [步骤 3/4] 执行表重命名...
echo.

REM 第三步：执行清理脚本
mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME% < cleanup-deprecated-tables.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo [成功] 表重命名完成!
    echo.
) else (
    echo.
    echo [失败] 表重命名失败，错误代码：%ERRORLEVEL%
    goto :error
)

echo [步骤 4/4] 验证重命名结果...
echo.

REM 第四步：验证
echo SELECT 
    TABLE_NAME as '重命名后的表',
    TABLE_ROWS as '行数',
    ENGINE as '引擎'
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = '%DB_NAME%' 
  AND (TABLE_NAME LIKE '%%backup%%' OR TABLE_NAME LIKE '%%_old%%')
ORDER BY TABLE_NAME; | mysql -h %DB_HOST% -P %DB_PORT% -u %DB_USER% -p%DB_PASSWORD% %DB_NAME%

echo.
echo ======================================
echo 清理完成！
echo ======================================
echo.
echo 已重命名的表:
echo   1. t_kid → t_kid_backup_20260323
echo   2. t_parent → t_parent_backup_20260323
echo   3. t_parent_limit → t_parent_limit_backup_20260323
echo   4. t_game_lock → t_game_lock_backup_20260323
echo   5. t_leaderboard_dimension → t_leaderboard_dimension_backup_20260323
echo   6. theme_info_backup_20250318 → theme_info_backup_20250318_old
echo   7. t_game_permission_backup_20240308 → t_game_permission_backup_20240308_old
echo.
echo ======================================
echo 重要提示:
echo   - 这些表已重命名为 backup 版本
echo   - 请在 30 天内确认系统运行正常
echo   - 如果没有问题，可以执行删除脚本永久删除
echo   - 如果有问题，可以立即恢复原表名
echo ======================================
echo.
pause
goto :eof

:error
echo.
echo ======================================
echo 执行失败！请检查:
echo   1. 数据库连接是否正常
echo   2. 是否有足够的权限
echo   3. SQL 脚本是否有语法错误
echo ======================================
echo.
pause
