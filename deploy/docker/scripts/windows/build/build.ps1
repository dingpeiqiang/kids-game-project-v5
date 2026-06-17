<#
========================================
构建模块
========================================
#>

$SCRIPT_DIR = Split-Path $MyInvocation.MyCommand.Path -Parent
. "$SCRIPT_DIR/../common/utils.ps1"
. "$SCRIPT_DIR/../common/config.ps1"

# 停止服务
function Stop-ServiceContainer {
    param([string]$Service)
    Write-LogInfo "停止 $Service 容器..."
    docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) stop $Service 2>&1 | Out-Null
}

# 构建单个服务镜像
function Build-Service {
    param([string]$Service)
    $imageName = Get-ImageName $Service
    
    Write-LogBlue "=== 构建 $Service ==="
    
    # 停止服务
    Stop-ServiceContainer $Service
    
    # 清理旧镜像
    . "$SCRIPT_DIR/../cleanup/cleanup.ps1"
    Cleanup-OldImages -Service $Service -ImageName $imageName
    
    # 构建新镜像
    Write-LogInfo "开始构建 $Service 镜像..."
    docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) build --pull $Service 2>&1
    if ($LASTEXITCODE -ne 0) {
        Exit-Error "$Service 镜像构建失败"
    }
    
    Write-LogInfo "$Service 镜像构建成功"
}

# 构建所有服务
function Build-All {
    Write-LogCyan "========================================"
    Write-LogCyan "构建所有服务"
    Write-LogCyan "========================================"
    
    Build-Service "backend"
    Build-Service "frontend"
    Build-Service "kids-game-simple"
    
    Write-LogInfo "所有服务构建完成"
}

# 主函数
function Main {
    param([string]$Service = "all")
    
    switch ($Service) {
        "backend" { Build-Service "backend" }
        "frontend" { Build-Service "frontend" }
        "kids-game-simple" { Build-Service "kids-game-simple" }
        "all" { Build-All }
        default { Exit-Error "未知服务: $Service" }
    }
}

# 执行
Main "$args"