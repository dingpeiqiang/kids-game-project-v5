@echo off
chcp 65001 >nul
echo ============================================================
echo 俄罗斯方块游戏代码克隆
echo ============================================================
echo.

cd /d "%~dp0.."

echo [1/2] 复制贪吃蛇代码到 tetris 目录...
if exist "tetris\snake" (
    rmdir /s /q "tetris\snake"
)
xcopy /E /I /Y "games\snake" "tetris\snake"
if %errorlevel% neq 0 (
    echo ❌ 代码复制失败！
    exit /b 1
)
echo ✅ 代码复制完成

echo.
echo [2/2] 清理 node_modules...
if exist "tetris\snake\node_modules" (
    rmdir /s /q "tetris\snake\node_modules"
    echo ✅ node_modules 已清理
) else (
    echo ℹ️  node_modules 不存在，跳过清理
)

echo.
echo ============================================================
echo ✅ 俄罗斯方块代码克隆完成!
echo ============================================================
echo.
echo 目录结构:
echo   tetris/
echo     ├── snake/              ← 从 games/snake 复制的完整代码
echo     ├── generate-resources.mjs  ← 资源生成脚本
echo     └── public/themes/default/  ← 资源输出目录
echo.
echo 下一步:
echo 1. 运行 generate-resources.bat 生成资源
echo 2. 修改 snake/src/phaser/PhaserGame.ts 实现俄罗斯方块逻辑
echo 3. 修改 package.json 中的游戏名称
echo.
pause
