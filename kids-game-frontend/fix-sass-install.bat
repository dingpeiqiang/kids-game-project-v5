@echo off
echo ========================================
echo 清理并重新安装 Sass 依赖
echo ========================================
echo.

echo [1/4] 删除 node_modules...
rmdir /s /q node_modules

echo.
echo [2/4] 删除 package-lock.json...
del /q package-lock.json

echo.
echo [3/4] 清理 npm 缓存...
call npm cache clean --force

echo.
echo [4/4] 重新安装依赖...
call npm install

echo.
echo ========================================
echo 安装完成！请重启开发服务器
echo ========================================
pause
