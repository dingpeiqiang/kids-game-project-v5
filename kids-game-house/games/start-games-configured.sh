#!/bin/bash

# ========================================
# 游戏服务配置化启动脚本
# 根据 games-config.json 动态启动游戏
# ========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/games-config.json"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# 检查配置文件
if [ ! -f "$CONFIG_FILE" ]; then
    log_error "配置文件不存在: $CONFIG_FILE"
    exit 1
fi

# 检查 jq 是否安装
if ! command -v jq &> /dev/null; then
    log_warn "jq 未安装，正在安装..."
    if command -v apt &> /dev/null; then
        apt update && apt install -y jq
    elif command -v yum &> /dev/null; then
        yum install -y jq
    else
        log_error "无法自动安装 jq，请手动安装"
        exit 1
    fi
fi

# 读取配置
log_info "读取游戏配置..."
GAME_COUNT=$(jq '.games | length' "$CONFIG_FILE")
ENABLED_COUNT=$(jq '[.games[] | select(.enabled == true)] | length' "$CONFIG_FILE")

log_info "找到 $GAME_COUNT 个游戏，其中 $ENABLED_COUNT 个已启用"

# 获取所有启用的游戏
ENABLED_GAMES=$(jq -c '.games[] | select(.enabled == true)' "$CONFIG_FILE")

# 启动游戏
STARTED=0
FAILED=0

echo "$ENABLED_GAMES" | while IFS= read -r game; do
    GAME_ID=$(echo "$game" | jq -r '.id')
    GAME_NAME=$(echo "$game" | jq -r '.name')
    GAME_DIR=$(echo "$game" | jq -r '.directory')
    GAME_PORT=$(echo "$game" | jq -r '.port')
    
    log_info "=========================================="
    log_info "启动游戏: $GAME_NAME ($GAME_ID)"
    log_info "目录: $GAME_DIR"
    log_info "端口: $GAME_PORT"
    
    GAME_PATH="$SCRIPT_DIR/$GAME_DIR"
    
    # 检查目录是否存在
    if [ ! -d "$GAME_PATH" ]; then
        log_error "游戏目录不存在: $GAME_PATH"
        FAILED=$((FAILED + 1))
        continue
    fi
    
    # 检查 package.json
    if [ ! -f "$GAME_PATH/package.json" ]; then
        log_error "package.json 不存在: $GAME_PATH/package.json"
        FAILED=$((FAILED + 1))
        continue
    fi
    
    cd "$GAME_PATH"
    
    # 检查 node_modules
    if [ ! -d "node_modules" ]; then
        log_warn "安装依赖..."
        npm ci --only=production || npm install --only=production
    fi
    
    # 检查是否有 vite.config 文件并修改端口
    VITE_CONFIG=""
    if [ -f "vite.config.ts" ]; then
        VITE_CONFIG="vite.config.ts"
    elif [ -f "vite.config.js" ]; then
        VITE_CONFIG="vite.config.js"
    fi
    
    if [ -n "$VITE_CONFIG" ]; then
        log_debug "更新端口配置为 $GAME_PORT"
        # 使用 sed 替换端口（兼容不同格式）
        if grep -q "port:" "$VITE_CONFIG"; then
            sed -i "s/port: [0-9]*/port: $GAME_PORT/" "$VITE_CONFIG"
        fi
    fi
    
    # 启动游戏（后台运行）
    log_info "启动游戏服务..."
    nohup npm run dev -- --host 0.0.0.0 --port $GAME_PORT > "$SCRIPT_DIR/logs/${GAME_ID}.log" 2>&1 &
    PID=$!
    
    echo $PID > "$SCRIPT_DIR/logs/${GAME_ID}.pid"
    
    log_info "游戏 $GAME_NAME 已启动 (PID: $PID, Port: $GAME_PORT)"
    STARTED=$((STARTED + 1))
    
    # 等待一下，让服务启动
    sleep 2
    
    log_info "=========================================="
done

log_info "=========================================="
log_info "启动完成！"
log_info "已启动: $STARTED 个游戏"
log_info "失败: $FAILED 个游戏"
log_info "=========================================="

# 显示运行状态
log_info "查看日志: tail -f $SCRIPT_DIR/logs/[game-id].log"
log_info "停止所有游戏: $SCRIPT_DIR/stop-games.sh"
