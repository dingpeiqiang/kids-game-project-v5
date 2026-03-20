@echo off
chcp 65001 >nul
echo ========================================
echo 贪吃蛇游戏主题初始化测试
echo ========================================
echo.

echo [1/4] 检查后端服务状态...
curl -s http://localhost:8080/api/theme/list?status=on_sale^&page=1^&pageSize=5 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ 后端服务运行正常
) else (
    echo ❌ 后端服务未启动或无法访问
    echo    请确保后端服务在 http://localhost:8080 运行
    goto :end
)
echo.

echo [2/4] 测试主题列表接口...
curl -s http://localhost:8080/api/theme/list?status=on_sale^&page=1^&pageSize=5 > temp_theme.json
echo 响应内容:
type temp_theme.json
echo.
del temp_theme.json >nul 2>&1
echo.

echo [3/4] 检查前端配置...
if exist "src\stores\theme.ts" (
    echo ✅ theme.ts 文件存在
) else (
    echo ❌ theme.ts 文件不存在
)
echo.

echo [4/4] 检查主入口文件...
if exist "src\main.ts" (
    echo ✅ main.ts 文件存在
    findstr /C:"themeStore.init()" src\main.ts >nul
    if %errorlevel% equ 0 (
        echo ✅ 主题初始化代码已添加
    ) else (
        echo ❌ 未找到主题初始化代码
    )
) else (
    echo ❌ main.ts 文件不存在
)
echo.

:end
echo ========================================
echo 测试完成
echo ========================================
echo.
echo 如果所有测试都通过，请运行:
echo   npm run dev
echo.
echo 然后打开浏览器访问 http://localhost:5173
echo 查看控制台是否有主题初始化的日志输出
echo.
pause
