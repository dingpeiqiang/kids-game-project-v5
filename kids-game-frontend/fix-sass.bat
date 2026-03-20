@echo off
echo ====================================
echo 正在修复 Sass 依赖问题...
echo ====================================
echo.

echo 步骤 1: 清理旧的缓存和模块...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✓ Vite 缓存已清理
)

echo.
echo 步骤 2: 删除 sass-embedded 并安装 sass...
call npm uninstall sass-embedded
call npm install sass@^1.69.5 sass-loader@^13.3.2 --save-dev

echo.
echo ====================================
echo 依赖修复完成！
echo ====================================
echo.
echo 正在启动开发服务器...
npm run dev

pause
