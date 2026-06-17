#!/bin/bash
# ========================================
# MySQL 智能部署脚本
# 智能检测数据卷状态，避免不必要的数据丢失
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

# 环境变量配置
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-rootpassword}
MYSQL_DATABASE=${MYSQL_DATABASE:-kidgame}
MYSQL_USER=${MYSQL_USER:-kidgame}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-kidgame123}

# ========================================
# 检测数据卷是否存在
# ========================================
VOLUME_EXISTS="false"
VOLUME_NAME="docker_mysql-data"

if docker volume ls --format '{{.Name}}' | grep -q "^$VOLUME_NAME$"; then
    VOLUME_EXISTS="true"
    log_info "检测到数据卷 $VOLUME_NAME 已存在"
else
    log_info "数据卷 $VOLUME_NAME 不存在，将执行首次初始化"
fi

# ========================================
# 创建配置文件
# ========================================
log_blue "准备配置文件"

mkdir -p "$DOCKER_DIR/mysql/conf.d"

cat > "$DOCKER_DIR/mysql/conf.d/my.cnf" << 'EOF'
[mysqld]
default_authentication_plugin=mysql_native_password
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
bind-address=0.0.0.0
EOF

log_info "MySQL 配置文件已创建"

# ========================================
# 如果数据卷存在，检查密码是否匹配
# ========================================
PASSWORD_MATCH="false"

if [ "$VOLUME_EXISTS" = "true" ]; then
    log_blue "检查现有数据卷的密码状态"
    
    # 启动临时容器检查密码
    log_info "启动临时容器检查密码..."
    docker run --name mysql-check -p 3307:3306 \
      -v "$VOLUME_NAME":/var/lib/mysql \
      -d mysql:8.0 --default-authentication-plugin=mysql_native_password >/dev/null 2>&1
    
    sleep 15
    
    # 尝试用默认密码连接
    if docker exec mysql-check mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1" >/dev/null 2>&1; then
        PASSWORD_MATCH="true"
        log_info "密码匹配，无需重置"
    else
        log_warn "密码不匹配，需要重置"
    fi
    
    # 停止临时容器
    docker stop mysql-check >/dev/null 2>&1 || true
    docker rm mysql-check >/dev/null 2>&1 || true
fi

# ========================================
# 停止现有容器（如果存在）
# ========================================
log_blue "停止现有容器"

if docker ps --format '{{.Names}}' | grep -q "^kids-game-mysql$"; then
    log_info "停止 MySQL 容器..."
    docker stop kids-game-mysql >/dev/null 2>&1 || true
fi

if docker ps -a --format '{{.Names}}' | grep -q "^kids-game-mysql$"; then
    log_info "删除 MySQL 容器..."
    docker rm kids-game-mysql >/dev/null 2>&1 || true
fi

# ========================================
# 处理密码不匹配的情况（数据卷存在但密码不对）
# ========================================
if [ "$VOLUME_EXISTS" = "true" ] && [ "$PASSWORD_MATCH" = "false" ]; then
    log_blue "重置密码（保留数据）"
    
    log_info "以跳过权限验证模式启动临时容器..."
    docker run --name mysql-reset -p 3306:3306 \
      -v "$VOLUME_NAME":/var/lib/mysql \
      -d mysql:8.0 --skip-grant-tables --skip-networking >/dev/null 2>&1
    
    sleep 10
    
    log_info "重置 root 密码..."
    docker exec -i mysql-reset mysql -u root << EOF
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED WITH mysql_native_password BY '$MYSQL_ROOT_PASSWORD';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE;

CREATE USER IF NOT EXISTS '$MYSQL_USER'@'%' IDENTIFIED WITH mysql_native_password BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'%';

CREATE USER IF NOT EXISTS '$MYSQL_USER'@'localhost' IDENTIFIED WITH mysql_native_password BY '$MYSQL_PASSWORD';
GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'localhost';

FLUSH PRIVILEGES;
EOF

    docker stop mysql-reset >/dev/null 2>&1 || true
    docker rm mysql-reset >/dev/null 2>&1 || true
    
    log_info "密码重置完成"
fi

# ========================================
# 使用 Docker Compose 启动 MySQL
# ========================================
log_blue "启动 MySQL 容器"

export MYSQL_ROOT_PASSWORD
export MYSQL_DATABASE
export MYSQL_USER
export MYSQL_PASSWORD
export MYSQL_DEFAULT_AUTH=mysql_native_password

log_info "启动 MySQL 容器..."
docker-compose up -d mysql

sleep 10

# ========================================
# 验证容器状态
# ========================================
if ! docker ps --format '{{.Names}}' | grep -q "^kids-game-mysql$"; then
    log_error "MySQL 容器启动失败！"
    log_info "查看日志: docker logs kids-game-mysql"
    exit 1
fi

log_info "MySQL 容器启动成功"

# ========================================
# 等待服务就绪
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
# 更新用户权限（确保正确配置）
# ========================================
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

log_info "用户权限配置成功"

# ========================================
# 测试连接
# ========================================
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

# ========================================
# 完成
# ========================================
log_blue "MySQL 部署完成"

echo ""
echo "部署模式: $(if [ "$VOLUME_EXISTS" = "true" ]; then echo "增量更新（保留数据）"; else echo "首次初始化"; fi)"
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
