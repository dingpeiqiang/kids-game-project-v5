# ============================================
# Update GTRS Configuration (WAV to MP3)
# Description: Replace all .wav references with .mp3
# Created: 2026-03-26
# ============================================

$ErrorActionPreference = "Stop"
Write-Host "=========================================================="
Write-Host "Update GTRS Configuration (WAV to MP3)"
Write-Host "=========================================================="
Write-Host ""

# Set working directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# GTRS configuration file paths
$gtrsFiles = @(
    (Join-Path $PSScriptRoot "plane-shooter-vue3\public\themes\default\GTRS.json"),
    (Join-Path $PSScriptRoot "plane-shooter-vue3\src\config\GTRS.json")
)

Write-Host "Configuration files to update:" -ForegroundColor Yellow
foreach ($file in $gtrsFiles) {
    Write-Host "  - $file" -ForegroundColor White
}
Write-Host ""

$updateCount = 0
$errorCount = 0

foreach ($gtrsFile in $gtrsFiles) {
    Write-Host "----------------------------------------" -ForegroundColor Gray
    
    # Check if file exists
    if (-not (Test-Path $gtrsFile)) {
        Write-Host "ERROR: File not found: $gtrsFile" -ForegroundColor Red
        $errorCount++
        continue
    }
    
    try {
        # Read file content
        $content = Get-Content $gtrsFile -Raw -Encoding UTF8
        $originalContent = $content
        
        # Count WAV references
        $wavCount = ([regex]::Matches($content, '\.wav"')).Count
        Write-Host "Found $wavCount .wav references" -ForegroundColor Yellow
        
        if ($wavCount -eq 0) {
            Write-Host "No update needed, no .wav references found" -ForegroundColor Green
            continue
        }
        
        # Replace .wav with .mp3
        $content = $content -replace '\.wav"', '.mp3"'
        
        # Verify replacement
        $mp3CountAfter = ([regex]::Matches($content, '\.mp3"')).Count
        Write-Host "After update: $mp3CountAfter .mp3 references" -ForegroundColor Green
        
        # Create backup
        $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
        $backupFile = "$gtrsFile.bak.$timestamp"
        Copy-Item $gtrsFile $backupFile -Force
        Write-Host "Backup created: $backupFile" -ForegroundColor Cyan
        
        # Save updated file
        Set-Content $gtrsFile $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $gtrsFile" -ForegroundColor Green
        
        $updateCount++
        
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $errorCount++
    }
    
    Write-Host ""
}

# Summary
Write-Host "=========================================================="
Write-Host "Update Summary:"
Write-Host "  - Files updated: $updateCount / $($gtrsFiles.Count)" -ForegroundColor Green
Write-Host "  - Files failed: $errorCount" -ForegroundColor $(if ($errorCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($errorCount -eq 0) {
    Write-Host "GTRS configuration updated successfully!" -ForegroundColor Green
} else {
    Write-Host "Some files failed to update. Please check errors above." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next Steps:"
Write-Host "  1. Verify audio paths in GTRS configuration are correct"
Write-Host "  2. Test game audio playback"
Write-Host "  3. Optionally delete original WAV files to save space"
Write-Host ""

# Show updated audio references
Write-Host "Updated Audio Resources:" -ForegroundColor Cyan
foreach ($gtrsFile in $gtrsFiles) {
    if (Test-Path $gtrsFile) {
        $content = Get-Content $gtrsFile -Raw
        $matches = [regex]::Matches($content, '"(bgm_|effect_)[^"]*\.mp3"')
        if ($matches.Count -gt 0) {
            Write-Host "`nFile: $gtrsFile" -ForegroundColor Yellow
            foreach ($match in $matches) {
                Write-Host "  - $($match.Value.Trim('"'))" -ForegroundColor White
            }
        }
    }
}

Write-Host ""
Write-Host "=========================================================="
Write-Host "Configuration Update Complete!" -ForegroundColor Green
Write-Host "=========================================================="
Write-Host ""
