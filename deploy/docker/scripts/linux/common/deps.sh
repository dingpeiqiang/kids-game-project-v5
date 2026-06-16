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
    
    # 确定使用 docker-compose 还是 docker compose
    if command_exists docker-compose; then
        export DOCKER_COMPOSE="docker-compose"
    elif docker compose version &> /dev/null; then
        export DOCKER_COMPOSE="docker compose"
    else
        error_exit "Docker Compose 未安装，请先安装 Docker Compose"
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