@echo off
chcp 65001 >nul
echo.
echo ===============================================
echo    🎮 坦克大战 - 快速验证工具
echo ===============================================
echo.

echo [1/4] 检查 Node.js 环境...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js 未安装或未添加到 PATH
    pause
    exit /b 1
)
echo ✅ Node.js 环境正常

echo.
echo [2/4] 检查项目结构...
if not exist "src\scenes\TankGameScene.ts" (
    echo ❌ 找不到核心文件 TankGameScene.ts
    pause
    exit /b 1
)
if not exist "src\core\TankGameOrchestrator.ts" (
    echo ❌ 找不到核心文件 TankGameOrchestrator.ts
    pause
    exit /b 1
)
echo ✅ 项目结构完整

echo.
echo [3/4] 检查资源文件...
if not exist "public\themes\tank_default\GTRS.json" (
    echo ❌ 找不到 GTRS.json
    pause
    exit /b 1
)
if not exist "public\themes\tank_default\assets\scene\bg_main.png" (
    echo ❌ 找不到背景图片 bg_main.png
    pause
    exit /b 1
)
if not exist "config\levels\tank_level_1.json" (
    echo ❌ 找不到关卡配置文件
    pause
    exit /b 1
)
echo ✅ 资源文件完整

echo.
echo [4/4] 检查依赖安装...
if not exist "node_modules\phaser" (
    echo ⚠️  检测到 node_modules 不完整，正在安装依赖...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
) else (
    echo ✅ 依赖已安装
)

echo.
echo ===============================================
echo    ✅ 所有检查通过！
echo ===============================================
echo.
echo 接下来请执行以下步骤:
echo.
echo 1. 启动开发服务器:
echo    ^> npm run dev
echo.
echo 2. 在浏览器中访问:
echo    http://localhost:5177
echo.
echo 3. 运行诊断工具（可选）:
echo    http://localhost:5177/diagnostic.html
echo.
echo 4. 查看修复报告:
echo    FIX_REPORT_2026-04-01.md
echo    ARCHITECTURE_ANALYSIS.md
echo.
echo ===============================================
pause
