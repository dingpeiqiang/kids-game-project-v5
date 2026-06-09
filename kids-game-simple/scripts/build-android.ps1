<#
.SYNOPSIS
Build kids-game-simple Android APK

.DESCRIPTION
Builds Android APK for kids-game-simple project using local Gradle and JDK 21.

.PARAMETER BuildType
Build type: debug or release (default)

.EXAMPLE
.\build-android.ps1
Build release APK

.EXAMPLE
.\build-android.ps1 debug
Build debug APK
#>

param(
    [string]$BuildType = "release"
)

$projectRoot = $PWD.Path
$androidPath = Join-Path $projectRoot "android"
$gradlePath = "D:\APP\WORK\gradle-8.14.3\bin\gradle.bat"
$jdkPath = "D:\APP\WORK\jdk-21.0.11"

Write-Host "`n============================================"
Write-Host "      Build kids-game-simple Android APK"
Write-Host "============================================`n"

# [1/4] Check environment
Write-Host "[1/4] Checking environment..."
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not installed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Node.js installed" -ForegroundColor Green

if (-not (Test-Path $jdkPath)) {
    Write-Host "ERROR: JDK not found at $jdkPath" -ForegroundColor Red
    exit 1
}
Write-Host "OK: JDK 21 found at $jdkPath" -ForegroundColor Green

if (-not (Test-Path $gradlePath)) {
    Write-Host "ERROR: Gradle not found at $gradlePath" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Gradle found at $gradlePath" -ForegroundColor Green

if (-not (Test-Path (Join-Path $projectRoot "package.json"))) {
    Write-Host "ERROR: package.json not found" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Project directory correct" -ForegroundColor Green

# [2/4] Build web project
Write-Host "`n[2/4] Building web project..."
Write-Host "Running npm run build:fast..."
npm run build:fast
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Web build failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Web build successful" -ForegroundColor Green

# [3/4] Sync Capacitor
Write-Host "`n[3/4] Syncing Capacitor..."
Write-Host "Running npx cap sync android..."
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Capacitor sync failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Capacitor sync successful" -ForegroundColor Green

# [4/4] Build APK using local Gradle with JDK 21
Write-Host "`n[4/4] Building APK ($BuildType)..."
Set-Location $androidPath

$gradleTask = if ($BuildType -eq "debug") { "assembleDebug" } else { "assembleRelease" }

# Set JAVA_HOME to JDK 21
$env:JAVA_HOME = $jdkPath
Write-Host "Using JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Cyan

Write-Host "Running $gradlePath $gradleTask..."
& $gradlePath $gradleTask
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: APK build failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: APK build successful" -ForegroundColor Green

# Output result
Write-Host "`n============================================"
Write-Host "              Build Complete"
Write-Host "============================================`n"

$buildVariant = if ($BuildType -eq "debug") { "debug" } else { "release" }
$apkPath = Join-Path $androidPath "app\build\outputs\apk\$buildVariant\app-$buildVariant.apk"

if (Test-Path $apkPath) {
    Write-Host "APK Path: $apkPath" -ForegroundColor Green
    Write-Host "`nBuild completed successfully!" -ForegroundColor Green
} else {
    Write-Host "WARN: APK file not found" -ForegroundColor Yellow
}

Set-Location $projectRoot