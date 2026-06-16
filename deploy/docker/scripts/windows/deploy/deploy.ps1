<#
========================================
部署模块
========================================
#>

$SCRIPT_DIR = Split-Path $MyInvocation.MyCommand.Path -Parent
. "$SCRIPT_DIR/../common/utils.ps1"
. "$SCRIPT_DIR/../common/config.ps1"

# 健康检查
function Health-Check {
    param(
        [string]$Service,
        [int]$MaxWait,
        [string]$CheckUrl
    )
    
    Write-LogInfo "等待 $Service 启动..."
    
    $startTime = Get-Date
    $endTime = $startTime.AddSeconds($MaxWait)
    
    while ((Get-Date) -lt $endTime) {
        docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) exec -T $Service sh -c "curl -s -f $CheckUrl" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-LogInfo "$Service 健康检查通过"
            return $true
        }
        
        $status = docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) ps $Service 2>&1
        if ($status -match "Up") {
            Write-LogInfo "$Service 容器已启动，等待服务就绪..."
        } else {
            Write-LogWarn "$Service 容器状态异常"
            Write-Host $status
        }
        
        Start-Sleep -Seconds 5
    }
    
    Write-LogError "$Service 健康检查超时"
    return $false
}

# 启动单个服务
function Start-ServiceContainer {
    param([string]$Service)
    $healthUrl = Get-HealthUrl $Service
    $healthTimeout = Get-HealthTimeout $Service
    
    Write-LogBlue "=== 启动 $Service ==="
    
    # 启动服务
    Write-LogInfo "启动 $Service 容器..."
    docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) up -d $Service 2>&1
    if ($LASTEXITCODE -ne 0) {
        Exit-Error "$Service 容器启动失败"
    }
    
    # 健康检查（如果提供了检查 URL）
    if ($healthUrl -and $healthUrl -ne "") {
        if (-not (Health-Check -Service $Service -MaxWait $healthTimeout -CheckUrl $healthUrl)) {
            Write-LogWarn "$Service 健康检查未通过，但容器已启动"
            Write-LogInfo "查看日志: docker-compose -f $env:COMPOSE_FILE logs $Service"
        }
    } else {
        # 等待容器启动
        Start-Sleep -Seconds 3
        $status = docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) ps $Service 2>&1
        if ($status -match "Up") {
            Write-LogInfo "$Service 容器启动成功"
        } else {
            Write-LogError "$Service 容器启动失败"
            docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) logs $Service
            return $false
        }
    }
    
    return $true
}

# 部署单个服务
function Deploy-Service {
    param([string]$Service)
    
    Write-LogCyan "========================================"
    Write-LogCyan "部署 $Service"
    Write-LogCyan "========================================"
    
    # 构建服务
    . "$SCRIPT_DIR/../build/build.ps1"
    Build-Service $Service
    
    # 启动服务
    Start-ServiceContainer $Service
    
    Write-LogInfo "$Service 部署完成"
}

# 部署所有服务
function Deploy-All {
    Write-LogCyan "========================================"
    Write-LogCyan "全量部署"
    Write-LogCyan "========================================"
    
    Deploy-Service "backend"
    Deploy-Service "frontend"
    Deploy-Service "kids-game-simple"
    
    Write-LogInfo "所有服务部署完成"
}

# 主函数
function Main {
    param([string]$Service = "all")
    
    switch ($Service) {
        "backend" { Deploy-Service "backend" }
        "frontend" { Deploy-Service "frontend" }
        "kids-game-simple" { Deploy-Service "kids-game-simple" }
        "all" { Deploy-All }
        default { Exit-Error "未知服务: $Service" }
    }
    
    # 显示状态
    . "$SCRIPT_DIR/../status/status.ps1"
    Show-Status
}

# 执行
Main "$args"