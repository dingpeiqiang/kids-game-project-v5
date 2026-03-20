@echo off
echo ============================================
echo 清理 Vite 缓存并重启开发服务器
echo ============================================

echo.
echo [1/3] 停止当前的开发服务器...
echo 请手动停止 Ctrl+C，或者按任意键继续...
pause > nul

echo.
echo [2/3] 清理 Vite 缓存...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite
    echo Vite 缓存已清理
) else (
    echo Vite 缓存目录不存在，跳过
)

if exist dist (
    rmdir /s /q dist
    echo dist 目录已清理
) else (
    echo dist 目录不存在，跳过
)

echo.
echo [3/3] 重启开发服务器...
npm run dev

pause
