#!/bin/bash
# ========================================
# Linux 主入口脚本
# ========================================

# 保存主脚本目录（deps.sh 会覆盖 SCRIPT_DIR）
MAIN_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_DIR="$MAIN_SCRIPT_DIR"

# 加载公共模块
source "$SCRIPT_DIR/common/utils.sh"
source "$SCRIPT_DIR/common/config.sh"
source "$SCRIPT_DIR/common/deps.sh"

# ========================================
# 显示帮助信息
# ========================================
show_help() {
    echo ""
    echo "用法: $0 [选项] [服务名]"
    echo ""
    echo "选项:"
    echo "  -d, --deploy        部署服务（构建并启动）"
    echo "  -b, --build         只构建镜像"
    echo "  -s, --start         只启动服务"
    echo "  -r, --restart       重启服务"
    echo "  -c, --cleanup       清理旧镜像"
    echo "  -t, --status        查看服务状态"
    echo "  -h, --help          显示帮助信息"
    echo ""
    echo "服务名:"
    echo "  mysql              MySQL 数据库"
    echo "  redis              Redis 缓存"
    echo "  backend            后端服务"
    echo "  frontend           前端服务"
    echo "  kids-game-simple   儿童游戏终端服务"
    echo "  all                所有服务（默认）"
    echo ""
    echo "示例:"
    echo "  $0 -d mysql                      # 启动 MySQL"
    echo "  $0 -d redis                      # 启动 Redis"
    echo "  $0 -d backend                    # 部署后端"
    echo "  $0 -b frontend                   # 只构建前端"
    echo "  $0 -s all                        # 启动所有服务"
    echo "  $0 -r kids-game-simple           # 重启儿童游戏服务"
    echo "  $0 -c                            # 清理旧镜像"
    echo "  $0 -t                            # 查看状态"
    echo ""
}

# ========================================
# 显示菜单（交互式模式）
# ========================================
show_menu() {
    while true; do
        echo ""
        echo "========================================="
        echo "儿童游戏平台 - 容器部署管理 (Linux)"
        echo "========================================="
        echo ""
        echo "  1) 启动 MySQL"
        echo "  2) 启动 Redis"
        echo "  3) 部署后端服务"
        echo "  4) 部署前端服务"
        echo "  5) 部署 kids-game-simple"
        echo "  6) 全量部署"
        echo "  7) 只构建镜像"
        echo "  8) 只启动服务"
        echo "  9) 重启服务"
        echo "  10) 查看服务状态"
        echo "  11) 清理旧镜像"
        echo "  0) 退出"
        echo ""
        printf "请选择 [0-11]: "
        read -r choice
        echo ""
        
        case $choice in
            0)
                echo "退出"
                exit 0
                ;;
            1)
                main_deploy "mysql"
                ;;
            2)
                main_deploy "redis"
                ;;
            3)
                main_deploy "backend"
                ;;
            4)
                main_deploy "frontend"
                ;;
            5)
                main_deploy "kids-game-simple"
                ;;
            6)
                main_deploy "all"
                ;;
            7)
                echo "选择要构建的服务:"
                echo "  1) 后端"
                echo "  2) 前端"
                echo "  3) kids-game-simple"
                echo "  4) 全部"
                printf "请选择: "
                read -r sub_choice
                case $sub_choice in
                    1) main_build "backend" ;;
                    2) main_build "frontend" ;;
                    3) main_build "kids-game-simple" ;;
                    4) main_build "all" ;;
                    *) echo "无效选择" ;;
                esac
                ;;
            8)
                echo "选择要启动的服务:"
                echo "  1) MySQL"
                echo "  2) Redis"
                echo "  3) 后端"
                echo "  4) 前端"
                echo "  5) kids-game-simple"
                echo "  6) 全部"
                printf "请选择: "
                read -r sub_choice
                case $sub_choice in
                    1) main_start "mysql" ;;
                    2) main_start "redis" ;;
                    3) main_start "backend" ;;
                    4) main_start "frontend" ;;
                    5) main_start "kids-game-simple" ;;
                    6) main_start "all" ;;
                    *) echo "无效选择" ;;
                esac
                ;;
            9)
                echo "选择要重启的服务:"
                echo "  1) MySQL"
                echo "  2) Redis"
                echo "  3) 后端"
                echo "  4) 前端"
                echo "  5) kids-game-simple"
                echo "  6) 全部"
                printf "请选择: "
                read -r sub_choice
                case $sub_choice in
                    1) main_restart "mysql" ;;
                    2) main_restart "redis" ;;
                    3) main_restart "backend" ;;
                    4) main_restart "frontend" ;;
                    5) main_restart "kids-game-simple" ;;
                    6) main_restart "all" ;;
                    *) echo "无效选择" ;;
                esac
                ;;
            10)
                main_status
                ;;
            11)
                main_cleanup
                ;;
            *)
                echo "无效选择，请重新输入"
                ;;
        esac
        
        if [ $choice -ne 10 ]; then
            printf "按回车继续... "
            read -r _
        fi
    done
}

