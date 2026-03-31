@echo off
chcp 65001 >nul
echo.
echo ╔═══════════════════════════════════════════╗
echo ║     坦克大战 - 清理缓存并重启工具        ║
echo ╚═══════════════════════════════════════════╝
echo.

echo [1/4] 停止开发服务器...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/4] 清理 Vite 缓存...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo ✅ Vite 缓存已清理
) else (
    echo ℹ️ 无 Vite 缓存需要清理
)

echo [3/4] 清理浏览器缓存提示...
echo.
echo ⚠️  请在浏览器中执行以下操作:
echo    1. 按 Ctrl+Shift+R 强制刷新
echo    2. 或按 F12 打开开发者工具
echo    3. 右键点击刷新按钮，选择"清空缓存并硬性重新加载"
echo.

echo [4/4] 重新启动开发服务器...
echo.
start "" cmd /k "npm run dev"

echo.
echo ═══════════════════════════════════════════
echo ✅ 清理完成！
echo.
echo 📋 下一步操作:
echo    1. 等待新窗口打开
echo    2. 访问 http://localhost:5176
echo    3. 按 Ctrl+Shift+R 强制刷新浏览器
echo    4. 检查控制台是否还有错误
echo ═══════════════════════════════════════════
echo.
pause
