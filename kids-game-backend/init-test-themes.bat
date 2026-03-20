@echo off
chcp 65001 >nul
echo ========================================
echo 快速初始化测试主题数据
echo 用于创作者中心功能验证
echo ========================================
echo.

REM 检查 MySQL 是否可用
where mysql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [错误] 未找到 MySQL 客户端，请确保已安装并添加到 PATH
    echo 或者手动在 MySQL Workbench/Navicat 中执行 init-test-themes-quick.sql
    pause
    exit /b 1
)

echo [信息] 正在连接数据库并执行 SQL...
echo.

REM 执行 SQL 脚本
mysql -u root -p kids_game < init-test-themes-quick.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ 测试主题数据初始化成功!
    echo ========================================
    echo.
    echo 已添加的主题:
    echo   1. 经典默认主题 (适用于所有游戏)
    echo   2. 贪吃蛇专属主题 - 清新绿
    echo   3. 植物大战僵尸 - 阳光主题
    echo.
    echo 下一步:
    echo   1. 重启后端服务 (如果正在运行)
    echo   2. 访问创作者中心：http://localhost:3001/creator-center
    echo   3. 查看主题列表是否正常显示
    echo.
) else (
    echo.
    echo ========================================
    echo ❌ 执行失败，请检查:
    echo   1. MySQL 服务是否运行
    echo   2. 数据库 kids_game 是否存在
    echo   3. theme_info 表是否已创建
    echo ========================================
)

pause
