# ============================================
# 飞机大战音频格式转换脚本 (WAV → MP3)
# 说明：批量将所有 WAV 音频转换为 MP3 格式
# 创建时间：2026-03-26
# ============================================

$ErrorActionPreference = "Stop"
Write-Host "=========================================================="
Write-Host "Audio Conversion Tool (WAV to MP3)"
Write-Host "=========================================================="
Write-Host ""

# Set working directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$audioDir = Join-Path $PSScriptRoot "plane-shooter-vue3\public\themes\default\assets\audio"

Write-Host "Audio Directory: $audioDir"
Write-Host ""

# Check if directory exists
if (-not (Test-Path $audioDir)) {
    Write-Host "ERROR: Audio directory does not exist!" -ForegroundColor Red
    exit 1
}

# Get all WAV files
$wavFiles = Get-ChildItem -Path $audioDir -Filter "*.wav"
Write-Host "Found $($wavFiles.Count) WAV files to convert"
Write-Host ""

if ($wavFiles.Count -eq 0) {
    Write-Host "No WAV files found. Nothing to convert." -ForegroundColor Green
    exit 0
}

# Check FFmpeg
Write-Host "Checking FFmpeg..." -ForegroundColor Yellow
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: FFmpeg is not installed!" -ForegroundColor Red
    Write-Host "Please install FFmpeg:"
    Write-Host "  Windows: choco install ffmpeg"
    Write-Host "  Or download from https://ffmpeg.org/download.html"
    exit 1
}
Write-Host "FFmpeg is ready" -ForegroundColor Green
Write-Host ""

# Start conversion
Write-Host "=== Starting Batch Conversion ==="
Write-Host ""

$conversionCount = 0
$errorCount = 0
$totalFiles = $wavFiles.Count
$currentIndex = 0

foreach ($wavFile in $wavFiles) {
    $currentIndex++
    $mp3File = [System.IO.Path]::ChangeExtension($wavFile.FullName, ".mp3")
    $fileName = $wavFile.Name
    $outputName = [System.IO.Path]::GetFileName($mp3File)
    
    Write-Host "[$currentIndex/$totalFiles] Converting: $fileName ..." -ForegroundColor Yellow
    
    try {
        # Use FFmpeg to convert (high quality MP3, 192kbps)
        $arguments = @(
            "-i", $wavFile.FullName,
            "-codec:a", "libmp3lame",
            "-b:a", "192k",
            "-y",
            $mp3File
        )
        
        $process = Start-Process -FilePath "ffmpeg" -ArgumentList $arguments -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0) {
            $mp3Info = Get-Item $mp3File
            $sizeKB = [math]::Round($mp3Info.Length / 1KB, 2)
            Write-Host "  SUCCESS: $outputName ($sizeKB KB)" -ForegroundColor Green
            
            # Calculate compression ratio
            $originalSize = $wavFile.Length
            $compressedSize = $mp3Info.Length
            $ratio = [math]::Round((1 - $compressedSize / $originalSize) * 100, 1)
            Write-Host "  Compression: ${ratio}% (Original: $([math]::Round($originalSize/1KB, 2)) KB)" -ForegroundColor Cyan
            
            $conversionCount++
        } else {
            Write-Host "  FAILED: FFmpeg exit code $($process.ExitCode)" -ForegroundColor Red
            $errorCount++
        }
    } catch {
        Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
    
    Write-Host ""
}

# Statistics
Write-Host "=========================================================="
Write-Host "Conversion Statistics:"
Write-Host "  - Success: $conversionCount / $totalFiles files" -ForegroundColor Green
Write-Host "  - Failed: $errorCount files" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($errorCount -eq 0) {
    Write-Host "All audio files converted successfully!" -ForegroundColor Green
} else {
    Write-Host "Some files failed to convert. Please check errors above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Output Directory: $audioDir"
Write-Host ""

# List all MP3 files
Write-Host "Generated MP3 Files:" -ForegroundColor Cyan
Get-ChildItem -Path $audioDir -Filter "*.mp3" | Sort-Object Name | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1KB, 2)
    Write-Host "  - $($_.Name) ($sizeKB KB)"
}

Write-Host ""
Write-Host "=========================================================="
Write-Host "Conversion Complete!" -ForegroundColor Green
Write-Host "=========================================================="
Write-Host ""
Write-Host "Next Steps:"
Write-Host "  1. Verify MP3 files work correctly"
Write-Host "  2. Run update-gtrs-config.ps1 to update GTRS configuration"
Write-Host "  3. Test game audio playback"
Write-Host ""
