#!/bin/sh

# ========================================
# 日志查看快捷命令
# 提供更简洁的命令别名
# ========================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

case $1 in
    backend)
        echo "=== 后端实时日志 ==="
        docker compose --file "$SCRIPT_DIR/../docker-compose.lowmem.yml" logs -f --tail=50 backend
        ;;
    frontend)
        echo "=== 前端实时日志 ==="
        docker compose --file "$SCRIPT_DIR/../docker-compose.lowmem.yml" logs -f --tail=50 frontend
        ;;
    mysql)
        echo "=== MySQL 实时日志 ==="
        docker compose --file "$SCRIPT_DIR/../docker-compose.lowmem.yml" logs -f --tail=50 mysql
        ;;
    redis)
        echo "=== Redis 实时日志 ==="
        docker compose --file "$SCRIPT_DIR/../docker-compose.lowmem.yml" logs -f --tail=50 redis
        ;;
    error)
        echo "=== 后端错误日志 (最近 20 行) ==="
        docker compose --file "$SCRIPT_DIR/../docker-compose.lowmem.yml" logs --tail=20 backend 2>&1 | grep -i "error\|exception"
        ;;
    status)
        echo "=== 容器状态 ==="
        docker compose --file "$SCRIPT_DIR/../docker-compose.lowmem.yml" ps
        ;;
    *)
        echo "用法: $0 {backend|frontend|mysql|redis|error|status}"
        echo ""
        echo "快捷命令:"
        echo "  backend  - 实时查看后端日志"
        echo "  frontend - 实时查看前端日志"
        echo "  mysql    - 实时查看 MySQL 日志"
        echo "  redis    - 实时查看 Redis 日志"
        echo "  error    - 查看后端错误日志"
        echo "  status   - 查看容器状态"
        exit 1
        ;;
esac
