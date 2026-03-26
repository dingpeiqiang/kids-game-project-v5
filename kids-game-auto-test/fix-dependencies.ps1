# ============================================
# 依赖检查和修复脚本
# 功能：自动检测并修复缺失的依赖
# 创建时间：2026-03-26
# ============================================

$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Dependency Check & Fix Tool" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# 设置工作目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
cd $scriptDir

Write-Host "Current Directory: $(Get-Location)`n" -ForegroundColor Yellow

# Step 1: 检查 Node.js
Write-Host "[1/5] Checking Node.js..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Gray
    exit 1
}
else {
    $nodeVersion = node --version
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
}

# Step 2: 检查 package.json
Write-Host "`n[2/5] Checking package.json..." -ForegroundColor Yellow
if (-not (Test-Path "package.json")) {
    Write-Host "ERROR: package.json not found!" -ForegroundColor Red
    exit 1
}
else {
    Write-Host "✓ package.json found" -ForegroundColor Green
}

# Step 3: 清理 npm 缓存
Write-Host "`n[3/5] Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "✓ Cache cleaned" -ForegroundColor Green

# Step 4: 删除 node_modules（如果有）
Write-Host "`n[4/5] Removing old node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force
    Write-Host "✓ Removed old node_modules" -ForegroundColor Green
}
else {
    Write-Host "ℹ No existing node_modules found" -ForegroundColor Gray
}

# Step 5: 重新安装所有依赖
Write-Host "`n[5/5] Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes...`n" -ForegroundColor Gray

try {
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n✓ All dependencies installed successfully!" -ForegroundColor Green
    }
    else {
        throw "npm install failed with exit code $LASTEXITCODE"
    }
}
catch {
    Write-Host "`nERROR: Failed to install dependencies!" -ForegroundColor Red
    Write-Host "Error details: $_" -ForegroundColor Gray
    Write-Host "`nTrying alternative approach..." -ForegroundColor Yellow
    
    # 尝试逐个安装关键依赖
    Write-Host "`nInstalling critical dependencies one by one..." -ForegroundColor Gray
    
    $criticalPackages = @(
        "puppeteer",
        "playwright",
        "axios",
        "winston",
        "moment",
        "lodash",
        "commander"
    )
    
    foreach ($package in $criticalPackages) {
        Write-Host "Installing $package..." -ForegroundColor Gray
        npm install $package --save
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠ Warning: Failed to install $package" -ForegroundColor Yellow
        }
    }
}

# 验证安装
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Verifying Installation..." -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

$testModules = @("puppeteer", "winston", "axios", "commander")

foreach ($module in $testModules) {
    try {
        node -e "require('$module')" 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ $module" -ForegroundColor Green
        }
        else {
            Write-Host "✗ $module (missing)" -ForegroundColor Red
        }
    }
    catch {
        Write-Host "✗ $module (error)" -ForegroundColor Red
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Installation Complete!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Run: npm run test:game -- --game=plane-shooter" -ForegroundColor White
Write-Host "  2. Or run: npm run test:all" -ForegroundColor White
Write-Host ""
