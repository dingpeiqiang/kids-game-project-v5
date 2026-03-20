@echo off
echo 正在清理 Vite 缓存...
echo.
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Vite 缓存已清理！
) else (
    echo 未发现 Vite 缓存目录
)
echo.
echo 正在重新启动开发服务器...
npm run dev
pause
