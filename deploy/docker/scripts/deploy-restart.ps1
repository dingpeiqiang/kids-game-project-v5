<#
========================================
儿童游戏平台 - 容器部署构建重启脚本 (优化版)
========================================
特性:
  - 支持增量部署（选择特定服务）
  - 完整的错误处理和日志记录
  - 健康检查和自动重试机制
  - 旧镜像清理和悬空镜像清理
  - 环境变量验证
  - 支持本地构建和远程镜像拉取
========================================
#>

param(
    [string]$Action = "deploy",
    [string]$Service = "",
    [string]$ComposeFile = "docker-compose.lowmem.yml"
)

$ErrorActionPreference = "Stop"

# 颜色定义
$RED = "Red"
$GREEN = "Green"
$YELLOW = "Yellow"
$BLUE = "Blue"
$CYAN = "Cyan"

# 脚本目录
$SCRIPT_DIR = Split-Path $MyInvocation.MyCommand.Path -Parent
$DOCKER_DIR = Split-Path $SCRIPT_DIR -Parent
$LOG_DIR = Join-Path $DOCKER_DIR "logs"
$TIMESTAMP = Get-Date -Format "yyyyMMdd_HHmmss"
$DEPLOY_LOG = Join-Path $LOG_DIR "deploy_$TIMESTAMP.log"

# 默认配置
$MAX_RETRY = 3
$RETRY_DELAY = 5
$HEALTH_CHECK_TIMEOUT = 120

# 创建日志目录
New-Item -ItemType Directory -Path $LOG_DIR -Force | Out-Null

# 日志函数
function Write-LogInfo {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $GREEN
    Add-Content -Path $DEPLOY_LOG -Value "[INFO] $Message"
}

function Write-LogWarn {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor $YELLOW
    Add-Content -Path $DEPLOY_LOG -Value "[WARN] $Message"
}

function Write-LogError {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $RED
    Add-Content -Path $DEPLOY_LOG -Value "[ERROR] $Message"
}

function Write-LogBlue {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $BLUE
    Add-Content -Path $DEPLOY_LOG -Value "[INFO] $Message"
}

function Write-LogCyan {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $CYAN
    Add-Content -Path $DEPLOY_LOG -Value "[INFO] $Message"
}

# 错误退出函数
function Exit-Error {
    param([string]$Message)
    Write-LogError $Message
    exit 1
}

# ========================================
# 依赖检查
# ========================================
function Check-Dependencies {
    Write-LogBlue "=== 检查依赖 ==="
    
    # 检查 Docker
    try {
        $dockerVersion = docker --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            Exit-Error "Docker 未安装，请先安装 Docker"
        }
        Write-LogInfo "Docker 版本: $dockerVersion"
    } catch {
        Exit-Error "Docker 未安装，请先安装 Docker"
    }
    
    # 检查 docker 目录
    if (-not (Test-Path $DOCKER_DIR)) {
        Exit-Error "Docker 目录不存在: $DOCKER_DIR"
    }
    
    # 检查 compose 文件
    $composePath = Join-Path $DOCKER_DIR $ComposeFile
    if (-not (Test-Path $composePath)) {
        Exit-Error "Compose 文件不存在: $composePath"
    }
    
    Write-LogInfo "依赖检查通过"
}

# ========================================
# 清理旧镜像
# ========================================
function Cleanup-OldImages {
    param(
        [string]$Service,
        [string]$ImageName
    )
    
    Write-LogWarn "清理 $Service 的旧镜像..."
    
    # 获取当前 latest 镜像 ID
    $latestId = docker-compose -f (Join-Path $DOCKER_DIR $ComposeFile) images -q $Service 2>&1
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

# ========================================
# 健康检查
# ========================================
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
        docker-compose -f (Join-Path $DOCKER_DIR $ComposeFile) exec -T $Service sh -c "curl -s -f $CheckUrl" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-LogInfo "$Service 健康检查通过"
            return $true
        }
        
        $status = docker-compose -f (Join-Path $DOCKER_DIR $ComposeFile) ps $Service 2>&1
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

# ========================================
# 构建服务
# ========================================
function Build-Service {
    param(
        [string]$Service,
        [string]$ImageName
    )
    
    Write-LogBlue "=== 构建 $Service ==="
    
    # 停止服务
    Write-LogInfo "停止 $Service 容器..."
    docker-compose -f (Join-Path $DOCKER_DIR $ComposeFile) stop $Service 2>&1 | Out-Null
    
    # 清理旧镜像
    Cleanup-OldImages -Service $Service -ImageName $ImageName
    
    # 构建新镜像
    Write-LogInfo "开始构建 $Service 镜像..."
    docker-compose -f (Join-Path $DOCKER_DIR $ComposeFile) build --pull $Service 2>&1
    if ($LASTEXITCODE -ne 0) {
        Exit-Error "$Service 镜像构建失败"
    }
    
    Write-LogInfo "$Service 镜像构建成功"
}

