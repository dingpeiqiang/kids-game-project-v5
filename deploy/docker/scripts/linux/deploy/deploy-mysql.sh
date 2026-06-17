#!/bin/bash
# ========================================
# MySQL 部署脚本 - 交互模式
# 支持两种部署模式：
#   1. 删除重建模式 - 删除容器和数据卷，重新初始化
#   2. 增量更新模式 - 保留数据卷，只重启容器
# ========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_blue() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

# 显示帮助信息
show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -d, --destroy        删除重建模式（删除容器和数据卷）"
    echo "  -i, --incremental    增量更新模式（保留数据卷，只重启容器）"
    echo "  -h, --help           显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0                    # 交互模式，选择部署方式"
    echo "  $0 -d                 # 删除重建模式（非交互）"
    echo "  $0 -i                 # 增量更新模式（非交互）"
    echo ""
    echo "环境变量:"
    echo "  MYSQL_ROOT_PASSWORD   root 用户密码（默认: rootpassword）"
    echo "  MYSQL_DATABASE        数据库名（默认: kidgame）"
    echo "  MYSQL_USER            普通用户名（默认: kidgame）"
    echo "  MYSQL_PASSWORD        普通用户密码（默认: kidgame123）"
}

# 获取脚本所在目录
SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
DOCKER_DIR="$SCRIPT_DIR/../../.."

# 环境变量配置
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-rootpassword}
MYSQL_DATABASE=${MYSQL_DATABASE:-kidgame}
MYSQL_USER=${MYSQL_USER:-kidgame}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-kidgame123}

# 部署模式
DEPLOY_MODE=""

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case "$1" in
        -d|--destroy)
            DEPLOY_MODE="destroy"
            shift
            ;;
        -i|--incremental)
            DEPLOY_MODE="incremental"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
done

# 如果没有指定模式，进入交互模式
if [ -z "$DEPLOY_MODE" ]; then
    clear
    echo ""
    echo "========================================="
    echo "       MySQL 部署脚本 - 交互模式"
    echo "========================================="
    echo ""
    echo "请选择部署模式:"
    echo ""
    echo "  1) 删除重建模式"
    echo "     - 删除旧容器和数据卷"
    echo "     - 重新初始化数据库"
    echo "     - ⚠️  数据将全部丢失！"
    echo ""
    echo "  2) 增量更新模式"
    echo "     - 保留数据卷（保留数据）"
    echo "     - 只重启容器"
    echo "     - 适合配置更新"
    echo ""
    echo "  0) 退出"
    echo ""
    read -p "请选择 [0-2]: " choice
    
    case "$choice" in
        1)
            DEPLOY_MODE="destroy"
            ;;
        2)
            DEPLOY_MODE="incremental"
            ;;
        0)
            log_info "取消操作"
            exit 0
            ;;
        *)
            log_error "无效选择"
            exit 1
            ;;
    esac
fi

# ========================================
# 通用函数：停止并删除容器
# ========================================
stop_and_remove_container() {
    log_blue "停止并删除旧容器"
    
    if docker ps --format '{{.Names}}' | grep -q "^kids-game-mysql$"; then
        log_info "停止 MySQL 容器..."
        docker stop kids-game-mysql >/dev/null 2>&1 || true
    fi
    
    if docker ps -a --format '{{.Names}}' | grep -q "^kids-game-mysql$"; then
        log_info "删除 MySQL 容器..."
        docker rm kids-game-mysql >/dev/null 2>&1 || true
    fi
    
    log_info "旧容器已删除"
}

# ========================================
# 通用函数：创建配置文件
# ========================================
create_config() {
    log_blue "创建配置文件"
    
    mkdir -p "$DOCKER_DIR/mysql/conf.d"
    
    cat > "$DOCKER_DIR/mysql/conf.d/my.cnf" << 'EOF'
[mysqld]
default_authentication_plugin=mysql_native_password
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
bind-address=0.0.0.0
EOF
    
    log_info "配置文件已创建"
}

