#!/bin/bash
# ========================================
# 清理模块
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../common/utils.sh"

# 清理单个服务的旧镜像
cleanup_old_images() {
    local service=$1
    local image_name=$2
    
    log_warn "清理 $service 的旧镜像..."
    
    # 获取当前 latest 镜像 ID
    local latest_id=$($DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" images -q "$service" 2>/dev/null || true)
    
    # 删除所有非 latest 的该服务镜像
    if [ -n "$latest_id" ]; then
        local old_images=$(docker images "$image_name" --format "{{.ID}}" | grep -v "^${latest_id}$" 2>/dev/null || true)
        for img in $old_images; do
            docker rmi "$img" -f 2>/dev/null || true
        done
    fi
    
    # 清理悬空镜像
    docker image prune -f 2>/dev/null || true
    
    log_info "$service 旧镜像清理完成"
}

# 清理所有服务的旧镜像
cleanup_all_images() {
    log_blue "=== 清理所有旧镜像 ==="
    
    cleanup_old_images "backend" "kids-game-backend"
    cleanup_old_images "frontend" "kids-game-frontend"
    cleanup_old_images "kids-game-simple" "kids-game-kids-game-simple"
    
    log_info "所有旧镜像清理完成"
}

# 清理容器（停止并删除）
cleanup_containers() {
    log_blue "=== 清理容器 ==="
    
    log_warn "此操作将停止并删除所有容器"
    read -p "确认继续？(y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        log_info "取消清理"
        return
    fi
    
    $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" down -v
    log_info "容器清理完成"
}

# 清理日志文件
cleanup_logs() {
    log_blue "=== 清理日志文件 ==="
    
    log_warn "此操作将删除所有日志文件"
    read -p "确认继续？(y/N): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        log_info "取消清理"
        return
    fi
    
    rm -rf "$DOCKER_DIR/logs/*"
    log_info "日志文件清理完成"
}

# 主函数
main() {
    local action="${1:-images}"
    
    case $action in
        images)
            cleanup_all_images
            ;;
        containers)
            cleanup_containers
            ;;
        logs)
            cleanup_logs
            ;;
        all)
            cleanup_all_images
            cleanup_containers
            cleanup_logs
            ;;
        *)
            error_exit "未知操作: $action"
            ;;
    esac
}

# 执行
main "$@"