# Chrome 安装进度实时监控（每 5 秒刷新）
$ErrorActionPreference = "Continue"
$cachePath = "$env:USERPROFILE\.cache\puppeteer"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Chrome Installation Progress Monitor" -ForegroundColor Green
Write-Host "  Refreshing every 5 seconds..." -ForegroundColor Gray
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop monitoring.`n" -ForegroundColor Yellow

try {
    for ($i = 1; $i -le 120; $i++) {  # 最多监控 10 分钟 (120 * 5 秒)
        Clear-Host
        
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "  Check #$i - $(Get-Date -Format 'HH:mm:ss')" -ForegroundColor White
        Write-Host "========================================`n" -ForegroundColor Cyan
        
        if (Test-Path $cachePath) {
            $files = Get-ChildItem -Path $cachePath -Recurse -File -ErrorAction SilentlyContinue
            
            if ($files.Count -gt 0) {
                $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
                $sizeMB = [math]::Round($totalSize / 1MB, 2)
                
                Write-Host "Status: Downloading..." -ForegroundColor Green
                Write-Host "Files: $($files.Count)" -ForegroundColor White
                Write-Host "Size: $sizeMB MB" -ForegroundColor Cyan
                
                # 进度条 - 使用 ASCII 字符
                $estimatedTotalMB = 300
                $progressPercent = [math]::Min([math]::Round(($sizeMB / $estimatedTotalMB) * 100, 1), 100)
                
                Write-Host "`nProgress: $progressPercent%" -ForegroundColor Yellow
                $completedBlocks = [int]($progressPercent / 5)
                for ($j = 1; $j -le 20; $j++) {
                    if ($j -le $completedBlocks) {
                        $progressBar += "#"
                    } else {
                        $progressBar += "-"
                    }
                }
                
                Write-Host "[$progressBar]" -ForegroundColor DarkGray
                
                if ($sizeMB -gt 280) {
                    Write-Host "`n✓ Download nearly complete!" -ForegroundColor Green
                    Write-Host "  Installation should finish soon..." -ForegroundColor Gray
                } elseif ($sizeMB -gt 150) {
                    Write-Host "`n⏳ Over 50% complete!" -ForegroundColor Cyan
                } else {
                    Write-Host "`n⏳ Download in progress..." -ForegroundColor Yellow
                }
            } else {
                Write-Host "Status: Preparing download..." -ForegroundColor Yellow
                Write-Host "Cache directory exists but no files yet." -ForegroundColor Gray
            }
        } else {
            Write-Host "Status: Waiting to start..." -ForegroundColor Yellow
            Write-Host "Cache directory not created yet." -ForegroundColor Gray
        }
        
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "Next check in 5 seconds..." -ForegroundColor Gray
        Write-Host "========================================`n" -ForegroundColor Cyan
        
        Start-Sleep -Seconds 5
    }
}
catch {
    Write-Host "`nMonitoring stopped by user." -ForegroundColor Yellow
}

Write-Host "`nFinal Status Check:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (Test-Path $cachePath) {
    $files = Get-ChildItem -Path $cachePath -Recurse -File -ErrorAction SilentlyContinue
    if ($files.Count -gt 0) {
        $totalSize = ($files | Measure-Object -Property Length -Sum).Sum
        $sizeMB = [math]::Round($totalSize / 1MB, 2)
        Write-Host "Downloaded: $sizeMB MB" -ForegroundColor Green
        
        if ($sizeMB -gt 280) {
            Write-Host "✓ Chrome installation appears complete!" -ForegroundColor Green
            Write-Host "`nYou can now run: npm run test:game -- --game=plane-shooter" -ForegroundColor Cyan
        }
    }
}
