@echo off
echo 🎮 Basic Fantasy RPG - Vite 模式安装脚本
echo ========================================

echo.
echo 1. 检查 Node.js 版本...
node --version
if errorlevel 1 (
    echo ❌ Node.js 未安装，请先安装 Node.js
    pause
    exit /b 1
)

echo.
echo 2. 安装依赖...
call npm install
if errorlevel 1 (
    echo ❌ 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 3. 运行配置测试...
call node test-vite.js

echo.
echo 4. 启动说明:
echo.
echo   启动开发服务器: npm run dev
echo   构建生产版本: npm run build:vite
echo   预览构建结果: npm run preview
echo.
echo   Vite 服务器将在 http://localhost:10003 启动
echo.
echo 5. 如需启动 Socket.IO 服务器:
echo   node server.js
echo   服务器将在 http://localhost:8081 启动
echo.

pause