#!/bin/sh

# ========================================
# 交互式日志查看菜单
# ========================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.lowmem.yml"

# 清屏函数
clear_screen() {
    clear 2>/dev/null || printf "\033[2J\033[H"
}

# 显示主菜单
show_menu() {
    clear_screen
    echo "========================================="
    echo "   Kids Game - 日志查看工具"
    echo "========================================="
    echo ""
    echo "  【实时日志】(Ctrl+C 返回)"
    echo "  1. 后端实时日志"
    echo "  2. 前端实时日志"
    echo "  3. kids-game-simple 实时日志"
    echo "  4. MySQL 实时日志"
    echo "  5. Redis 实时日志"
    echo "  6. 所有服务实时日志"
    echo ""
    echo "  【历史日志】"
    echo "  7. 后端最近 50 行"
    echo "  8. 前端最近 50 行"
    echo "  9. kids-game-simple 最近 50 行"
    echo "  10. 查看所有服务最近 50 行"
    echo ""
    echo "  【其他】"
    echo "  11. 后端错误日志 (最近 20 行)"
    echo "  12. 容器状态"
    echo ""
    echo "  0. 退出"
    echo ""
    echo "========================================="
    printf "请选择 (0-12): "
}

# 查看实时日志
view_live_logs() {
    local service=$1
    local label=$2
    
    clear_screen
    echo "========================================="
    echo "   $label (按 Ctrl+C 返回菜单)"
    echo "========================================="
    echo ""
    
    docker compose --file $COMPOSE_FILE logs -f --tail=50 $service
}

# 查看历史日志
view_history_logs() {
    local service=$1
    local label=$2
    local lines=${3:-50}
    
    clear_screen
    echo "========================================="
    echo "   $label (最近 $lines 行)"
    echo "========================================="
    echo ""
    
    docker compose --file $COMPOSE_FILE logs --tail=$lines $service
    echo ""
    echo "========================================="
    printf "按回车返回菜单..."
    read dummy
}

# 查看错误日志
view_error_logs() {
    clear_screen
    echo "========================================="
    echo "   后端错误日志 (最近 20 行)"
    echo "========================================="
    echo ""
    
    docker compose --file $COMPOSE_FILE logs --tail=20 backend 2>&1 | grep -i "error\|exception"
    
    echo ""
    echo "========================================="
    printf "按回车返回菜单..."
    read dummy
}

# 查看容器状态
view_status() {
    clear_screen
    echo "========================================="
    echo "   容器状态"
    echo "========================================="
    echo ""
    
    docker compose --file $COMPOSE_FILE ps
    
    echo ""
    echo "========================================="
    printf "按回车返回菜单..."
    read dummy
}

# 主循环
while true; do
    show_menu
    read choice
    
    case $choice in
        1)
            view_live_logs "backend" "后端实时日志"
            ;;
        2)
            view_live_logs "frontend" "前端实时日志"
            ;;
        3)
            view_live_logs "kids-game-simple" "kids-game-simple 实时日志"
            ;;
        4)
            view_live_logs "mysql" "MySQL 实时日志"
            ;;
        5)
            view_live_logs "redis" "Redis 实时日志"
            ;;
        6)
            view_live_logs "" "所有服务实时日志"
            ;;
        7)
            view_history_logs "backend" "后端日志" 50
            ;;
        8)
            view_history_logs "frontend" "前端日志" 50
            ;;
        9)
            view_history_logs "kids-game-simple" "kids-game-simple 日志" 50
            ;;
        10)
            view_history_logs "" "所有服务日志" 50
            ;;
        11)
            view_error_logs
            ;;
        12)
            view_status
            ;;
        0)
            clear_screen
            echo "再见！"
            exit 0
            ;;
        *)
            echo ""
            echo "无效选择，请重试"
            sleep 1
            ;;
    esac
done
