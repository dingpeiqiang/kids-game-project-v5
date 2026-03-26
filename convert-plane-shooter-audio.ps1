# 将 plane-shooter 的 WAV 音频批量转换为 MP3 格式
# 使用系统安装的 FFmpeg 工具

$audioDir = "D:\工作\sitech\项目\研发\git_workspace\AI\kids-game-project-v5\kids-game-house\plane-shooter\public\themes\default\audio"

Write-Host "开始转换音频文件..." -ForegroundColor Green
Write-Host "目标目录：$audioDir" -ForegroundColor Cyan
Write-Host ""

# 检查 FFmpeg 是否可用
try {
    $ffmpegVersion = ffmpeg -version 2>&1 | Select-Object -First 1
    Write-Host "FFmpeg 版本：$ffmpegVersion" -ForegroundColor Green
} catch {
    Write-Host "错误：未找到 FFmpeg，请先安装 FFmpeg" -ForegroundColor Red
    Write-Host "运行以下命令安装：" -ForegroundColor Yellow
    Write-Host "  .\install-ffmpeg.ps1" -ForegroundColor Cyan
    exit 1
}

Write-Host ""

# 获取所有 WAV 文件
$wavFiles = Get-ChildItem -Path $audioDir -Filter "*.wav"
$totalCount = $wavFiles.Count
$currentIndex = 0
$successCount = 0
$failCount = 0

foreach ($wavFile in $wavFiles) {
    $currentIndex++
    $mp3File = [System.IO.Path]::ChangeExtension($wavFile.FullName, ".mp3")
    $fileName = $wavFile.Name
    
    Write-Host "[$currentIndex/$totalCount] 转换：$fileName" -ForegroundColor Yellow
    
    # 使用 FFmpeg 转换：WAV -> MP3 (192kbps)
    $arguments = @(
        "-i", $wavFile.FullName,
        "-codec:a", "libmp3lame",
        "-b:a", "192k",
        "-y",  # 覆盖已存在的文件
        $mp3File
    )
    
    $processInfo = New-Object System.Diagnostics.ProcessStartInfo
    $processInfo.FileName = "ffmpeg"
    $processInfo.Arguments = $arguments
    $processInfo.RedirectStandardOutput = $true
    $processInfo.RedirectStandardError = $true
    $processInfo.UseShellExecute = $false
    $processInfo.CreateNoWindow = $true
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $processInfo
    $process.Start() | Out-Null
    $process.WaitForExit()
    
    if ($process.ExitCode -eq 0) {
        Write-Host "  ✓ 成功转换为 $([System.IO.Path]::GetFileName($mp3File))" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ✗ 转换失败" -ForegroundColor Red
        $failCount++
    }
}

Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "转换完成！" -ForegroundColor Green
Write-Host "总计：$totalCount 个文件" -ForegroundColor White
Write-Host "成功：$successCount 个文件" -ForegroundColor Green
Write-Host "失败：$failCount 个文件" -ForegroundColor Red
Write-Host "=================================" -ForegroundColor Cyan
