@echo off
echo ========================================
echo 清理 Plane Shooter 缓存并重启
echo ========================================
echo.

echo [1/3] 停止前端服务...
echo 请按 Ctrl+C 停止当前运行的前端服务，然后按任意键继续
pause

echo.
echo [2/3] 清理 Vite 缓存...
if exist node_modules\.vite (
    rmdir /s /q node_modules\.vite
    echo 已删除 node_modules\.vite
) else (
    echo node_modules\.vite 不存在，跳过
)

if exist dist (
    rmdir /s /q dist
    echo 已删除 dist
) else (
    echo dist 不存在，跳过
)

echo.
echo [3/3] 重启前端服务...
call npm run dev

echo.
echo ========================================
echo 完成！请在浏览器中强制刷新 (Ctrl+Shift+R)
echo ========================================
pause
