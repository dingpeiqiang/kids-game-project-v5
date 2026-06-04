@echo off
chcp 65001 >nul
echo ========================================
echo   🎵 AudioTool - 依赖安装脚本
echo ========================================
echo.

cd /d "%~dp0"

echo [信息] 检查 Python 环境...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python 环境！
    echo 请先安装 Python 3.8 或更高版本
    echo 下载地址：https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [信息] 当前 Python 版本:
python --version
echo.

echo [信息] 升级 pip...
python -m pip install --upgrade pip -i https://pypi.tuna.tsinghua.edu.cn/simple
echo.

echo [信息] 安装项目依赖...
echo.

pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   ✅ 依赖安装成功！
    echo ========================================
    echo.
    echo 下一步：
    echo 1. 运行 start.bat 启动程序
    echo 2. 或直接执行：python AudioTool.py
    echo.
) else (
    echo.
    echo ========================================
    echo   ❌ 依赖安装失败！
    echo ========================================
    echo.
    echo 请尝试手动安装:
    echo pip install pygame requests
    echo.
)

pause
