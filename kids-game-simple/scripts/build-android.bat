@echo off
setlocal

set "BUILD_TYPE=%1"
if "%BUILD_TYPE%"=="" set "BUILD_TYPE=release"

set "CLEAN_BUILD=0"
if "%2"=="clean" set "CLEAN_BUILD=1"

echo.
echo ============================================
echo         Build kids-game-simple Android APK
echo ============================================
echo.

rem [1/4] Check environment
echo [1/4] Checking environment...

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not installed
    exit /b 1
)
node --version
echo OK: Node.js installed

where pnpm >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: pnpm not installed
    exit /b 1
)
pnpm --version
echo OK: pnpm installed

if not exist "package.json" (
    echo ERROR: package.json not found
    exit /b 1
)
echo OK: Project directory correct

if not exist "android\gradlew.bat" (
    echo ERROR: Gradle wrapper not found
    exit /b 1
)
echo OK: Gradle wrapper found

rem [2/4] Build web project
echo.
echo [2/4] Building web project...
echo Running pnpm run build...
pnpm run build
if %errorlevel% neq 0 (
    echo ERROR: Web build failed
    exit /b 1
)
echo OK: Web build successful

rem [3/4] Sync Capacitor
echo.
echo [3/4] Syncing Capacitor...
echo Running pnpm exec cap sync android...
pnpm exec cap sync android
if %errorlevel% neq 0 (
    echo ERROR: Capacitor sync failed
    exit /b 1
)
echo OK: Capacitor sync successful

rem [4/4] Build APK
echo.
echo [4/4] Building APK (%BUILD_TYPE%)...
cd android

if "%CLEAN_BUILD%"=="1" (
    echo Running gradlew clean...
    .\gradlew.bat clean
    if %errorlevel% neq 0 (
        echo ERROR: Gradle clean failed
        exit /b 1
    )
    echo OK: Gradle clean successful
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
    for %%F in ("%APK_PATH%") do set "APK_SIZE=%%~zF"
    set /a APK_SIZE_MB=APK_SIZE/1048576
    echo APK Size: %APK_SIZE_MB% MB
    echo.
    echo Build completed successfully!
) else (
    echo WARNING: APK file not found
)

cd ..
endlocal
