#!/bin/bash
# ========================================
# MySQL 部署脚本 - 删除重建模式
# ========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_blue() {
    echo -e "${BLUE}=== $1 ===${NC}"
}

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
DOCKER_DIR="$SCRIPT_DIR/../../.."

MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-rootpassword}
MYSQL_DATABASE=${MYSQL_DATABASE:-kidgame}
MYSQL_USER=${MYSQL_USER:-kidgame}
MYSQL_PASSWORD=${MYSQL_PASSWORD:-kidgame123}

# ========================================
# 1. 停止并删除旧容器
# ========================================
log_blue "停止并删除旧容器"

docker stop kids-game-mysql >/dev/null 2>&1 || true
docker rm kids-game-mysql >/dev/null 2>&1 || true

log_info "旧容器已删除"

# ========================================
# 2. 删除数据卷
# ========================================
log_blue "删除数据卷"

docker volume rm docker_mysql-data >/dev/null 2>&1 || true

log_info "数据卷已删除"

# ========================================
# 3. 创建配置文件目录
# ========================================
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

# ========================================
# 4. 启动 MySQL 容器
# ========================================
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

# ========================================
# 5. 等待服务就绪
# ========================================
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

# ========================================
# 6. 配置用户权限
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

log_info "权限配置成功"

# ========================================
# 7. 测试连接
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
echo "部署模式: 删除重建"
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
