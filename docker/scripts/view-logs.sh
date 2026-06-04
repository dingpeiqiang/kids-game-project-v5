#!/bin/sh

# ========================================
# 快速查看容器日志
# 用法: ./view-logs.sh [service] [options]
#   service: backend, frontend, mysql, redis, all (默认: all)
#   options: -f (实时), -n <行数> (默认: 50)
# ========================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.lowmem.yml"

# 默认参数
SERVICE="all"
FOLLOW=false
TAIL=50

# 解析参数
while [ $# -gt 0 ]; do
    case $1 in
        backend|frontend|mysql|redis|all)
            SERVICE=$1
            shift
            ;;
        -f|--follow)
            FOLLOW=true
            shift
            ;;
        -n|--tail)
            TAIL=$2
            shift 2
            ;;
        -h|--help)
            echo "用法: $0 [service] [options]"
            echo ""
            echo "服务:"
            echo "  backend   - 后端服务"
            echo "  frontend  - 前端服务"
            echo "  mysql     - MySQL 数据库"
            echo "  redis     - Redis 缓存"
            echo "  all       - 所有服务 (默认)"
            echo ""
            echo "选项:"
            echo "  -f, --follow    实时跟踪日志"
            echo "  -n, --tail N    显示最后 N 行 (默认: 50)"
            echo "  -h, --help      显示帮助"
            echo ""
            echo "示例:"
            echo "  $0                    # 查看所有服务最近 50 行日志"
            echo "  $0 backend            # 查看后端最近 50 行日志"
            echo "  $0 backend -f         # 实时查看后端日志"
            echo "  $0 backend -n 100     # 查看后端最近 100 行日志"
            echo "  $0 all -f             # 实时查看所有服务日志"
            exit 0
            ;;
        *)
            echo "错误: 未知参数 $1"
            echo "使用 -h 查看帮助"
            exit 1
            ;;
    esac
done

# 构建 docker compose 命令
CMD="docker compose --file $COMPOSE_FILE logs"

# 添加 --tail 参数
CMD="$CMD --tail=$TAIL"

# 如果是实时模式，添加 -f
if [ "$FOLLOW" = true ]; then
    CMD="$CMD -f"
fi

# 添加服务名（如果不是 all）
if [ "$SERVICE" != "all" ]; then
    CMD="$CMD $SERVICE"
fi

# 执行命令
echo "========================================="
if [ "$FOLLOW" = true ]; then
    echo "实时查看 $SERVICE 日志 (按 Ctrl+C 退出)"
else
    echo "查看 $SERVICE 最近 $TAIL 行日志"
fi
echo "========================================="
echo ""

eval $CMD
