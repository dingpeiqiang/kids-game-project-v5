@echo off
echo ========================================
echo 实时多人太空侵略者游戏 - 开发服务器
echo ========================================
echo.
echo 正在检查环境变量配置...
echo.

if not exist .env (
    echo [警告] .env 文件不存在！
    echo 请复制 .env-sample 为 .env 并配置你的 Ably API 密钥
    echo.
    echo 按任意键退出...
    pause >nul
    exit /b 1
)

echo [信息] 找到 .env 文件
echo.
echo 正在启动开发服务器（使用 nodemon）...
echo 服务器将在代码更改时自动重启
echo.
echo 访问 http://localhost:8080 开始游戏
echo 按 Ctrl+C 停止服务器
echo.

npm run dev