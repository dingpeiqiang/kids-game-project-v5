<#
========================================
儿童游戏平台 - 本地开发环境启动脚本
========================================
启动服务：后端 + 管理端 + 终端
#>

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  儿童游戏平台 - 本地开发环境" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = Split-Path $PSScriptRoot -Parent
Set-Location $rootDir

Write-Host "[INFO] 检查 Java 环境..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-Object -First 1
    Write-Host "[OK] Java 版本: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Java 未安装或不在 PATH 中" -ForegroundColor Yellow
    Write-Host "请确保安装 Java 17+" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "[INFO] 启动后端服务..." -ForegroundColor Yellow

# 启动后端
Start-Process powershell -ArgumentList "-Command", "cd kids-game-backend; .\mvnw spring-boot:run" -WorkingDirectory $rootDir

Start-Sleep -Seconds 3

Write-Host "[INFO] 启动管理端..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd kids-game-frontend; npm run dev:admin" -WorkingDirectory $rootDir

Write-Host "[INFO] 启动终端..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-Command", "cd kids-game-simple; npm run dev" -WorkingDirectory $rootDir

Write-Host ""
Write-Host "[INFO] 服务启动中，请等待..." -ForegroundColor Green
Write-Host ""
Write-Host "访问地址：" -ForegroundColor Cyan
Write-Host "  后端 API: http://localhost:8080" -ForegroundColor White
Write-Host "  管理端: http://localhost:3000" -ForegroundColor White
Write-Host "  游戏终端: http://localhost:3001" -ForegroundColor White
Write-Host ""
Write-Host "按 Ctrl+C 停止所有服务"

Read-Host ""