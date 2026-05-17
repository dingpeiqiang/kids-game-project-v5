#!/bin/bash

# ========================================
# 儿童游戏平台 - Docker 部署脚本
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_info "依赖检查通过"
}

# 检查配置文件
check_config() {
    log_info "检查配置文件..."
    
    if [ ! -f .env.production ]; then
        log_warn ".env.production 文件不存在"
        if [ -f .env.production.example ]; then
            log_info "从示例文件创建 .env.production"
            cp .env.production.example .env.production
            log_warn "请编辑 .env.production 文件，配置必要的参数（特别是密码和密钥）"
            read -p "按回车键继续..." 
        else
            log_error "缺少 .env.production.example 文件"
            exit 1
        fi
    fi
    
    log_info "配置文件检查完成"
}

# 构建镜像
build_images() {
    log_info "开始构建 Docker 镜像..."
    docker-compose build
    log_info "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    # 是否启动游戏服务
    read -p "是否启动游戏服务？(y/n，默认n): " start_games
    if [[ $start_games =~ ^[Yy]$ ]]; then
        docker-compose --profile games up -d
    else
        docker-compose up -d
    fi
    
    log_info "服务启动完成"
}

# 查看服务状态
show_status() {
    log_info "服务状态："
    docker-compose ps
}

# 查看日志
show_logs() {
    local service=$1
    if [ -z "$service" ]; then
        log_info "查看所有服务日志（最近100行）"
        docker-compose logs --tail=100
    else
        log_info "查看 $service 服务日志（最近100行）"
        docker-compose logs --tail=100 "$service"
    fi
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    docker-compose down
    log_info "服务已停止"
}

# 重启服务
restart_services() {
    log_info "重启服务..."
    stop_services
    start_services
}

# 清理资源
cleanup() {
    log_warn "此操作将删除所有容器、网络、卷和镜像"
    read -p "确认继续？(yes/no): " confirm
    if [ "$confirm" = "yes" ]; then
        log_info "清理资源..."
        docker-compose down -v --rmi all
        log_info "清理完成"
    else
        log_info "取消清理"
    fi
}

# 备份数据库
backup_database() {
    log_info "备份数据库..."
    local backup_dir="./backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    docker-compose exec -T mysql mysqldump -ukidgame -p${MYSQL_PASSWORD:-kidgame123} kids_game > "$backup_dir/kids_game.sql"
    
    log_info "数据库备份完成：$backup_dir/kids_game.sql"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [命令]"
    echo ""
    echo "命令:"
    echo "  deploy      部署应用（构建并启动）"
    echo "  start       启动服务"
    echo "  stop        停止服务"
    echo "  restart     重启服务"
    echo "  status      查看服务状态"
    echo "  logs        查看日志"
    echo "  build       构建镜像"
    echo "  cleanup     清理资源"
    echo "  backup      备份数据库"
    echo "  help        显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 deploy           # 部署应用"
    echo "  $0 logs backend     # 查看后端日志"
    echo "  $0 backup           # 备份数据库"
}

# 主函数
main() {
    local command=${1:-deploy}
    
    case $command in
        deploy)
            check_dependencies
            check_config
            build_images
            start_services
            show_status
            ;;
        start)
            check_dependencies
            start_services
            show_status
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        status)
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        build)
            check_dependencies
            build_images
            ;;
        cleanup)
            cleanup
            ;;
        backup)
            backup_database
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "未知命令: $command"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
