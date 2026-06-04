@echo off
REM ============================================
REM simple-game Docker 快速构建脚本
REM 默认利用 Docker 层缓存，依赖不变时秒级复用
REM 如需完全重建：docker-build.bat --no-cache
REM ============================================

setlocal enabledelayedexpansion

set NO_CACHE=
if "%1"=="--no-cache" set NO_CACHE=-NoCache

echo.
echo ===========================================
echo   simple-game Docker Build
echo ===========================================
echo.
echo 依赖(phaser/three)不变时，npm install 层自动复用
echo 只改源码时，构建只需 10-20 秒
echo.
echo 完全重建: docker-build.bat --no-cache
echo ===========================================
echo.

cd /d "%~dp0..\..\..\docker"
powershell -NoProfile -ExecutionPolicy Bypass -Command ".\build-images.ps1 -Service simple-game %NO_CACHE%"

if %errorlevel% equ 0 (
    echo.
    echo [OK] simple-game 镜像构建成功
    echo.
    echo 导出镜像: docker save kids-game-simple-game:latest -o simple-game.tar
    echo 查看镜像: docker images kids-game-simple-game
) else (
    echo [ERROR] 构建失败
)

pause