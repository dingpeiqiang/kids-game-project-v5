#!/bin/bash
# ========================================
# 配置文件
# ========================================

# 默认配置
export COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.lowmem.yml}"
export MAX_RETRY=3
export RETRY_DELAY=5
export HEALTH_CHECK_TIMEOUT=120

# 服务配置
declare -A SERVICE_CONFIGS=(
    ["backend"]="kids-game-backend http://localhost:8080/actuator/health 120"
    ["frontend"]="kids-game-frontend http://localhost/ 60"
    ["kids-game-simple"]="kids-game-kids-game-simple \"\" 30"
)

# 必需环境变量
REQUIRED_VARS=(
    "MYSQL_ROOT_PASSWORD"
    "MYSQL_PASSWORD"
    "JWT_SECRET"
)

# 获取服务配置
get_service_config() {
    local service=$1
    echo "${SERVICE_CONFIGS[$service]}"
}

# 获取镜像名称
get_image_name() {
    local service=$1
    local config=$(get_service_config "$service")
    echo "$config" | awk '{print $1}'
}

# 获取健康检查URL
get_health_url() {
    local service=$1
    local config=$(get_service_config "$service")
    echo "$config" | awk '{print $2}'
}

# 获取健康检查超时
get_health_timeout() {
    local service=$1
    local config=$(get_service_config "$service")
    echo "$config" | awk '{print $3}'
}