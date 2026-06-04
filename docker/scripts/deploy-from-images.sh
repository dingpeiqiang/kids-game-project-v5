#!/bin/sh

# ========================================
# 服务器端部署脚本
# 交互式菜单：选择要执行的操作
# 日志文件: logs/backend.log, logs/frontend.log
# ========================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.lowmem.yml"
LOG_DIR="$DOCKER_DIR/logs"
PIDS_FILE="$LOG_DIR/.pids"

# 创建日志目录
mkdir -p "$LOG_DIR"

# ---- 停止日志收集进程 ----
stop_log_collector() {
    if [ -f "$PIDS_FILE" ]; then
        while read -r pid; do
            kill "$pid" 2>/dev/null || true
        done < "$PIDS_FILE"
        rm -f "$PIDS_FILE"
    fi
    
    # 额外清理：杀死所有 docker compose logs 进程
    pkill -f "docker compose.*logs.*backend" 2>/dev/null || true
    pkill -f "docker compose.*logs.*frontend" 2>/dev/null || true
    
    # 等待进程完全退出
    sleep 1
}

# ---- 启动日志收集 ----
start_log_collector() {
    stop_log_collector

    # 强制清空日志文件（使用 truncate 确保完全清空）
    truncate -s 0 "$LOG_DIR/backend.log" 2>/dev/null || : > "$LOG_DIR/backend.log"
    truncate -s 0 "$LOG_DIR/frontend.log" 2>/dev/null || : > "$LOG_DIR/frontend.log"
    
    # 验证文件已清空
    if [ -s "$LOG_DIR/backend.log" ] || [ -s "$LOG_DIR/frontend.log" ]; then
        echo "WARNING: 日志文件未能完全清空，尝试删除重建..."
        rm -f "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log"
        touch "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log"
    fi

    # 后台持续写文件（使用 --tail=100 显示最近100行，包含启动日志）
    docker compose -f "$COMPOSE_FILE" logs -f --no-log-prefix --tail=100 backend > "$LOG_DIR/backend.log"   2>&1 &
    echo $! >> "$PIDS_FILE"
    docker compose -f "$COMPOSE_FILE" logs -f --no-log-prefix --tail=100 frontend > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! >> "$PIDS_FILE"
    
    # 等待日志收集进程启动
    sleep 1
}

# 检查镜像是否存在
check_images() {
    BACKEND_TAR_OK=0
    FRONTEND_TAR_OK=0
    SIMPLE_GAME_TAR_OK=0
    [ -f "/tmp/backend.tar"   ] && BACKEND_TAR_OK=1
    [ -f "/tmp/frontend.tar" ] && FRONTEND_TAR_OK=1
    [ -f "/tmp/simple-game.tar" ] && SIMPLE_GAME_TAR_OK=1
}

# 生成时间戳
get_timestamp() {
    date +"%Y%m%d_%H%M%S"
}

# 清理悬空镜像（释放磁盘空间）
cleanup_dangling_images() {
    echo ">>> 清理悬空镜像..."
    docker image prune -f > /dev/null 2>&1
}

# 清理旧版本镜像（避免历史镜像残留）
cleanup_old_image() {
    local IMAGE_NAME=$1
    # 删除所有非 latest 标签的旧版本镜像
    local OLD_IDS=$(docker images "$IMAGE_NAME" --format "{{.ID}}" 2>/dev/null | sort -u)
    local LATEST_ID=$(docker images "${IMAGE_NAME}:latest" --format "{{.ID}}" 2>/dev/null)
    for id in $OLD_IDS; do
        if [ "$id" != "$LATEST_ID" ]; then
            docker rmi "$id" 2>/dev/null || true
        fi
    done
    # 清理所有悬空镜像
    docker image prune -f > /dev/null 2>&1
}

# 强制重建容器（停止→删除→创建→启动）
force_recreate_container() {
    local SERVICE=$1
    echo ">>> 强制重建容器: $SERVICE"
    docker compose -f "$COMPOSE_FILE" stop "$SERVICE" > /dev/null 2>&1
    docker compose -f "$COMPOSE_FILE" rm -f "$SERVICE" > /dev/null 2>&1
    docker compose -f "$COMPOSE_FILE" up -d --no-build --force-recreate "$SERVICE" > /dev/null 2>&1
}

# ---- 打印菜单 ----
show_menu() {
    echo ""
    echo "========================================="
    echo "Docker 部署"
    echo "========================================="
    echo ""
    echo "  1) 前端镜像加载 + 部署"
    echo "  2) 前端部署（不加载镜像）"
    echo "  3) 后端镜像加载 + 部署"
    echo "  4) 后端部署（不加载镜像）"
    echo "  5) simple-game 镜像加载 + 部署"
    echo "  6) simple-game 部署（不加载镜像）"
    echo "  7) 全量部署"
    echo "  8) 查看镜像信息"
    echo "  0) 退出"
    echo ""
}

