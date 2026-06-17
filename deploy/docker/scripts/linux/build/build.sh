#!/bin/bash
# ========================================
# 构建模块
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../common/utils.sh"
source "$SCRIPT_DIR/../common/config.sh"

# 构建单个服务
build_service() {
    local service=$1
    local image_name=$(get_image_name "$service")
    
    log_blue "=== 构建 $service ==="
    
    # 预构建前端项目（仅 kids-game-simple 需要）
    if [ "$service" = "kids-game-simple" ]; then
        log_info "执行 $service 预构建..."
        source "$SCRIPT_DIR/prebuild-frontend.sh"
        if ! prebuild_kids_game_simple; then
            error_exit "$service 预构建失败"
        fi
    fi
    
    log_info "构建 $service 镜像..."
    if ! $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" build "$service"; then
        error_exit "$service 镜像构建失败"
    fi
    
    log_info "$service 镜像构建成功: $image_name"
}

# 构建所有服务
build_all() {
    log_cyan "========================================"
    log_cyan "构建所有服务"
    log_cyan "========================================"
    
    build_service "backend"
    build_service "frontend"
    build_service "kids-game-simple"
    
    log_info "所有服务构建完成"
}

# 主函数
main() {
    local service="${1:-all}"
    
    case $service in
        backend|frontend|kids-game-simple)
            build_service "$service"
            ;;
        all)
            build_all
            ;;
        *)
            error_exit "未知服务: $service"
            ;;
    esac
}

# 执行（只有直接执行脚本时才调用 main）
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi