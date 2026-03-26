@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo    Kids Game Platform - 清理工具
echo ============================================
echo.

echo 正在清理构建产物...

REM 清理 frontend 构建产物
if exist "kids-game-frontend\dist" (
    echo   ✓ 清理 frontend/dist
    rmdir /s /q "kids-game-frontend\dist"
)

if exist "kids-game-frontend\node_modules\.vite" (
    echo   ✓ 清理 Vite 缓存
    rmdir /s /q "kids-game-frontend\node_modules\.vite"
)

REM 清理 game-house 构建产物
for %%d in (snake-vue3 plane-shooter chromosome plants-vs-zombie) do (
    if exist "kids-game-house\%%d\dist" (
        echo   ✓ 清理 kids-game-house\%%d\dist
        rmdir /s /q "kids-game-house\%%d\dist"
    )
)

REM 清理整合的游戏资源
if exist "kids-game-frontend\public\games" (
    echo   ✓ 清理整合的游戏资源
    rmdir /s /q "kids-game-frontend\public\games"
)

echo.
echo ============================================
echo ✅ 清理完成！
echo ============================================
echo.
pause
