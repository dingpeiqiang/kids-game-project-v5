#!/bin/sh

# ========================================
# 日志管理脚本
# ========================================

set -e

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
LOGS_DIR="$DOCKER_DIR/logs"

# 显示帮助信息
show_help() {
    printf "=========================================\n"
    printf "Kids Game 日志管理工具\n"
    printf "=========================================\n"
    printf "\n"
    printf "用法: ./manage-logs.sh <action> [service]\n"
    printf "\n"
    printf "可用操作:\n"
    printf "  tail      - 实时查看日志（默认查看后端）\n"
    printf "  cat       - 查看完整日志\n"
    printf "  clean     - 清空日志文件\n"
    printf "  status    - 查看日志文件大小\n"
    printf "  restart   - 重启日志收集进程\n"
    printf "\n"
    printf "可用服务:\n"
    printf "  backend   - 后端服务\n"
    printf "  frontend  - 前端服务\n"
    printf "  mysql     - 数据库\n"
    printf "  redis     - 缓存\n"
    printf "  all       - 所有服务（仅用于 tail）\n"
    printf "\n"
    printf "示例:\n"
    printf "  ./manage-logs.sh tail backend      # 实时查看后端日志\n"
    printf "  ./manage-logs.sh cat frontend      # 查看前端完整日志\n"
    printf "  ./manage-logs.sh clean all         # 清空所有日志\n"
    printf "  ./manage-logs.sh status            # 查看日志文件大小\n"
    printf "\n"
}

# 检查参数
if [ $# -lt 1 ]; then
    show_help
    exit 1
fi

ACTION=$1
SERVICE=${2:-backend}

# 获取日志文件路径
get_log_file() {
    case $1 in
        backend)
            echo "$LOGS_DIR/backend.log"
            ;;
        frontend)
            echo "$LOGS_DIR/frontend.log"
            ;;
        mysql)
            echo "$LOGS_DIR/mysql.log"
            ;;
        redis)
            echo "$LOGS_DIR/redis.log"
            ;;
        *)
            printf "错误: 未知服务 '%s'\n" "$1"
            exit 1
            ;;
    esac
}

case $ACTION in
    tail)
        if [ "$SERVICE" = "all" ]; then
            printf "实时查看所有服务日志（按 Ctrl+C 退出）...\n\n"
            docker compose --file $DOCKER_DIR/docker-compose.lowmem.yml logs -f --tail=100
        else
            LOG_FILE=$(get_log_file $SERVICE)
            if [ ! -f "$LOG_FILE" ]; then
                printf "错误: 日志文件不存在: %s\n" "$LOG_FILE"
                printf "提示: 可能需要重新部署以启动日志收集\n"
                exit 1
            fi
            printf "实时查看 %s 日志（按 Ctrl+C 退出）...\n\n" "$SERVICE"
            tail -f "$LOG_FILE"
        fi
        ;;
    
    cat)
        LOG_FILE=$(get_log_file $SERVICE)
        if [ ! -f "$LOG_FILE" ]; then
            printf "错误: 日志文件不存在: %s\n" "$LOG_FILE"
            exit 1
        fi
        cat "$LOG_FILE"
        ;;
    
    clean)
        if [ "$SERVICE" = "all" ]; then
            printf "清空所有日志文件...\n"
            > $LOGS_DIR/backend.log
            > $LOGS_DIR/frontend.log
            > $LOGS_DIR/mysql.log
            > $LOGS_DIR/redis.log
            printf "✓ 所有日志已清空\n"
        else
            LOG_FILE=$(get_log_file $SERVICE)
            if [ -f "$LOG_FILE" ]; then
                > "$LOG_FILE"
                printf "✓ %s 日志已清空\n" "$SERVICE"
            else
                printf "错误: 日志文件不存在: %s\n" "$LOG_FILE"
                exit 1
            fi
        fi
        ;;
    
    status)
        printf "=========================================\n"
        printf "日志文件状态\n"
        printf "=========================================\n"
        printf "\n"
        
        for svc in backend frontend mysql redis; do
            LOG_FILE=$(get_log_file $svc)
            if [ -f "$LOG_FILE" ]; then
                SIZE=$(du -h "$LOG_FILE" | cut -f1)
                LINES=$(wc -l < "$LOG_FILE")
                printf "%-15s %8s  (%d 行)\n" "$svc:" "$SIZE" "$LINES"
            else
                printf "%-15s %s\n" "$svc:" "不存在"
            fi
        done
        
        printf "\n"
        printf "日志目录: %s\n" "$LOGS_DIR"
        printf "\n"
        
        # 检查日志收集进程
        if [ -f "$LOGS_DIR/.pids" ]; then
            printf "日志收集进程:\n"
            while read pid; do
                if kill -0 $pid 2>/dev/null; then
                    printf "  PID %d - 运行中\n" "$pid"
                else
                    printf "  PID %d - 已停止\n" "$pid"
                fi
            done < $LOGS_DIR/.pids
        else
            printf "⚠ 未找到日志收集进程\n"
            printf "提示: 运行 ./deploy-from-images.sh 重新启动日志收集\n"
        fi
        ;;
    
    restart)
        printf "重启日志收集进程...\n"
        
        # 停止旧进程
        if [ -f "$LOGS_DIR/.pids" ]; then
            while read pid; do
                kill $pid 2>/dev/null || true
            done < $LOGS_DIR/.pids
            rm -f $LOGS_DIR/.pids
            printf "  ✓ 旧进程已停止\n"
        fi
        
        # 启动新进程（nohup 保证 SSH 断开后进程继续运行）
        nohup docker compose --file $DOCKER_DIR/docker-compose.lowmem.yml logs -f --no-log-prefix backend > $LOGS_DIR/backend.log 2>&1 &
        echo $! >> $LOGS_DIR/.pids
        
        nohup docker compose --file $DOCKER_DIR/docker-compose.lowmem.yml logs -f --no-log-prefix frontend > $LOGS_DIR/frontend.log 2>&1 &
        echo $! >> $LOGS_DIR/.pids
        
        nohup docker compose --file $DOCKER_DIR/docker-compose.lowmem.yml logs -f --no-log-prefix mysql > $LOGS_DIR/mysql.log 2>&1 &
        echo $! >> $LOGS_DIR/.pids
        
        nohup docker compose --file $DOCKER_DIR/docker-compose.lowmem.yml logs -f --no-log-prefix redis > $LOGS_DIR/redis.log 2>&1 &
        echo $! >> $LOGS_DIR/.pids
        
        printf "  ✓ 日志收集进程已重启\n"
        ;;
    
    *)
        printf "错误: 未知操作 '%s'\n" "$ACTION"
        show_help
        exit 1
        ;;
esac
