@echo off
chcp 65001 >nul
echo ========================================
echo   快速修复游戏数据问题
echo ========================================
echo.

REM 检查 MySQL 是否可用
echo [1/4] 检查 MySQL 连接...
mysql -u root -e "SELECT 1;" >nul 2>&1
if errorlevel 1 (
    echo ❌ MySQL 连接失败，请检查：
    echo    - MySQL 服务是否启动
    echo    - 用户名密码是否正确（默认 root）
    pause
    exit /b 1
)
echo ✅ MySQL 连接成功
echo.

REM 执行游戏初始化 SQL
echo [2/4] 执行游戏数据初始化...
mysql -u root -p kids_game < init-real-games.sql
if errorlevel 1 (
    echo ❌ SQL 执行失败！
    pause
    exit /b 1
)
echo ✅ 游戏数据初始化成功
echo.

REM 验证游戏数据
echo [3/4] 验证游戏数据...
mysql -u root -p kids_game -e "SELECT game_code, game_name, game_url FROM t_game WHERE game_code IN ('SNAKE_VUE3');"
if errorlevel 1 (
    echo ⚠️  验证失败，但数据可能已插入
)
echo.

REM 编译后端
echo [4/4] 重新编译后端...
call mvn clean install -DskipTests
if errorlevel 1 (
    echo ❌ 编译失败！
    pause
    exit /b 1
)
echo ✅ 后端编译成功
echo.

echo ========================================
echo   ✅ 修复完成！
echo ========================================
echo.
echo 📋 已完成：
echo    1. 数据库游戏数据已更新
echo    2. 后端代码已重新编译
echo.
echo 🚀 下一步：
echo    1. 重启后端服务
echo    2. 访问游戏列表检查是否正常
echo.
pause
