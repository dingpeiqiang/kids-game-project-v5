<#
========================================
Windows 主入口脚本
========================================
#>

param(
    [string]$Action = "menu",
    [string]$Service = "all"
)

$SCRIPT_DIR = Split-Path $MyInvocation.MyCommand.Path -Parent

# 加载公共模块
. "$SCRIPT_DIR/common/utils.ps1"
. "$SCRIPT_DIR/common/config.ps1"
. "$SCRIPT_DIR/common/deps.ps1"

# ========================================
# 显示帮助信息
# ========================================
function Show-Help {
    Write-Host ""
    Write-Host "用法: $($MyInvocation.MyCommand.Name) -Action <操作> -Service <服务>"
    Write-Host ""
    Write-Host "操作:"
    Write-Host "  deploy      部署服务（构建并启动）"
    Write-Host "  build       只构建镜像"
    Write-Host "  start       只启动服务"
    Write-Host "  restart     重启服务"
    Write-Host "  cleanup     清理旧镜像"
    Write-Host "  status      查看服务状态"
    Write-Host ""
    Write-Host "服务:"
    Write-Host "  backend            后端服务"
    Write-Host "  frontend           前端服务"
    Write-Host "  kids-game-simple   儿童游戏终端服务"
    Write-Host "  all                所有服务（默认）"
    Write-Host ""
    Write-Host "示例:"
    Write-Host "  $($MyInvocation.MyCommand.Name) -Action deploy -Service backend"
    Write-Host "  $($MyInvocation.MyCommand.Name) -Action build -Service frontend"
    Write-Host "  $($MyInvocation.MyCommand.Name) -Action restart -Service all"
    Write-Host ""
}

# ========================================
# 显示菜单（交互式模式）
# ========================================
function Show-Menu {
    while ($true) {
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor $CYAN
        Write-Host "儿童游戏平台 - 容器部署管理 (Windows)" -ForegroundColor $CYAN
        Write-Host "=========================================" -ForegroundColor $CYAN
        Write-Host ""
        Write-Host "  1) 部署后端服务"
        Write-Host "  2) 部署前端服务"
        Write-Host "  3) 部署 kids-game-simple"
        Write-Host "  4) 全量部署"
        Write-Host "  5) 只构建镜像"
        Write-Host "  6) 只启动服务"
        Write-Host "  7) 重启服务"
        Write-Host "  8) 查看服务状态"
        Write-Host "  9) 清理旧镜像"
        Write-Host "  0) 退出"
        Write-Host ""
        $choice = Read-Host "请选择 [0-9]"
        Write-Host ""
        
        switch ($choice) {
            "0" {
                Write-Host "退出"
                exit 0
            }
            "1" { Main-Deploy "backend" }
            "2" { Main-Deploy "frontend" }
            "3" { Main-Deploy "kids-game-simple" }
            "4" { Main-Deploy "all" }
            "5" {
                Write-Host "选择要构建的服务:"
                Write-Host "  1) 后端"
                Write-Host "  2) 前端"
                Write-Host "  3) kids-game-simple"
                Write-Host "  4) 全部"
                $subChoice = Read-Host "请选择"
                switch ($subChoice) {
                    "1" { Main-Build "backend" }
                    "2" { Main-Build "frontend" }
                    "3" { Main-Build "kids-game-simple" }
                    "4" { Main-Build "all" }
                    default { Write-Host "无效选择" }
                }
            }
            "6" {
                Write-Host "选择要启动的服务:"
                Write-Host "  1) 后端"
                Write-Host "  2) 前端"
                Write-Host "  3) kids-game-simple"
                Write-Host "  4) 全部"
                $subChoice = Read-Host "请选择"
                switch ($subChoice) {
                    "1" { Main-Start "backend" }
                    "2" { Main-Start "frontend" }
                    "3" { Main-Start "kids-game-simple" }
                    "4" { Main-Start "all" }
                    default { Write-Host "无效选择" }
                }
            }
            "7" {
                Write-Host "选择要重启的服务:"
                Write-Host "  1) 后端"
                Write-Host "  2) 前端"
                Write-Host "  3) kids-game-simple"
                Write-Host "  4) 全部"
                $subChoice = Read-Host "请选择"
                switch ($subChoice) {
                    "1" { Main-Restart "backend" }
                    "2" { Main-Restart "frontend" }
                    "3" { Main-Restart "kids-game-simple" }
                    "4" { Main-Restart "all" }
                    default { Write-Host "无效选择" }
                }
            }
            "8" { Main-Status }
            "9" { Main-Cleanup }
            default { Write-Host "无效选择，请重新输入" }
        }
        
        if ($choice -ne "8") {
            Read-Host "按回车继续"
        }
    }
}

