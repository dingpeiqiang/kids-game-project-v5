@echo off
chcp 65001 >nul
REM ============================================
REM 坦克大战游戏注册脚本
REM 功能：自动执行 SQL 脚本注册坦克大战游戏
REM 创建时间：2026-03-26
REM ============================================

echo ============================================================
echo 🎮 坦克大战 游戏注册工具
echo ============================================================
echo.

REM 检测 MySQL 是否安装
where mysql >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 错误：未检测到 MySQL 客户端
    echo.
    echo 请先安装 MySQL 或将其添加到系统 PATH
    echo 然后重新运行此脚本
    pause
    exit /b 1
)

echo ✅ MySQL 检测通过
echo.

REM 提示用户输入数据库密码
echo 请输入数据库密码 (直接回车使用默认密码 root):
set /p MYSQL_PASSWORD=
if "%MYSQL_PASSWORD%"=="" set MYSQL_PASSWORD=root

echo.
echo 📝 开始执行注册脚本...
echo.

REM 执行 SQL 脚本
mysql -u root -p%MYSQL_PASSWORD% kids_game_platform < register-game.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo ✅ 游戏注册成功!
    echo ============================================================
    echo.
    echo 🎮 游戏信息:
    echo    游戏代码：TANK_BATTLE
    echo    游戏名称：坦克大战
    echo    访问地址：http://localhost:3002
    echo.
    echo 🎨 主题信息:
    echo    主题名称：钢铁防线主题
    echo    主题类型：GAME (游戏官方)
    echo    价格：免费
    echo.
    echo 📚 下一步操作:
    echo    1. 启动后端服务
    echo    2. 启动前端开发服务器：npm run dev
    echo    3. 在浏览器中访问游戏
    echo.
) else (
    echo.
    echo ============================================================
    echo ❌ 游戏注册失败
    echo ============================================================
    echo.
    echo 请检查以下内容:
    echo    1. MySQL 服务是否正常运行
    echo    2. 数据库 kids_game_platform 是否存在
    echo    3. 用户名密码是否正确
    echo    4. register-game.sql 文件是否存在语法错误
    echo.
)

pause
