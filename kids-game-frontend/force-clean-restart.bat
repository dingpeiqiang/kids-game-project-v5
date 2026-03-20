@echo off
echo ============================================
echo 强制清理所有缓存并重启
echo ============================================

echo.
echo [1/4] 停止开发服务器...
echo 如果有开发服务器正在运行，请按 Ctrl+C 停止
echo 然后按任意键继续...
pause > nul

echo.
echo [2/4] 清理 Vite 缓存...
if exist node_modules\.vite (
    echo 删除 node_modules\.vite...
    rmdir /s /q node_modules\.vite 2>nul
    if errorlevel 1 (
        echo 无法删除 .vite，请手动关闭开发服务器
    ) else (
        echo Vite 缓存已清理
    )
) else (
    echo .vite 目录不存在
)

if exist dist (
    echo 删除 dist 目录...
    rmdir /s /q dist 2>nul
    if not errorlevel 1 (
        echo dist 目录已清理
    )
)

echo.
echo [3/4] 清理 package-lock.json...
echo (可选，如果遇到依赖问题)
if exist package-lock.json.backup (
    echo backup 文件已存在，跳过
) else (
    ren package-lock.json package-lock.json.backup 2>nul
)

echo.
echo [4/4] 启动开发服务器...
npm run dev

pause
