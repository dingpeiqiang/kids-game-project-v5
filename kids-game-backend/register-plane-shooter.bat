@echo off
chcp 65001 >nul
echo ========================================
echo   注册飞机大战游戏到数据库
echo ========================================
echo.

cd /d "%~dp0"

echo 📁 当前目录：%CD%
echo.

REM 检查 MySQL 是否安装
where mysql >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ 错误：未找到 MySQL 命令行工具
    echo 请确保 MySQL 已安装并添加到系统 PATH
    pause
    exit /b 1
)

echo ✅ MySQL 已安装
echo.

REM 设置数据库连接参数（根据实际情况修改）
set MYSQL_HOST=localhost
set MYSQL_PORT=3306
set MYSQL_USER=root
set MYSQL_DB=kids_game

echo 📊 数据库连接信息:
echo   主机：%MYSQL_HOST%:%MYSQL_PORT%
echo   用户：%MYSQL_USER%
echo   数据库：%MYSQL_DB%
echo.

REM 提示用户输入密码
echo 🔐 请输入数据库密码（输入时不会显示）
set /p MYSQL_PWD="密码："
echo.

REM 执行 SQL 脚本
echo 🚀 开始执行注册脚本...
echo.

mysql -h%MYSQL_HOST% -P%MYSQL_PORT% -u%MYSQL_USER% -p%MYSQL_PWD% %MYSQL_DB% < init-plane-shooter.sql

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ✨ 注册完成！
    echo ========================================
    echo.
    echo 🎮 飞机大战游戏已成功注册到平台
    echo 📁 主题资源位置：public\themes\default\
    echo.
    echo 🎯 下一步操作:
    echo   1. 刷新平台页面查看新游戏
    echo   2. 访问 http://localhost:3003 测试游戏
    echo.
) else (
    echo.
    echo ========================================
    echo   ❌ 注册失败
    echo ========================================
    echo.
    echo 请检查:
    echo   1. MySQL 服务是否启动
    echo   2. 数据库连接参数是否正确
    echo   3. 数据库是否存在
    echo   4. 是否有足够的权限
    echo.
    echo 可以尝试手动执行:
    echo   mysql -h localhost -P 3306 -u root -p kids_game ^< init-plane-shooter.sql
    echo.
)

pause
