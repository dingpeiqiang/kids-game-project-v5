#!/bin/bash
# ========================================
# MySQL 专用部署脚本 - 确保正确初始化
# 功能：
#   1. 停止并删除旧容器
#   2. 可选删除数据卷（重新初始化）
#   3. 确保使用 mysql_native_password 认证插件
#   4. 配置正确的用户权限
# ========================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$SCRIPT_DIR/../../.."

cd "$DOCKER_DIR"

# 参数处理
REMOVE_VOLUME="false"
FORCE_RESET="false"

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--remove-volume)
            REMOVE_VOLUME="true"
            shift
            ;;
        -f|--force)
            FORCE_RESET="true"
            shift
            ;;
        -h|--help)
            echo "用法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  -v, --remove-volume   删除数据卷后重新部署（数据会丢失）"
            echo "  -f, --force           强制重置，跳过确认"
            echo "  -h, --help            显示帮助信息"
            echo ""
            echo "示例:"
            echo "  $0                    # 常规重启（保留数据卷）"
            echo "  $0 -v                 # 删除数据卷后重新部署"
            echo "  $0 -v -f              # 强制删除数据卷并重新部署（无确认）"
            exit 0
            ;;
        *)
            shift
            ;;
    esac
done

# ========================================
# 1. 停止并删除旧容器
# ========================================
log_blue "停止并删除旧容器"

# 停止容器
if docker ps --format '{{.Names}}' | grep -q "^kids-game-mysql$"; then
    log_info "停止 MySQL 容器..."
    docker stop kids-game-mysql >/dev/null
    log_info "MySQL 容器已停止"
fi

# 删除容器
if docker ps -a --format '{{.Names}}' | grep -q "^kids-game-mysql$"; then
    log_info "删除 MySQL 容器..."
    docker rm kids-game-mysql >/dev/null
    log_info "MySQL 容器已删除"
fi

# ========================================
# 2. 删除数据卷（可选）
# ========================================
if [ "$REMOVE_VOLUME" = "true" ]; then
    if [ "$FORCE_RESET" != "true" ]; then
        read -p "⚠️  警告：删除数据卷将丢失所有数据库数据！确认继续？(y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "取消操作"
            exit 0
        fi
    fi
    
    log_warn "删除 MySQL 数据卷..."
    if docker volume ls --format '{{.Name}}' | grep -q "^kids-game-mysql-data$"; then
        docker volume rm kids-game-mysql-data >/dev/null
    elif docker volume ls --format '{{.Name}}' | grep -q "^docker_mysql-data$"; then
        docker volume rm docker_mysql-data >/dev/null
    fi
    log_info "MySQL 数据卷已删除"
fi

# ========================================
# 3. 创建自定义配置文件目录
# ========================================
log_blue "准备配置文件"

# 创建 MySQL 配置目录
mkdir -p "$DOCKER_DIR/mysql/conf.d"

# 创建 MySQL 配置文件（强制使用 mysql_native_password）
cat > "$DOCKER_DIR/mysql/conf.d/my.cnf" << 'EOF'
[mysqld]
default_authentication_plugin=mysql_native_password
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
bind-address=0.0.0.0
EOF

log_info "MySQL 配置文件已创建"

# ========================================
# 4. 使用 Docker Compose 启动 MySQL
# ========================================
log_blue "启动 MySQL 容器"

# 确保环境变量设置正确
export MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-rootpassword}
export MYSQL_DATABASE=${MYSQL_DATABASE:-kidgame}
export MYSQL_USER=${MYSQL_USER:-kidgame}
export MYSQL_PASSWORD=${MYSQL_PASSWORD:-kidgame123}
export MYSQL_DEFAULT_AUTH=mysql_native_password

# 启动容器
log_info "启动 MySQL 容器..."
docker-compose up -d mysql

# 等待容器启动
log_info "等待 MySQL 容器启动..."
sleep 10

# ========================================
# 5. 验证容器状态
# ========================================
log_blue "验证容器状态"

# 检查容器是否启动成功
if ! docker ps --format '{{.Names}}' | grep -q "^kids-game-mysql$"; then
    log_error "MySQL 容器启动失败！"
    log_info "查看日志: docker logs kids-game-mysql"
    exit 1
fi

log_info "MySQL 容器启动成功"

# ========================================
# 6. 等待 MySQL 服务就绪
# ========================================
log_blue "等待 MySQL 服务就绪"

max_wait=60
wait_count=0

while true; do
    if docker exec kids-game-mysql mysqladmin ping -h localhost --silent 2>/dev/null; then
        log_info "MySQL 服务就绪"
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

# ========================================
# 7. 确保用户权限正确（即使数据卷已存在）
# ========================================
log_blue "配置用户权限"

# 使用 heredoc 执行 SQL 命令
docker exec -i kids-game-mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" << EOF
-- 创建/更新用户并授予权限
-- 使用 mysql_native_password 认证插件以兼容旧版客户端
CREATE USER IF NOT EXISTS 'kidgame'@'%' IDENTIFIED WITH mysql_native_password BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON kidgame.* TO 'kidgame'@'%';

CREATE USER IF NOT EXISTS 'kidgame'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON kidgame.* TO 'kidgame'@'localhost';

-- 确保 root 用户也使用 mysql_native_password（便于外部连接）
ALTER USER IF EXISTS 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

FLUSH PRIVILEGES;

-- 验证
SELECT user, host, plugin FROM mysql.user WHERE user IN ('root', 'kidgame');
EOF

if [ $? -eq 0 ]; then
    log_info "用户权限配置成功"
else
    log_error "用户权限配置失败！"
    exit 1
fi

# ========================================
# 8. 测试连接
# ========================================
log_blue "测试连接"

# 测试 root 用户连接
if docker exec kids-game-mysql mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
    log_info "root 用户连接测试成功"
else
    log_error "root 用户连接测试失败！"
    exit 1
fi

# 测试 kidgame 用户连接
if docker exec kids-game-mysql mysql -u kidgame -p"$MYSQL_PASSWORD" -D kidgame -e "SELECT 1" >/dev/null 2>&1; then
    log_info "kidgame 用户连接测试成功"
else
    log_error "kidgame 用户连接测试失败！"
    exit 1
fi

# ========================================
# 完成
# ========================================
log_blue "MySQL 部署完成"

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
