<#
========================================
状态模块
========================================
#>

$SCRIPT_DIR = Split-Path $MyInvocation.MyCommand.Path -Parent
. "$SCRIPT_DIR/../common/utils.ps1"

# 显示服务状态
function Show-Status {
    Write-LogBlue "=== 服务状态 ==="
    docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) ps
    
    Write-LogBlue ""
    Write-LogBlue "=== 镜像信息 ==="
    docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) images
}

# 显示日志
function Show-Logs {
    param([string]$Service = "")
    
    Write-LogBlue "=== 查看日志 ==="
    
    if ($Service) {
        Write-LogInfo "查看 $Service 日志（最近100行）"
        docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) logs --tail=100 $Service
    } else {
        Write-LogInfo "查看所有服务日志（最近50行）"
        docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) logs --tail=50
    }
}

# 显示健康状态
function Show-Health {
    Write-LogBlue "=== 健康状态 ==="
    
    $services = @("backend", "frontend")
    
    foreach ($service in $services) {
        Write-LogInfo "检查 $service..."
        docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) exec -T $service sh -c "curl -s http://localhost:8080/actuator/health 2>/dev/null || echo '服务未就绪'" 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "无法连接到 $service"
        }
    }
}

# 主函数
function Main {
    param([string]$Action = "status")
    
    switch ($Action) {
        "status" { Show-Status }
        "logs" { Show-Logs $args[0] }
        "health" { Show-Health }
        default { Exit-Error "未知操作: $Action" }
    }
}

# 执行
Main "$args"