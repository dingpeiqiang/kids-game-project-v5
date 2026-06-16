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
    
    log_info "启动 $service 容器..."
    $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" up -d "$service"
    
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
    
    restart_service "backend"
    restart_service "frontend"
    restart_service "kids-game-simple"
    
    log_info "所有服务重启完成"
}

# 主函数
main() {
    local service="${1:-all}"
    
    case $service in
        backend|frontend|kids-game-simple)
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
    source "$SCRIPT_DIR/../status/status.sh"
    show_status
}

# 执行
main "$@"