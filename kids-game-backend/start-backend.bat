@echo off
REM =====================================================
REM 编译并启动后端服务（自动执行迁移）
REM =====================================================

set PROJECT_DIR=c:\Users\a1521\Desktop\kids-game-project\kids-game-backend
set WEB_DIR=%PROJECT_DIR%\kids-game-web

echo ========================================
echo 开始编译后端项目...
echo ========================================

cd /d %PROJECT_DIR%

REM 清理并编译
call mvn clean install -DskipTests
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ========================================
    echo 编译失败！
    echo ========================================
    pause
    exit /b 1
)

echo.
echo ========================================
echo 编译成功！
echo ========================================
echo.
echo 正在启动后端服务...
echo.

REM 启动应用
cd /d %WEB_DIR%
call mvn spring-boot:run

pause
