#!/bin/bash
# ========================================
# 状态模块
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../common/utils.sh"

# 显示服务状态
show_status() {
    log_blue "=== 服务状态 ==="
    $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" ps
    
    log_blue ""
    log_blue "=== 镜像信息 ==="
    $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" images
}

# 显示日志
show_logs() {
    local service="${1:-}"
    
    log_blue "=== 查看日志 ==="
    
    if [ -n "$service" ]; then
        log_info "查看 $service 日志（最近100行）"
        $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" logs --tail=100 "$service"
    else
        log_info "查看所有服务日志（最近50行）"
        $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" logs --tail=50
    fi
}

# 显示健康状态
show_health() {
    log_blue "=== 健康状态 ==="
    
    local services=("backend" "frontend")
    
    for service in "${services[@]}"; do
        log_info "检查 $service..."
        $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" exec -T "$service" sh -c "curl -s http://localhost:8080/actuator/health 2>/dev/null || echo '服务未就绪'" 2>/dev/null || echo "无法连接到 $service"
    done
}

# 主函数
main() {
    local action="${1:-status}"
    
    case $action in
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        health)
            show_health
            ;;
        *)
            error_exit "未知操作: $action"
            ;;
    esac
}

# 执行
main "$@"