# ========================================
# 子命令函数
# ========================================
function Main-Deploy {
    param([string]$Service)
    "部署日志: $env:DEPLOY_LOG" | Out-File -FilePath $env:DEPLOY_LOG
    "开始时间: $(Get-Date)" | Add-Content -Path $env:DEPLOY_LOG
    Check-All
    Set-Location $env:DOCKER_DIR
    . "$SCRIPT_DIR/deploy/deploy.ps1"
    Main $Service
    "结束时间: $(Get-Date)" | Add-Content -Path $env:DEPLOY_LOG
}

function Main-Build {
    param([string]$Service)
    "构建日志: $env:DEPLOY_LOG" | Out-File -FilePath $env:DEPLOY_LOG
    "开始时间: $(Get-Date)" | Add-Content -Path $env:DEPLOY_LOG
    Check-All
    Set-Location $env:DOCKER_DIR
    . "$SCRIPT_DIR/build/build.ps1"
    Main $Service
    "结束时间: $(Get-Date)" | Add-Content -Path $env:DEPLOY_LOG
}

function Main-Start {
    param([string]$Service)
    "启动日志: $env:DEPLOY_LOG" | Out-File -FilePath $env:DEPLOY_LOG
    "开始时间: $(Get-Date)" | Add-Content -Path $env:DEPLOY_LOG
    Check-All
    Set-Location $env:DOCKER_DIR
    . "$SCRIPT_DIR/deploy/deploy.ps1"
    foreach ($s in $Service -split ",") {
        Start-ServiceContainer $s.Trim()
    }
    . "$SCRIPT_DIR/status/status.ps1"
    Show-Status
    "结束时间: $(Get-Date)" | Add-Content -Path $env:DEPLOY_LOG
}

function Main-Restart {
    param([string]$Service)
    "重启日志: $env:DEPLOY_LOG" | Out-File -FilePath $env:DEPLOY_LOG
    "开始时间: $(Get-Date)" | Add-Content -Path $env:DEPLOY_LOG
    Check-All
    Set-Location $env:DOCKER_DIR
    . "$SCRIPT_DIR/restart/restart.ps1"
    Main $Service
    "结束时间: $(Get-Date)" | Add-Content -Path $env:DEPLOY_LOG
}

function Main-Cleanup {
    "清理日志: $env:DEPLOY_LOG" | Out-File -FilePath $env:DEPLOY_LOG
    "开始时间: $(Get-Date)" | Add-Content -Path $env:DEPLOY_LOG
    Check-All
    Set-Location $env:DOCKER_DIR
    . "$SCRIPT_DIR/cleanup/cleanup.ps1"
    Main "images"
    "结束时间: $(Get-Date)" | Add-Content -Path $env:DEPLOY_LOG
}

function Main-Status {
    Check-All
    Set-Location $env:DOCKER_DIR
    . "$SCRIPT_DIR/status/status.ps1"
    Show-Status
}

# ========================================
# 主函数
# ========================================
function Main {
    if ($PSBoundParameters.ContainsKey('Action')) {
        switch ($Action) {
            "deploy" { Main-Deploy $Service }
            "build" { Main-Build $Service }
            "start" { Main-Start $Service }
            "restart" { Main-Restart $Service }
            "cleanup" { Main-Cleanup }
            "status" { Main-Status }
            "help" { Show-Help }
            default { Exit-Error "未知操作: $Action" }
        }
    } else {
        Show-Menu
    }
}

# 执行主函数
Main