# ========================================
# 子命令函数
# ========================================
main_deploy() {
    local service="$1"
    echo "部署日志: $DEPLOY_LOG" > "$DEPLOY_LOG"
    echo "开始时间: $(date)" >> "$DEPLOY_LOG"
    check_all
    cd "$DOCKER_DIR"
    source "$MAIN_SCRIPT_DIR/deploy/deploy.sh"
    main "$service"
    echo "结束时间: $(date)" >> "$DEPLOY_LOG"
}

main_build() {
    local service="$1"
    echo "构建日志: $DEPLOY_LOG" > "$DEPLOY_LOG"
    echo "开始时间: $(date)" >> "$DEPLOY_LOG"
    check_all
    cd "$DOCKER_DIR"
    source "$MAIN_SCRIPT_DIR/build/build.sh"
    main "$service"
    echo "结束时间: $(date)" >> "$DEPLOY_LOG"
}

main_start() {
    local service="$1"
    echo "启动日志: $DEPLOY_LOG" > "$DEPLOY_LOG"
    echo "开始时间: $(date)" >> "$DEPLOY_LOG"
    check_all
    cd "$DOCKER_DIR"
    source "$MAIN_SCRIPT_DIR/deploy/deploy.sh"
    for s in $(echo "$service" | tr ',' ' '); do
        start_service "$s"
    done
    source "$MAIN_SCRIPT_DIR/status/status.sh"
    show_status
    echo "结束时间: $(date)" >> "$DEPLOY_LOG"
}

main_restart() {
    local service="$1"
    echo "重启日志: $DEPLOY_LOG" > "$DEPLOY_LOG"
    echo "开始时间: $(date)" >> "$DEPLOY_LOG"
    check_all
    cd "$DOCKER_DIR"
    source "$MAIN_SCRIPT_DIR/restart/restart.sh"
    main "$service"
    echo "结束时间: $(date)" >> "$DEPLOY_LOG"
}

main_cleanup() {
    echo "清理日志: $DEPLOY_LOG" > "$DEPLOY_LOG"
    echo "开始时间: $(date)" >> "$DEPLOY_LOG"
    check_all
    cd "$DOCKER_DIR"
    source "$MAIN_SCRIPT_DIR/cleanup/cleanup.sh"
    main "images"
    echo "结束时间: $(date)" >> "$DEPLOY_LOG"
}

main_status() {
    check_all
    cd "$DOCKER_DIR"
    source "$MAIN_SCRIPT_DIR/status/status.sh"
    show_status
}

# ========================================
# 主函数
# ========================================
main() {
    local action="menu"
    local service="all"
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -d|--deploy)
                action="deploy"
                shift
                ;;
            -b|--build)
                action="build"
                shift
                ;;
            -s|--start)
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
            -t|--status)
                action="status"
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
    
    # 执行操作
    case $action in
        deploy)
            main_deploy "$service"
            ;;
        build)
            main_build "$service"
            ;;
        start)
            main_start "$service"
            ;;
        restart)
            main_restart "$service"
            ;;
        cleanup)
            main_cleanup
            ;;
        status)
            main_status
            ;;
        menu)
            show_menu
            ;;
        *)
            error_exit "未知操作: $action"
            ;;
    esac
}

# 执行主函数
if [ $# -eq 0 ]; then
    show_menu
else
    main "$@"
fi