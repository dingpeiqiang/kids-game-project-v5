#!/bin/bash
# ========================================
# 前端预构建模块
# 功能：自动执行 npm install 和 npm run build
# ========================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/../common/utils.sh"
source "$SCRIPT_DIR/../common/config.sh"

# 预构建 kids-game-simple
prebuild_kids_game_simple() {
    log_blue "=== 预构建 kids-game-simple ==="
    
    # 计算项目根目录路径
    # SCRIPT_DIR = deploy/docker/scripts/linux/build
    # 向上跳4级到达项目根目录
    local project_root=$(cd "$SCRIPT_DIR/../../../../.." && pwd)
    local simple_dir="$project_root/kids-game-simple"
    
    # 检查目录是否存在
    if [ ! -d "$simple_dir" ]; then
        error_exit "kids-game-simple 目录不存在: $simple_dir"
    fi
    
    log_info "进入目录: $simple_dir"
    cd "$simple_dir"
    
    # 检查 package.json 是否存在
    if [ ! -f "package.json" ]; then
        error_exit "package.json 不存在"
    fi
    
    # 检查是否需要安装依赖（node_modules 不存在或 package-lock.json 有更新）
    if [ ! -d "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then
        log_info "安装依赖..."
        if ! npm ci --no-audit --prefer-offline 2>&1 | tee -a "$DEPLOY_LOG"; then
            error_exit "依赖安装失败"
        fi
    else
        log_info "依赖已存在，跳过安装"
    fi
    
    # 执行构建
    log_info "执行构建..."
    if ! npm run build 2>&1 | tee -a "$DEPLOY_LOG"; then
        error_exit "构建失败"
    fi
    
    # 检查 dist 目录是否生成
    if [ ! -d "dist" ]; then
        error_exit "构建产物 dist 目录未生成"
    fi
    
    log_info "预构建完成，dist 目录已生成"
}

# 预构建 kids-game-frontend
prebuild_kids_game_frontend() {
    log_blue "=== 预构建 kids-game-frontend ==="
    
    # 计算项目根目录路径
    local project_root=$(cd "$SCRIPT_DIR/../../../../.." && pwd)
    local frontend_dir="$project_root/kids-game-frontend"
    
    if [ ! -d "$frontend_dir" ]; then
        error_exit "kids-game-frontend 目录不存在: $frontend_dir"
    fi
    
    log_info "进入目录: $frontend_dir"
    cd "$frontend_dir"
    
    if [ ! -f "package.json" ]; then
        error_exit "package.json 不存在"
    fi
    
    if [ ! -d "node_modules" ] || [ "package-lock.json" -nt "node_modules" ]; then
        log_info "安装依赖..."
        if ! npm ci --no-audit --prefer-offline 2>&1 | tee -a "$DEPLOY_LOG"; then
            error_exit "依赖安装失败"
        fi
    else
        log_info "依赖已存在，跳过安装"
    fi
    
    log_info "执行构建..."
    if ! npm run build 2>&1 | tee -a "$DEPLOY_LOG"; then
        error_exit "构建失败"
    fi
    
    if [ ! -d "dist" ]; then
        error_exit "构建产物 dist 目录未生成"
    fi
    
    log_info "预构建完成，dist 目录已生成"
}

# 主函数
main() {
    local target="${1:-kids-game-simple}"
    
    case $target in
        kids-game-simple)
            prebuild_kids_game_simple
            ;;
        kids-game-frontend)
            prebuild_kids_game_frontend
            ;;
        all)
            prebuild_kids_game_frontend
            prebuild_kids_game_simple
            ;;
        *)
            error_exit "未知目标: $target"
            ;;
    esac
}

# 执行（只有直接执行脚本时才调用 main）
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
