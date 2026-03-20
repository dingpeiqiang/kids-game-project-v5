@echo off
REM =====================================================
REM 数据库迁移执行脚本
REM =====================================================

set MYSQL_PATH=D:\APP\WORK\mysql-9.6.0-winx64\mysql-9.6.0-winx64\bin\mysql.exe
set DB_HOST=106.54.7.205
set DB_NAME=kidgame
set DB_USER=kidsgame
set DB_PASS=Kidsgame2026!Secure

echo 正在执行数据库迁移...
echo 数据库: %DB_NAME%
echo.

REM 执行迁移脚本
"%MYSQL_PATH%" -h %DB_HOST% -u %DB_USER% -p%DB_PASS% %DB_NAME% < migration-game-decoupling.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ======================================
    echo 数据库迁移成功完成！
    echo ======================================
) else (
    echo.
    echo ======================================
    echo 数据库迁移失败，错误代码: %ERRORLEVEL%
    echo ======================================
)

pause
