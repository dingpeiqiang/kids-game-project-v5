@echo off
chcp 65001 >nul
echo ========================================
echo 初始化 houses 目录下的两款游戏数据
echo - 贪吃蛇大冒险 (snake-vue3)
echo - 植物大战僵尸 (plants-vs-zombie)
echo ========================================
echo.

REM 检查 MySQL 是否可用
where mysql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未找到 MySQL 客户端，请确保已安装并添加到 PATH
    echo 或者手动在 MySQL Workbench/Navicat 中执行 init-houses-games.sql
    pause
    exit /b 1
)

echo [信息] 正在连接数据库并执行 SQL...
echo.

REM 执行 SQL 脚本
mysql -u root -p kids_game < init-houses-games.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ 游戏数据初始化成功!
    echo ========================================
    echo.
    echo 已添加的游戏:
    echo   1. SNAKE_VUE3 - 贪吃蛇大冒险 (http://localhost:3003)
    echo   2. PLANTS_VS_ZOMBIE - 植物大战僵尸 (http://localhost:3004)
    echo.
    echo 下一步:
    echo   1. 启动贪吃蛇游戏：cd ..\kids-game-house\snake-vue3 ^&^& npm run dev
    echo   2. 启动植物大战僵尸：cd ..\kids-game-house\plants-vs-zombie ^&^& npm run dev
    echo   3. 访问前端页面：http://localhost:3001
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ 执行失败，请检查:
    echo   1. MySQL 服务是否运行
    echo   2. 数据库 kids_game 是否存在
    echo   3. 用户名密码是否正确
    echo ========================================
)

pause
