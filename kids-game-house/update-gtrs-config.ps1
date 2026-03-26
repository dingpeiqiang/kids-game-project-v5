# ============================================
# 更新 GTRS 配置文件中的音频引用 (WAV → MP3)
# 说明：将所有 .wav 引用改为 .mp3
# 创建时间：2026-03-26
# ============================================

$ErrorActionPreference = "Stop"
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📝 更新 GTRS 配置文件 (WAV → MP3)" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# 设置工作目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# GTRS 配置文件路径
$gtrsFiles = @(
    (Join-Path $scriptDir "..\plane-shooter-vue3\public\themes\default\GTRS.json"),
    (Join-Path $scriptDir "..\plane-shooter-vue3\src\config\GTRS.json")
)

Write-Host "📋 待更新的配置文件:" -ForegroundColor Yellow
foreach ($file in $gtrsFiles) {
    Write-Host "  • $file" -ForegroundColor White
}
Write-Host ""

$updateCount = 0
$errorCount = 0

foreach ($gtrsFile in $gtrsFiles) {
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    # 检查文件是否存在
    if (-not (Test-Path $gtrsFile)) {
        Write-Host "❌ 文件不存在：$gtrsFile" -ForegroundColor Red
        $errorCount++
        continue
    }
    
    try {
        # 读取文件内容
        $content = Get-Content $gtrsFile -Raw -Encoding UTF8
        $originalContent = $content
        
        # 统计需要替换的数量
        $wavCount = ([regex]::Matches($content, '\.wav"')).Count
        Write-Host "🔍 找到 $wavCount 个 .wav 引用" -ForegroundColor Yellow
        
        if ($wavCount -eq 0) {
            Write-Host "✅ 无需更新，文件中没有 .wav 引用" -ForegroundColor Green
            continue
        }
        
        # 执行替换
        $content = $content -replace '\.wav"', '.mp3"'
        
        # 验证替换结果
        $mp3CountAfter = ([regex]::Matches($content, '\.mp3"')).Count
        Write-Host "📊 替换后：$mp3CountAfter 个 .mp3 引用" -ForegroundColor Green
        
        # 创建备份
        $backupFile = "$gtrsFile.bak.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Copy-Item $gtrsFile $backupFile -Force
        Write-Host "💾 已创建备份：$backupFile" -ForegroundColor Cyan
        
        # 保存更新后的文件
        Set-Content $gtrsFile $content -Encoding UTF8 -NoNewline
        Write-Host "✅ 已更新：$gtrsFile" -ForegroundColor Green
        
        $updateCount++
        
    } catch {
        Write-Host "❌ 错误：$($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
    
    Write-Host ""
}

# 总结
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "📊 更新完成统计:" -ForegroundColor Cyan
Write-Host "  - 成功更新：$updateCount / $($gtrsFiles.Count) 个文件" -ForegroundColor Green
Write-Host "  - 失败：$errorCount 个文件" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($errorCount -eq 0) {
    Write-Host "🎉 GTRS 配置文件更新成功!" -ForegroundColor Green
} else {
    Write-Host "⚠️  部分文件更新失败，请检查错误信息" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "下一步操作:" -ForegroundColor Yellow
Write-Host "  1. 验证 GTRS 配置中的音频路径是否正确" -ForegroundColor White
Write-Host "  2. 测试游戏音频播放功能" -ForegroundColor White
Write-Host "  3. 如有必要，删除原始 WAV 文件以节省空间" -ForegroundColor White
Write-Host ""

# 显示更新后的音频引用
Write-Host "📋 更新后的音频资源配置:" -ForegroundColor Cyan
foreach ($gtrsFile in $gtrsFiles) {
    if (Test-Path $gtrsFile) {
        $content = Get-Content $gtrsFile -Raw
        $matches = [regex]::Matches($content, '"(bgm_|effect_)[^"]*\.mp3"')
        if ($matches.Count -gt 0) {
            Write-Host "`n  文件：$gtrsFile" -ForegroundColor Yellow
            foreach ($match in $matches) {
                Write-Host "    • $($match.Value.Trim('"'))" -ForegroundColor White
            }
        }
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "✅ GTRS 配置更新完成!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""
