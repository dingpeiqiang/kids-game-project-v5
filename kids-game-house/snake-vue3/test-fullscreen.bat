@echo off
chcp 65001 >nul
echo ========================================
echo 贪吃蛇游戏 - RESIZE 模式全屏测试
echo ========================================
echo.

echo [1/3] 检查文件是否存在...
if exist "index.html" (
    echo ✓ index.html 存在
) else (
    echo ✗ index.html 不存在
    pause
    exit /b 1
)

if exist "src\App.vue" (
    echo ✓ src\App.vue 存在
) else (
    echo ✗ src\App.vue 不存在
    pause
    exit /b 1
)

if exist "src\components\game\SnakeGame.vue" (
    echo ✓ src\components\game\SnakeGame.vue 存在
) else (
    echo ✗ src\components\game\SnakeGame.vue 不存在
    pause
    exit /b 1
)

if exist "src\components\game\PhaserGame.ts" (
    echo ✓ src\components\game\PhaserGame.ts 存在
) else (
    echo ✗ src\components\game\PhaserGame.ts 不存在
    pause
    exit /b 1
)

echo.
echo [2/3] 清理缓存...
if exist "node_modules\.vite" (
    echo 正在删除 Vite 缓存...
    rmdir /s /q node_modules\.vite
    echo ✓ Vite 缓存已清理
)

if exist "dist" (
    echo 正在删除 dist 目录...
    rmdir /s /q dist
    echo ✓ dist 目录已清理
)

echo.
echo [3/3] 启动开发服务器...
echo.
echo ========================================
echo 🎮 Phaser RESIZE 模式 - 真正的全屏适配
echo ========================================
echo 缩放模式: RESIZE（动态调整，无黑边）
echo 背景效果: 全屏渐变
echo 游戏区域: 自适应大小，居中显示
echo ========================================
echo.
echo 测试清单：
echo ========================================
echo 基础测试：
echo   [1] 桌面端 1920x1080
echo   [2] 桌面端 1366x768
echo   [3] 平板 1024x768
echo   [4] 手机竖屏 375x812
echo   [5] 手机横屏 812x375
echo.
echo 视觉效果测试：
echo   [6] 背景完全填充屏幕（无黑边）
echo   [7] 背景有漂亮的渐变效果
echo   [8] 游戏区域居中显示
echo   [9] 游戏区域有绿色边框
echo   [10] 游戏区域大小自适应
echo.
echo 交互测试：
echo   [11] 调整浏览器窗口大小
echo   [12] 横竖屏切换
echo   [13] 验证响应式流畅
echo   [14] 检查游戏区域自适应
echo.
echo 游戏功能测试：
echo   [15] 蛇的移动控制
echo   [16] 食物收集
echo   [17] 分数显示
echo   [18] 暂停/继续功能
echo   [19] 游戏结束逻辑
echo ========================================
echo.
echo 测试提示：
echo - 打开浏览器开发者工具（F12）
echo - 切换到设备模拟模式（Ctrl+Shift+M）
echo - 选择不同的设备进行测试
echo - 重点检查：背景是否全屏，游戏区域是否居中
echo.
echo 预期效果：
echo ✅ 背景完全填充屏幕，无黑边
echo ✅ 背景有漂亮的渐变效果
echo ✅ 游戏区域居中显示
echo ✅ 游戏区域大小根据屏幕自适应
echo ✅ 调整窗口大小平滑响应
echo ✅ 横竖屏切换正常工作
echo ========================================
echo.

npm run dev

pause
