@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ========================================
echo  Kids Game 本地开发（后端 + 管理端 + 终端）
echo ========================================
echo  管理端: http://localhost:3000
echo  终端:   http://localhost:3001
echo  后端:   http://localhost:8080
echo ========================================
echo.

where pnpm >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 pnpm，请先执行: corepack enable ^&^& corepack prepare pnpm@9.15.0 --activate
  exit /b 1
)

if not exist "node_modules\" (
  echo [1/2] pnpm install ...
  call pnpm install
  if errorlevel 1 exit /b 1
)

echo [2/2] 启动服务（各窗口独立）...
start "kids-game-backend" cmd /k "cd /d %~dp0kids-game-backend && mvn -pl kids-game-web -am spring-boot:run"
timeout /t 3 /nobreak >nul
start "kids-game-admin" cmd /k "cd /d %~dp0 && pnpm dev:admin"
start "kids-game-simple" cmd /k "cd /d %~dp0 && pnpm dev:simple"

echo.
echo 已在新窗口启动后端、管理端、终端。关闭对应窗口即可停止服务。
endlocal