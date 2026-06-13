<#
.SYNOPSIS
Build kids-game-simple Android APK

.DESCRIPTION
Builds Android APK for kids-game-simple project.

.PARAMETER BuildType
Build type: debug or release (default)

.EXAMPLE
.\build-android.ps1
Interactive build selection

.EXAMPLE
.\build-android.ps1 debug
Build debug APK directly
#>

param(
    [string]$BuildType = ""
)

$scriptPath = $MyInvocation.MyCommand.Definition
$projectRoot = Join-Path (Split-Path $scriptPath -Parent) ".."
$projectRoot = Resolve-Path $projectRoot
$androidPath = Join-Path $projectRoot "android"
$gradlePath = Join-Path $androidPath "gradlew.bat"

if ($BuildType -eq "") {
    Write-Host "`nBuild Type:"
    Write-Host "1) Debug"
    Write-Host "2) Release"
    Write-Host ""
    $choice = Read-Host "Enter 1 or 2"
    switch ($choice) {
        "1" { $BuildType = "debug" }
        "2" { $BuildType = "release" }
        default {
            Write-Host "Invalid choice, using release" -ForegroundColor Yellow
            $BuildType = "release"
        }
    }
} else {
    $BuildType = $BuildType.ToLower()
    if ($BuildType -ne "release" -and $BuildType -ne "debug") {
        Write-Host "ERROR: Invalid build type. Use 'release' or 'debug'" -ForegroundColor Red
        exit 1
    }
}

Write-Host "`n============================================"
Write-Host "      Build kids-game-simple Android APK"
Write-Host "============================================`n"
Write-Host "Build Type: $($BuildType.ToUpper())`n"

# [1/4] Check environment
Write-Host "[1/4] Checking environment..."

if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js not installed" -ForegroundColor Red
    exit 1
}
$nodeVersion = (node --version)
Write-Host "OK: Node.js installed ($nodeVersion)" -ForegroundColor Green

if (-not (Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: pnpm not installed" -ForegroundColor Red
    exit 1
}
$pnpmVersion = (pnpm --version)
Write-Host "OK: pnpm installed ($pnpmVersion)" -ForegroundColor Green

if (-not (Test-Path (Join-Path $projectRoot "package.json"))) {
    Write-Host "ERROR: package.json not found" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Project directory correct" -ForegroundColor Green

if (-not (Test-Path $gradlePath)) {
    Write-Host "ERROR: Gradle wrapper not found at $gradlePath" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Gradle wrapper found" -ForegroundColor Green

# [2/4] Build web project
Write-Host "`n[2/4] Building web project..."
Write-Host "Running pnpm run build..."
pnpm run build 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARN: Web build failed, trying with existing dist..." -ForegroundColor Yellow
} else {
    Write-Host "OK: Web build successful" -ForegroundColor Green
}

# [3/4] Sync Capacitor
Write-Host "`n[3/4] Syncing Capacitor..."
Write-Host "Running pnpm exec cap sync android..."
pnpm exec cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Capacitor sync failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Capacitor sync successful" -ForegroundColor Green

# [4/4] Build APK using Gradle wrapper
Write-Host "`n[4/4] Building APK ($BuildType)..."
Set-Location $androidPath

$gradleTask = if ($BuildType -eq "debug") { "assembleDebug" } else { "assembleRelease" }

Write-Host "Running gradlew clean..."
& $gradlePath clean
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Gradle clean failed" -ForegroundColor Red
    exit 1
}
Write-Host "OK: Gradle clean successful" -ForegroundColor Green

Write-Host "Running gradlew $gradleTask..."
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
    $apkSize = (Get-Item $apkPath).Length / 1MB
    Write-Host "APK Path: $apkPath" -ForegroundColor Green
    Write-Host "APK Size: $($apkSize.ToString('F2')) MB" -ForegroundColor Cyan
    Write-Host "`nBuild completed successfully!" -ForegroundColor Green
} else {
    Write-Host "WARN: APK file not found" -ForegroundColor Yellow
}

Set-Location $projectRoot