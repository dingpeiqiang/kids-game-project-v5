@echo off
echo ========================================
echo 正在安装 snake-vue3 项目依赖...
echo ========================================

cd /d "%~dp0"

REM 检查 node_modules 是否存在且完整
if not exist "node_modules\vite" (
    echo [提示] 检测到依赖不完整，正在重新安装...
    if exist "node_modules" (
        echo [清理] 删除旧的 node_modules...
        rmdir /s /q node_modules
    )
    if exist "package-lock.json" (
        del /q package-lock.json
    )
    npm install
) else (
    echo [提示] 依赖已存在，尝试直接启动...
)

echo.
echo ========================================
echo 启动开发服务器...
echo ========================================
npm run dev

pause
