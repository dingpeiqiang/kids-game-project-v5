@echo off
echo ========================================
echo 清理并重新安装 plants-vs-zombie 依赖
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] 正在删除 node_modules...
if exist "node_modules" (
    rmdir /s /q node_modules
    echo [完成] node_modules 已删除
) else (
    echo [跳过] node_modules 不存在
)
echo.

echo [2/4] 正在删除 package-lock.json...
if exist "package-lock.json" (
    del /q package-lock.json
    echo [完成] package-lock.json 已删除
) else (
    echo [跳过] package-lock.json 不存在
)
echo.

echo [3/4] 正在安装依赖...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [错误] 依赖安装失败！
    echo 建议：npm config set registry https://registry.npmmirror.com
    pause
    exit /b 1
)
echo [完成] 依赖安装成功
echo.

echo [4/4] 启动开发服务器...
echo.
npm run dev

pause
