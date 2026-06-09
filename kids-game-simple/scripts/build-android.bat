@echo off
setlocal

set "BUILD_TYPE=%1"
if "%BUILD_TYPE%"=="" set "BUILD_TYPE=release"

echo.
echo ============================================
echo         Build kids-game-simple Android APK
echo ============================================
echo.

rem Check environment
echo [1/4] Checking environment...
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not installed
    exit /b 1
)
echo OK: Node.js installed

where java >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Java not installed
    exit /b 1
)
echo OK: Java installed

if not exist "package.json" (
    echo ERROR: package.json not found
    exit /b 1
)
echo OK: Project directory correct

rem Build web project
echo.
echo [2/4] Building web project...
npm run build:fast
if %errorlevel% neq 0 (
    echo ERROR: Web build failed
    exit /b 1
)
echo OK: Web build successful

rem Sync Capacitor
echo.
echo [3/4] Syncing Capacitor...
npx cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed
    exit /b 1
)
echo OK: Capacitor sync successful

rem Build APK
echo.
echo [4/4] Building APK (%BUILD_TYPE%)...
cd android

if "%2"=="clean" (
    echo Running gradlew clean...
    .\gradlew.bat clean
    if %errorlevel% neq 0 (
        echo ERROR: Gradle clean failed
        exit /b 1
    )
)

if "%BUILD_TYPE%"=="debug" (
    set "GRADLE_TASK=assembleDebug"
) else (
    set "GRADLE_TASK=assembleRelease"
)

echo Running gradlew %GRADLE_TASK%...
.\gradlew.bat %GRADLE_TASK%
if %errorlevel% neq 0 (
    echo ERROR: APK build failed
    exit /b 1
)
echo OK: APK build successful

rem Output result
echo.
echo ============================================
echo         Build Complete
echo ============================================
echo.

if "%BUILD_TYPE%"=="debug" (
    set "APK_PATH=app\build\outputs\apk\debug\app-debug.apk"
) else (
    set "APK_PATH=app\build\outputs\apk\release\app-release.apk"
)

if exist "%APK_PATH%" (
    echo APK Path: %cd%\%APK_PATH%
    echo.
    echo Build completed successfully!
) else (
    echo WARNING: APK file not found
)

cd ..
endlocal