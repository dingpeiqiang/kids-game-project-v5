#!/bin/sh

# ========================================
# 服务管理脚本 - 单独控制各个服务
# ========================================

set -e

# 获取脚本所在目录（兼容 sh 和 bash）
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"

COMPOSE_FILE="$DOCKER_DIR/docker-compose.lowmem.yml"
LOGS_DIR="$DOCKER_DIR/logs"

# 显示帮助信息
show_help() {
    echo "========================================="
    echo "Kids Game 服务管理工具"
    echo "========================================="
    echo ""
    echo "用法: ./manage-service.sh <service> <action>"
    echo ""
    echo "可用服务:"
    echo "  backend   - 后端服务 (kids-game-backend)"
    echo "  frontend  - 前端服务 (kids-game-frontend)"
    echo "  mysql     - 数据库服务"
    echo "  redis     - 缓存服务"
    echo "  all       - 所有服务"
    echo ""
    echo "可用操作:"
    echo "  start     - 启动服务"
    echo "  stop      - 停止服务"
    echo "  restart   - 重启服务"
    echo "  logs      - 查看日志"
    echo "  status    - 查看状态"
    echo ""
    echo "示例:"
    echo "  ./manage-service.sh backend restart    # 重启后端"
    echo "  ./manage-service.sh frontend logs      # 查看前端日志"
    echo "  ./manage-service.sh all status         # 查看所有服务状态"
    echo ""
}

# 获取服务名称
get_service_name() {
    case $1 in
        backend)
            echo "backend"
            ;;
        frontend)
            echo "frontend"
            ;;
        mysql|redis)
            echo "$1"
            ;;
        all)
            echo ""
            ;;
        *)
            echo "ERROR: 未知服务 '$1'"
            exit 1
            ;;
    esac
}

# 检查参数
if [ $# -lt 2 ]; then
    show_help
    exit 1
fi

SERVICE=$1
ACTION=$2
SERVICE_NAME=$(get_service_name $SERVICE)

echo "========================================="
echo "执行操作: ${ACTION} ${SERVICE}"
echo "========================================="
echo ""

case $ACTION in
    start)
        if [ "$SERVICE" = "all" ]; then
            docker compose --file $COMPOSE_FILE up -d --no-build
        else
            docker compose --file $COMPOSE_FILE start $SERVICE_NAME
        fi
        echo "✓ 服务已启动"
        ;;
    
    stop)
        if [ "$SERVICE" = "all" ]; then
            docker compose --file $COMPOSE_FILE down
        else
            docker compose --file $COMPOSE_FILE stop $SERVICE_NAME
        fi
        echo "✓ 服务已停止"
        ;;
    
    restart)
        if [ "$SERVICE" = "all" ]; then
            echo "重启所有服务..."
            docker compose --file $COMPOSE_FILE restart
            
            # 等待 3 秒后显示日志
            sleep 3
            echo ""
            echo "========================================="
            echo "实时日志（按 Ctrl+C 退出）"
            echo "========================================="
            docker compose --file $COMPOSE_FILE logs -f --tail=50
        else
            echo "重启 $SERVICE_NAME..."
            docker compose --file $COMPOSE_FILE restart $SERVICE_NAME
            
            # 等待服务启动
            echo "等待服务启动..."
            sleep 3
            
            # 检查服务状态
            if docker inspect --format='{{.State.Running}}' "$SERVICE_NAME" 2>/dev/null | grep -q "true"; then
                echo "✓ 服务已启动"
                echo ""
                echo "========================================="
                echo "$SERVICE_NAME 实时日志（按 Ctrl+C 退出）"
                echo "========================================="
                docker compose --file $COMPOSE_FILE logs -f --tail=50 $SERVICE_NAME
            else
                echo "✗ 服务启动失败，查看错误日志："
                docker compose --file $COMPOSE_FILE logs --tail=50 $SERVICE_NAME
            fi
        fi
        ;;
    
    logs)
        mkdir -p $LOGS_DIR
        if [ "$SERVICE" = "all" ]; then
            docker compose --file $COMPOSE_FILE logs -f
        else
            LOG_FILE="${LOGS_DIR}/${SERVICE}.log"
            echo "实时日志输出到: $LOG_FILE"
            echo "按 Ctrl+C 退出"
            echo ""
            docker compose --file $COMPOSE_FILE logs -f $SERVICE_NAME | tee $LOG_FILE
        fi
        ;;
    
    status)
        if [ "$SERVICE" = "all" ]; then
            docker compose --file $COMPOSE_FILE ps
        else
            docker compose --file $COMPOSE_FILE ps $SERVICE_NAME
        fi
        ;;
    
    *)
        echo "ERROR: 未知操作 '$ACTION'"
        show_help
        exit 1
        ;;
esac

echo ""
