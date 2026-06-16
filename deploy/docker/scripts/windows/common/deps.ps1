<#
========================================
依赖检查模块
========================================
#>

$SCRIPT_DIR = Split-Path $MyInvocation.MyCommand.Path -Parent
. "$SCRIPT_DIR/utils.ps1"

# 检查 Docker
function Check-Docker {
    Write-LogBlue "=== 检查 Docker 依赖 ==="
    
    if (-not (Test-CommandExists "docker")) {
        Exit-Error "Docker 未安装，请先安装 Docker"
    }
    
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Exit-Error "Docker 未安装，请先安装 Docker"
    }
    Write-LogInfo "Docker 版本: $dockerVersion"
    
    $env:DOCKER_COMPOSE = "docker-compose"
    Write-LogInfo "使用: $env:DOCKER_COMPOSE"
}

# 检查目录结构
function Check-Directories {
    Write-LogBlue "=== 检查目录结构 ==="
    
    $dockerDir = Split-Path (Split-Path $SCRIPT_DIR -Parent) -Parent
    
    if (-not (Test-Path $dockerDir)) {
        Exit-Error "Docker 目录不存在: $dockerDir"
    }
    
    $composePath = Join-Path $dockerDir $env:COMPOSE_FILE
    if (-not (Test-Path $composePath)) {
        Exit-Error "Compose 文件不存在: $composePath"
    }
    
    # 创建日志目录
    New-Item -ItemType Directory -Path (Join-Path $dockerDir "logs") -Force | Out-Null
    
    $env:DOCKER_DIR = $dockerDir
    $env:DEPLOY_LOG = Join-Path $dockerDir "logs" ("deploy_{0}.log" -f (Get-Timestamp))
    
    Write-LogInfo "Docker 目录: $dockerDir"
    Write-LogInfo "部署日志: $env:DEPLOY_LOG"
}

# 验证环境变量
function Validate-Env {
    Write-LogBlue "=== 验证环境变量 ==="
    
    $missingVars = @()
    foreach ($var in $REQUIRED_VARS) {
        if (-not (Get-Item "env:$var" -ErrorAction SilentlyContinue)) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-LogWarn "以下环境变量未设置，将使用默认值:"
        foreach ($var in $missingVars) {
            Write-LogWarn "  - $var"
        }
    } else {
        Write-LogInfo "所有必需环境变量已设置"
    }
    
    # 检查 .env 文件
    if (-not (Test-Path (Join-Path $env:DOCKER_DIR ".env"))) {
        Write-LogWarn ".env 文件不存在，将使用环境变量或默认值"
    }
}

# 执行所有检查
function Check-All {
    Check-Docker
    Check-Directories
    Validate-Env
    Write-LogInfo "依赖检查通过"
}