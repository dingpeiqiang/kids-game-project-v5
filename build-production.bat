@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo ========================================
echo  Kids Game 生产构建（shared + 管理端 + 终端）
echo ========================================

where pnpm >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 pnpm
  exit /b 1
)

call pnpm install
if errorlevel 1 exit /b 1

call pnpm run build:shared
if errorlevel 1 exit /b 1

call pnpm run build:admin
if errorlevel 1 exit /b 1

call pnpm run build:simple
if errorlevel 1 exit /b 1

echo.
echo 完成:
echo   kids-game-frontend\dist  - 管理端静态资源
echo   kids-game-simple\dist    - 终端静态资源
endlocal