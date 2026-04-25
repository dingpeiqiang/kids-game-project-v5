#!/bin/bash

# ========================================
# 快速部署脚本（增量构建）
# ========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMPOSE_FILE="docker-compose.lowmem.yml"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "========================================="
echo "快速部署（增量构建）"
echo "========================================="

# 1. 检查 Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker 未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose 未安装"
    exit 1
fi

# 2. 检查 .env 文件
if [ ! -f ".env" ]; then
    log_warn ".env 文件不存在，从示例复制..."
    cp .env.production.example .env
    log_warn "请编辑 .env 文件配置必要参数"
    exit 1
fi

# 3. 停止旧服务
echo ""
log_info "1. 停止旧服务..."
docker-compose -f $COMPOSE_FILE down --remove-orphans 2>/dev/null || true

# 4. 构建镜像（利用缓存）
echo ""
log_info "2. 构建镜像（使用缓存）..."

# 启用 BuildKit
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# 并行构建
docker-compose -f $COMPOSE_FILE build --parallel

# 5. 启动服务
echo ""
log_info "3. 启动服务..."
docker-compose -f $COMPOSE_FILE up -d

# 6. 等待服务就绪
echo ""
log_info "4. 等待服务就绪..."
sleep 10

# 7. 检查服务状态
echo ""
echo "========================================="
log_info "服务状态："
echo "========================================="
docker-compose -f $COMPOSE_FILE ps

# 8. 健康检查
echo ""
log_info "5. 健康检查..."

BACKEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' kids-game-backend 2>/dev/null || echo "unknown")
FRONTEND_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' kids-game-frontend 2>/dev/null || echo "unknown")

if [ "$BACKEND_HEALTH" = "healthy" ]; then
    log_info "✓ 后端服务正常"
else
    log_warn "⚠ 后端服务状态: $BACKEND_HEALTH（可能需要更多时间启动）"
fi

if [ "$FRONTEND_HEALTH" = "healthy" ]; then
    log_info "✓ 前端服务正常"
else
    log_warn "⚠ 前端服务状态: $FRONTEND_HEALTH"
fi

# 9. 显示访问地址
echo ""
echo "========================================="
log_info "部署完成！"
echo "========================================="
echo ""
echo "访问地址："
echo "  前端: http://$(hostname -I | awk '{print $1}')"
echo "  后端 API: http://$(hostname -I | awk '{print $1}')/api"
echo ""
echo "常用命令："
echo "  查看日志: docker-compose -f $COMPOSE_FILE logs -f"
echo "  查看状态: docker-compose -f $COMPOSE_FILE ps"
echo "  重启服务: docker-compose -f $COMPOSE_FILE restart"
echo "  停止服务: docker-compose -f $COMPOSE_FILE down"
echo ""