# ---- 执行操作 ----
do_action() {
    case "$1" in
        1)  # 前端镜像加载 + 部署
            echo ""
            echo ">>> [1] 前端镜像加载 + 部署"
            if [ ! -f "/tmp/frontend.tar" ]; then
                echo "ERROR: /tmp/frontend.tar 不存在"
                return 1
            fi
            echo ">>> 停止容器..."
            docker compose -f "$COMPOSE_FILE" stop frontend > /dev/null 2>&1
            echo ">>> 清理旧镜像..."
            cleanup_old_image "kids-game-frontend"
            echo ">>> 加载镜像..."
            docker load < /tmp/frontend.tar 2>&1 | grep -v "^$"
            echo ">>> 强制重建容器..."
            force_recreate_container frontend
            sleep 3
            echo ""
            echo "========================================="
            echo ">>> 当前运行镜像版本"
            echo "========================================="
            docker inspect --format='{{.Config.Image}} 创建于 {{.Created}}' kids-game-frontend 2>/dev/null
            echo "========================================="
            echo ">>> logs/frontend.log"
            echo "========================================="
            tail -30 "$LOG_DIR/frontend.log"
            ;;
        2)  # 前端部署
            echo ""
            echo ">>> [2] 前端部署（不加载镜像）"
            echo ">>> 强制重建容器..."
            force_recreate_container frontend
            sleep 3
            echo ""
            echo "========================================="
            echo ">>> 当前运行镜像版本"
            echo "========================================="
            docker inspect --format='{{.Config.Image}} 创建于 {{.Created}}' kids-game-frontend 2>/dev/null
            echo "========================================="
            echo ">>> logs/frontend.log"
            echo "========================================="
            tail -30 "$LOG_DIR/frontend.log"
            ;;
        3)  # 后端镜像加载 + 部署
            echo ""
            echo ">>> [3] 后端镜像加载 + 部署"
            if [ ! -f "/tmp/backend.tar" ]; then
                echo "ERROR: /tmp/backend.tar 不存在"
                return 1
            fi
            echo ">>> 停止容器..."
            docker compose -f "$COMPOSE_FILE" stop backend > /dev/null 2>&1
            echo ">>> 清理旧镜像..."
            cleanup_old_image "kids-game-backend"
            echo ">>> 加载镜像..."
            docker load < /tmp/backend.tar 2>&1 | grep -v "^$"
            echo ">>> 强制重建容器..."
            force_recreate_container backend
            sleep 5
            echo ""
            echo "========================================="
            echo ">>> 当前运行镜像版本"
            echo "========================================="
            docker inspect --format='{{.Config.Image}} 创建于 {{.Created}}' kids-game-backend 2>/dev/null
            echo "========================================="
            echo ">>> logs/backend.log"
            echo "========================================="
            tail -50 "$LOG_DIR/backend.log"
            ;;
        4)  # 后端部署
            echo ""
            echo ">>> [4] 后端部署（不加载镜像）"
            echo ">>> 强制重建容器..."
            force_recreate_container backend
            sleep 5
            echo ""
            echo "========================================="
            echo ">>> 当前运行镜像版本"
            echo "========================================="
            docker inspect --format='{{.Config.Image}} 创建于 {{.Created}}' kids-game-backend 2>/dev/null
            echo "========================================="
            echo ">>> logs/backend.log"
            echo "========================================="
            tail -50 "$LOG_DIR/backend.log"
            ;;
        5)  # simple-game 镜像加载 + 部署
            echo ""
            echo ">>> [5] simple-game 镜像加载 + 部署"
            if [ ! -f "/tmp/simple-game.tar" ]; then
                echo "ERROR: /tmp/simple-game.tar 不存在"
                return 1
            fi
            echo ">>> 停止容器..."
            docker compose -f "$COMPOSE_FILE" stop simple-game > /dev/null 2>&1
            echo ">>> 清理旧镜像..."
            cleanup_old_image "kids-game-simple-game"
            echo ">>> 加载镜像..."
            docker load < /tmp/simple-game.tar 2>&1 | grep -v "^$"
            echo ">>> 强制重建容器..."
            force_recreate_container simple-game
            sleep 3
            echo ""
            echo "========================================="
            echo ">>> 当前运行镜像版本"
            echo "========================================="
            docker inspect --format='{{.Config.Image}} 创建于 {{.Created}}' kids-game-simple-game 2>/dev/null
            echo "========================================="
            echo ">>> simple-game 已部署"
            echo "========================================="
            echo "访问地址: http://8.136.156.190:3001/"
            ;;
        6)  # simple-game 部署
            echo ""
            echo ">>> [6] simple-game 部署（不加载镜像）"
            echo ">>> 强制重建容器..."
            force_recreate_container simple-game
            sleep 3
            echo ""
            echo "========================================="
            echo ">>> 当前运行镜像版本"
            echo "========================================="
            docker inspect --format='{{.Config.Image}} 创建于 {{.Created}}' kids-game-simple-game 2>/dev/null
            echo "========================================="
            echo ">>> simple-game 已部署"
            echo "========================================="
            echo "访问地址: http://8.136.156.190:3001/"
            ;;
        7)  # 全量部署
            echo ""
            echo ">>> [7] 全量部署"
            if [ ! -f "/tmp/backend.tar" ]; then
                echo "ERROR: /tmp/backend.tar 不存在"
                return 1
            fi
            if [ ! -f "/tmp/frontend.tar" ]; then
                echo "ERROR: /tmp/frontend.tar 不存在"
                return 1
            fi
            if [ ! -f "/tmp/simple-game.tar" ]; then
                echo "WARNING: /tmp/simple-game.tar 不存在，跳过 simple-game"
                SIMPLE_GAME_DEPLOY=0
            else
                SIMPLE_GAME_DEPLOY=1
            fi
            echo ">>> 停止所有容器..."
            docker compose -f "$COMPOSE_FILE" stop backend frontend simple-game > /dev/null 2>&1
            echo ">>> 清理旧镜像..."
            cleanup_old_image "kids-game-backend"
            cleanup_old_image "kids-game-frontend"
            [ $SIMPLE_GAME_DEPLOY -eq 1 ] && cleanup_old_image "kids-game-simple-game"
            echo ">>> 加载镜像..."
            docker load < /tmp/backend.tar  2>&1 | grep -v "^$"
            docker load < /tmp/frontend.tar 2>&1 | grep -v "^$"
            if [ $SIMPLE_GAME_DEPLOY -eq 1 ]; then
                docker load < /tmp/simple-game.tar 2>&1 | grep -v "^$"
            fi
            echo ">>> 强制重建所有容器..."
            docker compose -f "$COMPOSE_FILE" rm -f backend frontend simple-game > /dev/null 2>&1
            docker compose -f "$COMPOSE_FILE" up -d --no-build --force-recreate > /dev/null 2>&1
            sleep 5
            echo ""
            echo "========================================="
            echo ">>> 服务状态"
            echo "========================================="
            docker ps --filter "name=kids-game" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
            echo ""
            echo "========================================="
            echo ">>> 当前运行镜像版本"
            echo "========================================="
            docker images kids-game-backend:latest kids-game-frontend:latest kids-game-simple-game:latest --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}" 2>/dev/null
            echo ""
            echo "========================================="
            echo ">>> logs/backend.log"
            echo "========================================="
            tail -30 "$LOG_DIR/backend.log"
            echo ""
            echo "========================================="
            echo ">>> logs/frontend.log"
            echo "========================================="
            tail -20 "$LOG_DIR/frontend.log"
            ;;
        8)  # 查看镜像信息
            echo ""
            echo ">>> [8] 镜像信息"
            echo ""
            echo "后端镜像:"
            docker images kids-game-backend --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}"
            echo ""
            echo "前端镜像:"
            docker images kids-game-frontend --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}"
            echo ""
            echo "simple-game 镜像:"
            docker images kids-game-simple-game --format "table {{.Repository}}\t{{.Tag}}\t{{.CreatedAt}}\t{{.Size}}"
            echo ""
            printf "按回车返回菜单..."
            read dummy
            ;;
    esac
}

# ---- 主循环 ----
while true; do
    check_images
    echo ""
    echo "镜像状态：backend.tar=$( [ $BACKEND_TAR_OK -eq 1 ] && echo '存在' || echo '缺失')  frontend.tar=$( [ $FRONTEND_TAR_OK -eq 1 ] && echo '存在' || echo '缺失')  simple-game.tar=$( [ $SIMPLE_GAME_TAR_OK -eq 1 ] && echo '存在' || echo '缺失')"
    echo "日志文件：$LOG_DIR/backend.log  $LOG_DIR/frontend.log"
    show_menu
    printf "请选择 [0-8]: "
    read -r choice
    echo ""

    case "$choice" in
        0)
            stop_log_collector
            echo "退出"
            break
            ;;
        1|2|3|4|5|6|7)
            # 每次部署前重启日志收集（清空旧日志）
            start_log_collector
            do_action "$choice"
            echo ""
            echo ">>> 持续查看日志："
            echo "    后端: tail -f $LOG_DIR/backend.log"
            echo "    前端: tail -f $LOG_DIR/frontend.log"
            echo ""
            printf "按回车继续... "
            read -r _
            ;;
        *)  echo "无效选择，请重新输入" ;;
    esac
done
