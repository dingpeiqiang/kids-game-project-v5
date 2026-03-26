# ============================================
# 游戏批量启动和测试脚本
# 功能：自动打开浏览器测试所有运行中的游戏
# 创建时间：2026-03-26
# ============================================

$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Kids Game Auto Test Launcher" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# 定义游戏 URL 列表
$gameUrls = @(
    @{Name="Plane Shooter (飞机大战)"; Url="http://localhost:8081/"},
    @{Name="Snake (贪吃蛇)"; Url="http://localhost:3005/"},
    @{Name="Tank Battle (坦克大战)"; Url="http://localhost:3002/"},
    @{Name="Plants vs Zombie (植物大战僵尸)"; Url="http://localhost:3004/"}
)

Write-Host "Found $($gameUrls.Count) games to test:`n" -ForegroundColor Yellow

# 逐个打开浏览器
foreach ($game in $gameUrls) {
    Write-Host "Opening: $($game.Name)" -ForegroundColor White
    Write-Host "  URL: $($game.Url)" -ForegroundColor Gray
    
    try {
        # 使用默认浏览器打开 URL
        Start-Process $game.Url
        Write-Host "  ✓ Opened successfully`n" -ForegroundColor Green
    }
    catch {
        Write-Host "  ✗ Failed to open: $_`n" -ForegroundColor Red
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  All Games Opened in Browser!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Testing Checklist:" -ForegroundColor Yellow
Write-Host ""
Write-Host "For each game, please verify:" -ForegroundColor White
Write-Host "  ✓ Page loads correctly" -ForegroundColor Gray
Write-Host "  ✓ Start screen displays properly" -ForegroundColor Gray
Write-Host "  ✓ Can select difficulty" -ForegroundColor Gray
Write-Host "  ✓ Can select theme" -ForegroundColor Gray
Write-Host "  ✓ Game plays normally" -ForegroundColor Gray
Write-Host "  ✓ Audio works (if applicable)" -ForegroundColor Gray
Write-Host "  ✓ No console errors" -ForegroundColor Gray
Write-Host ""

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Test each game in the browser" -ForegroundColor White
Write-Host "  2. Report any issues found" -ForegroundColor White
Write-Host "  3. Close browser tabs when done" -ForegroundColor White
Write-Host ""
