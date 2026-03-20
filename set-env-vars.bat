@echo off
REM ========================================
REM Kids Game Project Environment Variable Setup Script (Windows CMD)
REM 
REM Usage:
REM 1. Copy .env.example to .env
REM 2. Edit .env file with your actual values
REM 3. Run this script: set-env-vars.bat
REM 4. Start your application
REM ========================================

echo Loading environment variables from .env file...

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please copy .env.example to .env first
    pause
    exit /b 1
)

REM Read and set environment variables from .env file
for /f "delims=" %%a in ('findstr /v "^#" .env ^| findstr /v "^$"') do (
    set "%%a"
)

echo.
echo Environment variables loaded successfully!
echo You can now start your application.
echo.