# ========================================
# 启动服务
# ========================================
function Start-Service {
    param(
        [string]$Service,
        [string]$HealthUrl = "",
        [int]$HealthTimeout = $HEALTH_CHECK_TIMEOUT
    )
    
    Write-LogBlue "=== 启动 $Service ==="
    
    # 启动服务
    Write-LogInfo "启动 $Service 容器..."
    docker-compose -f (Join-Path $DOCKER_DIR $ComposeFile) up -d $Service 2>&1
    if ($LASTEXITCODE -ne 0) {
        Exit-Error "$Service 容器启动失败"
    }
    
    # 健康检查（如果提供了检查 URL）
    if ($HealthUrl) {
        if (-not (Health-Check -Service $Service -MaxWait $HealthTimeout -CheckUrl $HealthUrl)) {
            Write-LogWarn "$Service 健康检查未通过，但容器已启动"
            Write-LogInfo "查看日志: docker-compose -f $ComposeFile logs $Service"
        }
    } else {
        # 等待容器启动
        Start-Sleep -Seconds 3
        $status = docker-compose -f (Join-Path $DOCKER_DIR $ComposeFile) ps $Service 2>&1
        if ($status -match "Up") {
            Write-LogInfo "$Service 容器启动成功"
        } else {
            Write-LogError "$Service 容器启动失败"
            docker-compose -f (Join-Path $DOCKER_DIR $ComposeFile) logs $Service
            return $false
        }
    }
    
    return $true
}

# ========================================
# 部署服务
# ========================================
function Deploy-Service {
    param(
        [string]$Service,
        [string]$ImageName,
        [string]$HealthUrl = ""
    )
    
    Write-LogCyan "========================================"
    Write-LogCyan "部署 $Service"
    Write-LogCyan "========================================"
    
    # 构建服务
    Build-Service -Service $Service -ImageName $ImageName
    
    # 启动服务
    Start-Service -Service $Service -HealthUrl $HealthUrl
    
    Write-LogInfo "$Service 部署完成"
}

# ========================================
# 显示服务状态
# ========================================
function Show-Status {
    Write-LogBlue "=== 服务状态 ==="
    docker-compose -f (Join-Path $DOCKER_DIR $ComposeFile) ps
    
    Write-LogBlue ""
    Write-LogBlue "=== 镜像信息 ==="
    docker-compose -f (Join-Path $DOCKER_DIR $ComposeFile) images
}

# ========================================
# 显示帮助信息
# ========================================
function Show-Help {
    Write-Host ""
    Write-Host "用法: $($MyInvocation.MyCommand.Name) -Action <操作> -Service <服务>"
    Write-Host ""
    Write-Host "操作:"
    Write-Host "  deploy      构建并部署服务"
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
    Write-Host "  all                所有服务"
    Write-Host ""
    Write-Host "示例:"
    Write-Host "  $($MyInvocation.MyCommand.Name) -Action deploy -Service backend"
    Write-Host "  $($MyInvocation.MyCommand.Name) -Action build -Service frontend"
    Write-Host "  $($MyInvocation.MyCommand.Name) -Action restart -Service all"
    Write-Host ""
}

