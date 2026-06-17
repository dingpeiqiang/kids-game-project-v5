#!/bin/bash
# ========================================
# 依赖检查模块
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/utils.sh"




# 检查目录结构（必须先执行，以定义 DEPLOY_LOG）
check_directories() {
    echo "=== 检查目录结构 ==="
    
    # 从 scripts/linux/common 退到 deploy/docker
    local docker_dir=$(cd "$SCRIPT_DIR/../../.." && pwd)
    
    if [ ! -d "$docker_dir" ]; then
        echo "ERROR: Docker 目录不存在: $docker_dir"
        exit 1
    fi
    
    local compose_path="$docker_dir/$COMPOSE_FILE"
    if [ ! -f "$compose_path" ]; then
        echo "ERROR: Compose 文件不存在: $compose_path"
        exit 1
    fi
    
    # 创建日志目录
    mkdir -p "$docker_dir/logs"
    
    export DOCKER_DIR="$docker_dir"
    export DEPLOY_LOG="$docker_dir/logs/deploy_$(get_timestamp).log"
    
    echo "Docker 目录: $docker_dir"
    echo "部署日志: $DEPLOY_LOG"
}

# 检查 Docker 和 Docker Compose
check_docker() {
    log_blue "=== 检查 Docker 依赖 ==="
    
    if ! command_exists docker; then
        error_exit "Docker 未安装，请先安装 Docker"
    fi
    log_info "Docker 版本: $(docker --version)"
    
    # 优先使用 Docker Compose V2（docker compose），避免 v1 在新版 Docker 上 recreate 报 ContainerConfig
    if docker compose version &> /dev/null; then
        export DOCKER_COMPOSE="docker compose"
        log_info "Compose 版本: $(docker compose version 2>/dev/null | head -1)"
    elif command_exists docker-compose; then
        export DOCKER_COMPOSE="docker-compose"
        local docker_major
        docker_major=$(docker version --format '{{.Server.Version}}' 2>/dev/null | cut -d. -f1)
        if [ -n "$docker_major" ] && [ "$docker_major" -ge 24 ] 2>/dev/null; then
            log_error "当前为 Docker ${docker_major}.x + docker-compose v1，启动/重建容器会失败 (KeyError: ContainerConfig)"
            log_error "请安装 Compose V2 插件后重试:"
            log_error "  apt-get update && apt-get install -y docker-compose-plugin"
            log_error "  docker compose version"
            error_exit "需要 Docker Compose V2 (docker compose)"
        fi
        log_warn "检测到 docker-compose v1，建议安装: apt-get install -y docker-compose-plugin"
    else
        error_exit "Docker Compose 未安装。Ubuntu: apt-get install -y docker-compose-plugin"
    fi
    log_info "使用: $DOCKER_COMPOSE"
}

# 验证环境变量
validate_env() {
    log_blue "=== 验证环境变量 ==="
    
    local missing_vars=()
    for var in "${REQUIRED_VARS[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_warn "以下环境变量未设置，将使用默认值:"
        for var in "${missing_vars[@]}"; do
            log_warn "  - $var"
        done
    else
        log_info "所有必需环境变量已设置"
    fi
    
    # 检查 .env 文件
    if [ ! -f "$DOCKER_DIR/.env" ]; then
        log_warn ".env 文件不存在，将使用环境变量或默认值"
    fi
}

# 执行所有检查
check_all() {
    check_directories   # 必须先执行，以定义 DEPLOY_LOG
    check_docker
    validate_env
    log_info "依赖检查通过"
}