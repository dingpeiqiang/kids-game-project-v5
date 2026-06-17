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
    echo "  -d, --deploy        只部署（不构建，直接启动）"
    echo "  -b, --build         只构建镜像（不启动）"
    echo "  -s, --start         只启动服务"
    echo "  -r, --restart       重启服务"
    echo "  -c, --cleanup       清理旧镜像"
    echo "  -t, --status        查看服务状态"
    echo "  -h, --help          显示帮助信息"
    echo ""
    echo "服务名:"
    echo "  backend            后端服务"
    echo "  frontend           前端服务"
    echo "  kids-game-simple   儿童游戏终端服务"
    echo "  all                所有服务（默认）"
    echo ""
    echo "三种操作模式说明:"
    echo "  1. 构建并部署: 构建新镜像 + 启动服务"
    echo "  2. 只构建:     仅构建镜像，不启动服务"
    echo "  3. 只部署:     跳过构建，直接启动服务"
    echo ""
    echo "示例:"
    echo "  $0 -d backend                    # 只部署 backend"
    echo "  $0 -b frontend                   # 只构建 frontend"
    echo "  $0 -s all                        # 启动所有服务"
    echo "  $0 -r kids-game-simple           # 重启 kids-game-simple"
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
        echo "【构建并部署】"
        echo "  1) 构建并部署 backend"
        echo "  2) 构建并部署 frontend"
        echo "  3) 构建并部署 kids-game-simple"
        echo ""
        echo "【只构建】"
        echo "  4) 只构建 backend"
        echo "  5) 只构建 frontend"
        echo "  6) 只构建 kids-game-simple"
        echo "  7) 只构建全部"
        echo ""
        echo "【只部署】"
        echo "  8) 只部署 backend"
        echo "  9) 只部署 frontend"
        echo " 10) 只部署 kids-game-simple"
        echo " 11) 只部署全部"
        echo ""
        echo "【其他操作】"
        echo " 12) 重启服务"
        echo " 13) 查看服务状态"
        echo " 14) 清理旧镜像"
        echo "  0) 退出"
        echo ""
        printf "请选择 [0-14]: "
        read -r choice
        echo ""
        
        case $choice in
            0)
                echo "退出"
                exit 0
                ;;
            # 构建并部署
            1)
                main_build_and_deploy "backend"
                ;;
            2)
                main_build_and_deploy "frontend"
                ;;
            3)
                main_build_and_deploy "kids-game-simple"
                ;;
            # 只构建
            4)
                main_build "backend"
                ;;
            5)
                main_build "frontend"
                ;;
            6)
                main_build "kids-game-simple"
                ;;
            7)
                main_build "all"
                ;;
            # 只部署
            8)
                main_deploy "backend"
                ;;
            9)
                main_deploy "frontend"
                ;;
            10)
                main_deploy "kids-game-simple"
                ;;
            11)
                main_deploy "all"
                ;;
            # 重启服务
            12)
                echo "选择要重启的服务:"
                echo "  1) backend"
                echo "  2) frontend"
                echo "  3) kids-game-simple"
                echo "  4) 全部"
                printf "请选择: "
                read -r sub_choice
                case $sub_choice in
                    1) main_restart "backend" ;;
                    2) main_restart "frontend" ;;
                    3) main_restart "kids-game-simple" ;;
                    4) main_restart "all" ;;
                    *) echo "无效选择" ;;
                esac
                ;;
            # 查看状态
            13)
                main_status
                ;;
            # 清理镜像
            14)
                main_cleanup
                ;;
            *)
                echo "无效选择，请重新输入"
                ;;
        esac
        
        if [ $choice -ne 13 ]; then
            printf "按回车继续... "
            read -r _
        fi
    done
}

# ========================================
# 子命令函数
# ========================================

# 构建并部署
main_build_and_deploy() {
    local service="$1"
    echo "构建并部署日志: $DEPLOY_LOG" > "$DEPLOY_LOG"
    echo "开始时间: $(date)" >> "$DEPLOY_LOG"
    check_all
    cd "$DOCKER_DIR"
    
    # 直接调用 deploy_service，它会先构建再启动，避免重复构建
    source "$MAIN_SCRIPT_DIR/deploy/deploy-services.sh"
    deploy_service "$service"
    
    echo "结束时间: $(date)" >> "$DEPLOY_LOG"
}

# 只构建
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

# 只部署
main_deploy() {
    local service="$1"
    echo "部署日志: $DEPLOY_LOG" > "$DEPLOY_LOG"
    echo "开始时间: $(date)" >> "$DEPLOY_LOG"
    check_all
    cd "$DOCKER_DIR"
    source "$MAIN_SCRIPT_DIR/deploy/deploy-services.sh"
    
    if [ "$service" = "all" ]; then
        start_service "backend"
        start_service "frontend"
        start_service "kids-game-simple"
    else
        start_service "$service"
    fi
    
    # 显示状态
    source "$MAIN_SCRIPT_DIR/status/status.sh"
    show_status
    
    echo "结束时间: $(date)" >> "$DEPLOY_LOG"
}

# 重启服务
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

# 清理镜像
main_cleanup() {
    echo "清理日志: $DEPLOY_LOG" > "$DEPLOY_LOG"
    echo "开始时间: $(date)" >> "$DEPLOY_LOG"
    check_all
    cd "$DOCKER_DIR"
    source "$MAIN_SCRIPT_DIR/cleanup/cleanup.sh"
    main "images"
    echo "结束时间: $(date)" >> "$DEPLOY_LOG"
}

# 查看状态
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
            main_deploy "$service"
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
            echo "未知操作: $action"
            exit 1
            ;;
    esac
}

# 执行主函数
if [ $# -eq 0 ]; then
    show_menu
else
    main "$@"
fi
