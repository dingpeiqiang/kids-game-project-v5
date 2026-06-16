<#
========================================
儿童游戏平台 - 生产环境构建脚本
========================================
构建顺序：shared -> admin -> simple
#>

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  儿童游戏平台 - 生产环境构建" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path $PSScriptRoot -Parent
Set-Location $rootDir

# 检查 Node.js
try {
    $nodeVersion = node -v
    Write-Host "[OK] Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js 未安装" -ForegroundColor Red
    exit 1
}

# 检查 pnpm
try {
    $pnpmVersion = pnpm -v
    Write-Host "[OK] pnpm 版本: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] pnpm 未安装" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "[INFO] 开始构建..." -ForegroundColor Yellow

# 安装依赖
Write-Host "[STEP 1/4] 安装依赖..." -ForegroundColor Cyan
pnpm install

# 构建 shared
Write-Host "[STEP 2/4] 构建 shared..." -ForegroundColor Cyan
pnpm --filter @kids-game/shared build

# 构建 admin
Write-Host "[STEP 3/4] 构建 admin..." -ForegroundColor Cyan
pnpm --filter kids-game-frontend build

# 构建 simple
Write-Host "[STEP 4/4] 构建 simple..." -ForegroundColor Cyan
pnpm --filter kids-game-simple build

Write-Host ""
Write-Host "[INFO] 构建完成！" -ForegroundColor Green
Write-Host ""
Write-Host "构建产物位置：" -ForegroundColor Cyan
Write-Host "  admin: kids-game-frontend/dist" -ForegroundColor White
Write-Host "  simple: kids-game-simple/dist" -ForegroundColor White