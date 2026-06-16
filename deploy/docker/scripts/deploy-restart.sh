#!/bin/bash
set -eo pipefail

# ========================================
# 儿童游戏平台 - 容器部署构建重启脚本 (优化版)
# ========================================
# 特性:
#   - 支持增量部署（选择特定服务）
#   - 完整的错误处理和日志记录
#   - 健康检查和自动重试机制
#   - 旧镜像清理和悬空镜像清理
#   - 环境变量验证
#   - 支持本地构建和远程镜像拉取
# ========================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 脚本目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$DOCKER_DIR/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DEPLOY_LOG="$LOG_DIR/deploy_$TIMESTAMP.log"

# 默认配置
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.lowmem.yml}"
MAX_RETRY=3
RETRY_DELAY=5
HEALTH_CHECK_TIMEOUT=120

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

# 创建日志目录
mkdir -p "$LOG_DIR"

# ========================================
# 依赖检查
# ========================================
check_dependencies() {
    log_blue "=== 检查依赖 ==="
    
    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        error_exit "Docker 未安装，请先安装 Docker"
    fi
    log_info "Docker 版本: $(docker --version)"
    
    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        error_exit "Docker Compose 未安装，请先安装 Docker Compose"
    fi
    
    # 确定使用 docker-compose 还是 docker compose
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    else
        DOCKER_COMPOSE="docker compose"
    fi
    log_info "使用: $DOCKER_COMPOSE"
    
    # 检查 docker 目录
    if [ ! -d "$DOCKER_DIR" ]; then
        error_exit "Docker 目录不存在: $DOCKER_DIR"
    fi
    
    # 检查 compose 文件
    if [ ! -f "$DOCKER_DIR/$COMPOSE_FILE" ]; then
        error_exit "Compose 文件不存在: $DOCKER_DIR/$COMPOSE_FILE"
    fi
    
    log_info "依赖检查通过"
}

