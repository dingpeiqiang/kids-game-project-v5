<#
儿童游戏平台 - 本地开发（后端 + 统一前端 :3000）
#>

$ErrorActionPreference = "Continue"

$rootDir = Split-Path $PSScriptRoot -Parent
Set-Location $rootDir

Write-Host ""
Write-Host "  后端 + 前端 (kids-game-frontend)" -ForegroundColor Cyan
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir\kids-game-backend'; .\mvnw spring-boot:run"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$rootDir'; pnpm dev"

Write-Host "  API:  http://localhost:8080"
Write-Host "  前端: http://localhost:3000"
Write-Host ""