# ========================================
# 通用函数：启动容器
# ========================================
start_container() {
    log_blue "启动 MySQL 容器"
    
    docker run --name kids-game-mysql -d \
      -p 3306:3306 \
      -v docker_mysql-data:/var/lib/mysql \
      -v "$DOCKER_DIR/mysql/conf.d:/etc/mysql/conf.d" \
      -e TZ=Asia/Shanghai \
      -e MYSQL_ROOT_PASSWORD="$MYSQL_ROOT_PASSWORD" \
      -e MYSQL_DATABASE="$MYSQL_DATABASE" \
      -e MYSQL_USER="$MYSQL_USER" \
      -e MYSQL_PASSWORD="$MYSQL_PASSWORD" \
      mysql:8.0 --default-authentication-plugin=mysql_native_password
    
    log_info "容器启动成功"
}

# ========================================
# 通用函数：等待服务就绪
# ========================================
wait_for_ready() {
    log_blue "等待服务就绪"
    
    max_wait=60
    wait_count=0
    
    while true; do
        if docker exec kids-game-mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
            log_info "服务就绪"
            break
        fi
        
        wait_count=$((wait_count + 5))
        if [ $wait_count -ge $max_wait ]; then
            log_error "MySQL 服务启动超时！"
            log_info "查看日志: docker logs kids-game-mysql"
            exit 1
        fi
        
        log_info "等待中... ($wait_count/$max_wait 秒)"
        sleep 5
    done
}

# ========================================
# 通用函数：配置用户权限
# ========================================
configure_permissions() {
    log_blue "配置用户权限"
    
    docker exec -i kids-game-mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
CREATE USER IF NOT EXISTS '$MYSQL_USER'@'%' IDENTIFIED WITH mysql_native_password BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'%';

CREATE USER IF NOT EXISTS '$MYSQL_USER'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'localhost';

ALTER USER IF EXISTS 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

FLUSH PRIVILEGES;
EOF
    
    log_info "权限配置成功"
}

# ========================================
# 通用函数：测试连接
# ========================================
test_connection() {
    log_blue "测试连接"
    
    if docker exec kids-game-mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
        log_info "root 用户连接测试成功"
    else
        log_error "root 用户连接测试失败！"
        exit 1
    fi
    
    if docker exec kids-game-mysql mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -D "$MYSQL_DATABASE" -e "SELECT 1" >/dev/null 2>&1; then
        log_info "$MYSQL_USER 用户连接测试成功"
    else
        log_error "$MYSQL_USER 用户连接测试失败！"
        exit 1
    fi
}

# ========================================
# 通用函数：显示完成信息
# ========================================
show_completion() {
    local mode_name="$1"
    
    log_blue "MySQL 部署完成"
    
    echo ""
    echo "部署模式: $mode_name"
    echo ""
    echo "连接信息："
    echo "  主机: localhost"
    echo "  端口: 3306"
    echo "  数据库: $MYSQL_DATABASE"
    echo "  root 用户: root / $MYSQL_ROOT_PASSWORD"
    echo "  普通用户: $MYSQL_USER / $MYSQL_PASSWORD"
    echo ""
    echo "连接命令："
    echo "  mysql -h localhost -P 3306 -u $MYSQL_USER -p$MYSQL_PASSWORD"
    echo ""
}

# ========================================
# 部署流程
# ========================================

if [ "$DEPLOY_MODE" = "destroy" ]; then
    # 删除重建模式
    log_warn "⚠️  即将执行删除重建模式，所有数据将丢失！"
    
    # 1. 停止并删除容器
    stop_and_remove_container
    
    # 2. 删除数据卷
    log_blue "删除数据卷"
    docker volume rm docker_mysql-data >/dev/null 2>&1 || true
    log_info "数据卷已删除"
    
    # 3. 创建配置文件
    create_config
    
    # 4. 启动容器
    start_container
    
    # 5. 等待服务就绪
    wait_for_ready
    
    # 6. 配置用户权限
    configure_permissions
    
    # 7. 测试连接
    test_connection
    
    # 8. 显示完成信息
    show_completion "删除重建"
    
elif [ "$DEPLOY_MODE" = "incremental" ]; then
    # 增量更新模式
    log_info "执行增量更新模式，保留数据卷"
    
    # 1. 停止并删除容器
    stop_and_remove_container
    
    # 2. 创建配置文件
    create_config
    
    # 3. 启动容器（保留数据卷）
    start_container
    
    # 4. 等待服务就绪
    wait_for_ready
    
    # 5. 配置用户权限（确保权限正确）
    configure_permissions
    
    # 6. 测试连接
    test_connection
    
    # 7. 显示完成信息
    show_completion "增量更新（保留数据）"
    
fi
