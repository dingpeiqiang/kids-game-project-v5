@echo off
chcp 65001 >nul
echo ============================================================
echo 🎨 开始生成主题资源
echo ============================================================
echo.

REM 检查 Python 是否安装
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误：未找到 Python，请先安装 Python 3.x
    pause
    exit /b 1
)

echo ✅ Python 已安装
echo.

REM 检查 Pillow 是否安装
python -c "import PIL" >nul 2>&1
if errorlevel 1 (
    echo 📦 正在安装 Pillow...
    pip install Pillow
    if errorlevel 1 (
        echo ❌ 安装 Pillow 失败
        pause
        exit /b 1
    )
)

echo ✅ Pillow 已安装
echo.

REM 生成资源
echo 🎨 开始生成主题资源...
python generate-theme-resources.py

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
echo 📂 资源位置：kids-game-frontend\dist\games\
echo.
echo 下一步操作:
echo 1. 启动前端服务器：cd kids-game-frontend ^&^& npm run dev
echo 2. 更新数据库配置：cd kids-game-backend ^&^& Get-Content fix-theme-resources-local.sql ^| mysql -u root -p123456 kids_game
echo.
pause
