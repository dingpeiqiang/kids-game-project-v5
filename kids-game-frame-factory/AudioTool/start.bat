@echo off
chcp 65001 >nul
echo ========================================
echo   🎵 小游戏音频爬取工具 - 快速启动
echo ========================================
echo.

cd /d "%~dp0"

echo [信息] 检查 Python 环境...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Python 环境，请先安装 Python 3.8+
    pause
    exit /b 1
)

echo [信息] 检查依赖包...
python -c "import pygame" >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] pygame 未安装，正在自动安装...
    pip install pygame -i https://pypi.tuna.tsinghua.edu.cn/simple
)

python -c "import requests" >nul 2>&1
if %errorlevel% neq 0 (
    echo [警告] requests 未安装，正在自动安装...
    pip install requests -i https://pypi.tuna.tsinghua.edu.cn/simple
)

echo.
echo [信息] 启动程序...
echo ========================================
echo.

python AudioTool.py

pause
