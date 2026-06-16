<#
========================================
清理模块
========================================
#>

$SCRIPT_DIR = Split-Path $MyInvocation.MyCommand.Path -Parent
. "$SCRIPT_DIR/../common/utils.ps1"

# 清理单个服务的旧镜像
function Cleanup-OldImages {
    param(
        [string]$Service,
        [string]$ImageName
    )
    
    Write-LogWarn "清理 $Service 的旧镜像..."
    
    # 获取当前 latest 镜像 ID
    $latestId = docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) images -q $Service 2>&1
    if ($LASTEXITCODE -eq 0 -and $latestId) {
        # 删除所有非 latest 的该服务镜像
        $oldImages = docker images $ImageName --format "{{.ID}}" 2>&1 | Where-Object { $_ -ne $latestId }
        foreach ($img in $oldImages) {
            docker rmi $img -f 2>&1 | Out-Null
        }
    }
    
    # 清理悬空镜像
    docker image prune -f 2>&1 | Out-Null
    
    Write-LogInfo "$Service 旧镜像清理完成"
}

# 清理所有服务的旧镜像
function Cleanup-AllImages {
    Write-LogBlue "=== 清理所有旧镜像 ==="
    
    Cleanup-OldImages -Service "backend" -ImageName "kids-game-backend"
    Cleanup-OldImages -Service "frontend" -ImageName "kids-game-frontend"
    Cleanup-OldImages -Service "kids-game-simple" -ImageName "kids-game-kids-game-simple"
    
    Write-LogInfo "所有旧镜像清理完成"
}

# 清理容器（停止并删除）
function Cleanup-Containers {
    Write-LogBlue "=== 清理容器 ==="
    
    Write-LogWarn "此操作将停止并删除所有容器"
    $confirm = Read-Host "确认继续？(y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-LogInfo "取消清理"
        return
    }
    
    docker-compose -f (Join-Path $env:DOCKER_DIR $env:COMPOSE_FILE) down -v 2>&1
    Write-LogInfo "容器清理完成"
}

# 清理日志文件
function Cleanup-Logs {
    Write-LogBlue "=== 清理日志文件 ==="
    
    Write-LogWarn "此操作将删除所有日志文件"
    $confirm = Read-Host "确认继续？(y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-LogInfo "取消清理"
        return
    }
    
    Remove-Item -Recurse -Force (Join-Path $env:DOCKER_DIR "logs/*") -ErrorAction SilentlyContinue
    Write-LogInfo "日志文件清理完成"
}

# 主函数
function Main {
    param([string]$Action = "images")
    
    switch ($Action) {
        "images" { Cleanup-AllImages }
        "containers" { Cleanup-Containers }
        "logs" { Cleanup-Logs }
        "all" {
            Cleanup-AllImages
            Cleanup-Containers
            Cleanup-Logs
        }
        default { Exit-Error "未知操作: $Action" }
    }
}

# 执行
Main "$args"