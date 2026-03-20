@echo off
echo ========================================
echo 重新编译项目（下载腾讯云 COS SDK）
echo ========================================
echo.

echo 正在清理旧的构建...
call mvn clean

echo.
echo 正在下载依赖并编译...
call mvn install -DskipTests

echo.
echo ========================================
echo 编译完成！
echo ========================================
echo.
pause
