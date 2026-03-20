@echo off
chcp 65001 >nul
echo ============================================================
echo 诊断游戏环境
echo ============================================================
echo.

echo [1] 检查 Node.js 版本...
node --version
if %errorlevel% neq 0 (
    echo [错误] 未安装 Node.js，请先安装 Node.js >= 18.0.0
    pause
    exit /b 1
)
echo.

echo [2] 检查 npm 版本...
npm --version
echo.

echo [3] 检查游戏目录...
if exist snake-vue3\package.json (
    echo [OK] 贪吃蛇 - package.json 存在
) else (
    echo [错误] 贪吃蛇 - package.json 不存在
)
echo.

echo [4] 检查已安装依赖...
if exist snake-vue3\node_modules (
    echo [OK] 贪吃蛇 - 依赖已安装
) else (
    echo [未安装] 贪吃蛇 - 需要安装依赖
)
echo.

echo [5] 检查端口占用...
netstat -ano | findstr :3003 >nul
if %errorlevel% == 0 (
    echo [占用] 端口 3003 已被占用
) else (
    echo [空闲] 端口 3003 可用
)
echo.

echo [6] 检查项目文件...
if exist snake-vue3\src\main.ts (
    echo [OK] 贪吃蛇 - main.ts 存在
) else (
    echo [错误] 贪吃蛇 - main.ts 不存在
)
echo.

echo ============================================================
echo 诊断完成！
echo ============================================================
echo.
echo 建议：
echo 1. 如果依赖未安装，运行: install-dependencies.bat
echo 2. 如果端口被占用，运行: stop-all-games.bat
echo 3. 检查以上[错误]项并修复
echo.
pause
