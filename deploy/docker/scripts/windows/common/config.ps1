<#
========================================
配置文件
========================================
#>

# 默认配置
$env:COMPOSE_FILE = if ($env:COMPOSE_FILE) { $env:COMPOSE_FILE } else { "docker-compose.lowmem.yml" }
$MAX_RETRY = 3
$RETRY_DELAY = 5
$HEALTH_CHECK_TIMEOUT = 120

# 服务配置
$SERVICE_CONFIGS = @{
    "backend" = @{
        ImageName = "kids-game-backend"
        HealthUrl = "http://localhost:8080/actuator/health"
        HealthTimeout = 120
    }
    "frontend" = @{
        ImageName = "kids-game-frontend"
        HealthUrl = "http://localhost/"
        HealthTimeout = 60
    }
    "kids-game-simple" = @{
        ImageName = "kids-game-kids-game-simple"
        HealthUrl = ""
        HealthTimeout = 30
    }
}

# 必需环境变量
$REQUIRED_VARS = @(
    "MYSQL_ROOT_PASSWORD"
    "MYSQL_PASSWORD"
    "JWT_SECRET"
)

# 获取服务配置
function Get-ServiceConfig {
    param([string]$Service)
    return $SERVICE_CONFIGS[$Service]
}

# 获取镜像名称
function Get-ImageName {
    param([string]$Service)
    $config = Get-ServiceConfig $Service
    return $config.ImageName
}

# 获取健康检查URL
function Get-HealthUrl {
    param([string]$Service)
    $config = Get-ServiceConfig $Service
    return $config.HealthUrl
}

# 获取健康检查超时
function Get-HealthTimeout {
    param([string]$Service)
    $config = Get-ServiceConfig $Service
    return $config.HealthTimeout
}