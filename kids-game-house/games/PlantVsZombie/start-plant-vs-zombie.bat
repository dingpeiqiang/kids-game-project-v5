@echo off
chcp 65001 >nul
echo 🌻 正在启动 PlantVsZombie 游戏 (Vite 模式)...
echo.

REM 检查 node_modules 是否存在
if not exist "node_modules\" (
    echo ⚠️  检测到未安装依赖，正在安装...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败！
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
    echo.
)

REM 生成资产（如果尚未生成）
if not exist "public\assets\" (
    echo 🎨 正在生成游戏资产...
    call npm run assets:generate
    if %errorlevel% neq 0 (
        echo ⚠️  资产生成失败，但将继续启动...
    ) else (
        echo ✅ 资产生成完成
    )
    echo.
)

REM 编译关卡数据（如果存在）
if exist "data\levels\" (
    echo 📋 正在编译关卡数据...
    call npm run levels:compile
    if %errorlevel% neq 0 (
        echo ⚠️  关卡编译失败，但将继续启动...
    ) else (
        echo ✅ 关卡编译完成
    )
    echo.
)

echo 🚀 启动 Vite 开发服务器...
echo 📍 游戏将在 http://localhost:5176 运行
echo 💡 提示: 按 Ctrl+C 停止服务器
echo.

call npm run dev
