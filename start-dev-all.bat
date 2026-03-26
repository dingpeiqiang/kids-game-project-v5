@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ============================================
echo    Kids Game Platform - 开发模式启动器
echo    (混合架构：独立部署)
echo ============================================
echo.

REM 检查是否在项目根目录
if not exist "kids-game-frontend" (
    echo [错误] 请在项目根目录执行此脚本
    echo [提示] kids-game-project-v5/
    pause
    exit /b 1
)

echo [步骤 1/3] 启动后端服务...
start "Kids-Backend" cmd /k "cd kids-game-backend && echo Starting backend... && start-backend.bat"
timeout /t 3 /nobreak >nul

echo [步骤 2/3] 启动主前端...
start "Kids-Frontend" cmd /k "cd kids-game-frontend && echo Starting frontend... && npm run dev"
timeout /t 3 /nobreak >nul

echo [步骤 3/3] 启动所有游戏（独立部署）...
start "Kids-Games" cmd /k "cd kids-game-house && echo Starting games in standalone mode... && start-all-games.bat"

echo.
echo ============================================
echo ✅ 所有服务已启动！
echo ============================================
echo.
echo 访问地址:
echo   📱 主平台：http://localhost:5173
echo   🐍 贪吃蛇：http://localhost:3003
echo   ✈️ 飞机大战：http://localhost:3002
echo   🧬 染色体：http://localhost:3001
echo.
echo 提示：关闭各个窗口以停止服务
echo ============================================
echo.
pause
