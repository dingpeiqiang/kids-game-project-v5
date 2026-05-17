#!/bin/bash

# ========================================
# 游戏服务停止脚本
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOGS_DIR="$SCRIPT_DIR/logs"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${RED}[WARN]${NC} $1"
}

log_info "停止所有游戏服务..."

# 查找并杀死所有 Node.js 进程（游戏服务）
if [ -d "$LOGS_DIR" ]; then
    for pid_file in "$LOGS_DIR"/*.pid; do
        if [ -f "$pid_file" ]; then
            PID=$(cat "$pid_file")
            GAME_ID=$(basename "$pid_file" .pid)
            
            if kill -0 "$PID" 2>/dev/null; then
                log_info "停止游戏: $GAME_ID (PID: $PID)"
                kill "$PID"
                rm "$pid_file"
            else
                log_warn "游戏 $GAME_ID 未运行，清理 PID 文件"
                rm "$pid_file"
            fi
        fi
    done
fi

# 备用方案：查找并杀死所有 vite 进程
log_info "清理残留的 Vite 进程..."
pkill -f "vite.*--host" || true

log_info "所有游戏服务已停止"
