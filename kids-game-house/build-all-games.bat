@echo off
chcp 65001 >nul
echo ============================================================
echo 构建所有游戏
echo ============================================================
echo.

echo [1/4] 构建飞机大战游戏...
cd /d %~dp0games\plane-shooter
call npm run build
if %errorlevel% neq 0 (
    echo 飞机大战游戏构建失败！
    pause
    exit /b 1
)

echo.
echo [2/4] 构建贪吃蛇游戏...
cd /d %~dp0games\snake
call npm run build
if %errorlevel% neq 0 (
    echo 贪吃蛇游戏构建失败！
    pause
    exit /b 1
)

echo.
echo [3/4] 构建坦克大战游戏...
cd /d %~dp0games\tank-battle
call npm run build
if %errorlevel% neq 0 (
    echo 坦克大战游戏构建失败！
    pause
    exit /b 1
)

echo.
echo [4/4] 构建植物大战僵尸游戏...
cd /d %~dp0games\plants-vs-zombie
call npm run build
if %errorlevel% neq 0 (
    echo 植物大战僵尸游戏构建失败！
    pause
    exit /b 1
)

echo.
echo ============================================================
echo 所有游戏构建完成!
echo ============================================================
echo.
echo 构建产物位于各游戏目录下的 dist 文件夹
echo.
pause
