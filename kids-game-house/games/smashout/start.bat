@echo off
echo 🚀 启动 Smash Out Game 开发服务器...
echo.
echo 📦 检查依赖...
if not exist node_modules (
    echo ⚠️  未检测到 node_modules，正在安装依赖...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败！
        pause
        exit /b 1
    )
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)

echo.
echo 🎮 启动 Vite 开发服务器...
echo 🌐 游戏将在 http://localhost:3006 自动打开
echo.
call npm run dev