@echo off
echo ========================================
echo   Space Invaders - Offline Mode
echo ========================================
echo.
echo Starting server...
echo.

cd /d "%~dp0"
npm run dev

pause
