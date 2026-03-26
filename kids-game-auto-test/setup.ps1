# ============================================
# Kids Game 自动化测试平台
# 功能：自动化模拟游戏操作 + AI 智能分析
# 创建时间：2026-03-26
# ============================================

$ErrorActionPreference = "Continue"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Kids Game Auto Test Platform" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

# 设置工作目录
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
cd $scriptDir

Write-Host "Current Directory: $(Get-Location)`n" -ForegroundColor Yellow

# 检查 Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Gray
    exit 1
}
else {
    $nodeVersion = node --version
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
}

# 检查 Python（用于 AI 分析）
Write-Host "`nChecking Python..." -ForegroundColor Yellow
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "⚠ WARNING: Python is not installed!" -ForegroundColor Yellow
    Write-Host "AI features will be limited without Python" -ForegroundColor Gray
}
else {
    $pythonVersion = python --version
    Write-Host "✓ Python version: $pythonVersion" -ForegroundColor Green
}

# 检查 FFmpeg（用于视频录制）
Write-Host "`nChecking FFmpeg..." -ForegroundColor Yellow
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    Write-Host "⚠ WARNING: FFmpeg is not installed!" -ForegroundColor Yellow
    Write-Host "Screen recording features will be unavailable" -ForegroundColor Gray
}
else {
    Write-Host "✓ FFmpeg is available" -ForegroundColor Green
}

# 安装依赖
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Installing Dependencies..." -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Installing NPM packages..." -ForegroundColor Yellow
npm install

Write-Host "`n✓ All dependencies installed successfully!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Review config/test-config.json" -ForegroundColor White
Write-Host "  2. Configure game URLs and test scenarios" -ForegroundColor White
Write-Host "  3. Run: npm run test:all" -ForegroundColor White
Write-Host ""
