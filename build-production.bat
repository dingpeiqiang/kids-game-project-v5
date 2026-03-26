@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo    Kids Game Platform - 生产环境构建器
echo    (混合架构：整合部署模式)
echo ============================================
echo.

REM 检查是否在项目根目录
if not exist "kids-game-frontend" (
    echo [错误] 请在项目根目录执行此脚本
    echo [提示] kids-game-project-v5/
    pause
    exit /b 1
)

echo [步骤 1/3] 构建所有游戏...
cd kids-game-house
call build-all-games.bat
cd ..

echo.
echo [步骤 2/3] 整合游戏到前端 public 目录...

REM 创建目标目录
if not exist "kids-game-frontend\public\games" mkdir "kids-game-frontend\public\games"

REM 复制每个游戏的 dist 目录
for %%d in (snake-vue3 plane-shooter chromosome plants-vs-zombie) do (
    if exist "kids-game-house\%%d\dist" (
        echo   ✓ 整合 %%d ...
        xcopy /E /I /Y "kids-game-house\%%d\dist" "kids-game-frontend\public\games\%%d\"
    ) else (
        echo   ⚠ %%d 未找到，跳过
    )
)

echo.
echo [步骤 3/3] 构建主前端...
cd kids-game-frontend
call npm run build
cd ..

echo.
echo ============================================
echo ✅ 构建完成！
echo ============================================
echo.
echo 输出目录：kids-game-frontend\dist\
echo.
echo 部署说明:
echo   1. 将 dist 目录上传到服务器
echo   2. 配置 Nginx 指向 dist 目录
echo   3. 游戏资源路径：/games/{gameCode}/
echo.
echo ============================================
echo.
pause
