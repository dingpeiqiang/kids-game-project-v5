@echo off
echo ========================================
echo 修复 Sass 环境问题
echo ========================================
echo.

echo [1/4] 删除 node_modules 目录...
rmdir /s /q node_modules
if %errorlevel% neq 0 (
    echo 删除 node_modules 失败，请手动删除后重试
    pause
    exit /b 1
)
echo ✓ node_modules 已删除
echo.

echo [2/4] 删除 package-lock.json...
del /q package-lock.json
if %errorlevel% neq 0 (
    echo 警告：删除 package-lock.json 失败
)
echo ✓ package-lock.json 已删除
echo.

echo [3/4] 清理 npm 缓存...
call npm cache clean --force
echo ✓ npm 缓存已清理
echo.

echo [4/4] 重新安装依赖...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ✗ 安装依赖失败，请检查网络连接
    pause
    exit /b 1
)
echo ✓ 依赖安装成功
echo.

echo ========================================
echo 修复完成！
echo ========================================
echo.
echo 现在可以运行 npm run dev 启动项目
pause
