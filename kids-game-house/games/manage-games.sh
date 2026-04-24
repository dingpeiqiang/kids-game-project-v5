#!/bin/bash

# ========================================
# 游戏服务管理脚本
# 用法: ./manage-games.sh [status|start|stop|restart|logs] [game-id]
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/games-config.json"
LOGS_DIR="$SCRIPT_DIR/logs"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 jq
if ! command -v jq &> /dev/null; then
    log_error "jq 未安装"
    exit 1
fi

ACTION=${1:-status}
GAME_ID=$2

case $ACTION in
    status)
        log_info "游戏服务状态："
        echo ""
        printf "%-20s %-15s %-10s %-10s\n" "游戏名称" "端口" "状态" "PID"
        printf "%-20s %-15s %-10s %-10s\n" "--------" "----" "----" "---"
        
        jq -c '.games[]' "$CONFIG_FILE" | while IFS= read -r game; do
            NAME=$(echo "$game" | jq -r '.name')
            PORT=$(echo "$game" | jq -r '.port')
            ID=$(echo "$game" | jq -r '.id')
            ENABLED=$(echo "$game" | jq -r '.enabled')
            
            if [ "$ENABLED" != "true" ]; then
                STATUS="disabled"
                PID="-"
            else
                PID_FILE="$LOGS_DIR/${ID}.pid"
                if [ -f "$PID_FILE" ]; then
                    PID=$(cat "$PID_FILE")
                    if kill -0 "$PID" 2>/dev/null; then
                        STATUS="${GREEN}running${NC}"
                    else
                        STATUS="${RED}stopped${NC}"
                        PID="${RED}dead${NC}"
                    fi
                else
                    STATUS="${YELLOW}unknown${NC}"
                    PID="-"
                fi
            fi
            
            printf "%-20b %-15s %-10b %-10s\n" "$NAME" "$PORT" "$STATUS" "$PID"
        done
        ;;
    
    start)
        if [ -n "$GAME_ID" ]; then
            # 启动单个游戏
            GAME=$(jq -c ".games[] | select(.id == \"$GAME_ID\")" "$CONFIG_FILE")
            if [ -z "$GAME" ]; then
                log_error "游戏不存在: $GAME_ID"
                exit 1
            fi
            echo "$GAME" | jq -c '.' > /tmp/single-game.json
            CONFIG_FILE=/tmp/single-game.json
        fi
        "$SCRIPT_DIR/start-games-configured.sh"
        ;;
    
    stop)
        if [ -n "$GAME_ID" ]; then
            # 停止单个游戏
            PID_FILE="$LOGS_DIR/${GAME_ID}.pid"
            if [ -f "$PID_FILE" ]; then
                PID=$(cat "$PID_FILE")
                if kill -0 "$PID" 2>/dev/null; then
                    log_info "停止游戏: $GAME_ID (PID: $PID)"
                    kill "$PID"
                    rm "$PID_FILE"
                else
                    log_warn "游戏未运行: $GAME_ID"
                fi
            else
                log_warn "PID 文件不存在: $GAME_ID"
            fi
        else
            "$SCRIPT_DIR/stop-games.sh"
        fi
        ;;
    
    restart)
        $0 stop $GAME_ID
        sleep 2
        $0 start $GAME_ID
        ;;
    
    logs)
        if [ -n "$GAME_ID" ]; then
            LOG_FILE="$LOGS_DIR/${GAME_ID}.log"
            if [ -f "$LOG_FILE" ]; then
                tail -f "$LOG_FILE"
            else
                log_error "日志文件不存在: $LOG_FILE"
            fi
        else
            log_error "请指定游戏 ID: $0 logs <game-id>"
            exit 1
        fi
        ;;
    
    list)
        log_info "可用游戏列表："
        echo ""
        jq -r '.games[] | "\(.id)\t\(.name)\t\(.port)\t\(.enabled)"' "$CONFIG_FILE" | \
        while IFS=$'\t' read -r id name port enabled; do
            if [ "$enabled" = "true" ]; then
                printf "${GREEN}✓${NC} %-20s %-30s %d\n" "$id" "$name" "$port"
            else
                printf "${YELLOW}○${NC} %-20s %-30s %d (disabled)\n" "$id" "$name" "$port"
            fi
        done
        ;;
    
    *)
        echo "用法: $0 {status|start|stop|restart|logs|list} [game-id]"
        echo ""
        echo "命令:"
        echo "  status              查看所有游戏状态"
        echo "  list                列出所有游戏"
        echo "  start [game-id]     启动游戏（不指定则启动所有）"
        echo "  stop [game-id]      停止游戏（不指定则停止所有）"
        echo "  restart [game-id]   重启游戏"
        echo "  logs <game-id>      查看游戏日志"
        echo ""
        echo "示例:"
        echo "  $0 status"
        echo "  $0 start snake"
        echo "  $0 logs pvz"
        exit 1
        ;;
esac