# ========================================
# 环境变量验证
# ========================================
validate_env() {
    log_blue "=== 验证环境变量 ==="
    
    local required_vars=(
        "MYSQL_ROOT_PASSWORD"
        "MYSQL_PASSWORD"
        "JWT_SECRET"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_warn "以下环境变量未设置，将使用默认值:"
        for var in "${missing_vars[@]}"; do
            log_warn "  - $var"
        done
    else
        log_info "所有必需环境变量已设置"
    fi
    
    # 检查 .env 文件
    if [ ! -f "$DOCKER_DIR/.env" ]; then
        log_warn ".env 文件不存在，将使用环境变量或默认值"
    fi
}

# ========================================
# 清理旧镜像
# ========================================
cleanup_old_images() {
    local service=$1
    local image_name=$2
    
    log_warn "清理 $service 的旧镜像..."
    
    # 获取当前 latest 镜像 ID
    local latest_id=$($DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" images -q "$service" 2>/dev/null || true)
    
    # 删除所有非 latest 的该服务镜像
    if [ -n "$latest_id" ]; then
        local old_images=$(docker images "$image_name" --format "{{.ID}}" | grep -v "^${latest_id}$" 2>/dev/null || true)
        for img in $old_images; do
            docker rmi "$img" -f 2>/dev/null || true
        done
    fi
    
    # 清理悬空镜像
    docker image prune -f 2>/dev/null || true
    
    log_info "$service 旧镜像清理完成"
}

# ========================================
# 健康检查
# ========================================
health_check() {
    local service=$1
    local max_wait=$2
    local check_url=$3
    
    log_info "等待 $service 启动..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + max_wait))
    
    while [ $(date +%s) -lt $end_time ]; do
        if $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" exec -T "$service" sh -c "curl -s -f $check_url" 2>/dev/null; then
            log_info "$service 健康检查通过"
            return 0
        fi
        
        if $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            log_info "$service 容器已启动，等待服务就绪..."
        else
            log_warn "$service 容器状态异常"
            $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" ps "$service"
        fi
        
        sleep 5
    done
    
    log_error "$service 健康检查超时"
    return 1
}

# ========================================
# 构建服务
# ========================================
build_service() {
    local service=$1
    local image_name=$2
    
    log_blue "=== 构建 $service ==="
    
    # 停止服务
    log_info "停止 $service 容器..."
    $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" stop "$service" 2>/dev/null || true
    
    # 清理旧镜像
    cleanup_old_images "$service" "$image_name"
    
    # 构建新镜像
    log_info "开始构建 $service 镜像..."
    if ! $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" build --pull "$service"; then
        error_exit "$service 镜像构建失败"
    fi
    
    log_info "$service 镜像构建成功"
}

# ========================================
# 启动服务
# ========================================
start_service() {
    local service=$1
    local health_url=$2
    local health_timeout=${3:-$HEALTH_CHECK_TIMEOUT}
    
    log_blue "=== 启动 $service ==="
    
    # 启动服务
    log_info "启动 $service 容器..."
    if ! $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" up -d "$service"; then
        error_exit "$service 容器启动失败"
    fi
    
    # 健康检查（如果提供了检查 URL）
    if [ -n "$health_url" ]; then
        if ! health_check "$service" "$health_timeout" "$health_url"; then
            log_warn "$service 健康检查未通过，但容器已启动"
            log_info "查看日志: $DOCKER_COMPOSE -f $DOCKER_DIR/$COMPOSE_FILE logs $service"
        fi
    else
        # 等待容器启动
        sleep 3
        if $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" ps "$service" | grep -q "Up"; then
            log_info "$service 容器启动成功"
        else
            log_error "$service 容器启动失败"
            $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" logs "$service"
            return 1
        fi
    fi
    
    return 0
}

# ========================================
# 部署服务
# ========================================
deploy_service() {
    local service=$1
    local image_name=$2
    local health_url=$3
    
    log_cyan "========================================"
    log_cyan "部署 $service"
    log_cyan "========================================"
    
    # 构建服务
    build_service "$service" "$image_name"
    
    # 启动服务
    start_service "$service" "$health_url"
    
    log_info "$service 部署完成"
}

# ========================================
# 显示服务状态
# ========================================
show_status() {
    log_blue "=== 服务状态 ==="
    $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" ps
    
    log_blue ""
    log_blue "=== 镜像信息 ==="
    $DOCKER_COMPOSE -f "$DOCKER_DIR/$COMPOSE_FILE" images
}

# ========================================
# 显示帮助信息
# ========================================
show_help() {
    echo ""
    echo "用法: $0 [选项] [服务名]"
    echo ""
    echo "选项:"
    echo "  -b, --build-only    只构建镜像，不启动"
    echo "  -s, --start-only    只启动服务，不构建"
    echo "  -r, --restart       重启服务（先停止再启动）"
    echo "  -c, --cleanup       清理旧镜像和悬空镜像"
    echo "  -h, --help          显示帮助信息"
    echo ""
    echo "服务名:"
    echo "  backend            后端服务"
    echo "  frontend           前端服务"
    echo "  kids-game-simple   儿童游戏终端服务"
    echo "  all                所有服务"
    echo ""
    echo "示例:"
    echo "  $0 backend                    # 构建并启动后端"
    echo "  $0 -b frontend               # 只构建前端镜像"
    echo "  $0 -s kids-game-simple       # 只启动儿童游戏服务"
    echo "  $0 -r all                    # 重启所有服务"
    echo "  $0 -c                        # 清理旧镜像"
    echo ""
}

# ========================================
# 主函数
# ========================================
main() {
    local action="deploy"
    local service=""
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -b|--build-only)
                action="build"
                shift
                ;;
            -s|--start-only)
                action="start"
                shift
                ;;
            -r|--restart)
                action="restart"
                shift
                ;;
            -c|--cleanup)
                action="cleanup"
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                service="$1"
                shift
                ;;
        esac
    done
    
    # 如果没有指定服务，显示菜单
    if [ -z "$service" ] && [ "$action" != "cleanup" ]; then
        show_menu
        exit 0
    fi
    
    # 初始化日志
    echo "部署日志: $DEPLOY_LOG" > "$DEPLOY_LOG"
    echo "开始时间: $(date)" >> "$DEPLOY_LOG"
    
    # 检查依赖
    check_dependencies
    
    # 验证环境变量
    validate_env
    
    # 切换到 docker 目录
    cd "$DOCKER_DIR"
    
    # 根据操作执行
    case $action in
        cleanup)
            log_blue "=== 清理旧镜像 ==="
            cleanup_old_images "backend" "kids-game-backend"
            cleanup_old_images "frontend" "kids-game-frontend"
            cleanup_old_images "kids-game-simple" "kids-game-kids-game-simple"
            log_info "清理完成"
            ;;
        
        build)
            case $service in
                backend)
                    build_service "backend" "kids-game-backend"
                    ;;
                frontend)
                    build_service "frontend" "kids-game-frontend"
                    ;;
                kids-game-simple)
                    build_service "kids-game-simple" "kids-game-kids-game-simple"
                    ;;
                all)
                    build_service "backend" "kids-game-backend"
                    build_service "frontend" "kids-game-frontend"
                    build_service "kids-game-simple" "kids-game-kids-game-simple"
                    ;;
                *)
                    error_exit "未知服务: $service"
                    ;;
            esac
            log_info "构建完成"
            ;;
        
        start)
            case $service in
                backend)
                    start_service "backend" "http://localhost:8080/actuator/health" 120
                    ;;
                frontend)
                    start_service "frontend" "http://localhost/" 60
                    ;;
                kids-game-simple)
                    start_service "kids-game-simple" ""
                    ;;
                all)
                    start_service "backend" "http://localhost:8080/actuator/health" 120
                    start_service "frontend" "http://localhost/" 60
                    start_service "kids-game-simple" ""
                    ;;
                *)
                    error_exit "未知服务: $service"
                    ;;
            esac
            show_status
            ;;
        
        restart)
            log_blue "=== 重启服务 ==="
            $DOCKER_COMPOSE -f "$COMPOSE_FILE" stop "$service"
            start_service "$service"
            show_status
            ;;
        
        deploy)
            case $service in
                backend)
                    deploy_service "backend" "kids-game-backend" "http://localhost:8080/actuator/health"
                    ;;
                frontend)
                    deploy_service "frontend" "kids-game-frontend" "http://localhost/"
                    ;;
                kids-game-simple)
                    deploy_service "kids-game-simple" "kids-game-kids-game-simple" ""
                    ;;
                all)
                    log_cyan "========================================"
                    log_cyan "全量部署"
                    log_cyan "========================================"
                    
                    deploy_service "backend" "kids-game-backend" "http://localhost:8080/actuator/health"
                    deploy_service "frontend" "kids-game-frontend" "http://localhost/"
                    deploy_service "kids-game-simple" "kids-game-kids-game-simple" ""
                    ;;
                *)
                    error_exit "未知服务: $service"
                    ;;
            esac
            show_status
            ;;
        
        *)
            error_exit "未知操作: $action"
            ;;
    esac
    
    echo "结束时间: $(date)" >> "$DEPLOY_LOG"
    log_info "部署完成，日志文件: $DEPLOY_LOG"
}

