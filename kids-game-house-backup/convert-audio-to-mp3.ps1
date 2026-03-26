# ============================================
# 飞机大战音频格式转换脚本 (WAV → MP3)
# 说明：批量将所有 WAV 音频转换为 MP3 格式
# 创建时间：2026-03-26
# ============================================

$ErrorActionPreference = "Stop"
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "🎵 飞机大战音频格式转换工具 (WAV → MP3)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 设置工作目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$audioDir = Join-Path $scriptDir "..\plane-shooter-vue3\public\themes\default\assets\audio"

Write-Host "📂 音频目录：$audioDir" -ForegroundColor Yellow
Write-Host ""

# 检查目录是否存在
if (-not (Test-Path $audioDir)) {
    Write-Host "❌ 错误：音频目录不存在！" -ForegroundColor Red
    exit 1
}

# 获取所有 WAV 文件
$wavFiles = Get-ChildItem -Path $audioDir -Filter "*.wav"
Write-Host "📊 找到 $($wavFiles.Count) 个 WAV 文件待转换" -ForegroundColor Yellow
Write-Host ""

if ($wavFiles.Count -eq 0) {
    Write-Host "✅ 没有需要转换的 WAV 文件" -ForegroundColor Green
    exit 0
}

# 检查 FFmpeg
Write-Host "🔍 检查 FFmpeg..." -ForegroundColor Yellow
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 错误：FFmpeg 未安装！" -ForegroundColor Red
    Write-Host "请安装 FFmpeg:"
    Write-Host "  Windows: choco install ffmpeg"
    Write-Host "  或从 https://ffmpeg.org/download.html 下载"
    exit 1
}
Write-Host "✅ FFmpeg 已就绪" -ForegroundColor Green
Write-Host ""

# 开始转换
Write-Host "=== 开始批量转换 ===" -ForegroundColor Cyan
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
    
    Write-Host "[$currentIndex/$totalFiles] 🔄 转换：$fileName ..." -ForegroundColor Yellow
    
    try {
        # 使用 FFmpeg 转换 (高质量 MP3, 192kbps)
        $arguments = @(
            "-i", $wavFile.FullName,
            "-codec:a", "libmp3lame",
            "-b:a", "192k",
            "-y",  # 覆盖已存在的文件
            $mp3File
        )
        
        Write-Host "  执行命令：ffmpeg $($arguments -join ' ')" -ForegroundColor Gray
        
        $process = Start-Process -FilePath "ffmpeg" -ArgumentList $arguments -Wait -PassThru -NoNewWindow
        
        if ($process.ExitCode -eq 0) {
            $mp3Info = Get-Item $mp3File
            $sizeKB = [math]::Round($mp3Info.Length / 1KB, 2)
            Write-Host "  ✅ 成功：$outputName ($sizeKB KB)" -ForegroundColor Green
            
            # 计算压缩比
            $originalSize = $wavFile.Length
            $compressedSize = $mp3Info.Length
            $ratio = [math]::Round((1 - $compressedSize / $originalSize) * 100, 1)
            Write-Host "  📉 压缩比：${ratio}% (原始：$([math]::Round($originalSize/1KB, 2)) KB)" -ForegroundColor Cyan
            
            $conversionCount++
        } else {
            Write-Host "  ❌ 失败：FFmpeg 退出码 $($process.ExitCode)" -ForegroundColor Red
            $errorCount++
        }
    } catch {
        Write-Host "  ❌ 错误：$($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
    
    Write-Host ""
}

# 统计结果
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📊 转换完成统计:" -ForegroundColor Cyan
Write-Host "  - 成功：$conversionCount / $totalFiles 个文件" -ForegroundColor Green
Write-Host "  - 失败：$errorCount 个文件" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($errorCount -eq 0) {
    Write-Host "🎉 所有音频文件转换成功!" -ForegroundColor Green
} else {
    Write-Host "⚠️  部分文件转换失败，请检查错误信息" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📁 输出目录：$audioDir" -ForegroundColor Yellow
Write-Host ""

# 列出所有 MP3 文件
Write-Host "📋 生成的 MP3 文件列表:" -ForegroundColor Cyan
Get-ChildItem -Path $audioDir -Filter "*.mp3" | Sort-Object Name | ForEach-Object {
    $sizeKB = [math]::Round($_.Length / 1KB, 2)
    Write-Host "  • $($_.Name) ($sizeKB KB)"
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "✅ 转换任务完成!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步操作:" -ForegroundColor Yellow
Write-Host "  1. 验证 MP3 文件是否正常" -ForegroundColor White
Write-Host "  2. 运行 update-gtrs-config.ps1 更新 GTRS 配置" -ForegroundColor White
Write-Host "  3. 测试游戏音频播放" -ForegroundColor White
Write-Host ""
