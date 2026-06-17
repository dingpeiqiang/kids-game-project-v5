#!/bin/bash
# ========================================
# 部署模块
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../common/utils.sh"
source "$SCRIPT_DIR/../common/config.sh"

# 健康检查
health_check() {
    local service=$1
    local max_wait=$2
    local check_url=$3
    
    log_info "等待 $service 启动..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + max_wait))
    
    while [ $(date +%s) -lt $end_time ]; do
        if $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" exec -T "$service" sh -c "curl -s -f $check_url" 2>/dev/null; then
            log_info "$service 健康检查通过"
            return 0
        fi
        
        if $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            log_info "$service 容器已启动，等待服务就绪..."
        else
            log_warn "$service 容器状态异常"
            $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" ps "$service"
        fi
        
        sleep 5
    done
    
    log_error "$service 健康检查超时"
    return 1
}

# 启动单个服务
start_service() {
    local service=$1
    local health_url=$(get_health_url "$service")
    local health_timeout=$(get_health_timeout "$service")
    
    log_blue "=== 启动 $service ==="
    
    # 检查容器是否存在，如果存在则先停止并删除
    local container_name=$(get_container_name "$service")
    if docker ps -a --format '{{.Names}}' | grep -q "^$container_name$"; then
        log_warn "容器 $container_name 已存在，正在停止并删除..."
        docker stop "$container_name" >/dev/null 2>&1 || true
        docker rm "$container_name" >/dev/null 2>&1 || true
        log_info "已移除旧容器 $container_name"
    fi
    
    # 启动服务（使用 --no-deps 禁止自动启动依赖服务）
    log_info "启动 $service 容器..."
    if ! $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" up -d --no-deps "$service"; then
        error_exit "$service 容器启动失败"
    fi
    
    # 健康检查（如果提供了检查 URL）
    if [ -n "$health_url" ] && [ "$health_url" != '""' ]; then
        if ! health_check "$service" "$health_timeout" "$health_url"; then
            log_warn "$service 健康检查未通过，但容器已启动"
            log_info "查看日志: $DOCKER_COMPOSE -f $DOCKER_DIR/$COMPOSE_FILE logs $service"
        fi
    else
        # 等待容器启动
        sleep 3
        if $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            log_info "$service 容器启动成功"
        else
            log_error "$service 容器启动失败"
            $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" logs "$service"
            return 1
        fi
    fi
    
    return 0
}

# 部署单个服务
deploy_service() {
    local service=$1
    
    log_cyan "========================================"
    log_cyan "部署 $service"
    log_cyan "========================================"
    
    # MySQL 和 Redis 不需要构建，直接启动
    if [ "$service" != "mysql" ] && [ "$service" != "redis" ]; then
        # 构建服务
        source "$SCRIPT_DIR/../build/build.sh"
        build_service "$service"
    fi
    
    # 启动服务
    start_service "$service"
    
    log_info "$service 部署完成"
}

# 部署所有服务
deploy_all() {
    log_cyan "========================================"
    log_cyan "全量部署"
    log_cyan "========================================"
    
    deploy_service "mysql"
    deploy_service "redis"
    deploy_service "backend"
    deploy_service "frontend"
    deploy_service "kids-game-simple"
    
    log_info "所有服务部署完成"
}

# 主函数
main() {
    local service="${1:-all}"
    
    case $service in
        mysql|redis|backend|frontend|kids-game-simple)
            deploy_service "$service"
            ;;
        all)
            deploy_all
            ;;
        *)
            error_exit "未知服务: $service"
            ;;
    esac
    
    # 显示状态
    source "$SCRIPT_DIR/../status/status.sh"
    show_status
}

# 执行
main "$@"