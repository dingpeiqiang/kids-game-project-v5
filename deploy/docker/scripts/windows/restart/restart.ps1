<#
========================================
重启模块
========================================
#>

$SCRIPT_DIR = Split-Path $MyInvocation.MyCommand.Path -Parent
. "$SCRIPT_DIR/../common/utils.ps1"

# 重启单个服务
function Restart-Service {
    param([string]$Service)
    
    Write-LogBlue "=== 重启 $Service ==="
    
    Write-LogInfo "停止 $Service 容器..."
    docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) stop $Service 2>&1 | Out-Null
    
    Write-LogInfo "启动 $Service 容器..."
    docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) up -d $Service 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-LogInfo "$Service 重启成功"
    } else {
        Write-LogError "$Service 重启失败"
        return $false
    }
    
    return $true
}

# 重启所有服务
function Restart-All {
    Write-LogCyan "========================================"
    Write-LogCyan "重启所有服务"
    Write-LogCyan "========================================"
    
    Restart-Service "backend"
    Restart-Service "frontend"
    Restart-Service "kids-game-simple"
    
    Write-LogInfo "所有服务重启完成"
}

# 主函数
function Main {
    param([string]$Service = "all")
    
    switch ($Service) {
        "backend" { Restart-Service "backend" }
        "frontend" { Restart-Service "frontend" }
        "kids-game-simple" { Restart-Service "kids-game-simple" }
        "all" { Restart-All }
        default { Exit-Error "未知服务: $Service" }
    }
    
    # 显示状态
    . "$SCRIPT_DIR/../status/status.ps1"
    Show-Status
}

# 执行
Main "$args"