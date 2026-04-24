@echo off
REM ========================================
REM 儿童游戏平台 - Docker 部署脚本 (Windows)
REM ========================================

setlocal enabledelayedexpansion

echo.
echo ========================================
echo   儿童游戏平台 - Docker 部署工具
echo ========================================
echo.

REM 检查 Docker 是否安装
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker 未安装，请先安装 Docker Desktop
    pause
    exit /b 1
)

REM 检查 Docker Compose 是否安装
where docker-compose >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose 未安装
    pause
    exit /b 1
)

echo [INFO] 依赖检查通过
echo.

REM 检查配置文件
if not exist .env.production (
    echo [WARN] .env.production 文件不存在
    if exist .env.production.example (
        echo [INFO] 从示例文件创建 .env.production
        copy .env.production.example .env.production
        echo [WARN] 请编辑 .env.production 文件，配置必要的参数
        echo.
        pause
    ) else (
        echo [ERROR] 缺少 .env.production.example 文件
        pause
        exit /b 1
    )
)

:menu
echo.
echo 请选择操作：
echo 1. 部署应用（构建并启动）
echo 2. 启动服务
echo 3. 停止服务
echo 4. 重启服务
echo 5. 查看服务状态
echo 6. 查看日志
echo 7. 构建镜像
echo 8. 清理资源
echo 9. 备份数据库
echo 0. 退出
echo.

set /p choice="请输入选项 (0-9): "

if "%choice%"=="1" goto deploy
if "%choice%"=="2" goto start
if "%choice%"=="3" goto stop
if "%choice%"=="4" goto restart
if "%choice%"=="5" goto status
if "%choice%"=="6" goto logs
if "%choice%"=="7" goto build
if "%choice%"=="8" goto cleanup
if "%choice%"=="9" goto backup
if "%choice%"=="0" goto end

echo [ERROR] 无效选项
goto menu

:deploy
echo.
echo [INFO] 开始部署应用...
echo.

echo [INFO] 构建 Docker 镜像...
docker-compose build
if %errorlevel% neq 0 (
    echo [ERROR] 镜像构建失败
    pause
    goto menu
)

echo.
set /p start_games="是否启动游戏服务？(y/n，默认n): "
if /i "%start_games%"=="y" (
    docker-compose --profile games up -d
) else (
    docker-compose up -d
)

echo.
echo [INFO] 部署完成！
echo.
docker-compose ps
pause
goto menu

:start
echo.
echo [INFO] 启动服务...
docker-compose up -d
echo.
docker-compose ps
pause
goto menu

:stop
echo.
echo [INFO] 停止服务...
docker-compose down
echo [INFO] 服务已停止
pause
goto menu

:restart
echo.
echo [INFO] 重启服务...
call :stop
call :start
goto menu

:status
echo.
echo [INFO] 服务状态：
docker-compose ps
pause
goto menu

:logs
echo.
set /p service="请输入服务名称 (backend/frontend/mysql/redis/games，留空查看所有): "
if "%service%"=="" (
    docker-compose logs --tail=100
) else (
    docker-compose logs --tail=100 %service%
)
pause
goto menu

:build
echo.
echo [INFO] 构建 Docker 镜像...
docker-compose build
echo [INFO] 构建完成
pause
goto menu

:cleanup
echo.
echo [WARN] 此操作将删除所有容器、网络、卷和镜像
set /p confirm="确认继续？(yes/no): "
if "%confirm%"=="yes" (
    echo [INFO] 清理资源...
    docker-compose down -v --rmi all
    echo [INFO] 清理完成
) else (
    echo [INFO] 取消清理
)
pause
goto menu

:backup
echo.
echo [INFO] 备份数据库...
if not exist backups mkdir backups
set timestamp=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set timestamp=%timestamp: =0%
set backup_dir=backups\%timestamp%
if not exist %backup_dir% mkdir %backup_dir%

docker-compose exec -T mysql mysqldump -ukidgame -p%MYSQL_PASSWORD% kids_game > %backup_dir%\kids_game.sql

echo [INFO] 数据库备份完成：%backup_dir%\kids_game.sql
pause
goto menu

:end
echo.
echo 感谢使用！
exit /b 0
