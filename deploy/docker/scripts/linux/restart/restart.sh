#!/bin/bash
# ========================================
# 重启模块
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../common/utils.sh"

# 重启单个服务
restart_service() {
    local service=$1
    
    log_blue "=== 重启 $service ==="
    
    log_info "停止 $service 容器..."
    $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" stop "$service" 2>/dev/null || true
    
    # 判断是否删除数据卷
    if [ "$REMOVE_VOLUME" = "true" ]; then
        log_warn "删除 $service 容器和数据卷（数据将丢失！）..."
        $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" rm -f -v "$service" >/dev/null 2>&1 || true
    fi
    
    log_info "启动 $service 容器..."
    $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" up -d --no-deps --no-build "$service"
    
    if [ $? -eq 0 ]; then
        log_info "$service 重启成功"
    else
        log_error "$service 重启失败"
        return 1
    fi
    
    return 0
}

# 重启所有服务
restart_all() {
    log_cyan "========================================"
    log_cyan "重启所有服务"
    log_cyan "========================================"
    
    restart_service "mysql"
    restart_service "redis"
    restart_service "backend"
    restart_service "frontend"
    restart_service "kids-game-simple"
    
    log_info "所有服务重启完成"
}

# 主函数
main() {
    local service="${1:-all}"
    
    case $service in
        mysql|redis|backend|frontend|kids-game-simple)
            restart_service "$service"
            ;;
        all)
            restart_all
            ;;
        *)
            error_exit "未知服务: $service"
            ;;
    esac
    
    # 显示状态
    log_blue "=== 服务状态 ==="
    $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" ps
}

# 执行（只有直接执行脚本时才调用 main）
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi