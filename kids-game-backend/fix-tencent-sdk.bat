@echo off
chcp 65001 >nul
echo ========================================
echo 修复腾讯云 SDK 依赖并重新编译
echo ========================================
echo.

echo [1/3] 清理旧的构建...
call mvn clean >nul 2>&1

echo [2/3] 下载新依赖并编译...
call mvn install -DskipTests

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo ✅ 编译成功！
    echo ========================================
) else (
    echo.
    echo ========================================
    echo ❌ 编译失败，请检查错误信息
    echo ========================================
)

echo.
pause
