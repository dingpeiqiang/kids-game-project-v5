<#
========================================
儿童游戏平台 - Docker 部署脚本 (PowerShell)
========================================
#>

param(
    [string]$Action = ""
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  儿童游戏平台 - Docker 部署工具" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Docker 是否安装
try {
    Get-Command docker -ErrorAction Stop | Out-Null
} catch {
    Write-Host "[ERROR] Docker 未安装，请先安装 Docker Desktop" -ForegroundColor Red
    Write-Host "下载地址: https://www.docker.com/products/docker-desktop/"
    Read-Host "按 Enter 键退出"
    exit 1
}

$dockerDir = Join-Path $PSScriptRoot "docker"

# 检查 docker 目录是否存在
if (-not (Test-Path $dockerDir)) {
    Write-Host "[ERROR] 找不到 docker 目录: $dockerDir" -ForegroundColor Red
    Read-Host "按 Enter 键退出"
    exit 1
}

Set-Location $dockerDir

# 检查是否有 .env 文件
if (-not (Test-Path ".env")) {
    Write-Host "[INFO] 复制环境变量配置文件..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env" -Force
    Write-Host "[WARN] 请编辑 deploy/docker/.env 文件配置必要参数" -ForegroundColor Yellow
    Write-Host ""
}

if ($Action -eq "deploy" -or $Action -eq "") {
    $confirm = Read-Host "是否继续部署？(y/n)"
    if ($confirm -eq "y" -or $confirm -eq "Y") {
        Write-Host ""
        Write-Host "[INFO] 开始构建并启动服务..." -ForegroundColor Green
        try {
            docker-compose build
            docker-compose up -d
            Write-Host ""
            Write-Host "[INFO] 部署完成！" -ForegroundColor Green
            docker-compose ps
        } catch {
            Write-Host "[ERROR] 部署失败: $_" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "[INFO] 已取消部署" -ForegroundColor Yellow
    }
}

Read-Host "按 Enter 键退出"