@echo off
chcp 65001 >nul
echo ============================================
echo   坦克大战 - 游戏注册工具
echo ============================================
echo.

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo [信息] 开始注册游戏到数据库...
echo.

REM 执行 SQL 脚本（需要根据实际数据库配置修改）
REM 这里提供示例，实际使用时需要连接真实数据库

set DB_HOST=localhost
set DB_PORT=3306
set DB_USER=root
set DB_PASS=your_password
set DB_NAME=kids_game

echo 数据库配置:
echo   主机：%DB_HOST%:%DB_PORT%
echo   用户：%DB_USER%
echo   数据库：%DB_NAME%
echo.

REM 使用 MySQL 命令行工具执行 SQL（需要先安装 MySQL）
REM mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASS% %DB_NAME% < register-game.sql

echo [提示] 请手动执行以下 SQL 命令：
echo   1. 打开 MySQL 客户端
echo   2. 连接到数据库：%DB_NAME%
echo   3. 执行文件：register-game.sql
echo.
echo   或者直接运行：
echo   mysql -h localhost -P 3306 -u root -p kids_game ^< register-game.sql
echo.

pause
