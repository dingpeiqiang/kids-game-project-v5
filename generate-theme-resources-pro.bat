@echo off
chcp 65001 >nul
echo ============================================================
echo 🎨 开始生成专业版主题资源（Node.js + Canvas）
echo ============================================================
echo.

REM 检查 Node.js 是否安装
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到 Node.js，请先安装 Node.js 16+
    pause
    exit /b 1
)

echo ✅ Node.js 已安装
echo.

REM 检查 canvas 模块是否安装
node -e "require('canvas')" >nul 2>&1
if errorlevel 1 (
    echo 📦 正在安装 canvas 模块...
    echo.
    npm install canvas
    if errorlevel 1 (
        echo ❌ 安装 canvas 失败
        echo 请手动运行：npm install canvas
        pause
        exit /b 1
    )
)

echo ✅ canvas 模块已安装
echo.

REM 生成资源
echo 🎨 开始生成主题资源...
echo.
node generate-theme-resources-pro.js

if errorlevel 1 (
    echo ❌ 资源生成失败
    pause
    exit /b 1
)

echo.
echo ============================================================
echo ✅ 主题资源生成完成！
echo ============================================================
echo.
echo 📂 资源位置:
echo   - 开发版本：kids-game-frontend\dist\games\
echo   - 源文件：kids-game-frontend\assets\games\
echo.
echo 下一步操作:
echo 1. 启动前端服务器：cd kids-game-frontend ^&^& npm run dev
echo 2. 更新数据库配置：cd kids-game-backend ^&^& Get-Content fix-theme-resources-local.sql ^| mysql -u root -p123456 kids_game
echo.
pause
