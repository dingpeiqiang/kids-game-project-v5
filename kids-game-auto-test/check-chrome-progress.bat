@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   Chrome Installation Progress Check
echo ========================================
echo.

set CACHE_PATH=%USERPROFILE%\.cache\puppeteer

if not exist "%CACHE_PATH%" (
    echo Cache directory not found. Download may not have started yet.
    goto :end
)

echo Checking cache directory: %CACHE_PATH%
echo.

dir /s "%CACHE_PATH%" 2>nul | find "File(s)" 

for /f "tokens=*" %%i in ('powershell -Command "Get-ChildItem -Path '%CACHE_PATH%' -Recurse -File | Measure-Object -Property Length -Sum | Select-Object -ExpandProperty Sum"') do set TOTAL_BYTES=%%i

if defined TOTAL_BYTES (
    set /a TOTAL_MB=%TOTAL_BYTES%/1048576
    echo Downloaded: %TOTAL_MB% MB
    echo.
    if %TOTAL_MB% GTR 250 (
        echo [OK] Download appears complete!
    ) else if %TOTAL_MB% GTR 150 (
        echo [OK] Over 50%% complete - Almost there...
    ) else (
        echo [..] Download in progress...
    )
) else (
    echo No files downloaded yet.
)

:end
echo.
echo ========================================
echo.