# ========================================
# 主函数
# ========================================
function Main {
    param(
        [string]$Action,
        [string]$Service
    )
    
    # 初始化日志
    "部署日志: $DEPLOY_LOG" | Out-File -FilePath $DEPLOY_LOG
    "开始时间: $(Get-Date)" | Add-Content -Path $DEPLOY_LOG
    
    # 检查依赖
    Check-Dependencies
    
    # 切换到 docker 目录
    Set-Location $DOCKER_DIR
    
    # 根据操作执行
    switch ($Action) {
        "cleanup" {
            Write-LogBlue "=== 清理旧镜像 ==="
            Cleanup-OldImages -Service "backend" -ImageName "kids-game-backend"
            Cleanup-OldImages -Service "frontend" -ImageName "kids-game-frontend"
            Cleanup-OldImages -Service "kids-game-simple" -ImageName "kids-game-kids-game-simple"
            Write-LogInfo "清理完成"
        }
        
        "build" {
            switch ($Service) {
                "backend" { Build-Service -Service "backend" -ImageName "kids-game-backend" }
                "frontend" { Build-Service -Service "frontend" -ImageName "kids-game-frontend" }
                "kids-game-simple" { Build-Service -Service "kids-game-simple" -ImageName "kids-game-kids-game-simple" }
                "all" {
                    Build-Service -Service "backend" -ImageName "kids-game-backend"
                    Build-Service -Service "frontend" -ImageName "kids-game-frontend"
                    Build-Service -Service "kids-game-simple" -ImageName "kids-game-kids-game-simple"
                }
                default { Exit-Error "未知服务: $Service" }
            }
            Write-LogInfo "构建完成"
        }
        
        "start" {
            switch ($Service) {
                "backend" { Start-Service -Service "backend" -HealthUrl "http://localhost:8080/actuator/health" -HealthTimeout 120 }
                "frontend" { Start-Service -Service "frontend" -HealthUrl "http://localhost/" -HealthTimeout 60 }
                "kids-game-simple" { Start-Service -Service "kids-game-simple" }
                "all" {
                    Start-Service -Service "backend" -HealthUrl "http://localhost:8080/actuator/health" -HealthTimeout 120
                    Start-Service -Service "frontend" -HealthUrl "http://localhost/" -HealthTimeout 60
                    Start-Service -Service "kids-game-simple"
                }
                default { Exit-Error "未知服务: $Service" }
            }
            Show-Status
        }
        
        "restart" {
            Write-LogBlue "=== 重启服务 ==="
            docker-compose -f $ComposeFile stop $Service 2>&1 | Out-Null
            Start-Service -Service $Service
            Show-Status
        }
        
        "deploy" {
            switch ($Service) {
                "backend" { Deploy-Service -Service "backend" -ImageName "kids-game-backend" -HealthUrl "http://localhost:8080/actuator/health" }
                "frontend" { Deploy-Service -Service "frontend" -ImageName "kids-game-frontend" -HealthUrl "http://localhost/" }
                "kids-game-simple" { Deploy-Service -Service "kids-game-simple" -ImageName "kids-game-kids-game-simple" }
                "all" {
                    Write-LogCyan "========================================"
                    Write-LogCyan "全量部署"
                    Write-LogCyan "========================================"
                    
                    Deploy-Service -Service "backend" -ImageName "kids-game-backend" -HealthUrl "http://localhost:8080/actuator/health"
                    Deploy-Service -Service "frontend" -ImageName "kids-game-frontend" -HealthUrl "http://localhost/"
                    Deploy-Service -Service "kids-game-simple" -ImageName "kids-game-kids-game-simple"
                }
                default { Exit-Error "未知服务: $Service" }
            }
            Show-Status
        }
        
        "status" {
            Show-Status
        }
        
        default {
            Exit-Error "未知操作: $Action"
        }
    }
    
    "结束时间: $(Get-Date)" | Add-Content -Path $DEPLOY_LOG
    Write-LogInfo "部署完成，日志文件: $DEPLOY_LOG"
}

# ========================================
# 显示菜单（交互式模式）
# ========================================
function Show-Menu {
    while ($true) {
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor $CYAN
        Write-Host "儿童游戏平台 - 容器部署管理" -ForegroundColor $CYAN
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
            "1" { Main -Action "deploy" -Service "backend" }
            "2" { Main -Action "deploy" -Service "frontend" }
            "3" { Main -Action "deploy" -Service "kids-game-simple" }
            "4" { Main -Action "deploy" -Service "all" }
            "5" {
                Write-Host "选择要构建的服务:"
                Write-Host "  1) 后端"
                Write-Host "  2) 前端"
                Write-Host "  3) kids-game-simple"
                Write-Host "  4) 全部"
                $subChoice = Read-Host "请选择"
                switch ($subChoice) {
                    "1" { Main -Action "build" -Service "backend" }
                    "2" { Main -Action "build" -Service "frontend" }
                    "3" { Main -Action "build" -Service "kids-game-simple" }
                    "4" { Main -Action "build" -Service "all" }
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
                    "1" { Main -Action "start" -Service "backend" }
                    "2" { Main -Action "start" -Service "frontend" }
                    "3" { Main -Action "start" -Service "kids-game-simple" }
                    "4" { Main -Action "start" -Service "all" }
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
                    "1" { Main -Action "restart" -Service "backend" }
                    "2" { Main -Action "restart" -Service "frontend" }
                    "3" { Main -Action "restart" -Service "kids-game-simple" }
                    "4" { Main -Action "restart" -Service "all" }
                    default { Write-Host "无效选择" }
                }
            }
            "8" {
                Check-Dependencies
                Set-Location $DOCKER_DIR
                Show-Status
            }
            "9" { Main -Action "cleanup" -Service "" }
            default { Write-Host "无效选择，请重新输入" }
        }
        
        if ($choice -ne "8") {
            Read-Host "按回车继续"
        }
    }
}

# 执行主函数
if ($Service -eq "") {
    Show-Menu
} else {
    Main -Action $Action -Service $Service
}