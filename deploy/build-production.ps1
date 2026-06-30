<#
儿童游戏平台 - 生产环境构建（单前端 kids-game-frontend）
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  儿童游戏平台 - 生产环境构建" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path $PSScriptRoot -Parent
Set-Location $rootDir

try { Write-Host "[OK] Node.js: $(node -v)" -ForegroundColor Green } catch { exit 1 }
try { Write-Host "[OK] pnpm: $(pnpm -v)" -ForegroundColor Green } catch { exit 1 }

Write-Host ""
Write-Host "[STEP 1/2] pnpm install..." -ForegroundColor Cyan
pnpm install

Write-Host "[STEP 2/2] pnpm build (frontend)..." -ForegroundColor Cyan
pnpm build

Write-Host ""
Write-Host "[OK] 产物: kids-game-frontend/dist" -ForegroundColor Green