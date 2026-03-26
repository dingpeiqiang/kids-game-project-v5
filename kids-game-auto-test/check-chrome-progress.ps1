# ============================================
# Chrome 浏览器安装进度检查器
# 功能：实时监控 Puppeteer Chrome 下载进度
# 创建时间：2026-03-26
# ============================================

$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Chrome Installation Progress Monitor" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# 设置缓存目录路径
$cachePath = "$env:USERPROFILE\.cache\puppeteer"

Write-Host "Checking cache directory: $cachePath`n" -ForegroundColor Yellow

# 检查缓存目录是否存在
if (-not (Test-Path $cachePath)) {
    Write-Host "Cache directory not found. Download may not have started yet." -ForegroundColor Red
    exit 1
}

# 获取所有文件
$files = Get-ChildItem -Path $cachePath -Recurse -File -ErrorAction SilentlyContinue

if ($files.Count -eq 0) {
    Write-Host "No files found in cache directory." -ForegroundColor Yellow
    exit 0
}

# 统计信息
$totalFiles = $files.Count
$totalSize = ($files | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)

Write-Host "Download Statistics:" -ForegroundColor Green
Write-Host "  Total Files: $totalFiles" -ForegroundColor White
Write-Host "  Total Size: $totalSizeMB MB" -ForegroundColor White

# 估算进度（Chrome 大约 300MB）
$estimatedTotalMB = 300
$progressPercent = [math]::Round(($totalSizeMB / $estimatedTotalMB) * 100, 2)

Write-Host "`nEstimated Progress:" -ForegroundColor Green
Write-Host "  Downloaded: $totalSizeMB MB / ~$estimatedTotalMB MB" -ForegroundColor White
Write-Host "  Progress: $progressPercent%" -ForegroundColor White

# 显示进度条
$progressBar = ""
$completedBlocks = [int]($progressPercent / 5)
for ($i = 1; $i -le 20; $i++) {
    if ($i -le $completedBlocks) {
        $progressBar += "█"
    } else {
        $progressBar += "░"
    }
}

Write-Host "`n[$progressBar] $progressPercent%`n" -ForegroundColor Cyan

# 检查是否完成
if ($totalSizeMB -gt 250) {
    Write-Host "✓ Download appears to be complete or nearly complete!" -ForegroundColor Green
    Write-Host "  Chrome installation should finish soon." -ForegroundColor Gray
} elseif ($progressPercent -lt 50) {
    Write-Host "⏳ Download in progress... This may take a few more minutes." -ForegroundColor Yellow
} else {
    Write-Host "⏳ Download over 50% complete! Almost there..." -ForegroundColor Cyan
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Tip: You can run this script again to" -ForegroundColor Gray
Write-Host "       check progress in real-time." -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan
