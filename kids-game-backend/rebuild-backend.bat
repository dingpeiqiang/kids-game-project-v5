@echo off
chcp 65001 >nul
echo ========================================
echo   重新编译并重启后端
echo ========================================
echo.

echo [1/3] 停止旧的后端服务...
taskkill /F /IM java.exe /FI "WINDOWTITLE eq *kids-game*" >nul 2>&1
timeout /t 2 /nobreak >nul
echo ✅ 已停止旧服务
echo.

echo [2/3] 清理并重新编译...
call mvn clean install -DskipTests
if errorlevel 1 (
    echo ❌ 编译失败！
    pause
    exit /b 1
)
echo ✅ 编译成功
echo.

echo [3/3] 启动后端服务...
echo 提示：后端将在新窗口中启动
echo 请等待几秒，直到看到 "Started Application" 提示
echo.
start cmd /k "cd kids-game-web && mvn spring-boot:run"

echo ========================================
echo   ✅ 后端服务启动中...
echo ========================================
echo.
echo 📋 请检查新窗口的输出，确认服务启动成功
echo.
echo 💡 提示：
echo    - 服务启动通常需要 10-20 秒
echo    - 看到 "Started Application" 表示启动成功
echo    - 不要关闭启动窗口
echo.
pause
