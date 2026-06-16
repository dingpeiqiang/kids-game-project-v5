#!/bin/bash
# ========================================
# 公共工具函数
# ========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOY_LOG" >&2
}

log_blue() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$DEPLOY_LOG"
}

log_cyan() {
    echo -e "${CYAN}[INFO]${NC} $1" | tee -a "$DEPLOY_LOG"
}

# 错误退出函数
error_exit() {
    log_error "$1"
    exit 1
}

# 获取脚本目录
get_script_dir() {
    echo "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
}

# 获取项目根目录
get_project_root() {
    local script_dir=$(get_script_dir)
    echo "$(dirname "$(dirname "$(dirname "$script_dir")")")"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" &> /dev/null
}

# 获取时间戳
get_timestamp() {
    date +"%Y%m%d_%H%M%S"
}