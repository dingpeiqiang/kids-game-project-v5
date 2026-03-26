@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   Chrome 浏览器安装启动器
echo ========================================
echo.
echo [信息] 即将开始下载 Chrome 浏览器...
echo [提示] 预计大小：约 300MB
echo [提示] 预计时间：5-15 分钟（取决于网络速度）
echo.
echo [步骤 1/2] 进入项目目录...
cd /d "%~dp0"
echo        当前目录：%CD%
echo.
echo [步骤 2/2] 开始安装 Chrome...
echo.
echo 下载进度:
echo ----------------------------------------
npx puppeteer browsers install chrome
echo.
echo ----------------------------------------
echo.

if %errorlevel% equ 0 (
    echo [OK] Chrome 安装成功！
    echo.
    echo 下一步操作:
    echo   1. 运行测试：npm run test:game -- --game=plane-shooter
    echo   2. 查看报告：start reports\report-*.html
    echo.
) else (
    echo [错误] Chrome 安装失败！错误代码：%errorlevel%
    echo.
    echo 可能的原因:
    echo   1. 网络连接问题
    echo   2. 防火墙阻止
    echo   3. 磁盘空间不足
    echo.
    echo 解决方案:
    echo   1. 使用国内镜像：set PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors/chromium-browser-snapshots
    echo   2. 检查磁盘空间
    echo   3. 暂时关闭防火墙
    echo.
)

pause
