Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FFmpeg 自动安装脚本 (Windows)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] 检查 FFmpeg 是否已安装..." -ForegroundColor Yellow
$check = ffmpeg -version
if ($LASTEXITCODE -eq 0) {
    Write-Host "FFmpeg 已安装" -ForegroundColor Green
    Write-Host $check[0] -ForegroundColor Gray
    exit 0
}

Write-Host "FFmpeg 未安装，开始安装..." -ForegroundColor Yellow

Write-Host "[2/5] 下载 FFmpeg..." -ForegroundColor Yellow
$url = "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
$tempZip = "$env:TEMP\ffmpeg.zip"
$installDir = "C:\ffmpeg"

Write-Host "Downloading from: $url" -ForegroundColor Gray
try {
    Invoke-WebRequest -Uri $url -OutFile $tempZip -UseBasicParsing
    Write-Host "Download completed" -ForegroundColor Green
} catch {
    Write-Host "Download failed: $_" -ForegroundColor Red
    Write-Host "Please download manually from https://ffmpeg.org/download.html" -ForegroundColor Yellow
    exit 1
}

Write-Host "[3/5] 解压 FFmpeg..." -ForegroundColor Yellow
if (Test-Path $installDir) {
    Write-Host "Removing existing installation..." -ForegroundColor Yellow
    Remove-Item -Path $installDir -Recurse -Force
}

Expand-Archive -Path $tempZip -DestinationPath $env:TEMP -Force
Write-Host "Extraction completed" -ForegroundColor Green

Write-Host "[4/5] 移动 FFmpeg 到安装目录..." -ForegroundColor Yellow
$folder = Get-ChildItem -Path $env:TEMP | Where-Object { $_.Name -like "ffmpeg-*" -and $_.PSIsContainer } | Select-Object -First 1
if ($folder) {
    Move-Item -Path $folder.FullName -Destination $installDir -Force
    Write-Host "FFmpeg installed to: $installDir" -ForegroundColor Green
} else {
    Write-Host "ERROR: Cannot find extracted folder" -ForegroundColor Red
    exit 1
}

Write-Host "[5/5] 添加到系统 PATH..." -ForegroundColor Yellow
$pathVar = [Environment]::GetEnvironmentVariable("Path", "Machine")
$binPath = "$installDir\bin"

if ($pathVar -notlike "*$binPath*") {
    $newPath = $pathVar + ";" + $binPath
    [Environment]::SetEnvironmentVariable("Path", $newPath, "Machine")
    Write-Host "Added $binPath to PATH" -ForegroundColor Green
    Write-Host "NOTE: Please restart terminal or re-login to take effect" -ForegroundColor Yellow
} else {
    Write-Host "FFmpeg already in PATH" -ForegroundColor Green
}

Write-Host "Cleaning up..." -ForegroundColor Gray
Remove-Item -Path $tempZip -Force -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "FFmpeg Installation Success!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "To verify:" -ForegroundColor White
Write-Host "1. Open a NEW command prompt window" -ForegroundColor Gray
Write-Host "2. Run: ffmpeg -version" -ForegroundColor Gray
Write-Host "3. You should see FFmpeg version info" -ForegroundColor Gray
Write-Host ""
Write-Host "Install location: $installDir" -ForegroundColor White
Write-Host "Executable: $binPath\ffmpeg.exe" -ForegroundColor White