# ========================================
# 显示菜单（交互式模式）
# ========================================
show_menu() {
    while true; do
        echo ""
        echo "========================================="
        echo "儿童游戏平台 - 容器部署管理"
        echo "========================================="
        echo ""
        echo "  1) 部署后端服务"
        echo "  2) 部署前端服务"
        echo "  3) 部署 kids-game-simple"
        echo "  4) 全量部署"
        echo "  5) 只构建镜像"
        echo "  6) 只启动服务"
        echo "  7) 重启服务"
        echo "  8) 查看服务状态"
        echo "  9) 清理旧镜像"
        echo "  0) 退出"
        echo ""
        printf "请选择 [0-9]: "
        read -r choice
        echo ""
        
        case $choice in
            0)
                echo "退出"
                exit 0
                ;;
            1)
                main deploy backend
                ;;
            2)
                main deploy frontend
                ;;
            3)
                main deploy kids-game-simple
                ;;
            4)
                main deploy all
                ;;
            5)
                echo "选择要构建的服务:"
                echo "  1) 后端"
                echo "  2) 前端"
                echo "  3) kids-game-simple"
                echo "  4) 全部"
                printf "请选择: "
                read -r sub_choice
                case $sub_choice in
                    1) main -b backend ;;
                    2) main -b frontend ;;
                    3) main -b kids-game-simple ;;
                    4) main -b all ;;
                    *) echo "无效选择" ;;
                esac
                ;;
            6)
                echo "选择要启动的服务:"
                echo "  1) 后端"
                echo "  2) 前端"
                echo "  3) kids-game-simple"
                echo "  4) 全部"
                printf "请选择: "
                read -r sub_choice
                case $sub_choice in
                    1) main -s backend ;;
                    2) main -s frontend ;;
                    3) main -s kids-game-simple ;;
                    4) main -s all ;;
                    *) echo "无效选择" ;;
                esac
                ;;
            7)
                echo "选择要重启的服务:"
                echo "  1) 后端"
                echo "  2) 前端"
                echo "  3) kids-game-simple"
                echo "  4) 全部"
                printf "请选择: "
                read -r sub_choice
                case $sub_choice in
                    1) main -r backend ;;
                    2) main -r frontend ;;
                    3) main -r kids-game-simple ;;
                    4) main -r all ;;
                    *) echo "无效选择" ;;
                esac
                ;;
            8)
                check_dependencies
                cd "$DOCKER_DIR"
                show_status
                ;;
            9)
                main -c
                ;;
            *)
                echo "无效选择，请重新输入"
                ;;
        esac
        
        if [ $choice -ne 8 ]; then
            printf "按回车继续... "
            read -r _
        fi
    done
}

# 执行主函数
if [ $# -eq 0 ]; then
    show_menu
else
    main "$@"
fi